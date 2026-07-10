from datetime import datetime
from pydantic import BaseModel, ConfigDict
from models.traffic import CongestionLevel

class TrafficDataBase(BaseModel):
    road_name: str
    location: str
    vehicle_count: int
    traffic_density: int
    congestion_level: CongestionLevel
    average_speed: float

class TrafficDataCreate(TrafficDataBase):
    pass

class TrafficDataUpdate(BaseModel):
    road_name: str | None = None
    location: str | None = None
    vehicle_count: int | None = None
    traffic_density: int | None = None
    congestion_level: CongestionLevel | None = None
    average_speed: float | None = None

class TrafficDataResponse(TrafficDataBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
