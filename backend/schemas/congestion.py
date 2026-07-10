from datetime import datetime
from pydantic import BaseModel, ConfigDict
from models.congestion import CongestionStatus

class CongestionRecordBase(BaseModel):
    road_name: str
    current_congestion: int
    status: CongestionStatus

class CongestionRecordCreate(CongestionRecordBase):
    pass

class CongestionRecordUpdate(BaseModel):
    road_name: str | None = None
    current_congestion: int | None = None
    status: CongestionStatus | None = None

class CongestionRecordResponse(CongestionRecordBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
