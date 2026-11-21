"""
Users Router — /api/users
==========================
POST /api/users/sync         Upsert user from Firebase token (called on login)
GET  /api/users/me           Own profile
GET  /api/users/leaderboard  Top 10 civic heroes
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.middleware.auth import require_auth
from app.models.schemas import LeaderboardEntry, UserOut
from app.services import firebase_service as db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post(
    "/sync",
    response_model=UserOut,
    summary="Sync Firebase user into Firestore (call on login)",
)
async def sync_user(user: dict = Depends(require_auth)) -> UserOut:
    """
    Called by the frontend immediately after Google Sign-In.
    Creates the user document if it doesn't exist, updates display name and photo otherwise.
    """
    return await db.upsert_user(
        uid=user["uid"],
        display_name=user.get("name", "Anonymous"),
        email=user.get("email", ""),
        photo_url=user.get("picture", ""),
    )


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get own profile and points",
)
async def get_me(user: dict = Depends(require_auth)) -> UserOut:
    profile = await db.get_user(user["uid"])
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found. Call /sync first.")
    return profile


@router.get(
    "/leaderboard",
    response_model=list[LeaderboardEntry],
    summary="Top civic heroes by points",
)
async def leaderboard(
    limit: int = Query(default=10, ge=1, le=50),
    _user: dict = Depends(require_auth),
) -> list[LeaderboardEntry]:
    return await db.get_leaderboard(limit=limit)
