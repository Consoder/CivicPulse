"""
AI Router — /api/ai
====================
POST /api/ai/analyze         → Civic Intelligence Engine (5-agent pipeline)
POST /api/ai/mayor-insights  → Mayor's daily operational briefing
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import optional_auth, require_auth
from app.models.schemas import (
    CIERequest, CIEResponse,
    MayorBriefingRequest, MayorBriefingResponse,
    IssueForBriefing,
)
from app.services.civic_intelligence_engine import (
    run_civic_intelligence_engine,
    run_mayor_briefing,
)
from app.services import firebase_service as db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["Civic Intelligence Engine"])


@router.post(
    "/analyze",
    response_model=CIEResponse,
    summary="Run the 5-agent Civic Intelligence Engine",
)
async def analyze_issue(
    req: CIERequest,
    _user: dict = Depends(optional_auth),   # Auth encouraged but not required for demo
) -> CIEResponse:
    """
    Accepts a base64 image + location context and runs all five CIE agents:

    1. **Issue Detection** — classify + quality gate the image
    2. **Duplicate Detection** — match against nearby open issues
    3. **Priority Scoring** — 0-100 dynamic score (4-factor breakdown)
    4. **Department Routing** — assign responsible department + escalation
    5. **Mayor Insight** — generate tags + area risk contribution

    If the image is too blurry, `agent1_detection.quality_pass` will be `false`
    and `quality_feedback` will tell the user exactly how to retake the photo.
    """
    return await run_civic_intelligence_engine(req)


@router.post(
    "/mayor-insights",
    response_model=MayorBriefingResponse,
    summary="Generate Mayor's daily AI briefing from all open issues",
)
async def mayor_insights(
    req: MayorBriefingRequest,
    _user: dict = Depends(optional_auth),
) -> MayorBriefingResponse:
    """
    Analyses all open issues and produces a structured operational briefing:

    - AI-written situation summary
    - Geographic hotspots
    - Department workload (flags overloaded departments)
    - 24h risk deltas by area
    - Concrete recommended actions
    - Neighborhood health scores

    Results are persisted to Firestore for historical tracking.
    """
    result = await run_mayor_briefing(req)

    # Persist snapshot asynchronously (best-effort)
    try:
        await db.save_mayor_briefing(result.model_dump())
    except Exception as exc:
        logger.warning("Could not persist mayor briefing: %s", exc)

    return result


@router.post(
    "/mayor-insights/live",
    response_model=MayorBriefingResponse,
    summary="Fetch live issues from Firestore and generate Mayor briefing",
)
async def mayor_insights_live(
    timeframe_hours: int = 24,
    _user: dict = Depends(optional_auth),
) -> MayorBriefingResponse:
    """
    Convenience endpoint — fetches open issues directly from Firestore
    instead of requiring the caller to pass issue data.
    """
    raw_issues = await db.get_open_issues_for_briefing(hours=timeframe_hours)

    issues = [
        IssueForBriefing(
            id=i.get("id", ""),
            title=i.get("title", ""),
            category=i.get("category", "OTHER"),
            priority_score=i.get("priorityScore", 0),
            status=i.get("status", "REPORTED"),
            department=i.get("department", "OTHER"),
            location_address=i.get("location", {}).get("address", ""),
            upvotes=i.get("upvotes", 0),
            created_at=i.get("createdAt", ""),
            tags=i.get("tags", []),
        )
        for i in raw_issues
    ]

    req = MayorBriefingRequest(issues=issues, timeframe_hours=timeframe_hours)
    result = await run_mayor_briefing(req)

    try:
        await db.save_mayor_briefing(result.model_dump())
    except Exception as exc:
        logger.warning("Could not persist mayor briefing: %s", exc)

    return result
