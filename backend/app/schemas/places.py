"""
Schemas for place search functionality.
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class PlaceInfo(BaseModel):
    """Information about a place from search results."""
    title: str = Field(..., description="Place name")
    address: str = Field("", description="Full address")
    rating: float = Field(0.0, description="Average rating")
    review_count: int = Field(0, description="Total number of reviews")
    category: str = Field("", description="Place category")
    link: str = Field("", description="Google Maps URL")
    place_id: str = Field("", description="Google Place ID")
    phone: str = Field("", description="Phone number")
    website: str = Field("", description="Website URL")
    thumbnail: str = Field("", description="Thumbnail image URL")


class PlaceSearchRequest(BaseModel):
    """Request for place search."""
    query: str = Field(..., min_length=2, description="Search query")
    limit: int = Field(5, ge=1, le=20, description="Max results to return")


class PlaceSearchResponse(BaseModel):
    """Response from place search."""
    query: str
    places: List[PlaceInfo]
    total_found: int


class AnalyzeByPlaceRequest(BaseModel):
    """Request to analyze a specific place."""
    place_url: str = Field(..., description="Google Maps URL of the place")
    place_name: str = Field(..., description="Name of the place")
    user_id: Optional[str] = Field(None, description="User ID for tracking history")
