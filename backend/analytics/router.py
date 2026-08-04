from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from sqlalchemy.orm import Session
from database.database import get_db
from core.dependencies import get_operator_user
from models.user import User
from analytics.service import analytics_service
from analytics.schemas import AnalyticsDashboardKPIs, AnalyticsChartsData

router = APIRouter(prefix="/api/v1/analytics", tags=["Traffic Analytics"])

@router.get("/dashboard", response_model=AnalyticsDashboardKPIs)
def get_analytics_dashboard(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None,
    local_authority: Optional[str] = None,
    road_type: Optional[str] = None,
    road_name: Optional[str] = None,
    time_period: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Get aggregated analytics KPIs for the dashboard.
    """
    try:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "region": region,
            "local_authority": local_authority,
            "road_type": road_type,
            "road_name": road_name,
            "time_period": time_period
        }
        return analytics_service.get_dashboard_kpis(db, filters)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load analytics KPIs: {str(e)}"
        )

@router.get("/charts", response_model=AnalyticsChartsData)
def get_analytics_charts(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    region: Optional[str] = None,
    local_authority: Optional[str] = None,
    road_type: Optional[str] = None,
    road_name: Optional[str] = None,
    time_period: Optional[str] = None,
    current_user: User = Depends(get_operator_user)
):
    """
    Get formatted chart datasets for Recharts.
    """
    try:
        filters = {
            "start_date": start_date,
            "end_date": end_date,
            "region": region,
            "local_authority": local_authority,
            "road_type": road_type,
            "road_name": road_name,
            "time_period": time_period
        }
        return analytics_service.get_charts_data(filters)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load analytics charts data: {str(e)}"
        )
