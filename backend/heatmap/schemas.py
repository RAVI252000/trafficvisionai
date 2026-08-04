from typing import List, Optional
from pydantic import BaseModel

class HeatmapObservationPoint(BaseModel):
    road_name: str
    location: str
    latitude: float
    longitude: float
    congestion_score: int
    traffic_density: int
    congestion_level: str
    vehicle_density: int
    vehicle_count: int
    prediction_score: float
    last_updated: str
