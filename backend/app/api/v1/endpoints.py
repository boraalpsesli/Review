from fastapi import APIRouter, HTTPException, Depends
from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, TaskStatusResponse, AnalysisHistoryItem, AnalysisResultSchema, ReviewListResponse, ReviewItem, AnalysisHistoryResponse
from app.worker.tasks import analyze_restaurant_task
from app.core.database import get_db
from app.models.restaurant import AnalysisReport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func
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


@router.get("/analyses", response_model=AnalysisHistoryResponse)
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
        # Get total count
        count_query = select(func.count()).select_from(AnalysisReport).where(
            AnalysisReport.user_id == user_id
        )
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results
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
                status="COMPLETED",
                google_maps_url=report.restaurant.google_maps_url if report.restaurant else None
            )
            response_items.append(item)
        
        return AnalysisHistoryResponse(items=response_items, total=total)
        
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
        from sqlalchemy.orm import joinedload
        query = select(AnalysisReport).options(joinedload(AnalysisReport.restaurant)).where(
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
        
        distribution = {"positive": 0, "neutral": 0, "negative": 0}
        
        # Individual points for trend (more granular "up and down")
        sentiment_trend = []
        for r in reports:
            sentiment_trend.append({
                "date": r.created_at.isoformat(),
                "volume": 1,
                "avg_sentiment": r.sentiment_score or 0,
                "restaurant_name": r.restaurant.name if r.restaurant else "Unknown"
            })
            
            # Distribution
            score = r.sentiment_score or 0
            if score > 0.6:
                distribution["positive"] += 1
            elif score > 0.2:
                 distribution["neutral"] += 1
            else:
                 distribution["negative"] += 1
                 
        return {
            "total_analyzed": total_analyzed,
            "avg_sentiment": round(avg_sentiment, 2),
            "sentiment_trend": sentiment_trend,
            "sentiment_distribution": distribution
        }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")


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
            recommended_actions=report.recommended_actions or [],
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
@router.get("/analyses/{analysis_id}/reviews", response_model=ReviewListResponse)
async def get_analysis_reviews(
    analysis_id: int,
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    Get raw scraped reviews for a specific analysis.
    """
    try:
        # 1. Get Analysis Report and Restaurant URL
        from sqlalchemy.orm import joinedload
        query = select(AnalysisReport).options(joinedload(AnalysisReport.restaurant)).where(
            AnalysisReport.id == analysis_id,
            AnalysisReport.user_id == user_id
        )
        result = await db.execute(query)
        report = result.scalars().first()
        
        if not report or not report.restaurant:
            raise HTTPException(status_code=404, detail="Analysis not found")
            
        restaurant_url = report.restaurant.google_maps_url
        restaurant_name = report.restaurant.name
        
        # 2. Query MongoDB for latest reviews
        from app.core.database import get_mongo_collection
        from pymongo import DESCENDING
        
        collection = get_mongo_collection("raw_reviews")
        
        # Find document matching the URL, sort by scraped_at desc to get latest
        doc = await collection.find_one(
            {"query": restaurant_url},
            sort=[("scraped_at", DESCENDING)]
        )
        
        reviews_data = []
        if doc and "reviews" in doc:
            for r in doc["reviews"]:
                # Map raw review dict to schema
                # Raw review structure depends on scraper but usually has text, rating, date
                reviews_data.append(ReviewItem(
                    text=r.get("text"),
                    rating=r.get("rating"),
                    author=r.get("author"),
                    date=r.get("date_text"),
                    profile_picture=r.get("profile_picture"),
                    source="Google Maps"
                ))
        
        # Helper to parse date for sorting
        def parse_review_date(r: ReviewItem):
            if not r.date or r.date == "Unknown Date":
                return datetime.min 
            try:
                # Handle YYYY-M-D or YYYY-MM-DD
                if "-" in r.date and "T" not in r.date: # Simple date format
                     try:
                        return datetime.strptime(r.date, "%Y-%m-%d")
                     except ValueError:
                        pass
                
                # Handle relative dates (e.g., "2 days ago", "a week ago")
                date_str = r.date.lower()
                now = datetime.now()
                
                if "ago" in date_str:
                    try:
                        val = int(''.join(filter(str.isdigit, date_str)) or 1) # Extract number, default 1 for "a week ago"
                    except:
                        val = 1
                        
                    if "minute" in date_str or "hour" in date_str:
                        return now # Treat as very recent
                    elif "day" in date_str:
                        return now - timedelta(days=val)
                    elif "week" in date_str:
                        return now - timedelta(weeks=val)
                    elif "month" in date_str:
                        return now - timedelta(days=val*30)
                    elif "year" in date_str:
                        return now - timedelta(days=val*365)
                        
                return datetime.min
            except Exception:
                return datetime.min

        # Sort descending (newest first)
        reviews_data.sort(key=parse_review_date, reverse=True)
        
        # Paginate
        total = len(reviews_data)
        paginated_reviews = reviews_data[skip : skip + limit]

        return ReviewListResponse(
            restaurant_name=restaurant_name,
            total_reviews=total,
            reviews=paginated_reviews
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reviews for analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching reviews: {str(e)}")
