import os
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Deepfake Detector"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = "change-this-in-production-super-secret-key-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./deepfake_detector.db"

    # Paths
    UPLOAD_DIR: str = "uploads"
    MODELS_DIR: str = "models"
    REPORTS_DIR: str = "reports"
    LOGS_DIR: str = "logs"

    # File limits
    MAX_IMAGE_SIZE_MB: int = 10
    MAX_VIDEO_SIZE_MB: int = 100
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    ALLOWED_VIDEO_TYPES: List[str] = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"]

    # Video processing
    MAX_FRAMES_TO_ANALYZE: int = 30
    FRAME_SAMPLE_RATE: int = 10  # every N frames

    # Rate limiting
    RATE_LIMIT_UPLOADS: int = 10  # per minute

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:80",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Model
    MODEL_PATH: str = "models/deepfake_detector.pth"
    MODEL_INPUT_SIZE: int = 224
    MODEL_CONFIDENCE_THRESHOLD: float = 0.5

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
