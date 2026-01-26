"""
SQLAlchemy ORM models for PostgreSQL
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Restaurant(Base):
    """Restaurant model for storing restaurant information"""
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    google_maps_url = Column(Text, nullable=False, unique=True)
    address = Column(Text)
    rating = Column(Float)
    total_reviews = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AnalysisReport(Base):
    """Analysis report model for storing AI analysis results"""
    __tablename__ = "analysis_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, nullable=False, index=True)
    task_id = Column(String(255), unique=True, index=True)
    
    # Analysis Results
    sentiment_score = Column(Float)  # Overall sentiment (-1 to 1)
    summary = Column(Text)
    complaints = Column(JSON)  # List of common complaints
    praises = Column(JSON)  # List of common praises
    
    # Metadata
    reviews_analyzed = Column(Integer)
    analysis_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Raw AI response
    raw_ai_response = Column(JSON)
