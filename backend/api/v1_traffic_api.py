from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, Dict, Any
from core.dependencies import get_current_active_user
from models.user import User
from services.traffic_api_service import traffic_api_service

router = APIRouter(prefix="/api/v1/traffic", tags=["External Traffic API"])

@router.get("/live-flow", response_model=Dict[str, Any])
def get_live_traffic_flow(
    latitude: float,
    longitude: float,
    road_name: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get live real-time traffic flow segment speed, free flow speed, delays, and congestion indices.
    Queries the external TomTom Traffic API with fallback simulation.
    """
    try:
        return traffic_api_service.fetch_live_traffic_flow(
            latitude=latitude,
            longitude=longitude
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query live traffic flow: {str(e)}"
        )
