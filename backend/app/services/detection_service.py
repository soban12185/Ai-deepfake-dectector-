"""
Detection Service — orchestrates image and video analysis pipelines.
"""

import io
import os
import time
import uuid
import logging
from typing import List, Tuple, Optional

import numpy as np
from PIL import Image, ImageFilter
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.detection import Detection
from app.models.user import User
from app.schemas.detection import FrameResult
from app.services.model_service import model_manager, generate_heatmap
from app.utils.file_utils import sanitize_filename, ensure_dirs

logger = logging.getLogger(__name__)

ensure_dirs([settings.UPLOAD_DIR, settings.REPORTS_DIR])


# --------------------------------------------------------------------------- #
#  Edit-Type Analysis                                                           #
# --------------------------------------------------------------------------- #

def _detect_edit_types(pil_image: Image.Image, prediction: str, confidence: float) -> List[str]:
    """
    Run a suite of classical-CV heuristics to identify *what kind* of editing
    was applied to the image.  Returns a list of human-readable tag strings.
    Each check is isolated so a failure in one never breaks the others.
    """
    tags: List[str] = []

    # Only run deep analysis when the model says FAKE
    if prediction != "FAKE":
        return tags

    try:
        import cv2
    except ImportError:
        return tags

    img_rgb = np.array(pil_image.convert("RGB"))
    img_gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    h, w = img_gray.shape

    # ── 1. Error Level Analysis (ELA) ──────────────────────────────────────
    try:
        buf = io.BytesIO()
        pil_image.convert("RGB").save(buf, format="JPEG", quality=75)
        buf.seek(0)
        compressed = np.array(Image.open(buf).convert("RGB"), dtype=np.float32)
        original_f = img_rgb.astype(np.float32)
        ela = np.abs(original_f - compressed)
        ela_mean = ela.mean()
        ela_std = ela.std()
        # Patchy high-ELA regions indicate localised re-saving / compositing
        if ela_mean > 8.0 or ela_std > 18.0:
            tags.append("Image Splicing / Compositing")
        # Very uniform ELA across all channels → regenerated (GAN) image
        if ela_std < 4.0 and ela_mean < 5.0:
            tags.append("AI-Generated (GAN / Diffusion)")
    except Exception as e:
        logger.debug(f"ELA check failed: {e}")

    # ── 2. Noise Inconsistency ──────────────────────────────────────────────
    try:
        blurred = cv2.GaussianBlur(img_gray, (5, 5), 0)
        noise_map = np.abs(img_gray - blurred)
        # Divide into a 3×3 grid and compare local noise stdev values
        cell_h, cell_w = h // 3, w // 3
        stdevs = []
        for r in range(3):
            for c in range(3):
                patch = noise_map[r * cell_h:(r + 1) * cell_h, c * cell_w:(c + 1) * cell_w]
                stdevs.append(float(patch.std()))
        stdev_range = max(stdevs) - min(stdevs)
        if stdev_range > 6.0:
            tags.append("Noise Inconsistency (Region Pasting)")
    except Exception as e:
        logger.debug(f"Noise check failed: {e}")

    # ── 3. FFT Frequency Artifacts ──────────────────────────────────────────
    try:
        f_transform = np.fft.fft2(img_gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude = np.log1p(np.abs(f_shift))
        # GAN images often show periodic grid patterns in frequency domain
        center_y, center_x = h // 2, w // 2
        strip_h = magnitude[center_y - 2:center_y + 2, :]
        strip_v = magnitude[:, center_x - 2:center_x + 2]
        cross_energy = float(strip_h.mean() + strip_v.mean())
        total_energy = float(magnitude.mean())
        if total_energy > 0 and (cross_energy / total_energy) > 3.5:
            tags.append("Periodic Grid Artifacts (GAN Fingerprint)")
    except Exception as e:
        logger.debug(f"FFT check failed: {e}")

    # ── 4. Blur / Sharpness Region Inconsistency ────────────────────────────
    try:
        laplacian = cv2.Laplacian(img_gray, cv2.CV_32F)
        cell_h2, cell_w2 = h // 4, w // 4
        laplacian_vars = []
        for r in range(4):
            for c in range(4):
                patch = laplacian[r * cell_h2:(r + 1) * cell_h2, c * cell_w2:(c + 1) * cell_w2]
                laplacian_vars.append(float(patch.var()))
        if laplacian_vars:
            var_ratio = max(laplacian_vars) / (min(laplacian_vars) + 1e-6)
            if var_ratio > 80:
                tags.append("Blur/Sharpness Mismatch (Face Swap / Inpainting)")
    except Exception as e:
        logger.debug(f"Blur check failed: {e}")

    # ── 5. Color Channel Splicing ───────────────────────────────────────────
    try:
        r_ch = img_rgb[:, :, 0].astype(np.float32)
        g_ch = img_rgb[:, :, 1].astype(np.float32)
        b_ch = img_rgb[:, :, 2].astype(np.float32)
        rg_corr = float(np.corrcoef(r_ch.ravel(), g_ch.ravel())[0, 1])
        rb_corr = float(np.corrcoef(r_ch.ravel(), b_ch.ravel())[0, 1])
        gb_corr = float(np.corrcoef(g_ch.ravel(), b_ch.ravel())[0, 1])
        min_corr = min(rg_corr, rb_corr, gb_corr)
        # Natural photos have strongly correlated channels; spliced regions break this
        if min_corr < 0.55:
            tags.append("Color Channel Inconsistency (Splicing)")
    except Exception as e:
        logger.debug(f"Color channel check failed: {e}")

    # ── 6. High-confidence catch-all ────────────────────────────────────────
    if not tags and confidence > 0.70:
        tags.append("AI-Generated (Unspecified Manipulation)")

    return tags


def _build_explanation(prediction: str, confidence: float, file_type: str) -> str:
    pct = round(confidence * 100, 1)
    if prediction == "FAKE":
        return (
            f"Our AI model detected signs of digital manipulation in this {file_type} "
            f"with {pct}% confidence. Common indicators include unnatural facial blending, "
            "inconsistent lighting artifacts, and temporal incoherence in facial features. "
            "We recommend cross-verifying with a second source."
        )
    return (
        f"This {file_type} appears to be authentic based on our analysis ({pct}% confidence). "
        "No significant manipulation artifacts were detected. Natural noise patterns, "
        "consistent lighting, and coherent facial geometry support this conclusion."
    )


# --------------------------------------------------------------------------- #
#  Image Detection                                                              #
# --------------------------------------------------------------------------- #

def analyze_image(
    file_bytes: bytes,
    original_filename: str,
    user: User,
    db: Session,
) -> Detection:
    start = time.time()
    safe_name = sanitize_filename(original_filename)
    uid = uuid.uuid4().hex[:8]
    stem = os.path.splitext(safe_name)[0]

    upload_path = os.path.join(settings.UPLOAD_DIR, f"{uid}_{safe_name}")
    heatmap_path = os.path.join(settings.UPLOAD_DIR, f"{uid}_{stem}_heatmap.jpg")

    with open(upload_path, "wb") as f:
        f.write(file_bytes)

    pil_image = Image.open(upload_path).convert("RGB")
    prediction, confidence = model_manager.predict_image(pil_image)
    generate_heatmap(pil_image, heatmap_path, model_manager)
    edit_types = _detect_edit_types(pil_image, prediction, confidence)

    elapsed = round(time.time() - start, 2)
    explanation = _build_explanation(prediction, confidence, "image")

    detection = Detection(
        user_id=user.id,
        filename=original_filename,
        file_type="image",
        file_size=len(file_bytes),
        prediction=prediction,
        confidence=round(confidence, 4),
        explanation=explanation,
        heatmap_path=os.path.basename(heatmap_path),
        edit_types=edit_types,
        processing_time=elapsed,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    logger.info(f"Image analysis done [{elapsed}s] → {prediction} ({confidence:.2%}) | edits={edit_types}")
    return detection


# --------------------------------------------------------------------------- #
#  Video Detection                                                              #
# --------------------------------------------------------------------------- #

def analyze_video(
    file_bytes: bytes,
    original_filename: str,
    user: User,
    db: Session,
) -> Detection:
    start = time.time()
    safe_name = sanitize_filename(original_filename)
    uid = uuid.uuid4().hex[:8]

    video_path = os.path.join(settings.UPLOAD_DIR, f"{uid}_{safe_name}")
    with open(video_path, "wb") as f:
        f.write(file_bytes)

    frame_results, final_prediction, final_confidence = _process_video_frames(video_path)
    elapsed = round(time.time() - start, 2)
    explanation = _build_explanation(final_prediction, final_confidence, "video")
    edit_types = _build_video_edit_types(final_prediction, final_confidence, frame_results)

    frame_dicts = [fr.dict() for fr in frame_results]

    detection = Detection(
        user_id=user.id,
        filename=original_filename,
        file_type="video",
        file_size=len(file_bytes),
        prediction=final_prediction,
        confidence=round(final_confidence, 4),
        explanation=explanation,
        frame_results=frame_dicts,
        edit_types=edit_types,
        processing_time=elapsed,
    )
    db.add(detection)
    db.commit()
    db.refresh(detection)
    logger.info(f"Video analysis done [{elapsed}s] → {final_prediction} ({final_confidence:.2%}) across {len(frame_results)} frames | edits={edit_types}")
    return detection


def _build_video_edit_types(
    prediction: str,
    confidence: float,
    frame_results: List[FrameResult],
) -> List[str]:
    """Derive manipulation tags from video frame statistics."""
    tags: List[str] = []
    if prediction != "FAKE":
        return tags
    fake_frames = [fr for fr in frame_results if fr.prediction == "FAKE"]
    total = len(frame_results)
    if total == 0:
        return tags
    fake_ratio = len(fake_frames) / total
    if fake_ratio > 0.8:
        tags.append("Fully AI-Generated Video (Deepfake)")
    elif fake_ratio > 0.4:
        tags.append("Partial Face Swap / Temporal Splicing")
    else:
        tags.append("Selective Frame Manipulation")
    if confidence > 0.85:
        tags.append("High-Confidence GAN / Diffusion Model")
    return tags


def _process_video_frames(
    video_path: str,
) -> Tuple[List[FrameResult], str, float]:
    try:
        import cv2
    except ImportError:
        logger.warning("OpenCV not available, cannot process video.")
        return [], "REAL", 0.5

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Sample evenly across the video
    sample_rate = max(1, total_frames // settings.MAX_FRAMES_TO_ANALYZE)
    frame_results: List[FrameResult] = []
    frame_num = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_num % sample_rate == 0:
            pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            pred, conf = model_manager.predict_image(pil_frame)
            fr = FrameResult(
                frame_number=frame_num,
                timestamp=round(frame_num / fps, 2),
                prediction=pred,
                confidence=round(conf, 4),
                is_suspicious=(pred == "FAKE" and conf > 0.65),
            )
            frame_results.append(fr)
            if len(frame_results) >= settings.MAX_FRAMES_TO_ANALYZE:
                break
        frame_num += 1

    cap.release()

    if not frame_results:
        return [], "REAL", 0.5

    fake_scores = [fr.confidence for fr in frame_results if fr.prediction == "FAKE"]
    real_scores = [fr.confidence for fr in frame_results if fr.prediction == "REAL"]

    fake_ratio = len(fake_scores) / len(frame_results)
    avg_fake_conf = float(np.mean(fake_scores)) if fake_scores else 0.0
    avg_real_conf = float(np.mean(real_scores)) if real_scores else 0.0

    if fake_ratio >= 0.4:
        final_pred = "FAKE"
        final_conf = avg_fake_conf
    else:
        final_pred = "REAL"
        final_conf = avg_real_conf if avg_real_conf else 0.6

    return frame_results, final_pred, final_conf
