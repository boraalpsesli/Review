"""
Application configuration using Pydantic settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Restaurant Review Analysis SaaS"
    VERSION: str = "1.0.0"
    
    # Auth Settings
    SECRET_KEY: str = "development_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database Settings - PostgreSQL
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "restaurant_saas"
    
    # Database Settings - MongoDB
    MONGO_URL: str = "mongodb://localhost:27017"
    MONGO_DB: str = "restaurant_reviews"
    
    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Celery Settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Google Gemini API
    GEMINI_API_KEY: Optional[str] = None
    
    # Outscraper Settings
    OUTSCRAPER_API_KEY: Optional[str] = None
    
    # Playwright Settings
    PLAYWRIGHT_HEADLESS: bool = True
    PLAYWRIGHT_TIMEOUT: int = 30000  # 30 seconds
    
    # Scraper Settings
    REVIEW_DAYS_LIMIT: int = 30  # Last 30 days
    MAX_REVIEWS_TO_SCRAPE: int = 1000  # Increased to capture all reviews within 30 days
    
    @property
    def postgres_url(self) -> str:
        """Generate PostgreSQL connection URL"""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def celery_broker_url(self) -> str:
        """Celery broker URL"""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
