from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class AnalyzeRequest(BaseModel):
    query: str = Field(..., description="Restaurant name + location")
    user_id: Optional[str] = Field(None, description="User ID for tracking history")


class AnalyzeResponse(BaseModel):
    task_id: str
    status: str = "PENDING"
    message: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[dict] = None
    error: Optional[str] = None


class AnalysisResultSchema(BaseModel):
    sentiment_score: float = Field(..., ge=-1.0, le=1.0)
    summary: str
    complaints: List[str] = Field(default_factory=list)
    praises: List[str] = Field(default_factory=list)
    reviews_analyzed: int
    restaurant_name: Optional[str] = None
    restaurant_rating: Optional[float] = None


class RestaurantSchema(BaseModel):
    id: int
    name: str
    google_maps_url: str
    address: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnalysisHistoryItem(BaseModel):
    id: int
    restaurant_name: Optional[str] = None
    sentiment_score: Optional[float] = None
    summary: Optional[str] = None
    created_at: datetime
    status: str = "COMPLETED"
    google_maps_url: Optional[str] = None
    
    class Config:
        from_attributes = True
