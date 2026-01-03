from sqlalchemy import Column, Integer, ForeignKey, Boolean, Float, DateTime, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False, index=True)
    endpoint_id = Column(Integer, ForeignKey("endpoints.id"), nullable=False, index=True)
    status_code = Column(Integer, nullable=True)
    success = Column(Boolean, default=False)
    latency_ms = Column(Float, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    validation_errors = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    scan = relationship("Scan", back_populates="test_runs")
    endpoint = relationship("Endpoint", back_populates="test_runs")

# composite index for endpoint + timestamp
Index('ix_test_runs_endpoint_timestamp', TestRun.endpoint_id, TestRun.timestamp)
