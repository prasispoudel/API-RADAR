from sqlalchemy import Column, Integer, ForeignKey, String, Float, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id"), nullable=False, index=True)
    metric_type = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    is_anomalous = Column(Boolean, default=False)
    details = Column(JSON, nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

    endpoint = relationship("Endpoint")
