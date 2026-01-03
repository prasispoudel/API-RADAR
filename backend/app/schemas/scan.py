from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class ScanCreate(BaseModel):
    scan_type: Literal["full", "quick"] = "quick"

class ScanRead(BaseModel):
    id: int
    project_id: int
    status: str
    scan_type: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    summary: Optional[dict] = None

    class Config:
        from_attributes = True
