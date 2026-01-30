from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class RawReview(Base):
    __tablename__ = "raw_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(2048), index=True, nullable=False)
    restaurant_info = Column(JSON, default=dict) # Name, rating, address
    reviews = Column(JSON, default=list) # The list of reviews
    total_reviews_collected = Column(Integer, default=0)
    scraped_at = Column(DateTime(timezone=True), default=func.now())
    stored_at = Column(DateTime(timezone=True), server_default=func.now())
