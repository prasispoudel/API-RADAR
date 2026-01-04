import importlib
import os
import sys

# Ensure backend package on sys.path
THIS_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(THIS_DIR, "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.logging import get_request_id, set_request_id
from app.services import ml_service


class DummyJob:
    def __init__(self, meta):
        self.meta = meta


def test_apply_request_id_from_rq_job(monkeypatch):
    # ensure no request id initially
    set_request_id("")

    # patch rq.get_current_job to return a dummy job with meta
    def fake_get_current_job():
        return DummyJob({"request_id": "rq-12345"})

    monkeypatch.setitem(sys.modules, "rq", importlib.import_module("rq") if "rq" in sys.modules else None)

    # monkeypatch the get_current_job function in rq
    try:
        import rq
        monkeypatch.setattr(rq, "get_current_job", fake_get_current_job)
    except Exception:
        # If rq not installed, create a dummy module
        import types

        rq = types.SimpleNamespace()
        rq.get_current_job = fake_get_current_job
        sys.modules["rq"] = rq

    # call the helper indirectly via detect_anomalies (it will call the helper and set request id)
    # We don't want to run DB logic; call the helper directly
    ml_service._apply_request_id_from_rq_job()

    assert get_request_id() == "rq-12345"
