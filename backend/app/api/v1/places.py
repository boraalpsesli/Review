"""
Place search API endpoints.
"""
from fastapi import APIRouter, HTTPException
from app.schemas.places import PlaceSearchRequest, PlaceSearchResponse, PlaceInfo, AnalyzeByPlaceRequest
from app.schemas.analysis import AnalyzeResponse
from app.services.place_search import PlaceSearchService
from app.worker.tasks import analyze_restaurant_task
import logging

router = APIRouter(prefix="/places", tags=["places"])
logger = logging.getLogger(__name__)


@router.post("/search", response_model=PlaceSearchResponse)
async def search_places(request: PlaceSearchRequest):
    """
    Search for places matching the query.
    Returns a list of places for user to select from.
    """
    try:
        logger.info(f"Place search request: {request.query}")
        
        async with PlaceSearchService() as service:
            places_data = await service._search_places_async(request.query, request.limit)
        
        places = [PlaceInfo(**p) for p in places_data]
        
        return PlaceSearchResponse(
            query=request.query,
            places=places,
            total_found=len(places)
        )
        
    except Exception as e:
        logger.error(f"Place search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_place(request: AnalyzeByPlaceRequest):
    """
    Analyze a specific place by its Google Maps URL.
    This ensures only the selected place is analyzed.
    """
    try:
        logger.info(f"Analyze place request: {request.place_name}")
        
        # Use the place URL as the query - Gosom accepts URLs directly
        task = analyze_restaurant_task.delay(
            request.place_url,  # Pass URL instead of search query
            request.user_id
        )
        
        return AnalyzeResponse(
            task_id=task.id,
            status="PENDING",
            message=f"Analysis queued for {request.place_name}. Use task_id to check status."
        )
        
    except Exception as e:
        logger.error(f"Analyze place error: {e}")
        raise HTTPException(status_code=500, detail=f"Error queuing task: {str(e)}")
