import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Float, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from database.database import Base

class RecommendationStatus(str, enum.Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    IMPLEMENTED = "Implemented"
    DISMISSED = "Dismissed"

class RecommendationCategory(str, enum.Enum):
    TRAFFIC_MANAGEMENT = "Traffic Management"
    ROUTE_OPTIMIZATION = "Route Optimization"
    SIGNAL_OPTIMIZATION = "Traffic Signal Optimization"
    EMERGENCY_RESPONSE = "Emergency Response"
    INFRASTRUCTURE_IMPROVEMENT = "Infrastructure Improvement"
    PUBLIC_ADVISORY = "Public Advisory"
    SAFETY_RECOMMENDATION = "Safety Recommendation"

class RecommendationPriority(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=False)
    category: Mapped[RecommendationCategory] = mapped_column(
        Enum(RecommendationCategory, name="recommendationcategory"),
        default=RecommendationCategory.TRAFFIC_MANAGEMENT,
        nullable=False
    )
    priority: Mapped[RecommendationPriority] = mapped_column(
        Enum(RecommendationPriority, name="recommendationpriority"),
        default=RecommendationPriority.MEDIUM,
        nullable=False
    )
    affected_road: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    expected_impact: Mapped[str] = mapped_column(String(500), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.85, nullable=False)
    status: Mapped[RecommendationStatus] = mapped_column(
        Enum(RecommendationStatus, name="recommendationstatus"),
        default=RecommendationStatus.PENDING,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
