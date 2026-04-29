from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # image / video
    file_size = Column(Integer, nullable=False)  # bytes
    mime_type = Column(String, nullable=True)
    prediction = Column(String, nullable=False)  # REAL / FAKE
    confidence = Column(Float, nullable=False)
    explanation = Column(Text, nullable=True)
    heatmap_path = Column(String, nullable=True)
    report_path = Column(String, nullable=True)
    frame_results = Column(JSON, nullable=True)   # for video detections
    edit_types = Column(JSON, nullable=True)         # list of detected edit/manipulation types
    processing_time = Column(Float, nullable=True)  # seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="detections")
