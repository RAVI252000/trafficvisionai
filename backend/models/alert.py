import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from database.database import Base

class AlertType(str, enum.Enum):
    HEAVY_TRAFFIC = "Heavy Traffic"
    SEVERE_CONGESTION = "Severe Congestion"
    ACCIDENT = "Accident Alert"
    ROAD_CLOSURE = "Road Closure"
    WEATHER_IMPACT = "Weather Impact"
    HIGH_VOLUME = "High Traffic Volume"
    AI_PREDICTION = "AI Congestion Prediction Warning"

class AlertSeverity(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class AlertStatus(str, enum.Enum):
    ACTIVE = "Active"
    ACKNOWLEDGED = "Acknowledged"
    RESOLVED = "Resolved"

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    road_name: Mapped[str] = mapped_column(String(100), nullable=False)
    alert_type: Mapped[AlertType] = mapped_column(
        Enum(AlertType, name="alerttype"),
        nullable=False
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, name="alertseverity"),
        nullable=False
    )
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alertstatus"),
        default=AlertStatus.ACTIVE,
        nullable=False
    )
    prediction_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    traffic_volume: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
