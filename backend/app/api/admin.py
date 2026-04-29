from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.detection import Detection

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    from fastapi import HTTPException, status
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    total_users = db.query(func.count(User.id)).scalar()
    total_detections = db.query(func.count(Detection.id)).scalar()
    fake_count = db.query(func.count(Detection.id)).filter(Detection.prediction == "FAKE").scalar()
    real_count = db.query(func.count(Detection.id)).filter(Detection.prediction == "REAL").scalar()
    avg_conf = db.query(func.avg(Detection.confidence)).scalar() or 0.0

    return {
        "total_users": total_users,
        "total_detections": total_detections,
        "fake_count": fake_count,
        "real_count": real_count,
        "average_confidence": round(float(avg_conf), 4),
    }


@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "created_at": u.created_at,
        }
        for u in users
    ]
