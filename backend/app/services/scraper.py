import asyncio
import csv
import io
import json as json_lib
import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict

import httpx

logger = logging.getLogger(__name__)

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
            "depth": 10,
            "max_time": 600,
            "fast_mode": False,
            "json": True,
            "email": False
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
                                    reviews_data = []
                                    review_key = next((k for k in ['user_reviews', 'UserReviews', 'reviews'] if k in row), None)
                                    if review_key and row[review_key]:
                                        try:
                                            parsed = json_lib.loads(row[review_key])
                                            if isinstance(parsed, list):
                                                reviews_data.extend(parsed)
                                        except Exception:
                                            pass

                                    ext_key = next((k for k in ['user_reviews_extended', 'UserReviewsExtended'] if k in row), None)
                                    if ext_key and row[ext_key]:
                                        try:
                                            parsed = json_lib.loads(row[ext_key])
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
            for r in raw_reviews:
                reviews.append({
                    'review_id': get_val(r, 'reviewId', 'googleMapsReviewId', 'id_review') or str(hash(get_val(r, 'reviewerName', 'Name', 'name') or 'unknown')),
                    'text': get_val(r, 'text', 'caption', 'Text', 'Description') or '',
                    'rating': float(get_val(r, 'stars', 'rating', 'Rating') or 0),
                    'author': get_val(r, 'reviewerName', 'name', 'Name') or 'Anonymous',
                    'date_text': get_val(r, 'publishedAtDate', 'relativePublishTimeDescription', 'date', 'When') or ''
                })

            recent_reviews = []
            cutoff = datetime.utcnow() - timedelta(days=32)

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
