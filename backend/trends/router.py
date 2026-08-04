from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from core.dependencies import get_current_active_user
from models.user import User
from trends.service import trends_service
from trends.schemas import TrafficTrendsResponse, ForecastTrendResponse

router = APIRouter(prefix="/api/v1/trends", tags=["Traffic Trends"])

@router.get("", response_model=TrafficTrendsResponse)
def get_trends(
    region: Optional[str] = None,
    road_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get dynamic comparison trends (hourly, daily, weekly, monthly) and generated AI insights.
    """
    try:
        filters = {
            "region": region,
            "road_type": road_type
        }
        return trends_service.get_trends_summary(filters)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trends analytics: {str(e)}"
        )

@router.get("/forecast", response_model=ForecastTrendResponse)
def get_forecast_trends(
    road_name: str,
    date: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get AI-driven forecast timelines for a given road name and date.
    """
    try:
        return trends_service.get_forecast_trends(road_name, date)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load forecast timeline: {str(e)}"
        )
