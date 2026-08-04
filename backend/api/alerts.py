from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User
from core.dependencies import get_operator_user, get_admin_user
from schemas.alert import AlertCreate, AlertResponse
from services.alert_service import alert_service

router = APIRouter(prefix="/api/v1/alerts", tags=["Traffic Alert System"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Get all alerts. Triggers AI prediction check dynamically.
    Accessible by operators and admins.
    """
    try:
        return alert_service.get_alerts(db, status=status, severity=severity, alert_type=alert_type)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch alerts: {str(e)}"
        )

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Get details of a specific alert.
    Accessible by operators and admins.
    """
    alert = alert_service.get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return alert

@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_manual_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Create a manual traffic alert.
    Admin only.
    """
    try:
        return alert_service.create_manual_alert(db, payload, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create alert: {str(e)}"
        )

@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Acknowledge an active alert.
    Accessible by operators and admins.
    """
    alert = alert_service.acknowledge_alert(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return alert

@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Resolve an active or acknowledged alert.
    Admin only.
    """
    alert = alert_service.resolve_alert(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return alert

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    Delete an alert.
    Admin only.
    """
    success = alert_service.delete_alert(db, alert_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return None
