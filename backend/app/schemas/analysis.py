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


class RecommendedAction(BaseModel):
    title: str
    description: str


class AnalysisResultSchema(BaseModel):
    id: int
    restaurant_name: Optional[str] = None
    google_maps_url: Optional[str] = None
    sentiment_score: Optional[float] = Field(None, ge=-1.0, le=1.0)
    summary: Optional[str] = None
    complaints: List[str] = Field(default_factory=list)
    praises: List[str] = Field(default_factory=list)
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    reviews_analyzed: Optional[int] = 0
    restaurant_rating: Optional[float] = None
    created_at: datetime
    status: str = "COMPLETED"


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
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    google_maps_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class AnalysisHistoryResponse(BaseModel):
    items: List[AnalysisHistoryItem]
    total: int


class ReviewItem(BaseModel):
    text: Optional[str] = None
    rating: Optional[float] = None
    author: Optional[str] = None
    date: Optional[str] = None
    profile_picture: Optional[str] = None
    source: str = "Google Maps"


class ReviewListResponse(BaseModel):
    restaurant_name: str
    total_reviews: int
    reviews: List[ReviewItem]
