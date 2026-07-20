from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
from core.dependencies import get_current_active_user
from models.user import User
from services.reports_service import reports_service

router = APIRouter(prefix="/api/v1/reports", tags=["Traffic Prediction Reports"])

@router.get("/traffic", response_model=Dict[str, Any])
def get_traffic_prediction_reports(
    date: Optional[str] = None,
    region: Optional[str] = None,
    road_type: Optional[str] = None,
    time_range: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get aggregated prediction insights and analytics charts data.
    Accessible by authenticated users.
    """
    try:
        # Generate the report data using the service layer
        return reports_service.get_report_data(
            date=date,
            region=region,
            road_type=road_type,
            time_range=time_range
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate traffic prediction report: {str(e)}"
        )
