import importlib
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is on sys.path so imports like `app` and `backend.main` resolve
THIS_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(THIS_DIR, "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import the FastAPI app (try both `main` and `backend.main` for flexibility)
try:
    main = importlib.import_module("main")
except Exception:
    main = importlib.import_module("backend.main")

app = getattr(main, "app")

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.project import Project
from app.models.endpoint import Endpoint
from app.models.scan import Scan
from app.models.test_run_model import TestRun
from datetime import datetime, timedelta
from app.services.rq_helper import enqueue_job
from app.core.logging import set_request_id


def setup_module(module):
    # create tables for tests
    Base.metadata.create_all(bind=engine)


def teardown_module(module):
    # drop tables after tests to keep test runs idempotent
    Base.metadata.drop_all(bind=engine)


def test_project_create_list_and_discover():
    client = TestClient(app)

    # Create project
    resp = client.post(
        "/projects",
        json={
            "name": "Integration Demo",
            "base_url": "https://example.com",
        },
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "id" in body
    project_id = body["id"]

    # List projects
    resp = client.get("/projects")
    assert resp.status_code == 200
    projects = resp.json()
    assert any(p["id"] == project_id for p in projects)

    # Trigger discovery (sync stub)
    resp = client.post(f"/projects/{project_id}/discover")
    assert resp.status_code == 200, resp.text
    summary = resp.json()
    assert summary.get("project_id") == project_id
    assert "added" in summary and "updated" in summary

    # Verify endpoints exist (discovery adds at least /health in stub)
    resp = client.get(f"/projects/{project_id}/endpoints")
    assert resp.status_code == 200
    endpoints = resp.json()
    assert isinstance(endpoints, list)
    # Expect at least one endpoint from discovery
    assert len(endpoints) >= 1


def test_integration_enqueue_and_detect(monkeypatch):
    """End-to-end test: create project/endpoints/runs, enqueue detection, verify fallback."""
    db = SessionLocal()
    try:
        # create project, endpoint, scan, and test runs
        p = Project(name="int-proj", base_url="http://example.com")
        db.add(p)
        db.commit()
        db.refresh(p)

        ep = Endpoint(project_id=p.id, path="/api", method="GET")
        db.add(ep)
        db.commit()
        db.refresh(ep)

        scan = Scan(project_id=p.id, status="completed", scan_type="manual")
        db.add(scan)
        db.commit()
        db.refresh(scan)

        # insert normal test runs
        now = datetime.utcnow()
        for i in range(5):
            tr = TestRun(
                scan_id=scan.id,
                endpoint_id=ep.id,
                status_code=200,
                success=True,
                latency_ms=100 + i,
                response_size_bytes=500,
                validation_errors=None,
                timestamp=now - timedelta(minutes=5 + i),
            )
            db.add(tr)
        db.commit()

        # set a request id
        set_request_id("integration-rid-123")

        # enqueue detection job (will fall back to sync if no Redis)
        # patch get_queue to return None so fallback is triggered
        import app.services.rq_helper as helper
        monkeypatch.setattr(helper, "get_queue", lambda name='default': None)

        # when enqueue_job falls back to sync, it calls detect_anomalies(project_id, window, z_threshold)
        # but detect_anomalies signature expects (db, project_id, ...) so we need to pass db
        result = enqueue_job("app.services.ml_service.detect_anomalies", db, p.id, window=10, z_threshold=3.0)

        # result should be a list (since detect_anomalies returns a list)
        assert isinstance(result, list)
        # should have processed endpoint
        assert any(r["endpoint_id"] == ep.id for r in result)

    finally:
        db.close()
