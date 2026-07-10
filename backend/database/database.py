from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from core.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    # psycopg2 doesn't need connect_args={"check_same_thread": False} as it is only for sqlite
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class
class Base(DeclarativeBase):
    pass

# DB dependency for FastAPI routes
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
