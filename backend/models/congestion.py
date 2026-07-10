import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from database.database import Base

class CongestionStatus(str, enum.Enum):
    CLEAR = "CLEAR"
    MODERATE = "MODERATE"
    HEAVY = "HEAVY"
    BLOCKED = "BLOCKED"

class CongestionRecord(Base):
    __tablename__ = "congestion_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    road_name: Mapped[str] = mapped_column(String(100), nullable=False)
    current_congestion: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Congestion percentage (0-100)
    status: Mapped[CongestionStatus] = mapped_column(
        Enum(CongestionStatus, name="congestionstatus"),
        default=CongestionStatus.CLEAR,
        nullable=False
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
