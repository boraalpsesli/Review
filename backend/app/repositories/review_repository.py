from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.review import RawReview

class ReviewRepository:
    """Repository for RawReview model database operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_query(self, query: str) -> Optional[RawReview]:
        """Get raw reviews by query/url."""
        result = await self.db.execute(
            select(RawReview).where(RawReview.query == query)
        )
        return result.scalar_one_or_none()
    
    async def create(self, review: RawReview) -> RawReview:
        """Create a new raw review record."""
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def get_or_create(self, query: str, **kwargs) -> RawReview:
        """Get existing or create new raw review record."""
        existing = await self.get_by_query(query)
        if existing:
            # Optionally update if needed, but for now just return
            return existing
        
        new_review = RawReview(query=query, **kwargs)
        return await self.create(new_review)
