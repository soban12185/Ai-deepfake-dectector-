import os
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.detection import Detection
from app.schemas.detection import DetectionResponse, DetectionListItem, DetectionStats, FrameResult
from app.services.detection_service import analyze_image, analyze_video
from app.services.report_service import generate_pdf_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/detections", tags=["Detections"])

MAX_IMAGE_BYTES = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
MAX_VIDEO_BYTES = settings.MAX_VIDEO_SIZE_MB * 1024 * 1024


def _validate_image(file: UploadFile) -> bytes:
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported image type: {file.content_type}. Allowed: {settings.ALLOWED_IMAGE_TYPES}",
        )
    data = file.file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {settings.MAX_IMAGE_SIZE_MB}MB limit",
        )
    return data


def _validate_video(file: UploadFile) -> bytes:
    if file.content_type not in settings.ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported video type: {file.content_type}. Allowed: {settings.ALLOWED_VIDEO_TYPES}",
        )
    data = file.file.read()
    if len(data) > MAX_VIDEO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video exceeds {settings.MAX_VIDEO_SIZE_MB}MB limit",
        )
    return data


@router.post("/analyze/image", response_model=DetectionResponse, status_code=201)
async def detect_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = _validate_image(file)
    detection = analyze_image(data, file.filename or "image.jpg", current_user, db)
    return _to_response(detection)


@router.post("/analyze/video", response_model=DetectionResponse, status_code=201)
async def detect_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = _validate_video(file)
    detection = analyze_video(data, file.filename or "video.mp4", current_user, db)
    return _to_response(detection)


@router.get("/", response_model=List[DetectionListItem])
def list_detections(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Detection)
        .filter(Detection.user_id == current_user.id)
        .order_by(Detection.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return rows


@router.get("/stats", response_model=DetectionStats)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_rows = db.query(Detection).filter(Detection.user_id == current_user.id).all()
    total = len(all_rows)
    real_count = sum(1 for r in all_rows if r.prediction == "REAL")
    fake_count = total - real_count
    avg_conf = round(sum(r.confidence for r in all_rows) / total, 4) if total else 0.0
    recent = sorted(all_rows, key=lambda r: r.created_at, reverse=True)[:5]
    return DetectionStats(
        total_scans=total,
        real_count=real_count,
        fake_count=fake_count,
        average_confidence=avg_conf,
        recent_detections=recent,
    )


@router.get("/{detection_id}", response_model=DetectionResponse)
def get_detection(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    d = _get_owned_detection(detection_id, current_user.id, db)
    return _to_response(d)


@router.delete("/{detection_id}", status_code=204)
def delete_detection(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    d = _get_owned_detection(detection_id, current_user.id, db)
    db.delete(d)
    db.commit()


@router.post("/{detection_id}/report")
def download_report(
    detection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    d = _get_owned_detection(detection_id, current_user.id, db)
    report_filename = generate_pdf_report(d, current_user.username)
    report_path = os.path.join(settings.REPORTS_DIR, report_filename)

    # Persist report path
    d.report_path = report_filename
    db.commit()

    return FileResponse(
        report_path,
        media_type="application/pdf",
        filename=report_filename,
    )


@router.get("/heatmap/{filename}")
def get_heatmap(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    # Security: strip path components
    safe = os.path.basename(filename)
    path = os.path.join(settings.UPLOAD_DIR, safe)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return FileResponse(path, media_type="image/jpeg")


# --------------------------------------------------------------------------- #
#  Helpers                                                                      #
# --------------------------------------------------------------------------- #

def _get_owned_detection(detection_id: int, user_id: int, db: Session) -> Detection:
    d = db.query(Detection).filter(Detection.id == detection_id, Detection.user_id == user_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Detection not found")
    return d


def _to_response(d: Detection) -> DetectionResponse:
    frames = None
    if d.frame_results:
        frames = [FrameResult(**f) for f in d.frame_results]
    return DetectionResponse(
        id=d.id,
        filename=d.filename,
        file_type=d.file_type,
        file_size=d.file_size,
        prediction=d.prediction,
        confidence=d.confidence,
        explanation=d.explanation or "",
        heatmap_path=d.heatmap_path,
        report_path=d.report_path,
        frame_results=frames,
        edit_types=d.edit_types or [],
        processing_time=d.processing_time,
        created_at=d.created_at,
    )
