"""
CivicPulse — AI Civic Operations Platform
FastAPI application entry point.
"""

import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
DEMO_MODE = settings.DEMO_MODE

from app.routers import ai, issues, users, votes

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if DEMO_MODE:
        logger.info("🟡 CivicPulse starting in DEMO MODE — in-memory store, no external APIs")
    else:
        logger.info("CivicPulse backend starting | env=%s", settings.APP_ENV)
        try:
            from app.services.firebase_service import get_db
            get_db()
            logger.info("Firebase Admin initialised ✓")
        except Exception as exc:
            logger.warning("Firebase init failed: %s", exc)
    yield
    logger.info("CivicPulse backend shutting down")


app = FastAPI(
    title="CivicPulse — AI Civic Operations Platform",
    description="5-agent Civic Intelligence Engine built on Gemini 2.0 Flash.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Response-Time-Ms"] = f"{(time.perf_counter()-start)*1000:.1f}"
    return response

@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(status_code=500, content={"success": False, "error": "Internal server error."})

app.include_router(ai.router)
app.include_router(issues.router)
app.include_router(votes.router)
app.include_router(users.router)

@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "civicpulse-backend", "env": settings.APP_ENV, "demo": DEMO_MODE}

@app.get("/", tags=["System"])
async def root():
    return {"name": "CivicPulse API", "docs": "/docs", "demo_mode": DEMO_MODE}
