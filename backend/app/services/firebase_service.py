"""
Firebase Service — with demo mode fallback.
When DEMO_MODE=true, all reads/writes go to an in-memory store
so the app runs without real Firebase credentials.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

logger = logging.getLogger(__name__)

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

from app.models.schemas import (
    IssueCreate, IssueOut, IssueStatus, IssueUpdate,
    UserBadge, UserOut, VoteType,
    Location, TimelineStage, IssueListResponse,
    LeaderboardEntry,
)

# ─── Demo in-memory store ─────────────────────────────────────────────────────
if DEMO_MODE:
    from app.services.mock_data import MOCK_ISSUES, MOCK_USERS, MOCK_MAYOR_BRIEFING
    import copy
    _issues: dict[str, dict] = {i["id"]: copy.deepcopy(i) for i in MOCK_ISSUES}
    _users:  dict[str, dict] = copy.deepcopy(MOCK_USERS)
    _votes:  dict[str, dict] = {}
    _briefings: dict[str, dict] = {"demo": MOCK_MAYOR_BRIEFING}
    logger.info("🟡 DEMO MODE — using in-memory store")
else:
    import firebase_admin
    from firebase_admin import credentials, firestore
    from google.cloud.firestore_v1 import Client, DocumentSnapshot
    from app.config import settings

    COL_ISSUES    = "issues"
    COL_USERS     = "users"
    COL_VOTES     = "votes"
    COL_BRIEFINGS = "mayor_briefings"

    _db: Optional[Client] = None

    def get_db() -> Client:
        global _db
        if _db is None:
            if not firebase_admin._apps:
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": settings.FIREBASE_PROJECT_ID,
                    "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                    "client_email": settings.FIREBASE_CLIENT_EMAIL,
                    "token_uri": "https://oauth2.googleapis.com/token",
                })
                firebase_admin.initialize_app(cred)
            _db = firestore.client()
        return _db


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def _badge_for_points(pts: int) -> UserBadge:
    if pts >= 500: return UserBadge.CIVIC_HERO
    if pts >= 201: return UserBadge.REPORTER
    if pts >= 51:  return UserBadge.WATCHDOG
    return UserBadge.NEWCOMER

def _dict_to_issue(d: dict) -> IssueOut:
    loc = d.get("location", {})
    return IssueOut(
        id=d.get("id", ""),
        title=d.get("title", ""),
        description=d.get("description", ""),
        category=d.get("category"),
        status=IssueStatus(d.get("status", "REPORTED")),
        location=Location(lat=loc.get("lat", 0), lng=loc.get("lng", 0), address=loc.get("address", "")),
        image_urls=d.get("imageUrls", []),
        reported_by=d.get("reportedBy", ""),
        verified_by=d.get("verifiedBy", []),
        verification_count=d.get("verificationCount", 0),
        upvotes=d.get("upvotes", 0),
        department=d.get("department"),
        escalated=d.get("escalated", False),
        priority_score=d.get("priorityScore", 0),
        duplicate_of=d.get("duplicateOf"),
        estimated_resolution_hours=d.get("estimatedResolutionHours"),
        ai_analysis=d.get("aiAnalysis"),
        ai_timeline=[TimelineStage(**s) for s in d.get("aiTimeline", [])],
        created_at=d.get("createdAt", ""),
        updated_at=d.get("updatedAt", ""),
        resolved_at=d.get("resolvedAt"),
    )

def _dict_to_user(d: dict) -> UserOut:
    pts = d.get("points", 0)
    return UserOut(
        uid=d.get("uid", ""),
        display_name=d.get("displayName", ""),
        email=d.get("email", ""),
        photo_url=d.get("photoURL", ""),
        points=pts,
        badge=_badge_for_points(pts),
        issues_reported=d.get("issuesReported", 0),
        issues_verified=d.get("issuesVerified", 0),
        issues_resolved=d.get("issuesResolved", 0),
        joined_at=d.get("joinedAt", ""),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Issues
# ═══════════════════════════════════════════════════════════════════════════════

async def create_issue(payload: IssueCreate, reporter_uid: str) -> IssueOut:
    if DEMO_MODE:
        now = _now_iso()
        cie = payload.cie_response
        issue_id = f"issue-{str(uuid4())[:8]}"
        doc: dict[str, Any] = {
            "id": issue_id,
            "title": payload.title,
            "description": payload.description,
            "category": cie.agent1_detection.category.value if (cie and cie.agent1_detection.category) else None,
            "status": "REPORTED",
            "location": {"lat": payload.location.lat, "lng": payload.location.lng, "address": payload.location.address},
            "imageUrls": payload.image_urls,
            "reportedBy": reporter_uid,
            "verifiedBy": [],
            "verificationCount": 0,
            "upvotes": 0,
            "department": cie.agent4_routing.department.value if cie else None,
            "escalated": cie.agent4_routing.escalate if cie else False,
            "priorityScore": cie.agent3_priority.priority_score if cie else 0,
            "duplicateOf": cie.agent2_duplicate.duplicate_of if cie else None,
            "estimatedResolutionHours": cie.agent3_priority.estimated_resolution_hours if cie else 72,
            "aiAnalysis": cie.model_dump() if cie else None,
            "aiTimeline": [
                {"stage": "AI Detected",        "timestamp": now, "note": "Gemini classified the issue"},
                {"stage": "Evidence Validated", "timestamp": now if (cie and cie.agent1_detection.quality_pass) else None, "note": "Image quality passed"},
                {"stage": "Community Confirmed","timestamp": None, "note": None},
                {"stage": "Department Assigned","timestamp": now if cie else None, "note": f"Routed to {cie.agent4_routing.department.value}" if cie else None},
                {"stage": "Work Ordered",       "timestamp": None, "note": None},
                {"stage": "Resolved",           "timestamp": None, "note": None},
            ],
            "tags": cie.agent5_insight.tags if cie else [],
            "createdAt": now, "updatedAt": now, "resolvedAt": None,
        }
        _issues[issue_id] = doc
        logger.info(f"[DEMO] Issue created: {issue_id}")
        return _dict_to_issue(doc)
    # Real Firebase path
    db = get_db()
    cie = payload.cie_response
    now = _now_iso()
    doc_ref = db.collection(COL_ISSUES).document()
    doc = {
        "title": payload.title,
        "description": payload.description,
        "category": cie.agent1_detection.category.value if (cie and cie.agent1_detection.category) else None,
        "status": "REPORTED",
        "location": {"lat": payload.location.lat, "lng": payload.location.lng, "address": payload.location.address},
        "imageUrls": payload.image_urls,
        "reportedBy": reporter_uid,
        "verifiedBy": [],
        "verificationCount": 0,
        "upvotes": 0,
        "department": cie.agent4_routing.department.value if cie else None,
        "escalated": cie.agent4_routing.escalate if cie else False,
        "priorityScore": cie.agent3_priority.priority_score if cie else 0,
        "duplicateOf": cie.agent2_duplicate.duplicate_of if cie else None,
        "estimatedResolutionHours": cie.agent3_priority.estimated_resolution_hours if cie else 72,
        "aiAnalysis": cie.model_dump() if cie else None,
        "aiTimeline": [
            {"stage": "AI Detected",        "timestamp": now, "note": "Gemini classified the issue"},
            {"stage": "Evidence Validated", "timestamp": now if (cie and cie.agent1_detection.quality_pass) else None, "note": "Image quality passed"},
            {"stage": "Community Confirmed","timestamp": None, "note": None},
            {"stage": "Department Assigned","timestamp": now if cie else None, "note": f"Routed to {cie.agent4_routing.department.value}" if cie else None},
            {"stage": "Work Ordered",       "timestamp": None, "note": None},
            {"stage": "Resolved",           "timestamp": None, "note": None},
        ],
        "tags": cie.agent5_insight.tags if cie else [],
        "createdAt": now, "updatedAt": now, "resolvedAt": None,
    }
    doc_ref.set(doc)
    doc["id"] = doc_ref.id
    return _dict_to_issue(doc)


async def get_issue(issue_id: str) -> Optional[IssueOut]:
    if DEMO_MODE:
        d = _issues.get(issue_id)
        return _dict_to_issue(d) if d else None
    db = get_db()
    from google.cloud.firestore_v1 import DocumentSnapshot
    doc = db.collection(COL_ISSUES).document(issue_id).get()
    if not doc.exists: return None
    return _dict_to_issue({"id": doc.id, **doc.to_dict()})


async def list_issues(
    status: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> IssueListResponse:
    if DEMO_MODE:
        items = list(_issues.values())
        if status:     items = [i for i in items if i.get("status") == status]
        if category:   items = [i for i in items if i.get("category") == category]
        if department: items = [i for i in items if i.get("department") == department]
        items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        total = len(items)
        start = (page - 1) * page_size
        paged = items[start: start + page_size]
        return IssueListResponse(items=[_dict_to_issue(i) for i in paged], total=total, page=page, page_size=page_size)
    # Real Firebase
    db = get_db()
    import firebase_admin.firestore as fs
    q = db.collection(COL_ISSUES)
    if status:     q = q.where("status", "==", status)
    if category:   q = q.where("category", "==", category)
    if department: q = q.where("department", "==", department)
    q = q.order_by("createdAt", direction=fs.Query.DESCENDING)
    all_docs = list(q.stream())
    total = len(all_docs)
    paged = all_docs[(page-1)*page_size: page*page_size]
    items = [_dict_to_issue({"id": d.id, **d.to_dict()}) for d in paged if d.exists]
    return IssueListResponse(items=items, total=total, page=page, page_size=page_size)


async def update_issue_status(issue_id: str, update: IssueUpdate) -> Optional[IssueOut]:
    if DEMO_MODE:
        d = _issues.get(issue_id)
        if not d: return None
        now = _now_iso()
        if update.status:
            d["status"] = update.status.value
            if update.status == IssueStatus.RESOLVED:
                d["resolvedAt"] = now
        if update.description is not None:
            d["description"] = update.description
        d["updatedAt"] = now
        return _dict_to_issue(d)
    db = get_db()
    ref = db.collection(COL_ISSUES).document(issue_id)
    now = _now_iso()
    patch: dict[str, Any] = {"updatedAt": now}
    if update.status:
        patch["status"] = update.status.value
        if update.status == IssueStatus.RESOLVED:
            patch["resolvedAt"] = now
    if update.description is not None:
        patch["description"] = update.description
    ref.update(patch)
    doc = ref.get()
    return _dict_to_issue({"id": doc.id, **doc.to_dict()}) if doc.exists else None


async def soft_delete_issue(issue_id: str) -> bool:
    if DEMO_MODE:
        if issue_id in _issues:
            _issues[issue_id]["status"] = "DELETED"
        return True
    db = get_db()
    db.collection(COL_ISSUES).document(issue_id).update({"status": "DELETED", "updatedAt": _now_iso()})
    return True


async def get_open_issues_for_briefing(hours: int = 24) -> list[dict]:
    if DEMO_MODE:
        return [i for i in _issues.values() if i.get("status") not in ("RESOLVED", "DELETED")]
    db = get_db()
    docs = db.collection(COL_ISSUES).where("status", "not-in", ["RESOLVED", "DELETED"]).stream()
    return [{"id": d.id, **d.to_dict()} for d in docs if d.exists]


# ═══════════════════════════════════════════════════════════════════════════════
# Votes
# ═══════════════════════════════════════════════════════════════════════════════

async def cast_vote(issue_id: str, user_uid: str, vote_type: VoteType) -> dict:
    if DEMO_MODE:
        vote_key = f"{issue_id}_{user_uid}_{vote_type.value}"
        if vote_key not in _votes:
            _votes[vote_key] = True
            d = _issues.get(issue_id, {})
            if vote_type == VoteType.UPVOTE:
                d["upvotes"] = d.get("upvotes", 0) + 1
            elif vote_type == VoteType.VERIFY:
                uid_list = d.get("verifiedBy", [])
                if user_uid not in uid_list:
                    uid_list.append(user_uid)
                    d["verifiedBy"] = uid_list
                    d["verificationCount"] = len(uid_list)
                if d.get("verificationCount", 0) >= 3 and d.get("status") == "REPORTED":
                    d["status"] = "VERIFIED"
        return await get_vote_state(issue_id, user_uid)
    # Real Firebase
    import firebase_admin.firestore as fs
    db = get_db()
    vref = db.collection(COL_VOTES).document(f"{issue_id}_{user_uid}_{vote_type.value}")
    iref = db.collection(COL_ISSUES).document(issue_id)
    if not vref.get().exists:
        vref.set({"issueId": issue_id, "userId": user_uid, "type": vote_type.value, "createdAt": _now_iso()})
        if vote_type == VoteType.UPVOTE:
            iref.update({"upvotes": fs.Increment(1)})
        elif vote_type == VoteType.VERIFY:
            iref.update({"verificationCount": fs.Increment(1), "verifiedBy": fs.ArrayUnion([user_uid])})
    return await get_vote_state(issue_id, user_uid)


async def get_vote_state(issue_id: str, user_uid: str) -> dict:
    if DEMO_MODE:
        d = _issues.get(issue_id, {})
        return {
            "issue_id": issue_id,
            "upvotes": d.get("upvotes", 0),
            "verification_count": d.get("verificationCount", 0),
            "user_has_verified": user_uid in d.get("verifiedBy", []),
            "user_has_upvoted": f"{issue_id}_{user_uid}_UPVOTE" in _votes,
        }
    db = get_db()
    d = db.collection(COL_ISSUES).document(issue_id).get().to_dict() or {}
    user_upvoted = db.collection(COL_VOTES).document(f"{issue_id}_{user_uid}_UPVOTE").get().exists
    return {
        "issue_id": issue_id,
        "upvotes": d.get("upvotes", 0),
        "verification_count": d.get("verificationCount", 0),
        "user_has_verified": user_uid in d.get("verifiedBy", []),
        "user_has_upvoted": user_upvoted,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Users
# ═══════════════════════════════════════════════════════════════════════════════

async def upsert_user(uid: str, display_name: str, email: str, photo_url: str) -> UserOut:
    if DEMO_MODE:
        if uid not in _users:
            _users[uid] = {"uid": uid, "displayName": display_name, "email": email,
                           "photoURL": photo_url, "points": 0, "badge": "NEWCOMER",
                           "issuesReported": 0, "issuesVerified": 0, "issuesResolved": 0,
                           "joinedAt": _now_iso()}
        else:
            _users[uid].update({"displayName": display_name, "photoURL": photo_url})
        return _dict_to_user(_users[uid])
    db = get_db()
    ref = db.collection(COL_USERS).document(uid)
    if not ref.get().exists:
        ref.set({"uid": uid, "displayName": display_name, "email": email, "photoURL": photo_url,
                 "points": 0, "badge": "NEWCOMER", "issuesReported": 0, "issuesVerified": 0,
                 "issuesResolved": 0, "joinedAt": _now_iso()})
    else:
        ref.update({"displayName": display_name, "photoURL": photo_url})
    doc = ref.get()
    return _dict_to_user({"uid": doc.id, **doc.to_dict()})


async def get_user(uid: str) -> Optional[UserOut]:
    if DEMO_MODE:
        d = _users.get(uid)
        return _dict_to_user(d) if d else None
    db = get_db()
    doc = db.collection(COL_USERS).document(uid).get()
    return _dict_to_user({"uid": doc.id, **doc.to_dict()}) if doc.exists else None


async def get_leaderboard(limit: int = 10) -> list[LeaderboardEntry]:
    if DEMO_MODE:
        sorted_users = sorted(_users.values(), key=lambda u: u.get("points", 0), reverse=True)[:limit]
        return [
            LeaderboardEntry(rank=i+1, uid=u["uid"], display_name=u["displayName"],
                             photo_url=u.get("photoURL", ""), points=u["points"],
                             badge=_badge_for_points(u["points"]))
            for i, u in enumerate(sorted_users)
        ]
    db = get_db()
    import firebase_admin.firestore as fs
    docs = db.collection(COL_USERS).order_by("points", direction=fs.Query.DESCENDING).limit(limit).stream()
    return [
        LeaderboardEntry(rank=i+1, uid=d.id, display_name=d.to_dict().get("displayName",""),
                         photo_url=d.to_dict().get("photoURL",""), points=d.to_dict().get("points",0),
                         badge=_badge_for_points(d.to_dict().get("points",0)))
        for i, d in enumerate(docs)
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# Mayor briefings
# ═══════════════════════════════════════════════════════════════════════════════

async def save_mayor_briefing(briefing_data: dict) -> str:
    if DEMO_MODE:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        _briefings[today] = {**briefing_data, "generatedAt": _now_iso()}
        return today
    db = get_db()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    db.collection(COL_BRIEFINGS).document(today).set({**briefing_data, "generatedAt": _now_iso()})
    return today


async def get_latest_mayor_briefing() -> Optional[dict]:
    if DEMO_MODE:
        if _briefings:
            return sorted(_briefings.values(), key=lambda b: b.get("generatedAt", ""), reverse=True)[0]
        return None
    db = get_db()
    import firebase_admin.firestore as fs
    docs = db.collection(COL_BRIEFINGS).order_by("generatedAt", direction=fs.Query.DESCENDING).limit(1).stream()
    for doc in docs:
        return doc.to_dict()
    return None


async def _award_points(uid: str, points: int, reason: str) -> None:
    if DEMO_MODE:
        if uid in _users:
            _users[uid]["points"] = _users[uid].get("points", 0) + points
        return
    if not uid: return
    db = get_db()
    import firebase_admin.firestore as fs
    try:
        db.collection(COL_USERS).document(uid).update({"points": fs.Increment(points)})
    except Exception as e:
        logger.warning(f"Could not award points to {uid}: {e}")
