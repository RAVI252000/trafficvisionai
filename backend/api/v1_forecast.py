from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any, List
from core.dependencies import get_current_active_user
from models.user import User
from services.forecast_service import forecast_service
from services.prediction_service import prediction_service

router = APIRouter(prefix="/api/v1/forecast", tags=["Congestion Forecasting Workflow"])

@router.get("/congestion", response_model=Dict[str, Any])
def get_upcoming_congestion_forecast(
    road_name: str,
    date: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get congestion forecast timeline (+30m, +1h, +2h, +3h) for a specific road.
    Accessible by authenticated users.
    """
    try:
        # Check if the road exists in metadata
        roads = prediction_service.get_available_roads()
        if not roads:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Road metadata is not loaded yet."
            )

        if road_name not in prediction_service.road_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Road '{road_name}' not found. Please select a valid road."
            )

        # Generate the forecast workflow
        return forecast_service.get_congestion_forecast_workflow(road_name, date)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate congestion forecast: {str(e)}"
        )

@router.get("/monitoring-status", response_model=List[Dict[str, Any]])
def get_all_roads_monitoring_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current hour congestion statuses, predictions, and locations for all monitored roads.
    Used by the interactive traffic monitoring map.
    """
    try:
        return forecast_service.get_all_roads_monitoring_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load monitoring statuses: {str(e)}"
        )
