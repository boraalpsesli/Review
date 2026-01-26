"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime


class AnalyzeRequest(BaseModel):
    """Request schema for analyze endpoint"""
    google_maps_url: str = Field(..., description="Google Maps restaurant URL")
    
    class Config:
        json_schema_extra = {
            "example": {
                "google_maps_url": "https://www.google.com/maps/place/Restaurant+Name/@37.7749,-122.4194"
            }
        }


class AnalyzeResponse(BaseModel):
    """Response schema for analyze endpoint"""
    task_id: str = Field(..., description="Celery task ID for tracking")
    status: str = Field(default="PENDING", description="Task status")
    message: str = Field(..., description="Status message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "status": "PENDING",
                "message": "Analysis task queued successfully"
            }
        }


class TaskStatusResponse(BaseModel):
    """Response schema for task status endpoint"""
    task_id: str
    status: str  # PENDING, STARTED, SUCCESS, FAILURE
    result: Optional[dict] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "status": "SUCCESS",
                "result": {
                    "sentiment_score": 0.75,
                    "summary": "Overall positive reviews...",
                    "complaints": ["Slow service", "High prices"],
                    "praises": ["Great food", "Nice ambiance"]
                }
            }
        }


class AnalysisResultSchema(BaseModel):
    """Schema for analysis results"""
    sentiment_score: float = Field(..., ge=-1.0, le=1.0, description="Sentiment score from -1 to 1")
    summary: str = Field(..., description="Summary of reviews")
    complaints: List[str] = Field(default_factory=list, description="Common complaints")
    praises: List[str] = Field(default_factory=list, description="Common praises")
    reviews_analyzed: int = Field(..., description="Number of reviews analyzed")
    restaurant_name: Optional[str] = None
    restaurant_rating: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "sentiment_score": 0.75,
                "summary": "Customers love the food quality and ambiance but complain about service speed.",
                "complaints": ["Slow service", "High prices", "Small portions"],
                "praises": ["Excellent food", "Great atmosphere", "Fresh ingredients"],
                "reviews_analyzed": 45,
                "restaurant_name": "Sample Restaurant",
                "restaurant_rating": 4.3
            }
        }


class RestaurantSchema(BaseModel):
    """Schema for restaurant information"""
    id: int
    name: str
    google_maps_url: str
    address: Optional[str] = None
    rating: Optional[float] = None
    total_reviews: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
