"""
Civic Intelligence Engine (CIE)
================================
Five reasoning agents orchestrated via a single Gemini 2.0 Flash call.
In DEMO_MODE, returns rich realistic mock responses without calling Gemini.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import random
from typing import Any

from app.models.schemas import (
    Agent1Detection, Agent2Duplicate, Agent3Priority,
    Agent4Routing, Agent5Insight,
    CIERequest, CIEResponse,
    Department, IssueCategory, IssueForBriefing,
    MayorBriefingRequest, MayorBriefingResponse,
    NeighborhoodHealth, PriorityBreakdown, PriorityLabel,
    RiskDelta, RiskLevel, Hotspot,
)

logger = logging.getLogger(__name__)

from app.config import settings

DEMO_MODE    = settings.DEMO_MODE
GROQ_MODEL   = "meta-llama/llama-4-scout-17b-16e-instruct"
CIE_TEMPERATURE   = 0.1
MAYOR_TEMPERATURE = 0.2


# ═══════════════════════════════════════════════════════════════════════════════
# Prompts
# ═══════════════════════════════════════════════════════════════════════════════

def _cie_prompt(req: CIERequest) -> str:
    nearby = json.dumps([i.model_dump() for i in req.nearby_issues], indent=2) if req.nearby_issues else "[]"
    return f"""
You are the CivicPulse Civic Intelligence Engine — five collaborative AI agents
that analyze a citizen-submitted civic issue image and context.

CONTEXT:
  Location : {req.location_address} (lat={req.location_lat}, lng={req.location_lng})
  Upvotes  : {req.upvote_count}
  Nearby open issues (within 500m):
{nearby}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENT 1 — ISSUE DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the image is blurry/unclassifiable: quality_pass=false, quality_feedback=instructions.
Otherwise: quality_pass=true, category=POTHOLE|WATER_LEAKAGE|STREETLIGHT|WASTE|SEWAGE|OTHER,
confidence=0.0-1.0, description=2 sentences, short_title=5-8 words.

AGENT 2 — DUPLICATE DETECTION
Match against nearby_issues by location + category.
is_duplicate, duplicate_of (id or null), merge_reason, confidence.

AGENT 3 — PRIORITY SCORING (breakdown must sum to priority_score)
road_damage(max 40) + traffic_density(max 25) + community_votes(max 20) + hospital_proximity(max 15)
priority_label: 0-30=LOW, 31-60=MEDIUM, 61-80=HIGH, 81-100=CRITICAL
estimated_resolution_hours: LOW=168, MEDIUM=72, HIGH=36, CRITICAL=12

AGENT 4 — DEPARTMENT ROUTING
POTHOLE→PWD, WATER_LEAKAGE→JVVNL, WASTE/SEWAGE→JMC, STREETLIGHT→DISCOM
escalate=true if priority_score>80

AGENT 5 — MAYOR INSIGHT
tags (3-6 keywords), area_risk_contribution (HIGH/MEDIUM/LOW), insight_note (1 sentence)

Return ONLY valid JSON, no markdown:
{{"agent1_detection":{{...}},"agent2_duplicate":{{...}},"agent3_priority":{{...}},"agent4_routing":{{...}},"agent5_insight":{{...}}}}
""".strip()


def _mayor_prompt(req: MayorBriefingRequest) -> str:
    issues_json = json.dumps([i.model_dump() for i in req.issues], indent=2)
    return f"""
You are the CivicPulse Mayor Intelligence Agent. Analyze {len(req.issues)} open civic issues
and produce a structured operational briefing. Return ONLY valid JSON:
{{
  "summary": "3-4 sentence paragraph with key numbers and most urgent action",
  "hotspots": [{{"area":"...","issue_count":N,"risk_level":"HIGH","top_category":"POTHOLE"}}],
  "department_load": {{"PWD":N,"JVVNL":N,"JMC":N,"DISCOM":N,"OTHER":N}},
  "risk_deltas": [{{"area":"...","change_percent":N,"direction":"UP"}}],
  "recommended_actions": ["specific action 1","specific action 2"],
  "neighborhood_health_scores": [{{"ward":"...","score":N,"trend":"DOWN"}}],
  "total_open_issues": N,
  "total_critical": N,
  "duplicates_merged_today": N
}}

