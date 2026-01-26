from fastapi import APIRouter, HTTPException
from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, TaskStatusResponse
from app.worker.tasks import analyze_restaurant_task
from celery.result import AsyncResult
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_restaurant(request: AnalyzeRequest):
    try:
        logger.info(f"Received analysis request for: {request.query} from user: {request.user_id}")
        
        if len(request.query.strip()) < 3:
            raise HTTPException(
                status_code=400,
                detail="Query too short. Please enter a restaurant name and location."
            )
        
        task = analyze_restaurant_task.delay(request.query, request.user_id)
        
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


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    try:
        task_result = AsyncResult(task_id)
        
        response = TaskStatusResponse(
            task_id=task_id,
            status=task_result.status
        )
        
        if task_result.ready():
            if task_result.successful():
                response.result = task_result.result
            else:
                response.error = str(task_result.result)
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting status: {str(e)}")


@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "API is running"}
