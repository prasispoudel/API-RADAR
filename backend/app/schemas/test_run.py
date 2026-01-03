from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TestRunRead(BaseModel):
    id: int
    scan_id: int
    endpoint_id: int
    status_code: Optional[int] = None
    success: bool = False
    latency_ms: Optional[float] = None
    response_size_bytes: Optional[int] = None
    validation_errors: Optional[dict] = None
    timestamp: Optional[datetime] = None

    class Config:
        orm_mode = True
