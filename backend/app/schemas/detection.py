from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class FrameResult(BaseModel):
    frame_number: int
    timestamp: float
    prediction: str
    confidence: float
    is_suspicious: bool


class DetectionResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    prediction: str
    confidence: float
    explanation: str
    heatmap_path: Optional[str] = None
    report_path: Optional[str] = None
    frame_results: Optional[List[FrameResult]] = None
    edit_types: Optional[List[str]] = None
    processing_time: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DetectionListItem(BaseModel):
    id: int
    filename: str
    file_type: str
    prediction: str
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True


class DetectionStats(BaseModel):
    total_scans: int
    real_count: int
    fake_count: int
    average_confidence: float
    recent_detections: List[DetectionListItem]
