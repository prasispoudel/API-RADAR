from typing import Optional, List, Dict
from datetime import datetime
import math
from sqlalchemy.orm import Session

from app.models.test_run_model import TestRun
from app.models.anomaly import Anomaly
from app.models.endpoint import Endpoint
from app.core.logging import set_request_id


def _apply_request_id_from_rq_job():
    try:
        # import lazily to avoid requiring rq at import time
        from rq import get_current_job
        job = get_current_job()
        if job is not None and hasattr(job, "meta"):
            rid = job.meta.get("request_id")
            if rid:
                set_request_id(rid)
    except Exception:
        # no-op if rq not installed or no current job
        pass


def compute_endpoint_metrics(db: Session, endpoint_id: int, window: int = 30) -> Optional[Dict]:
    runs: List[TestRun] = (
        db.query(TestRun)
        .filter(TestRun.endpoint_id == endpoint_id, TestRun.latency_ms != None)
        .order_by(TestRun.timestamp.desc())
        .limit(window)
        .all()
    )
    latencies = [r.latency_ms for r in runs if r.latency_ms is not None]
    if not latencies:
        return None
    count = len(latencies)
    mean_val = sum(latencies) / count
    if count > 1:
        # sample std
        variance = sum((x - mean_val) ** 2 for x in latencies) / (count - 1)
        std = math.sqrt(variance)
    else:
        std = 0.0
    latest = latencies[0]
    z = None
    if std > 0:
        z = (latest - mean_val) / std
    return {"mean": mean_val, "std": std, "latest": latest, "z": z, "count": count}


def detect_anomalies(db: Session, project_id: int, window: int = 30, z_threshold: float = 3.0) -> List[Dict]:
    results = []
    # if running inside an RQ job, apply its request-id to logging context
    _apply_request_id_from_rq_job()
    endpoints: List[Endpoint] = db.query(Endpoint).filter(Endpoint.project_id == project_id).all()
    for ep in endpoints:
        metrics = compute_endpoint_metrics(db, ep.id, window=window)
        if not metrics:
            continue
        z = metrics.get("z")
        is_anom = False
        score = float(z) if z is not None else 0.0
        if z is not None and abs(z) >= z_threshold:
            is_anom = True
        # upsert anomaly row for metric_type 'latency'
        an: Optional[Anomaly] = (
            db.query(Anomaly)
            .filter(Anomaly.endpoint_id == ep.id, Anomaly.metric_type == "latency")
            .first()
        )
        details = {"mean": metrics["mean"], "std": metrics["std"], "count": metrics["count"], "latest": metrics["latest"]}
        if an:
            an.score = score
            an.is_anomalous = is_anom
            an.details = details
            an.detected_at = datetime.utcnow()
            db.add(an)
            db.commit()
            db.refresh(an)
            state = "updated"
        else:
            an = Anomaly(
                endpoint_id=ep.id,
                metric_type="latency",
                score=score,
                is_anomalous=is_anom,
                details=details,
                detected_at=datetime.utcnow(),
            )
            db.add(an)
            db.commit()
            db.refresh(an)
            state = "created"
        results.append({"endpoint_id": ep.id, "status": state, "is_anomalous": is_anom, "score": score})
    return results
