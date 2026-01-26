"""
Celery tasks for restaurant review analysis
"""
import asyncio
import logging
from typing import Dict
from app.worker.celery_app import celery_app
from app.services.scraper import GoogleMapsScraper
from app.services.ai_analyzer import GeminiAnalyzer
from app.core.database import MongoDB, async_session_maker
from app.models.restaurant import Restaurant, AnalysisReport
from sqlalchemy import select
from datetime import datetime

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="tasks.analyze_restaurant")
def analyze_restaurant_task(self, google_maps_url: str) -> Dict:
    """
    Celery task to analyze a restaurant
    """
    task_id = self.request.id
    logger.info(f"Starting analysis task {task_id} for {google_maps_url}")
    
    try:
        # Run the async analysis
        return asyncio.run(_async_analyze_restaurant(google_maps_url, task_id))
        
    except Exception as e:
        logger.error(f"Task {task_id} failed: {str(e)}", exc_info=True)
        raise


async def _async_analyze_restaurant(google_maps_url: str, task_id: str) -> Dict:
    """Async implementation of restaurant analysis"""
    
    # Step 1: Scrape reviews
    logger.info("Step 1: Fetching reviews from Google Maps via Selenium")
    
    # Instantiate scraper locally for this task
    scraper = GoogleMapsScraper(headless=True)
    scrape_result = await scraper._scrape_reviews_async(google_maps_url, max_reviews=100)
    
    restaurant_info = scrape_result['restaurant_info']
    reviews = scrape_result['reviews']
    
    if not reviews:
        raise ValueError("No reviews found for this restaurant")
    
    # Step 2: Store raw reviews in MongoDB
    logger.info(f"Step 2: Storing {len(reviews)} raw reviews in MongoDB")
    await _store_raw_reviews_mongodb(google_maps_url, scrape_result)
    
    # Step 3: Analyze reviews with AI
    logger.info("Step 3: Analyzing reviews with Gemini AI")
    analyzer = GeminiAnalyzer()
    analysis_result = await analyzer.analyze_reviews(reviews, restaurant_info['name'])
    
    # Step 4: Store results in PostgreSQL
    logger.info("Step 4: Storing analysis results in PostgreSQL")
    restaurant_id = await _store_analysis_postgres(
        google_maps_url,
        restaurant_info,
        analysis_result,
        task_id
    )
    
    # Prepare final result
    final_result = {
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant_info['name'],
        "restaurant_rating": restaurant_info.get('rating'),
        "sentiment_score": analysis_result['sentiment_score'],
        "summary": analysis_result['summary'],
        "complaints": analysis_result['complaints'],
        "praises": analysis_result['praises'],
        "reviews_analyzed": analysis_result['reviews_analyzed'],
        "task_id": task_id
    }
    
    return final_result


async def _store_raw_reviews_mongodb(google_maps_url: str, scrape_result: Dict):
    """Store raw scraped data in MongoDB"""
    # Force fresh connection for this async context
    MongoDB.client = None
    await MongoDB.connect()
    
    collection = MongoDB.get_collection("raw_reviews")
    
    document = {
        "google_maps_url": google_maps_url,
        "restaurant_info": scrape_result['restaurant_info'],
        "reviews": scrape_result['reviews'],
        "total_reviews_collected": scrape_result['total_reviews_collected'],
        "scraped_at": scrape_result['scraped_at'],
        "stored_at": datetime.utcnow().isoformat()
    }
    
    await collection.insert_one(document)
    logger.info(f"Stored raw data in MongoDB collection 'raw_reviews'")


