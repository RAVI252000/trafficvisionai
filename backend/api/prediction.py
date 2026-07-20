from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from core.dependencies import get_current_active_user
from models.user import User
from services.prediction_service import prediction_service

router = APIRouter(prefix="/api/prediction", tags=["Traffic Prediction"])

@router.get("/roads", response_model=List[str])
def get_predicted_roads(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a list of all unique roads available for forecasting.
    """
    try:
        return prediction_service.get_available_roads()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load roads: {str(e)}"
        )

@router.get("/forecast", response_model=Dict[str, Any])
def get_traffic_forecast(
    road_name: str,
    date: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a 24-hour traffic volume and congestion level forecast for a specific road and date.
    """
    try:
        # Validate that the road exists in metadata
        roads = prediction_service.get_available_roads()
        if not roads:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Road metadata is not loaded yet. Make sure models and metadata are generated."
            )
        
        if road_name not in prediction_service.road_metadata:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Road '{road_name}' not found in metadata. Please select a valid road."
            )

        # Generate predictions
        return prediction_service.predict_hourly_forecast(road_name, date)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast prediction failed: {str(e)}"
        )
