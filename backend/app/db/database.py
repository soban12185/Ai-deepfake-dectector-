import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from app.models import user, detection  # noqa: F401
    Base.metadata.create_all(bind=engine)


def run_migrations():
    """
    Safely apply incremental schema changes to existing tables.
    SQLAlchemy's create_all() only creates missing tables — it never
    alters existing ones. Add every new column here so deployments
    against an existing database don't crash.
    """
    inspector = inspect(engine)

    # --- detections table migrations ---
    if "detections" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("detections")}
        with engine.connect() as conn:
            # v2: edit_types column (list of manipulation tags as JSON)
            if "edit_types" not in existing_cols:
                logger.info("Migration: adding 'edit_types' column to detections table")
                conn.execute(text("ALTER TABLE detections ADD COLUMN edit_types JSON"))
                conn.commit()

            # v2: mime_type column
            if "mime_type" not in existing_cols:
                logger.info("Migration: adding 'mime_type' column to detections table")
                conn.execute(text("ALTER TABLE detections ADD COLUMN mime_type VARCHAR"))
                conn.commit()

    logger.info("Database migrations complete")
