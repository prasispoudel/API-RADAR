from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnomalyRead(BaseModel):
    id: int
    endpoint_id: int
    metric_type: str
    score: float
    is_anomalous: bool
    details: Optional[dict] = None
    detected_at: Optional[datetime] = None

    class Config:
        orm_mode = True
