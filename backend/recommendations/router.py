from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from database.database import get_db
from core.dependencies import get_current_active_user, get_operator_user, get_admin_user
from models.user import User
from recommendations.service import recommendation_service
from recommendations.schemas import (
    RecommendationResponse,
    RecommendationStatusUpdate,
    RecommendationSummary
)

router = APIRouter(prefix="/api/v1/recommendations", tags=["AI Recommendations"])

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    priority: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    region: Optional[str] = None,
    road_name: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Get a list of all recommendations, supporting filters and keyword search.
    """
    try:
        return recommendation_service.get_recommendations(
            db, priority=priority, category=category, status=status,
            region=region, road_name=road_name, search=search
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recommendations: {str(e)}"
        )

@router.get("/summary", response_model=RecommendationSummary)
def get_recommendations_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Get summary card metrics for recommendations.
    """
    try:
        return recommendation_service.get_recommendation_summary(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load summary: {str(e)}"
        )

@router.get("/{id}", response_model=RecommendationResponse)
def get_recommendation_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Get details of a single recommendation by ID.
    """
    rec = recommendation_service.get_recommendation_by_id(db, id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found."
        )
    return rec

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_recommendations(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Manually trigger the AI recommendation engine. Restricted to Admin role.
    """
    try:
        count = recommendation_service.generate_recommendations(db)
        return {
            "status": "success",
            "message": f"AI Recommendation Engine run completed. Generated {count} new recommendations."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}"
        )

@router.patch("/{id}/status", response_model=RecommendationResponse)
def update_recommendation_status(
    id: int,
    payload: RecommendationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Update the status of a recommendation. Accessible by Operators and Admins.
    """
    updated_rec = recommendation_service.update_recommendation_status(db, id, payload.status)
    if not updated_rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation not found."
        )
    return updated_rec
