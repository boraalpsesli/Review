"""Restaurant repository for database operations."""
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.restaurant import Restaurant, AnalysisReport


class RestaurantRepository:
    """Repository for Restaurant model database operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, restaurant_id: int) -> Optional[Restaurant]:
        """Get restaurant by ID."""
        result = await self.db.execute(
            select(Restaurant).where(Restaurant.id == restaurant_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_url(self, google_maps_url: str) -> Optional[Restaurant]:
        """Get restaurant by Google Maps URL."""
        result = await self.db.execute(
            select(Restaurant).where(Restaurant.google_maps_url == google_maps_url)
        )
        return result.scalar_one_or_none()
    
    async def create(self, restaurant: Restaurant) -> Restaurant:
        """Create a new restaurant."""
        self.db.add(restaurant)
        await self.db.commit()
        await self.db.refresh(restaurant)
        return restaurant
    
    async def get_or_create(self, google_maps_url: str, **kwargs) -> Restaurant:
        """Get existing restaurant or create new one."""
        restaurant = await self.get_by_url(google_maps_url)
        if restaurant:
            return restaurant
        restaurant = Restaurant(google_maps_url=google_maps_url, **kwargs)
        return await self.create(restaurant)


class AnalysisReportRepository:
    """Repository for AnalysisReport model database operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, report_id: int) -> Optional[AnalysisReport]:
        """Get analysis report by ID."""
        result = await self.db.execute(
            select(AnalysisReport)
            .options(selectinload(AnalysisReport.restaurant))
            .where(AnalysisReport.id == report_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_user_id(self, user_id: str, limit: int = 10) -> List[AnalysisReport]:
        """Get analysis reports by user ID."""
        result = await self.db.execute(
            select(AnalysisReport)
            .options(selectinload(AnalysisReport.restaurant))
            .where(AnalysisReport.user_id == user_id)
            .order_by(AnalysisReport.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def create(self, report: AnalysisReport) -> AnalysisReport:
        """Create a new analysis report."""
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return report
