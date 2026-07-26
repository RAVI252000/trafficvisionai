from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
from core.dependencies import get_current_active_user
from models.user import User
from services.routing_service import routing_service

router = APIRouter(prefix="/api/v1/routes", tags=["Route Analysis & Travel Time"])

class RouteRequest(BaseModel):
    source_road: str
    dest_road: str
    preference: str = "Fastest"  # "Fastest", "Shortest", "Eco"
    weather: str = "Clear"       # "Clear", "Rain", "Snow", "Fog"
    road_condition: str = "Excellent"  # "Excellent", "Good", "Maintenance"

class TravelTimeRequest(BaseModel):
    distance_km: float
    congestion_level: float
    road_type: str = "Major"
    weather: str = "Clear"
    road_condition: str = "Excellent"

@router.post("/recommend", response_model=List[Dict[str, Any]])
def recommend_alternate_routes(
    payload: RouteRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a list of routes (best route + alternatives) between two monitored roads.
    Includes distance, expected travel time, delay, congestion level, eco footprint, and map path coordinates.
    Accessible by authenticated users.
    """
    try:
        if not payload.source_road or not payload.dest_road:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source and destination roads must be specified."
            )
        
        return routing_service.recommend_routes(
            source_road=payload.source_road,
            dest_road=payload.dest_road,
            preference=payload.preference,
            weather=payload.weather,
            road_condition=payload.road_condition
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route analysis failed: {str(e)}"
        )

@router.post("/travel-time", response_model=Dict[str, Any])
def estimate_travel_time_metrics(
    payload: TravelTimeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Estimate travel times, delays, fuel consumption, CO2 emissions, and weather impact for travel conditions.
    Accessible by authenticated users.
    """
    try:
        return routing_service.estimate_travel_time(
            distance_km=payload.distance_km,
            avg_congestion=payload.congestion_level,
            road_type=payload.road_type,
            weather=payload.weather,
            road_condition=payload.road_condition
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Travel time estimation failed: {str(e)}"
        )
