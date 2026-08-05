from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AIReportCreate(BaseModel):
    name: str
    report_type: str  # "Daily Report", "Weekly Report", "Monthly Report", "Custom Report"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    region: Optional[str] = None
    road_type: Optional[str] = None
    format: str  # "PDF", "CSV", "Excel"

class AIReportResponse(BaseModel):
    id: int
    name: str
    report_type: str
    filters_applied: Dict[str, Any]
    format: str
    summary_data: Dict[str, Any]
    created_at: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class AIReportSummary(BaseModel):
    total_reports: int
    daily_count: int
    weekly_count: int
    monthly_count: int
