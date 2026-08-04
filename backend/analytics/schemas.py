from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class AnalyticsDashboardKPIs(BaseModel):
    total_traffic_count: int
    total_predictions: int
    average_traffic_density: int
    average_congestion_score: int
    peak_hour: str
    lowest_traffic_hour: str
    average_travel_time: float
    total_alerts: int
    prediction_accuracy: int
    total_monitored_roads: int

class ChartDataPoint(BaseModel):
    label: str
    volume: int
    congestion: int
    predicted: Optional[int] = None

class HourlyTrendPoint(BaseModel):
    time: str
    volume: int
    congestion: int
    predicted: int

class DailyTrendPoint(BaseModel):
    day: str
    volume: int
    congestion: int

class CongestionDistributionPoint(BaseModel):
    name: str
    value: int
    color: str

class VehicleCategoryPoint(BaseModel):
    time: str
    cars: int
    lgvs: int
    hgvs: int
    buses: int
    cycles: int

class DensityTimelinePoint(BaseModel):
    date: str
    density: int

class AnalyticsChartsData(BaseModel):
    hourly_trend: List[HourlyTrendPoint]
    daily_trend: List[DailyTrendPoint]
    congestion_distribution: List[CongestionDistributionPoint]
    vehicle_category_analysis: List[VehicleCategoryPoint]
    density_timeline: List[DensityTimelinePoint]
