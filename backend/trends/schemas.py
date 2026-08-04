from typing import List, Optional
from pydantic import BaseModel

class AIInsightCard(BaseModel):
    id: str
    type: str  # "info", "warning", "success"
    title: str
    message: str
    impact_percentage: Optional[float] = None

class TrendLinePoint(BaseModel):
    label: str  # e.g., "08:00", "Monday", "Week 1", "Jan"
    historical: int
    predicted: int

class RegionTrendPoint(BaseModel):
    region: str
    avg_congestion: int
    volume_change_pct: float

class TrafficTrendsResponse(BaseModel):
    hourly_trends: List[TrendLinePoint]
    daily_trends: List[TrendLinePoint]
    weekly_trends: List[TrendLinePoint]
    monthly_trends: List[TrendLinePoint]
    region_trends: List[RegionTrendPoint]
    ai_insights: List[AIInsightCard]

class ForecastTrendPoint(BaseModel):
    time: str
    predicted_volume: int
    congestion_index: int
    average_speed: float
    confidence_score: float

class ForecastTrendResponse(BaseModel):
    road_name: str
    road_type: str
    latitude: float
    longitude: float
    date: str
    forecast: List[ForecastTrendPoint]
