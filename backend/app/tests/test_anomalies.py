import importlib
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is on sys.path so imports like `app` resolve
THIS_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(THIS_DIR, "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.base import Base
from app.db.session import engine, get_db, SessionLocal
import importlib

# Import the FastAPI app (try both `main` and `backend.main` for flexibility)
try:
    main = importlib.import_module("main")
except Exception:
    main = importlib.import_module("backend.main")
from app.services import ml_service
from app.models.project import Project
from app.models.endpoint import Endpoint
from app.models.test_run_model import TestRun
from app.models.scan import Scan
from datetime import datetime, timedelta

app = getattr(main, "app")
client = TestClient(app)


def setup_module(module):
    Base.metadata.create_all(bind=engine)


def teardown_module(module):
    Base.metadata.drop_all(bind=engine)


def test_detect_latency_anomaly():
    db = SessionLocal()
    try:
        # create project
        p = Project(name="anomaly-project", base_url="http://example.com")
        db.add(p)
        db.commit()
        db.refresh(p)
        # create endpoint
        ep = Endpoint(project_id=p.id, path="/slow", method="GET")
        db.add(ep)
        db.commit()
        db.refresh(ep)
        # create a scan to associate test runs (scan_id is non-nullable)
        scan = Scan(project_id=p.id, status="completed", scan_type="manual")
        db.add(scan)
        db.commit()
        db.refresh(scan)

        # insert normal runs
        now = datetime.utcnow()
        for i in range(10):
            tr = TestRun(
                scan_id=scan.id,
                endpoint_id=ep.id,
                status_code=200,
                success=True,
                latency_ms=100 + i,
                response_size_bytes=500,
                validation_errors=None,
                timestamp=now - timedelta(minutes=10 + i),
            )
            db.add(tr)
        # insert an outlier run
        outlier = TestRun(
            scan_id=scan.id,
            endpoint_id=ep.id,
            status_code=200,
            success=True,
            latency_ms=2000,
            response_size_bytes=500,
            validation_errors=None,
            timestamp=now,
        )
        db.add(outlier)
        db.commit()
        # run detection
        results = ml_service.detect_anomalies(db, project_id=p.id, window=20, z_threshold=3.0)
        assert any(r["endpoint_id"] == ep.id for r in results)
        # fetch anomaly row
        # simpler: query by model class import
        from app.models.anomaly import Anomaly
        an = db.query(Anomaly).filter(Anomaly.endpoint_id == ep.id).first()
        assert an is not None
        assert an.is_anomalous is True or an.score is not None
    finally:
        db.close()
