import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from database.database import Base

class TrafficReport(Base):
    __tablename__ = "traffic_reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    report_type: Mapped[str] = mapped_column(String(100), nullable=False)
    filters_applied: Mapped[dict] = mapped_column(JSON, nullable=False)  # stores date, region, road_type, time_range
    format: Mapped[str] = mapped_column(String(20), nullable=False)     # "CSV", "PDF", "HTML"
    summary_data: Mapped[dict] = mapped_column(JSON, nullable=False)    # stores aggregated stats (volumes, peak hours, metrics)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
