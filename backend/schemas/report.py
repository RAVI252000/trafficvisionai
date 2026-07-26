from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Dict, Any

class ReportCreate(BaseModel):
    name: str
    report_type: str
    date: str | None = None
    region: str | None = None
    road_type: str | None = None
    time_range: str | None = None
    format: str  # "CSV", "PDF", "HTML"

class ReportResponse(BaseModel):
    id: int
    name: str
    report_type: str
    filters_applied: Dict[str, Any]
    format: str
    summary_data: Dict[str, Any]
    created_at: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)
