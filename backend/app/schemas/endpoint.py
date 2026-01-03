from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EndpointRead(BaseModel):
    id: int
    project_id: int
    path: str
    method: str
    requires_auth: bool = False
    source: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    last_status_code: Optional[int] = None
    last_latency_ms: Optional[float] = None

    class Config:
        from_attributes = True


class EndpointCreate(BaseModel):
    path: str
    method: str
    requires_auth: Optional[bool] = False
    source: Optional[str] = None


class EndpointUpdate(BaseModel):
    path: Optional[str] = None
    method: Optional[str] = None
    requires_auth: Optional[bool] = None
    source: Optional[str] = None
