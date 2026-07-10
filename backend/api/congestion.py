from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.database import get_db
from models.congestion import CongestionRecord
from schemas.congestion import CongestionRecordCreate, CongestionRecordUpdate, CongestionRecordResponse
from core.dependencies import get_operator_user
from models.user import User

router = APIRouter(prefix="/api/congestion", tags=["Congestion Tracking"])

@router.get("", response_model=List[CongestionRecordResponse])
def get_congestion_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    List congestion status records. Accessible by operators and admins.
    """
    return db.query(CongestionRecord).order_by(CongestionRecord.timestamp.desc()).all()

@router.post("", response_model=CongestionRecordResponse, status_code=status.HTTP_201_CREATED)
def create_congestion_record(
    payload: CongestionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Create a new congestion status record. Accessible by operators and admins.
    """
    new_record = CongestionRecord(
        road_name=payload.road_name,
        current_congestion=payload.current_congestion,
        status=payload.status
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.put("/{congestion_id}", response_model=CongestionRecordResponse)
def update_congestion_record(
    congestion_id: int,
    payload: CongestionRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_operator_user)
):
    """
    Update congestion metrics for a road. Accessible by operators and admins.
    """
    record = db.query(CongestionRecord).filter(CongestionRecord.id == congestion_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Congestion record not found."
        )

    if payload.road_name is not None:
        record.road_name = payload.road_name
    if payload.current_congestion is not None:
        record.current_congestion = payload.current_congestion
    if payload.status is not None:
        record.status = payload.status

    db.commit()
    db.refresh(record)
    return record