Issues data:
{issues_json}
""".strip()


# ═══════════════════════════════════════════════════════════════════════════════
# JSON utilities
# ═══════════════════════════════════════════════════════════════════════════════

def _parse_json_response(raw: str) -> dict[str, Any]:
    text = raw.strip()
    # Strip any prose before the first { or [
    brace = min(
        (text.find(c) for c in ('{', '[') if text.find(c) != -1),
        default=-1
    )
    if brace > 0:
        text = text[brace:]
    # Strip markdown code fences
    if text.startswith("```"):
        lines = text.splitlines()
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        text = "\n".join(inner)
    # Strip trailing prose after the last } or ]
    last = max(text.rfind('}'), text.rfind(']'))
    if last != -1:
        text = text[:last + 1]
    return json.loads(text)


# ═══════════════════════════════════════════════════════════════════════════════
# Fallbacks
# ═══════════════════════════════════════════════════════════════════════════════

def _cie_fallback(reason: str = "AI analysis temporarily unavailable.") -> CIEResponse:
    return CIEResponse(
        agent1_detection=Agent1Detection(quality_pass=False, quality_feedback=f"{reason} Please try again."),
        agent2_duplicate=Agent2Duplicate(is_duplicate=False, confidence=0.0),
        agent3_priority=Agent3Priority(
            priority_score=50, priority_label=PriorityLabel.MEDIUM,
            breakdown=PriorityBreakdown(road_damage=20, traffic_density=12, community_votes=10, hospital_proximity=8),
            estimated_resolution_hours=72,
        ),
        agent4_routing=Agent4Routing(department=Department.JMC, routing_reason="Default routing.", escalate=False),
        agent5_insight=Agent5Insight(tags=["unclassified"], area_risk_contribution=RiskLevel.MEDIUM, insight_note="Requires manual review."),
    )


def _mayor_fallback(req: MayorBriefingRequest) -> MayorBriefingResponse:
    total    = len(req.issues)
    critical = sum(1 for i in req.issues if i.priority_score > 80)
    load     = {"PWD": 0, "JVVNL": 0, "JMC": 0, "DISCOM": 0, "OTHER": 0}
    for i in req.issues:
        k = i.department if i.department in load else "OTHER"
        load[k] += 1
    return MayorBriefingResponse(
        summary=f"{total} open issues. {critical} critical. Manual review recommended.",
        hotspots=[], department_load=load, risk_deltas=[],
        recommended_actions=["Review all critical issues immediately."],
        neighborhood_health_scores=[],
        total_open_issues=total, total_critical=critical, duplicates_merged_today=0,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Demo mock responses
# ═══════════════════════════════════════════════════════════════════════════════

_DEMO_CATEGORIES = [
    ("POTHOLE",       "PWD",    88, "CRITICAL", 12,  True,  38, 23, 15, 12, ["pothole","critical","road-damage"]),
    ("WATER_LEAKAGE", "JVVNL",  66, "HIGH",     36,  False, 25, 18, 13, 10, ["water","leakage","residential"]),
    ("STREETLIGHT",   "DISCOM", 52, "MEDIUM",   72,  False, 18, 15, 11, 8,  ["streetlight","safety","night"]),
    ("WASTE",         "JMC",    44, "MEDIUM",   72,  False, 15, 12, 9,  8,  ["waste","garbage","health"]),
    ("SEWAGE",        "JMC",    75, "HIGH",     36,  False, 28, 20, 14, 13, ["sewage","overflow","hygiene"]),
]

def _demo_cie(req: CIERequest) -> CIEResponse:
    cat_data = random.choice(_DEMO_CATEGORIES)
    cat, dept, score, label, hours, escalate, rd, td, cv, hp, tags = cat_data

    descriptions = {
        "POTHOLE":       "A significant pothole approximately 2 feet in diameter has been identified on the road surface. The damage exposes underlying gravel and poses a risk to vehicles and two-wheelers.",
        "WATER_LEAKAGE": "A burst water pipe is causing continuous water flow onto the road surface. The leakage has created waterlogging conditions and potential hazards for road users.",
        "STREETLIGHT":   "A streetlight is observed to be non-functional at this location. The absence of lighting creates safety concerns for pedestrians and vehicle operators during night hours.",
        "WASTE":         "An uncleared garbage pile has accumulated at this location. The waste buildup indicates a missed collection cycle and poses hygiene and environmental concerns.",
        "SEWAGE":        "Sewage overflow is detected at this location, creating unhygienic conditions on the road surface. The issue requires immediate attention from municipal authorities.",
    }

    return CIEResponse(
        agent1_detection=Agent1Detection(
            quality_pass=True,
            quality_feedback=None,
            category=IssueCategory(cat),
            confidence=round(random.uniform(0.85, 0.97), 2),
            description=descriptions.get(cat, "A civic issue has been detected at this location."),
            short_title=f"{cat.replace('_',' ').title()} at {req.location_address or 'Reported Location'}",
        ),
        agent2_duplicate=Agent2Duplicate(
            is_duplicate=bool(req.nearby_issues and random.random() < 0.1),
            duplicate_of=req.nearby_issues[0].id if (req.nearby_issues and random.random() < 0.1) else None,
            merge_reason=None, confidence=0.0,
        ),
        agent3_priority=Agent3Priority(
            priority_score=score,
            priority_label=PriorityLabel(label),
            breakdown=PriorityBreakdown(road_damage=rd, traffic_density=td, community_votes=cv, hospital_proximity=hp),
            estimated_resolution_hours=hours,
        ),
        agent4_routing=Agent4Routing(
            department=Department(dept),
            routing_reason=f"This issue falls under {dept} jurisdiction based on category and location.",
            escalate=escalate,
            escalation_reason="Priority score exceeds 80-point escalation threshold." if escalate else None,
        ),
        agent5_insight=Agent5Insight(
            tags=tags,
            area_risk_contribution=RiskLevel.HIGH if score >= 75 else RiskLevel.MEDIUM if score >= 45 else RiskLevel.LOW,
            insight_note=f"{'Critical issue' if score >= 80 else 'Moderate issue'} requiring {dept} attention at {req.location_address or 'this location'}.",
        ),
    )


def _demo_mayor(req: MayorBriefingRequest) -> MayorBriefingResponse:
    from app.services.mock_data import MOCK_MAYOR_BRIEFING
    import copy
    return MayorBriefingResponse(**copy.deepcopy(MOCK_MAYOR_BRIEFING))


# ═══════════════════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════════════════

async def run_civic_intelligence_engine(req: CIERequest) -> CIEResponse:
    if DEMO_MODE:
        logger.info("CIE [DEMO] ▶ returning mock response")
        result = _demo_cie(req)
        logger.info("CIE [DEMO] ✓ cat=%s score=%d dept=%s escalate=%s",
                    result.agent1_detection.category,
                    result.agent3_priority.priority_score,
                    result.agent4_routing.department,
                    result.agent4_routing.escalate)
        return result

    raw_text = ""
    try:
        from groq import Groq
        from app.config import settings

        client = Groq(api_key=settings.GROQ_API_KEY)
        image_bytes = base64.b64decode(req.image_base64)
        image_b64_str = base64.b64encode(image_bytes).decode("utf-8")

        logger.info("CIE ▶ calling Groq Llama-4-Scout | addr=%s nearby=%d", req.location_address, len(req.nearby_issues))

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=CIE_TEMPERATURE,
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{req.image_mime_type};base64,{image_b64_str}"},
                    },
                    {
                        "type": "text",
                        "text": _cie_prompt(req),
                    },
                ],
            }],
        )

        raw_text = response.choices[0].message.content
        data = _parse_json_response(raw_text)
        result = CIEResponse(**data)
        logger.info("CIE ✓ cat=%s score=%d", result.agent1_detection.category, result.agent3_priority.priority_score)
        return result

    except json.JSONDecodeError as exc:
        logger.error("CIE JSON parse failed | err=%s | raw=%.200s", exc, raw_text)
        return _cie_fallback("Could not parse AI response.")
    except Exception as exc:
        logger.error("CIE unexpected error: %s", exc, exc_info=True)
        return _cie_fallback()


async def run_mayor_briefing(req: MayorBriefingRequest) -> MayorBriefingResponse:
    if DEMO_MODE:
        logger.info("Mayor [DEMO] ▶ returning mock briefing")
        return _demo_mayor(req)

    if not req.issues:
        return MayorBriefingResponse(
            summary="No open issues. City is all clear.", hotspots=[],
            department_load={"PWD": 0, "JVVNL": 0, "JMC": 0, "DISCOM": 0, "OTHER": 0},
            risk_deltas=[], recommended_actions=["Continue monitoring."],
            neighborhood_health_scores=[], total_open_issues=0, total_critical=0, duplicates_merged_today=0,
        )

    try:
        from groq import Groq
        from app.config import settings

        client = Groq(api_key=settings.GROQ_API_KEY)
        logger.info("Mayor ▶ analysing %d issues with Groq", len(req.issues))
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=MAYOR_TEMPERATURE,
            max_tokens=2000,
            messages=[{"role": "user", "content": _mayor_prompt(req)}],
        )
        data = _parse_json_response(response.choices[0].message.content)
        return MayorBriefingResponse(**data)

    except Exception as exc:
        logger.error("Mayor briefing error: %s", exc, exc_info=True)
        return _mayor_fallback(req)
