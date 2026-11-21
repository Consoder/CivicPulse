"""
Votes Router — /api/votes
==========================
POST /api/votes          Cast a verify or upvote
GET  /api/votes/{id}     Get vote counts for an issue
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth import optional_auth, require_auth
from app.models.schemas import VoteRequest, VoteResponse
from app.services import firebase_service as db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/votes", tags=["Votes"])


@router.post(
    "",
    response_model=VoteResponse,
    summary="Cast a verify or upvote on an issue",
)
async def cast_vote(
    payload: VoteRequest,
    user: dict = Depends(require_auth),
) -> VoteResponse:
    """
    Idempotent — casting the same vote twice is a no-op.
    VERIFY votes auto-advance status to VERIFIED at 3 verifications.
    Awards +5 pts to the voter and +15 pts to the reporter at threshold.
    """
    issue = await db.get_issue(payload.issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    result = await db.cast_vote(payload.issue_id, user["uid"], payload.vote_type)
    return VoteResponse(**result)


@router.get(
    "/{issue_id}",
    response_model=VoteResponse,
    summary="Get vote counts and current user's vote state",
)
async def get_votes(
    issue_id: str,
    user: dict = Depends(require_auth),
) -> VoteResponse:
    result = await db.get_vote_state(issue_id, user["uid"])
    return VoteResponse(**result)
