"""
AI Deepfake Detector — FastAPI Application Entry Point
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.db.database import create_tables, run_migrations
from app.api import auth, detections, admin
from app.utils.file_utils import ensure_dirs

# Boot logging before anything else
setup_logging()
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    ensure_dirs([settings.UPLOAD_DIR, settings.REPORTS_DIR, settings.LOGS_DIR, "models"])
    create_tables()
    run_migrations()
    logger.info("Database tables ready")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade AI deepfake detection API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
#  Global exception handler                                                     #
# --------------------------------------------------------------------------- #

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# --------------------------------------------------------------------------- #
#  Routers                                                                      #
# --------------------------------------------------------------------------- #

app.include_router(auth.router, prefix="/api/v1")
app.include_router(detections.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


# --------------------------------------------------------------------------- #
#  Health Check                                                                 #
# --------------------------------------------------------------------------- #

@app.get("/api/health", tags=["Health"])
def health_check():
    from app.services.model_service import model_manager
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "model_loaded": model_manager.weights_loaded,
        "model_device": str(model_manager.device),
        "environment": settings.ENVIRONMENT,
    }


# --------------------------------------------------------------------------- #
#  Serve uploaded files (heatmaps)                                              #
# --------------------------------------------------------------------------- #

if os.path.isdir(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
