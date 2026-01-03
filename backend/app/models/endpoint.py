from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Endpoint(Base):
    __tablename__ = "endpoints"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    path = Column(String, nullable=False)
    method = Column(String(10), nullable=False)
    requires_auth = Column(Boolean, default=False)
    source = Column(String, nullable=True)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="endpoints")
    test_runs = relationship("TestRun", back_populates="endpoint", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint('project_id', 'path', 'method', name='uix_project_path_method'),)
