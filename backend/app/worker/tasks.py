import asyncio
import logging
from typing import Dict
from app.worker.celery_app import celery_app
from app.services.scraper import GoogleMapsScraper
from app.services.ai_analyzer import GeminiAnalyzer
from app.core.database import MongoDB
from app.models.restaurant import Restaurant, AnalysisReport
from sqlalchemy import select
from datetime import datetime

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.analyze_restaurant")
def analyze_restaurant_task(self, query: str, user_id: str = None) -> Dict:
    task_id = self.request.id
    logger.info(f"Starting analysis task {task_id} for '{query}' (user_id: {user_id})")
    
    try:
        return asyncio.run(_async_analyze_restaurant(query, task_id, user_id))
    except Exception as e:
        logger.error(f"Task {task_id} failed: {str(e)}", exc_info=True)
        raise


async def _async_analyze_restaurant(query: str, task_id: str, user_id: str = None) -> Dict:
    logger.info(f"Step 1: Searching Google Maps for '{query}'")
    
    scraper = GoogleMapsScraper(headless=True)
    scrape_result = await scraper._scrape_reviews_async(query, max_reviews=100)
    
    restaurant_info = scrape_result['restaurant_info']
    reviews = scrape_result['reviews']
    
    if not reviews:
        raise ValueError(f"No reviews found for '{query}'")
    
    logger.info(f"Step 2: Storing {len(reviews)} raw reviews in MongoDB")
    await _store_raw_reviews_mongodb(query, scrape_result)
    
    logger.info("Step 3: Analyzing reviews with Gemini AI")
    analyzer = GeminiAnalyzer()
    # Clean reviews for AI (remove images/profile_pics to keep payload lean)
    ai_reviews = [{k: v for k, v in r.items() if k != 'profile_picture'} for r in reviews]
    analysis_result = await analyzer.analyze_reviews(ai_reviews, restaurant_info['name'])
    
    logger.info("Step 4: Storing analysis results in PostgreSQL")
    restaurant_id = await _store_analysis_postgres(
        query, restaurant_info, analysis_result, task_id, user_id
    )
    
    return {
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant_info['name'],
        "restaurant_rating": restaurant_info.get('rating'),
        "sentiment_score": analysis_result['sentiment_score'],
        "summary": analysis_result['summary'],
        "complaints": analysis_result['complaints'],
        "praises": analysis_result['praises'],
        "recommended_actions": analysis_result.get('recommended_actions', []),
        "reviews_analyzed": analysis_result['reviews_analyzed'],
        "task_id": task_id
    }


async def _store_raw_reviews_mongodb(query: str, scrape_result: Dict):
    MongoDB.client = None
    await MongoDB.connect()
    
    collection = MongoDB.get_collection("raw_reviews")
    
    document = {
        "query": query,
        "restaurant_info": scrape_result['restaurant_info'],
        "reviews": scrape_result['reviews'],
        "total_reviews_collected": scrape_result['total_reviews_collected'],
        "scraped_at": scrape_result['scraped_at'],
        "stored_at": datetime.utcnow().isoformat()
    }
    
    await collection.insert_one(document)
    logger.info(f"Stored raw data in MongoDB")


async def _store_analysis_postgres(
    query: str,
    restaurant_info: Dict,
    analysis_result: Dict,
    task_id: str,
    user_id: str = None
) -> int:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from app.core.config import settings
    
    engine = create_async_engine(settings.postgres_url, echo=True, future=True)
    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with session_maker() as session:
        result = await session.execute(
            select(Restaurant).where(Restaurant.google_maps_url == query)
        )
        restaurant = result.scalar_one_or_none()
        
        if not restaurant:
            try:
                restaurant = Restaurant(
                    name=restaurant_info['name'],
                    google_maps_url=query,
                    address=restaurant_info.get('address'),
                    rating=restaurant_info.get('rating'),
                    total_reviews=restaurant_info.get('total_reviews')
                )
                session.add(restaurant)
                await session.flush()
            except Exception:
                # Fallback in case of race condition: try to fetch again
                await session.rollback()
                result = await session.execute(
                    select(Restaurant).where(Restaurant.google_maps_url == query)
                )
                restaurant = result.scalar_one_or_none()
                if not restaurant:
                    raise  # Re-raise if still not found
        
        analysis_report = AnalysisReport(
            restaurant_id=restaurant.id,
            task_id=task_id,
            user_id=user_id,
            sentiment_score=analysis_result['sentiment_score'],
            summary=analysis_result['summary'],
            complaints=analysis_result['complaints'],
            praises=analysis_result['praises'],
            recommended_actions=analysis_result.get('recommended_actions', []),
            reviews_analyzed=analysis_result['reviews_analyzed'],
            raw_ai_response=analysis_result
        )
        
        session.add(analysis_report)
        await session.commit()
        
        logger.info(f"Stored analysis in PostgreSQL for restaurant_id={restaurant.id}")
        return restaurant.id
