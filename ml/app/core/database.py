"""Database session management for the ML service."""

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"connect_timeout": 5},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
