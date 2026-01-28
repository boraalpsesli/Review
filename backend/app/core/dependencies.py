"""Centralized FastAPI dependencies for dependency injection."""
from typing import AsyncGenerator, Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker, get_db


# Database session dependency
DbSession = Annotated[AsyncSession, Depends(get_db)]


def get_user_repository(db: DbSession) -> UserRepository:
    """Get UserRepository instance with injected db session."""
    return UserRepository(db)


def get_restaurant_repository(db: DbSession) -> RestaurantRepository:
    """Get RestaurantRepository instance with injected db session."""
    return RestaurantRepository(db)


def get_analysis_report_repository(db: DbSession) -> AnalysisReportRepository:
    """Get AnalysisReportRepository instance with injected db session."""
    return AnalysisReportRepository(db)


# Type aliases for cleaner endpoint signatures
UserRepo = Annotated[UserRepository, Depends(get_user_repository)]
RestaurantRepo = Annotated[RestaurantRepository, Depends(get_restaurant_repository)]
AnalysisReportRepo = Annotated[AnalysisReportRepository, Depends(get_analysis_report_repository)]
