
import asyncio
from app.services.place_search import PlaceSearchService
from app.services.scraper import GoogleMapsScraper
from app.services.ai_analyzer import GeminiAnalyzer
import logging
import sys

# Setup logging
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger(__name__)

async def test_full_flow():
    print("1. Testing Place Search...")
    async with PlaceSearchService() as service:
        # Step 1: Search
        query = "McDonalds Kadikoy"
        places = await service._search_places_async(query, limit=3)
        print(f"Found {len(places)} places")
        
        if not places:
            print("No places found!")
            return

        # Step 2: Select first place
        place = places[0]
        print(f"Selected: {place['title']} ({place['link']})")

        # Step 3: Scrape
        print("\n2. Testing Place Scraping (Direct URL)...")
        scraper = GoogleMapsScraper()
        result = await scraper._scrape_reviews_async(place['link'], max_reviews=50)
        
        reviews = result.get('reviews', [])
        print(f"Scraped {len(reviews)} reviews")
        
        if not reviews:
            print("No reviews scraped!")
            return

        # Step 4: Analyze
        print("\n3. Testing AI Analysis...")
        formatted_reviews = [
            f"{r.get('review_rating')} stars: {r.get('review_text')}" 
            for r in reviews if r.get('review_text')
        ]
        
        print(f"Sending {len(formatted_reviews)} reviews to Gemini...")
        analyzer = GeminiAnalyzer()
        analysis = await analyzer.analyze_reviews(reviews[:20], place['title'])
        
        print("\nAnalysis Result:")
        print(f"Sentiment: {analysis['sentiment_score']}")
        print(f"Summary: {analysis['summary'][:100]}...")
        
        print("\nRecommended Actions:")
        for action in analysis.get('recommended_actions', []):
            print(f"- {action}")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
