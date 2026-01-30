import asyncio
import csv
import io
import json as json_lib
import logging
import os
import sys
import time
from datetime import datetime, timedelta
from typing import Any, Dict

import httpx

# Increase CSV field size limit to handle large review data
csv.field_size_limit(sys.maxsize)

logger = logging.getLogger(__name__)

def normalize_text(text: str) -> str:
    """Normalize text for consistent hashing (strip, lowercase, remove extra spaces)."""
    if not text:
        return ""
    return " ".join(text.lower().split())

def generate_review_signature(review: Dict[str, Any]) -> str:
    """Generate a unique signature for a review based on its content."""
    author = normalize_text(review.get('author', ''))
    # Use only part of the text to avoid issues with "More..." expansions differing slightly
    text_snippet = normalize_text(review.get('text', ''))[:50] 
    rating = str(review.get('rating', 0))
    date = normalize_text(review.get('date_text', ''))
    
    # Signature: author|rating|date|partial_text
    return f"{author}|{rating}|{date}|{text_snippet}"


GOSOM_URL = os.getenv("GOSOM_URL", "http://gosom-scraper:8080")


class GoogleMapsScraper:

    def __init__(self, headless: bool = True):
        self.base_url = GOSOM_URL
        self.client = httpx.AsyncClient(timeout=300.0)

    async def close(self):
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.close()

    def scrape_reviews(self, query: str, max_reviews: int = 100) -> Dict[str, Any]:
        return asyncio.run(self._scrape_reviews_async(query, max_reviews))

    async def _scrape_reviews_async(self, query: str, max_reviews: int) -> Dict[str, Any]:
        logger.info(f"Submitting scrape job to {self.base_url} for {query}")

        payload = {
            "name": f"scrape_{int(time.time())}",
            "keywords": [query],
            "lang": "en",
            "depth": 1,  # Only get the single best matching place
            "max_time": 600,
            "fast_mode": False,  # Disable fast mode as it requires lat/lon
            "json": True,
            "email": False,
            "extra_reviews": True  # Fetch extended reviews (up to ~300)
        }

        try:
            response = await self.client.post(f"{self.base_url}/api/v1/jobs", json=payload)
            if response.status_code not in [200, 201]:
                logger.error(f"Gosom API Error: {response.status_code} - {response.text}")
            response.raise_for_status()
            
            job_data = response.json()
            job_id = job_data.get("id")
            logger.info(f"Job created: {job_id}")

            results = None
            start_time = time.time()
            max_wait = 900

            while time.time() - start_time < max_wait:
                status_res = await self.client.get(f"{self.base_url}/api/v1/jobs/{job_id}")
                if status_res.status_code == 200:
                    job_status = status_res.json()
                    status = (job_status.get("Status") or job_status.get("status", "")).lower()

                    if status in ["completed", "ok", "done", "success"]:
                        results_res = await self.client.get(f"{self.base_url}/api/v1/jobs/{job_id}/download")
                        if results_res.status_code == 200:
                            try:
                                results = results_res.json()
                            except Exception:
                                logger.info("JSON parse failed, attempting CSV parse...")
                                csv_text = results_res.text
                                reader = csv.DictReader(io.StringIO(csv_text))
                                results = []
                                for row in reader:
                                    # Prioritize extended reviews. If we have them, ignore the basic 'reviews' to avoid duplicates.
                                    reviews_data = []
                                    has_extended = False
                                    
                                    ext_key = next((k for k in ['user_reviews_extended', 'UserReviewsExtended'] if k in row), None)
                                    if ext_key and row[ext_key]:
                                        try:
                                            parsed = json_lib.loads(row[ext_key])
                                            if isinstance(parsed, list) and len(parsed) > 0:
                                                reviews_data.extend(parsed)
                                                has_extended = True
                                        except Exception:
                                            pass

                                    # Only look at basic reviews if we didn't get any extended ones
                                    if not has_extended:
                                        review_key = next((k for k in ['user_reviews', 'UserReviews', 'reviews'] if k in row), None)
                                        if review_key and row[review_key]:
                                            try:
                                                parsed = json_lib.loads(row[review_key])
                                                if isinstance(parsed, list):
                                                    reviews_data.extend(parsed)
                                            except Exception:
                                                pass

                                    row['reviews'] = reviews_data
                                    results.append(row)
                            break
                    elif status in ["failed", "error"]:
                        logger.error(f"Job {job_id} failed: {job_status.get('error') or job_status.get('Error')}")
                        break

                await asyncio.sleep(2)

            if not results:
                logger.warning("Scrape timed out or failed to return results")
                return {
                    'restaurant_info': {'name': 'Unknown'},
                    'reviews': [],
                    'total_reviews_collected': 0,
                    'scraped_at': datetime.utcnow().isoformat()
                }

            place_data = results[0] if results else {}

            def get_val(data, *keys):
                for k in keys:
                    if k in data:
                        return data[k]
                    if k.title() in data:
                        return data[k.title()]
                return None

            restaurant_info = {
                'name': get_val(place_data, 'title', 'name', 'Title', 'Name') or "Unknown",
                'rating': float(get_val(place_data, 'totalScore', 'rating', 'review_rating', 'Rating') or 0),
                'total_reviews': int(get_val(place_data, 'reviewsCount', 'reviews_count', 'review_count', 'ReviewsCount') or 0),
                'address': get_val(place_data, 'address', 'Address', 'complete_address') or ''
            }

            raw_reviews = get_val(place_data, 'reviews', 'Reviews', 'user_reviews') or []
            if isinstance(raw_reviews, str):
                try:
                    raw_reviews = json_lib.loads(raw_reviews)
                except Exception:
                    raw_reviews = []

            reviews = []
            reviews_map = {}
            
            for r in raw_reviews:
                # Extract fields first to generate signature
                text = get_val(r, 'text', 'caption', 'Text', 'Description') or ''
                rating = float(get_val(r, 'stars', 'rating', 'Rating') or 0)
                author = get_val(r, 'reviewerName', 'name', 'Name') or 'Anonymous'
                date_text = get_val(r, 'publishedAtDate', 'relativePublishTimeDescription', 'date', 'When') or ''
                profile_picture = get_val(r, 'reviewerPhotoUrl', 'ProfilePicture', 'profile_picture') or ''
                
                # Original ID from source (still kept for reference)
                original_id = get_val(r, 'reviewId', 'googleMapsReviewId', 'id_review')
                
                review_obj = {
                    'text': text,
                    'rating': rating,
                    'author': author,
                    'date_text': date_text,
                    'profile_picture': profile_picture
                }
                
                # Generate robust content-based signature
                signature = generate_review_signature(review_obj)
                
                # If we have a real ID, use it as part of the object, else generate one
                review_obj['review_id'] = original_id or str(hash(signature))

                # Deduplicate based on signature
                if signature not in reviews_map:
                    reviews_map[signature] = review_obj
                else:
                    # If we already have this review, check if the new one has more data (e.g. longer text)
                    existing = reviews_map[signature]
                    if len(text) > len(existing['text']):
                        reviews_map[signature] = review_obj
            
            reviews = list(reviews_map.values())

            recent_reviews = []
            cutoff = datetime.utcnow() - timedelta(days=30)  # Only reviews from last 30 days

            for r in reviews:
                try:
                    d_str = r['date_text']
                    if d_str and 'T' in d_str:
                        dt = datetime.fromisoformat(d_str.replace('Z', '+00:00'))
                        if dt >= cutoff.replace(tzinfo=dt.tzinfo):
                            recent_reviews.append(r)
                    else:
                        recent_reviews.append(r)
                except Exception:
                    recent_reviews.append(r)

            return {
                'restaurant_info': restaurant_info,
                'reviews': recent_reviews[:max_reviews],
                'total_reviews_collected': len(recent_reviews[:max_reviews]),
                'scraped_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Gosom scrape failed: {e}")
            raise


def get_reviews(query: str, max_reviews: int = 100) -> Dict[str, Any]:
    scraper = GoogleMapsScraper()
    return scraper.scrape_reviews(query, max_reviews)
