"""
Domain models for CivicPulse.
All request/response shapes are defined here as Pydantic models.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator, model_validator


# ═══════════════════════════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════════════════════════

class IssueCategory(str, Enum):
    POTHOLE       = "POTHOLE"
    WATER_LEAKAGE = "WATER_LEAKAGE"
    STREETLIGHT   = "STREETLIGHT"
    WASTE         = "WASTE"
    SEWAGE        = "SEWAGE"
    OTHER         = "OTHER"


class IssueStatus(str, Enum):
    REPORTED   = "REPORTED"
    VERIFIED   = "VERIFIED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED   = "RESOLVED"


class Department(str, Enum):
    PWD    = "PWD"     # Public Works — roads, potholes
    JVVNL  = "JVVNL"  # Water / electricity
    JMC    = "JMC"     # Jaipur Municipal Corp — waste, sewage
    DISCOM = "DISCOM"  # Streetlights / power distribution
    OTHER  = "OTHER"


class PriorityLabel(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


class RiskLevel(str, Enum):
    LOW      = "LOW"
    MEDIUM   = "MEDIUM"
    HIGH     = "HIGH"
    CRITICAL = "CRITICAL"


class UserBadge(str, Enum):
    NEWCOMER    = "NEWCOMER"    # 0–50 pts
    WATCHDOG    = "WATCHDOG"    # 51–200 pts
    REPORTER    = "REPORTER"    # 201–500 pts
    CIVIC_HERO  = "CIVIC_HERO"  # 500+ pts


class VoteType(str, Enum):
    VERIFY = "VERIFY"
    UPVOTE = "UPVOTE"


# ═══════════════════════════════════════════════════════════════════════════════
# Shared sub-models
# ═══════════════════════════════════════════════════════════════════════════════

class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: str = ""


class TimelineStage(BaseModel):
    stage: str
    timestamp: Optional[str] = None
    note: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# CIE (Civic Intelligence Engine) Models
# ═══════════════════════════════════════════════════════════════════════════════

class NearbyIssue(BaseModel):
    """Passed to CIE for duplicate detection context."""
    id: str
    category: str
    title: str
    lat: float
    lng: float
    upvotes: int = 0
    created_at: str


class CIERequest(BaseModel):
    image_base64: str = Field(..., min_length=4)
    image_mime_type: str = Field(default="image/jpeg")
    location_lat: float = Field(..., ge=-90, le=90)
    location_lng: float = Field(..., ge=-180, le=180)
    location_address: str = ""
    upvote_count: int = Field(default=0, ge=0)
    nearby_issues: list[NearbyIssue] = Field(default_factory=list)

    @field_validator("image_mime_type")
    @classmethod
    def validate_mime(cls, v: str) -> str:
        allowed = {"image/jpeg", "image/png", "image/webp"}
        if v not in allowed:
            raise ValueError(f"mime_type must be one of {allowed}")
        return v


class Agent1Detection(BaseModel):
    quality_pass: bool
    quality_feedback: Optional[str] = None
    category: Optional[IssueCategory] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    description: Optional[str] = None
    short_title: Optional[str] = None


class Agent2Duplicate(BaseModel):
    is_duplicate: bool
    duplicate_of: Optional[str] = None
    merge_reason: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class PriorityBreakdown(BaseModel):
    road_damage: int = Field(..., ge=0, le=40)
    traffic_density: int = Field(..., ge=0, le=25)
    community_votes: int = Field(..., ge=0, le=20)
    hospital_proximity: int = Field(..., ge=0, le=15)


class Agent3Priority(BaseModel):
    priority_score: int = Field(..., ge=0, le=100)
    priority_label: PriorityLabel
    breakdown: Optional[PriorityBreakdown] = None
    estimated_resolution_hours: int = Field(default=72, ge=1)

    @model_validator(mode='before')
    @classmethod
    def build_breakdown(cls, data: Any) -> Any:
        if isinstance(data, dict) and data.get('breakdown') is None:
            rd = int(data.get('road_damage', 0))
            td = int(data.get('traffic_density', 0))
            cv = int(data.get('community_votes', 0))
            hp = int(data.get('hospital_proximity', 0))
            if rd or td or cv or hp:
                data['breakdown'] = {
                    'road_damage': rd, 'traffic_density': td,
                    'community_votes': cv, 'hospital_proximity': hp,
                }
        return data


class Agent4Routing(BaseModel):
    department: Department
    routing_reason: str = ""
    escalate: bool = False
    escalation_reason: Optional[str] = None


class Agent5Insight(BaseModel):
    tags: list[str] = Field(..., min_length=1)
    area_risk_contribution: RiskLevel
    insight_note: str


class CIEResponse(BaseModel):
    agent1_detection: Agent1Detection
    agent2_duplicate: Agent2Duplicate
    agent3_priority: Agent3Priority
    agent4_routing: Agent4Routing
    agent5_insight: Agent5Insight


# ═══════════════════════════════════════════════════════════════════════════════
# Mayor Briefing Models
# ═══════════════════════════════════════════════════════════════════════════════

class IssueForBriefing(BaseModel):
    id: str
    title: str
    category: str
    priority_score: int
    status: str
    department: str
    location_address: str
    upvotes: int
    created_at: str
    tags: list[str] = Field(default_factory=list)


class MayorBriefingRequest(BaseModel):
    issues: list[IssueForBriefing]
    timeframe_hours: int = Field(default=24, ge=1, le=168)


class Hotspot(BaseModel):
    area: str
    issue_count: int
    risk_level: str
    top_category: str


class RiskDelta(BaseModel):
    area: str
    change_percent: int
    direction: str  # UP | DOWN | STABLE


class NeighborhoodHealth(BaseModel):
    ward: str
    score: int = Field(..., ge=0, le=100)
    trend: str  # UP | DOWN | STABLE


class MayorBriefingResponse(BaseModel):
    summary: str
    hotspots: list[Hotspot]
    department_load: dict[str, int]
    risk_deltas: list[RiskDelta]
    recommended_actions: list[str]
    neighborhood_health_scores: list[NeighborhoodHealth]
    total_open_issues: int
    total_critical: int
    duplicates_merged_today: int


# ═══════════════════════════════════════════════════════════════════════════════
# Issue Models
# ═══════════════════════════════════════════════════════════════════════════════

class IssueCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(default="", max_length=2000)
    location: Location
    image_urls: list[str] = Field(default_factory=list)
    cie_response: Optional[CIEResponse] = None  # result from /ai/analyze


class IssueUpdate(BaseModel):
    status: Optional[IssueStatus] = None
    description: Optional[str] = None


class IssueOut(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = None
    status: IssueStatus
    location: Location
    image_urls: list[str]
    reported_by: str
    verified_by: list[str]
    verification_count: int
    upvotes: int
    department: Optional[str] = None
    escalated: bool
    priority_score: int
    duplicate_of: Optional[str] = None
    estimated_resolution_hours: Optional[int] = None
    ai_analysis: Optional[dict[str, Any]] = None
    ai_timeline: list[TimelineStage]
    created_at: str
    updated_at: str
    resolved_at: Optional[str] = None


class IssueListResponse(BaseModel):
    items: list[IssueOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════════════════════════════════════════
# User Models
# ═══════════════════════════════════════════════════════════════════════════════

class UserOut(BaseModel):
    uid: str
    display_name: str
    email: str
    photo_url: str
    points: int
    badge: UserBadge
    issues_reported: int
    issues_verified: int
    issues_resolved: int
    joined_at: str


class LeaderboardEntry(BaseModel):
    rank: int
    uid: str
    display_name: str
    photo_url: str
    points: int
    badge: UserBadge


# ═══════════════════════════════════════════════════════════════════════════════
# Vote Models
# ═══════════════════════════════════════════════════════════════════════════════

class VoteRequest(BaseModel):
    issue_id: str
    vote_type: VoteType


class VoteResponse(BaseModel):
    issue_id: str
    upvotes: int
    verification_count: int
    user_has_verified: bool
    user_has_upvoted: bool


# ═══════════════════════════════════════════════════════════════════════════════
# Common API Responses
# ═══════════════════════════════════════════════════════════════════════════════

class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "OK"


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
