from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from models.recommendation import RecommendationStatus, RecommendationCategory, RecommendationPriority

class RecommendationBase(BaseModel):
    title: str
    description: str
    category: RecommendationCategory
    priority: RecommendationPriority
    affected_road: str
    region: str
    reason: str
    expected_impact: str
    confidence_score: float

class RecommendationCreate(RecommendationBase):
    pass

class RecommendationStatusUpdate(BaseModel):
    status: RecommendationStatus

class RecommendationResponse(RecommendationBase):
    id: int
    status: RecommendationStatus
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendationSummary(BaseModel):
    total_count: int
    critical_count: int
    pending_count: int
    implemented_count: int
