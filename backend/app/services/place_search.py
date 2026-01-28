"""
Place search service using Gosom scraper.
Searches for places without fetching reviews (fast mode).
"""
import asyncio
import csv
import io
import logging
import os
import sys
import time
from typing import Any, Dict, List

import httpx

# Increase CSV field size limit
csv.field_size_limit(sys.maxsize)

logger = logging.getLogger(__name__)

GOSOM_URL = os.getenv("GOSOM_URL", "http://gosom-scraper:8080")


class PlaceSearchService:
    """Service for searching places using Gosom scraper."""

    def __init__(self):
        self.base_url = GOSOM_URL
        self.client = httpx.AsyncClient(timeout=120.0)

    async def close(self):
        await self.client.aclose()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.close()

    def search_places(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Synchronous wrapper for place search."""
        return asyncio.run(self._search_places_async(query, limit))

    async def _search_places_async(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for places matching the query.
        Returns basic place info without reviews for fast selection.
        """
        logger.info(f"Searching places for: {query}")

        payload = {
            "name": f"search_{int(time.time())}",
            "keywords": [query],
            "lang": "en",
            "depth": limit,  # Number of results to return
            "max_time": 60,  # Short timeout for fast search
            "fast_mode": False,
            "json": True,
            "email": False,
            "extra_reviews": False  # No reviews for search - faster
        }

        try:
            response = await self.client.post(f"{self.base_url}/api/v1/jobs", json=payload)
            response.raise_for_status()

            job_data = response.json()
            job_id = job_data.get("id")
            logger.info(f"Search job created: {job_id}")

            # Wait for job completion
            start_time = time.time()
            max_wait = 90  # 90 seconds max for search

            while time.time() - start_time < max_wait:
                status_res = await self.client.get(f"{self.base_url}/api/v1/jobs/{job_id}")
                if status_res.status_code == 200:
                    job_status = status_res.json()
                    status = (job_status.get("Status") or job_status.get("status", "")).lower()

                    if status in ["completed", "ok", "done", "success"]:
                        return await self._download_and_parse_places(job_id)
                    elif status in ["failed", "error"]:
                        logger.error(f"Search job failed: {job_status}")
                        return []

                await asyncio.sleep(1)

            logger.warning(f"Search job timed out after {max_wait}s")
            return []

        except Exception as e:
            logger.error(f"Place search error: {e}")
            return []

    async def _download_and_parse_places(self, job_id: str) -> List[Dict[str, Any]]:
        """Download and parse place results from Gosom."""
        try:
            results_res = await self.client.get(f"{self.base_url}/api/v1/jobs/{job_id}/download")
            if results_res.status_code != 200:
                return []

            # Try JSON first
            try:
                data = results_res.json()
                if isinstance(data, list):
                    return self._extract_places(data)
            except Exception:
                pass

            # Fall back to CSV
            try:
                content = results_res.text
                reader = csv.DictReader(io.StringIO(content))
                rows = list(reader)
                return self._extract_places(rows)
            except Exception as e:
                logger.error(f"CSV parse error: {e}")
                return []

        except Exception as e:
            logger.error(f"Download error: {e}")
            return []

    def _extract_places(self, data: List[Dict]) -> List[Dict[str, Any]]:
        """Extract place info from raw data."""
        places = []
        for item in data:
            place = {
                "title": item.get("title", ""),
                "address": item.get("address", ""),
                "rating": self._safe_float(item.get("review_rating", 0)),
                "review_count": self._safe_int(item.get("review_count", 0)),
                "category": item.get("category", ""),
                "link": item.get("link", ""),
                "place_id": item.get("place_id", ""),
                "phone": item.get("phone", ""),
                "website": item.get("website", ""),
                "thumbnail": item.get("thumbnail", ""),
            }
            if place["title"]:
                places.append(place)
        return places

    def _safe_float(self, val) -> float:
        try:
            return float(val) if val else 0.0
        except (ValueError, TypeError):
            return 0.0

    def _safe_int(self, val) -> int:
        try:
            return int(val) if val else 0
        except (ValueError, TypeError):
            return 0
