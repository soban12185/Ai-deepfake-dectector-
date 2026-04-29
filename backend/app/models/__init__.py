from sqlalchemy.orm import relationship
from app.models.user import User

# Add relationship to User model dynamically to avoid circular imports
User.detections = relationship("Detection", back_populates="user", cascade="all, delete-orphan")
