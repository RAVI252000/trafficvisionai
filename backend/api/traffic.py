from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.traffic import TrafficData
from schemas.traffic import TrafficDataCreate, TrafficDataUpdate, TrafficDataResponse
from core.dependencies import get_operator_user, get_admin_user
from models.user import User

router = APIRouter(prefix="/api/traffic", tags=["Traffic Monitoring"])

@router.get("", response_model=List[TrafficDataResponse])
def get_traffic_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Get live traffic monitoring data. Accessible by operators and admins.
    """
    return db.query(TrafficData).order_by(TrafficData.timestamp.desc()).all()

@router.post("", response_model=TrafficDataResponse, status_code=status.HTTP_201_CREATED)
def add_traffic_data(
    payload: TrafficDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Add new traffic observation. Accessible by operators and admins.
    """
    new_traffic = TrafficData(
        road_name=payload.road_name,
        location=payload.location,
        vehicle_count=payload.vehicle_count,
        traffic_density=payload.traffic_density,
        congestion_level=payload.congestion_level,
        average_speed=payload.average_speed
    )
    db.add(new_traffic)
    db.commit()
    db.refresh(new_traffic)
    return new_traffic

@router.put("/{traffic_id}", response_model=TrafficDataResponse)
def update_traffic_data(
    traffic_id: int,
    payload: TrafficDataUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Update an existing traffic record. Accessible by operators and admins.
    """
    traffic = db.query(TrafficData).filter(TrafficData.id == traffic_id).first()
    if not traffic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Traffic record not found."
        )

    if payload.road_name is not None:
        traffic.road_name = payload.road_name
    if payload.location is not None:
        traffic.location = payload.location
    if payload.vehicle_count is not None:
        traffic.vehicle_count = payload.vehicle_count
    if payload.traffic_density is not None:
        traffic.traffic_density = payload.traffic_density
    if payload.congestion_level is not None:
        traffic.congestion_level = payload.congestion_level
    if payload.average_speed is not None:
        traffic.average_speed = payload.average_speed

    db.commit()
    db.refresh(traffic)
    return traffic

@router.delete("/{traffic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_traffic_data(
    traffic_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """
    Delete a traffic observation record. Restricted to ADMIN only.
    """
    traffic = db.query(TrafficData).filter(TrafficData.id == traffic_id).first()
    if not traffic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Traffic record not found."
        )

    db.delete(traffic)
    db.commit()
    return None
