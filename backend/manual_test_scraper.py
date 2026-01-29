import asyncio
import os
import sys

# Add the parent directory to sys.path to resolve app imports
sys.path.append(os.getcwd())

from app.services.scraper import GoogleMapsScraper
from app.core.database import MongoDB
from datetime import datetime

async def run_full_scraping_test():
    query = "McDonald's Kozyatağı"
    print(f"Starting test scrape for: {query}")
    
    # 1. Scrape
    scraper = GoogleMapsScraper(headless=True)
    try:
        scrape_result = await scraper._scrape_reviews_async(query, max_reviews=100)
    except Exception as e:
        print(f"Scraping failed: {e}")
        return

    print(f"Scrape successful. Got {len(scrape_result['reviews'])} reviews.")
    
    # 2. Store in MongoDB
    print("Connecting to MongoDB...")
    MongoDB.client = None
    try:
        await MongoDB.connect()
    except Exception as e:
         print(f"MongoDB connect failed: {e}")
         return

    collection = MongoDB.get_collection("raw_reviews")
    
    document = {
        "query": query,
        "restaurant_info": scrape_result['restaurant_info'],
        "reviews": scrape_result['reviews'],
        "total_reviews_collected": scrape_result['total_reviews_collected'],
        "scraped_at": scrape_result['scraped_at'],
        "stored_at": datetime.utcnow().isoformat(),
        "is_test": True
    }
    
    await collection.insert_one(document)
    print("Stored raw data in MongoDB.")
    
    # 3. Verify inserted data
    print("-" * 30)
    print("Verifying saved data...")
    saved_doc = await collection.find_one({"is_test": True}, sort=[("stored_at", -1)])
    
    if saved_doc:
        reviews = saved_doc['reviews']
        with_date = sum(1 for r in reviews if r.get('date_text') and r.get('date_text') != "Unknown Date")
        print(f"Reviews with valid date_text: {with_date}/{len(reviews)}")
        
        print("\nLast 5 Reviews (should be newest / relative dates):")
        for r in reviews[:5]:
             print(f"Date: '{r.get('date_text')}' | Text: {r.get('text', '')[:30]}...")
    else:
        print("Could not find the saved document!")

if __name__ == "__main__":
    asyncio.run(run_full_scraping_test())
