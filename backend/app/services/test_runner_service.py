from typing import List
from datetime import datetime
import time
from sqlalchemy.orm import Session

from app.models.scan import Scan
from app.models.test_run_model import TestRun
from app.models.project import Project
from app.models.endpoint import Endpoint
from app.services import endpoint_service


def start_scan(db: Session, project_id: int, scan_type: str = "quick") -> Scan:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise ValueError("Project not found")

    scan = Scan(project_id=project_id, status="running", scan_type=scan_type, started_at=datetime.utcnow())
    db.add(scan)
    db.commit()
    db.refresh(scan)

    try:
        run_scan(db, scan)
        scan.status = "completed"
    except Exception as e:
        scan.status = "failed"
        scan.summary = {"error": str(e)}
    finally:
        scan.finished_at = datetime.utcnow()
        db.add(scan)
        db.commit()
        db.refresh(scan)

    return scan


def run_scan(db: Session, scan: Scan) -> None:
    # lazy import httpx to avoid hard runtime deps at import time
    try:
        import httpx
    except Exception:
        raise RuntimeError("httpx is required to run scans")

    project = db.query(Project).filter(Project.id == scan.project_id).first()
    if not project:
        raise ValueError("Project not found")

    endpoints: List[Endpoint] = endpoint_service.list_endpoints(db, project.id)
    total = 0
    success = 0
    latencies = []

    for ep in endpoints:
        total += 1
        url = project.base_url.rstrip("/") + (ep.path if ep.path.startswith("/") else ("/" + ep.path))
        method = ep.method.upper() if ep.method else "GET"
        headers = {}
        # build simple request; auth handling can be added later
        start = time.perf_counter()
        status_code = None
        resp_size = None
        ok = False
        errors = None
        try:
            r = httpx.request(method, url, headers=headers, timeout=10.0)
            status_code = r.status_code
            resp_size = len(r.content) if r.content is not None else 0
            ok = 200 <= status_code < 400
            if ok:
                success += 1
            lat = (time.perf_counter() - start) * 1000.0
            latencies.append(lat)
        except Exception as e:
            lat = (time.perf_counter() - start) * 1000.0
            errors = str(e)
            latencies.append(lat)
        # create TestRun row
        tr = TestRun(
            scan_id=scan.id,
            endpoint_id=ep.id,
            status_code=status_code,
            success=ok,
            latency_ms=lat,
            response_size_bytes=resp_size,
            validation_errors={"error": errors} if errors else None,
            timestamp=datetime.utcnow(),
        )
        db.add(tr)
        db.commit()
        db.refresh(tr)

    avg_latency = sum(latencies) / len(latencies) if latencies else None
    summary = {
        "total_endpoints": total,
        "successes": success,
        "avg_latency_ms": avg_latency,
    }
    scan.summary = summary
    db.add(scan)
    db.commit()
    db.refresh(scan)
