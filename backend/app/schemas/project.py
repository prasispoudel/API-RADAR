from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    base_url: str
    environment: Optional[str] = None
    auth_type: Optional[str] = None
    auth_config: Optional[dict[str, Any]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    environment: Optional[str] = None
    auth_type: Optional[str] = None
    auth_config: Optional[dict[str, Any]] = None

class ProjectRead(ProjectBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    latest_scan_summary: Optional[dict[str, Any]] = None

    class Config:
        orm_mode = True
