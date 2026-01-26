
import logging
import sys
import os
import json
import asyncio

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.scraper import GoogleMapsScraper

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_live_scraper():
    # Use Search Query instead of URL to avoid potential URL parsing issues
    TEST_QUERY = "Gordon Ramsay Burger Las Vegas" 
    
    logger.info("Starting live scraper test (Using GOSOM via API)...")
    logger.info(f"Target Query: {TEST_QUERY}")
    
    # Check if we can reach the GOSOM service env var
    gosom_url = os.getenv("GOSOM_URL", "http://gosom-scraper:8080")
    logger.info(f"Gosom URL: {gosom_url}")

    try:
        scraper = GoogleMapsScraper()
        
        # This calls the sync wrapper which calls async logic
        result = scraper.scrape_reviews(TEST_QUERY, max_reviews=100)
        
        print("\n" + "="*50)
        print("SCRAPER RESULT SUMMARY")
        print("="*50)
        
        info = result.get('restaurant_info', {})
        print(f"Name: {info.get('name')}")
        print(f"Rating: {info.get('rating')}")
        print(f"Total Reviews: {info.get('total_reviews')}")
        print(f"Address: {info.get('address')}")
        
        reviews = result.get('reviews', [])
        print(f"\nCollected {len(reviews)} reviews")
        
        if reviews:
            print("\nSample Reviews:")
            for r in reviews[:3]:
                print(f"- [{r.get('date_text')}] {r.get('author')} ({r.get('rating')}*): {r.get('text')[:100]}...")
            
        print("\n" + "="*50)
        
        if len(reviews) > 0:
            print("✅ TEST PASSED: Successfully retrieved reviews from Gosom.")
        else:
            print("❌ TEST FAILED: No reviews collected (or timed out).")
            
    except Exception as e:
        logger.error(f"TEST FAILED with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_live_scraper()
