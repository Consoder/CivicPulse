"""
Firebase Auth Middleware — with demo mode bypass.
In DEMO_MODE, all auth returns a synthetic demo user.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"

_bearer = HTTPBearer(auto_error=False)

_DEMO_USER = {
    "uid":     "user-demo-1",
    "name":    "Kartik S.",
    "email":   "kartik@demo.com",
    "picture": "",
}


def _decode_token(token: str) -> dict:
    if DEMO_MODE:
        return _DEMO_USER
    try:
        from firebase_admin import auth
        return auth.verify_id_token(token)
    except Exception as exc:
        logger.warning("Token verification error: %s", exc)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")


async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    if DEMO_MODE:
        return _DEMO_USER
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header required.")
    return _decode_token(credentials.credentials)


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[dict]:
    if DEMO_MODE:
        return _DEMO_USER
    if not credentials:
        return None
    try:
        return _decode_token(credentials.credentials)
    except HTTPException:
        return None
