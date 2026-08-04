from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from core.dependencies import get_current_active_user
from models.user import User
from heatmap.service import heatmap_service
from heatmap.schemas import HeatmapObservationPoint

router = APIRouter(prefix="/api/v1/heatmap", tags=["Traffic Heatmap"])

@router.get("", response_model=List[HeatmapObservationPoint])
def get_heatmap(
    region: Optional[str] = None,
    road_type: Optional[str] = None,
    time: Optional[str] = None,
    congestion_level: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get heatmap coordinates, congestion levels, densities and metadata for leaflet visualization.
    """
    try:
        filters = {
            "region": region,
            "road_type": road_type,
            "time": time,
            "congestion_level": congestion_level
        }
        return heatmap_service.get_heatmap_points(filters)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch traffic heatmap data: {str(e)}"
        )
