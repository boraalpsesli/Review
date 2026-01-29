from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    google_maps_url = Column(String(2048), unique=True, nullable=False)
    address = Column(String(500))
    rating = Column(Float)
    total_reviews = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    analysis_reports = relationship("AnalysisReport", back_populates="restaurant")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    task_id = Column(String(100))
    user_id = Column(String(255), nullable=True)
    analysis_date = Column(DateTime(timezone=True), server_default=func.now())
    sentiment_score = Column(Float)
    summary = Column(Text)
    complaints = Column(JSON, default=list)
    praises = Column(JSON, default=list)
    recommended_actions = Column(JSON, default=list)
    reviews_analyzed = Column(Integer)
    raw_ai_response = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    restaurant = relationship("Restaurant", back_populates="analysis_reports")
