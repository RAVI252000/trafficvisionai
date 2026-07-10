import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from database.database import Base

class CongestionLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TrafficData(Base):
    __tablename__ = "traffic_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    road_name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    vehicle_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    traffic_density: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Density percentage (0-100)
    congestion_level: Mapped[CongestionLevel] = mapped_column(
        Enum(CongestionLevel, name="congestionlevel"),
        default=CongestionLevel.LOW,
        nullable=False
    )
    average_speed: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
