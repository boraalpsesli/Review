from fastapi import APIRouter, HTTPException, Depends
from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, TaskStatusResponse, AnalysisHistoryItem, AnalysisResultSchema
from app.worker.tasks import analyze_restaurant_task
from app.core.database import get_db
from app.models.restaurant import AnalysisReport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from datetime import datetime, timedelta
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


@router.get("/analyses", response_model=list[AnalysisHistoryItem])
async def get_analyses(
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    Get analysis history for a user.
    """
    try:
        # We need to join with Restaurant to get name info if needed, 
        # but AnalysisReport table has most data. 
        # Ideally, we should join to get fresh restaurant name if stored there.
        # For now, simplistic query on AnalysisReport.
        
        # Note: In a real app we might need to filter by user_id if we associate reports with users.
        # Current model has user_id on AnalysisReport.
        
        # Use joinedload to avoid N+1 queries. 
        # Correct syntax for SQLAlchemy 2.0+ with select()
        from sqlalchemy.orm import joinedload
        query = select(AnalysisReport).options(joinedload(AnalysisReport.restaurant)).where(
            AnalysisReport.user_id == user_id
        ).order_by(desc(AnalysisReport.created_at)).offset(skip).limit(limit)

        result = await db.execute(query)
        reports = result.scalars().all()
        
        # Manually map to schema to ensure flat fields are populated from relation
        response_items = []
        for report in reports:
            item = AnalysisHistoryItem(
                id=report.id,
                restaurant_name=report.restaurant.name if report.restaurant else "Unknown Restaurant",
                sentiment_score=report.sentiment_score,
                summary=report.summary,
                created_at=report.created_at,
                status="COMPLETED", # Assuming checked status or stored properly
                google_maps_url=report.restaurant.google_maps_url if report.restaurant else None
            )
            response_items.append(item)
        
        return response_items
        
    except Exception as e:
        logger.error(f"Error fetching analyses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching analyses: {str(e)}")


@router.get("/analyses/stats")
async def get_analysis_stats(
    user_id: str,
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """
    Get aggregated statistics for dashboard charts.
    """
    try:
        # Calculate date range
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Base query for user's reports in range
        query = select(AnalysisReport).where(
            AnalysisReport.user_id == user_id,
            AnalysisReport.created_at >= start_date
        ).order_by(AnalysisReport.created_at)
        
        result = await db.execute(query)
        reports = result.scalars().all()
        
        # Calculate stats
        total_analyzed = len(reports)
        
        if total_analyzed == 0:
            return {
                "total_analyzed": 0,
                "avg_sentiment": 0,
                "sentiment_trend": [],
                "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}
            }
            
        avg_sentiment = sum(r.sentiment_score or 0 for r in reports) / total_analyzed
        
        # Group by date for area chart
        # We'll group by day
        trend_data = {}
        distribution = {"positive": 0, "neutral": 0, "negative": 0}
        
        for r in reports:
            date_key = r.created_at.strftime("%Y-%m-%d")
            score = r.sentiment_score or 0
            
            # Trend
            if date_key not in trend_data:
                trend_data[date_key] = {"count": 0, "total_sentiment": 0}
            trend_data[date_key]["count"] += 1
            trend_data[date_key]["total_sentiment"] += score
            
            # Distribution
            if score > 0.6:
                distribution["positive"] += 1
            elif score > 0.2:
                 distribution["neutral"] += 1
            else:
                 distribution["negative"] += 1
                 
        # Format trend list
        sentiment_trend = []
        for date, data in sorted(trend_data.items()):
            sentiment_trend.append({
                "date": date,
                "volume": data["count"],
                "avg_sentiment": data["total_sentiment"] / data["count"]
            })
            
        return {
            "total_analyzed": total_analyzed,
            "avg_sentiment": round(avg_sentiment, 2),
            "sentiment_trend": sentiment_trend,
            "sentiment_distribution": distribution
        }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
@router.get("/analyses/{analysis_id}", response_model=AnalysisResultSchema)
async def get_analysis(
    analysis_id: int,
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single analysis report by ID.
    """
    try:
        logger.info(f"Fetching analysis {analysis_id} for user {user_id}")
        
        from sqlalchemy.orm import joinedload
        query = select(AnalysisReport).options(joinedload(AnalysisReport.restaurant)).where(
            AnalysisReport.id == analysis_id,
            AnalysisReport.user_id == user_id
        )
        
        result = await db.execute(query)
        report = result.scalars().first()
        
        if not report:
            logger.warning(f"Analysis {analysis_id} not found for user {user_id}")
            # Check if it exists for ANY user to debug mismatch
            check_query = select(AnalysisReport.user_id).where(AnalysisReport.id == analysis_id)
            check_result = await db.execute(check_query)
            existing_user = check_result.scalar_one_or_none()
            if existing_user:
                 logger.warning(f"Analysis {analysis_id} actually belongs to user: {existing_user}")
            
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        return AnalysisResultSchema(
            id=report.id,
            sentiment_score=report.sentiment_score,
            summary=report.summary,
            complaints=report.complaints or [],
            praises=report.praises or [],
            recommended_actions=[], # Add logic if/when we have this field
            reviews_analyzed=report.reviews_analyzed,
            restaurant_name=report.restaurant.name if report.restaurant else "Unknown Restaurant",
            restaurant_rating=report.restaurant.rating if report.restaurant else None,
            google_maps_url=report.restaurant.google_maps_url if report.restaurant else None,
            created_at=report.created_at,
            status="COMPLETED"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching analysis: {str(e)}")
