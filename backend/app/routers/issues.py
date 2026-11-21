"""
Issues Router — /api/issues
============================
POST   /api/issues              Create issue (with CIE result)
GET    /api/issues              List issues (filterable, paginated)
GET    /api/issues/{id}         Single issue
PATCH  /api/issues/{id}/status  Update status
DELETE /api/issues/{id}         Soft delete
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.middleware.auth import optional_auth, require_auth
from app.models.schemas import (
    IssueCreate, IssueListResponse, IssueOut, IssueUpdate, SuccessResponse,
)
from app.services import firebase_service as db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/issues", tags=["Issues"])


@router.post(
    "",
    response_model=IssueOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new civic issue report",
)
async def create_issue(
    payload: IssueCreate,
    user: Optional[dict] = Depends(optional_auth),
) -> IssueOut:
    """
    Creates a new civic issue.
    Expects the CIE analysis result from `/api/ai/analyze` embedded in the body.
    Awards gamification points to the reporter.
    """
    reporter_uid = user["uid"] if user else "anonymous_user"
    return await db.create_issue(payload, reporter_uid=reporter_uid)


@router.get(
    "",
    response_model=IssueListResponse,
    summary="List issues with filters and pagination",
)
async def list_issues(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _user: Optional[dict] = Depends(optional_auth),
) -> IssueListResponse:
    return await db.list_issues(
        status=status_filter,
        category=category,
        department=department,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{issue_id}",
    response_model=IssueOut,
    summary="Get a single issue by ID",
)
async def get_issue(
    issue_id: str,
    _user: Optional[dict] = Depends(optional_auth),
) -> IssueOut:
    issue = await db.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return issue


@router.patch(
    "/{issue_id}/status",
    response_model=IssueOut,
    summary="Update issue status (admin / department)",
)
async def update_status(
    issue_id: str,
    payload: IssueUpdate,
    user: dict = Depends(require_auth),
) -> IssueOut:
    issue = await db.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    updated = await db.update_issue_status(issue_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Update failed.")
    return updated


@router.delete(
    "/{issue_id}",
    response_model=SuccessResponse,
    summary="Soft-delete an issue",
)
async def delete_issue(
    issue_id: str,
    user: dict = Depends(require_auth),
) -> SuccessResponse:
    issue = await db.get_issue(issue_id)
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    if issue.reported_by != user["uid"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    await db.soft_delete_issue(issue_id)
    return SuccessResponse(message="Issue deleted.")