async def _store_analysis_postgres(
    google_maps_url: str,
    restaurant_info: Dict,
    analysis_result: Dict,
    task_id: str
) -> int:
    """Store restaurant and analysis results in PostgreSQL"""
    async with async_session_maker() as session:
        # Find or create restaurant
        result = await session.execute(
            select(Restaurant).where(Restaurant.google_maps_url == google_maps_url)
        )
        restaurant = result.scalar_one_or_none()
        
        if not restaurant:
            restaurant = Restaurant(
                name=restaurant_info['name'],
                google_maps_url=google_maps_url,
                address=restaurant_info.get('address'),
                rating=restaurant_info.get('rating'),
                total_reviews=restaurant_info.get('total_reviews')
            )
            session.add(restaurant)
            await session.flush()
        
        # Create analysis report
        analysis_report = AnalysisReport(
            restaurant_id=restaurant.id,
            task_id=task_id,
            sentiment_score=analysis_result['sentiment_score'],
            summary=analysis_result['summary'],
            complaints=analysis_result['complaints'],
            praises=analysis_result['praises'],
            reviews_analyzed=analysis_result['reviews_analyzed'],
            raw_ai_response=analysis_result
        )
        
        session.add(analysis_report)
        await session.commit()
        
        logger.info(f"Stored analysis in PostgreSQL for restaurant_id={restaurant.id}")
        return restaurant.id


@celery_app.task(bind=True, name="tasks.test_analyze_with_mock_data")
def test_analyze_with_mock_data(self) -> Dict:
    """
    Test task using mock restaurant review data
    
    This bypasses the scraper and uses predefined mock reviews
    to demonstrate the AI analysis and database storage functionality.
    """
    task_id = self.request.id
    logger.info(f"Starting TEST analysis task {task_id} with mock data")
    
    try:
        # Mock reviews for a fictional restaurant
        mock_reviews = [
            {"author": "John D.", "rating": 5, "text": "Amazing food! The pasta was incredible and the service was outstanding. Will definitely come back!", "date_text": "2 days ago"},
            {"author": "Sarah M.", "rating": 4, "text": "Great atmosphere and delicious food. The wait during peak hours was a bit slow, but worth it.", "date_text": "1 week ago"},
            {"author": "Mike R.", "rating": 5, "text": "Best Italian restaurant in town! Fresh ingredients, amazing flavors, and friendly staff.", "date_text": "3 days ago"},
            {"author": "Emily K.", "rating": 3, "text": "Food was good but portion sizes were small for the price. Service could be improved.", "date_text": "5 days ago"},
            {"author": "David L.", "rating": 5, "text": "Excellent dining experience! The chef's special was phenomenal. Highly recommended!", "date_text": "1 day ago"},
            {"author": "Lisa P.", "rating": 2, "text": "Disappointed with our visit. Long wait times and the food was overpriced. Expected better quality.", "date_text": "4 days ago"},
            {"author": "Tom H.", "rating": 4, "text": "Really enjoyed the food and ambiance. The desserts were especially good. Parking was difficult to find.", "date_text": "6 days ago"},
            {"author": "Rachel W.", "rating": 5, "text": "Absolutely loved everything! The risotto was creamy perfection and the wine selection was excellent.", "date_text": "2 days ago"},
            {"author": "Chris B.", "rating": 3, "text": "Decent food but nothing special. Drinks were overpriced and service was average.", "date_text": "1 week ago"},
            {"author": "Anna S.", "rating": 5, "text": "Perfect restaurant for a special occasion! Amazing food, great service, beautiful presentation.", "date_text": "3 days ago"},
        ]
        
        restaurant_name = "Test Italian Restaurant"
        
        # Analyze reviews with AI  
        logger.info("Analyzing mock reviews with Gemini AI")
        analyzer = GeminiAnalyzer()
        analysis_result = asyncio.run(analyzer.analyze_reviews(mock_reviews, restaurant_name))
        
        # Prepare result
        final_result = {
            "restaurant_name": restaurant_name,
            "sentiment_score": analysis_result['sentiment_score'],
            "summary": analysis_result['summary'],
            "complaints": analysis_result['complaints'],
            "praises": analysis_result['praises'],
            "reviews_analyzed": analysis_result['reviews_analyzed'],
            "task_id": task_id,
            "is_test": True
        }
        
        logger.info(f"Test task {task_id} completed successfully")
        return final_result
        
    except Exception as e:
        logger.error(f"Test task {task_id} failed: {str(e)}", exc_info=True)
        raise
