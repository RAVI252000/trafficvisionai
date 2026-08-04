from datetime import datetime
from pydantic import BaseModel, ConfigDict
from models.alert import AlertType, AlertSeverity, AlertStatus

class AlertBase(BaseModel):
    title: str
    description: str
    location: str
    road_name: str
    alert_type: AlertType
    severity: AlertSeverity
    status: AlertStatus = AlertStatus.ACTIVE
    prediction_score: float | None = None
    traffic_volume: int | None = None

class AlertCreate(BaseModel):
    title: str
    description: str
    location: str
    road_name: str
    alert_type: AlertType
    severity: AlertSeverity
    prediction_score: float | None = None
    traffic_volume: int | None = None

class AlertUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    road_name: str | None = None
    alert_type: AlertType | None = None
    severity: AlertSeverity | None = None
    status: AlertStatus | None = None
    prediction_score: float | None = None
    traffic_volume: int | None = None

class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    updated_at: datetime
    created_by: int | None = None

    model_config = ConfigDict(from_attributes=True)
