"""
FastAPI endpoints for restaurant analysis
"""
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    TaskStatusResponse
)
from app.worker.tasks import analyze_restaurant_task, test_analyze_with_mock_data
from celery.result import AsyncResult
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_restaurant(request: AnalyzeRequest):
    """
    Queue a restaurant analysis task
    
    This endpoint accepts a Google Maps URL and queues a Celery task to:
    1. Scrape reviews from Google Maps
    2. Analyze reviews using AI
    3. Store results in the database
    
    Returns a task_id that can be used to check the status.
    """
    try:
        logger.info(f"Received analysis request for: {request.google_maps_url}")
        
        # Validate URL (basic check)
        if "google.com/maps" not in request.google_maps_url:
            raise HTTPException(
                status_code=400,
                detail="Invalid Google Maps URL. Must contain 'google.com/maps'"
            )
        
        # Queue the Celery task
        task = analyze_restaurant_task.delay(request.google_maps_url)
        
        return AnalyzeResponse(
            task_id=task.id,
            status="PENDING",
            message="Analysis task queued successfully. Use the task_id to check status."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error queuing analysis task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error queuing task: {str(e)}")


@router.post("/test-analyze", response_model=AnalyzeResponse)
async def test_analyze():
    """
    Test endpoint with mock data
    
    This endpoint queues a test analysis task using mock review data
    to demonstrate the AI analysis functionality without scraping.
    """
    try:
        logger.info("Received test analysis request with mock data")
        
        # Queue the test task
        task = test_analyze_with_mock_data.delay()
        
        return AnalyzeResponse(
            task_id=task.id,
            status="PENDING",
            message="Test analysis task queued successfully. Use the task_id to check status."
        )
        
    except Exception as e:
        logger.error(f"Error queuing test task: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error queuing task: {str(e)}")


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Get the status of an analysis task
    
    Returns the current status and result (if completed) of a task.
    
    Possible statuses:
    - PENDING: Task is waiting to be executed
    - STARTED: Task has started
    - SUCCESS: Task completed successfully
    - FAILURE: Task failed
    - RETRY: Task is being retried
    """
    try:
        task_result = AsyncResult(task_id)
        
        response = TaskStatusResponse(
            task_id=task_id,
            status=task_result.status
        )
        
        if task_result.successful():
            response.result = task_result.result
        elif task_result.failed():
            response.error = str(task_result.info)
        
        return response
        
    except Exception as e:
        logger.error(f"Error fetching task status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching task status: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Restaurant Review Analysis API"
    }
