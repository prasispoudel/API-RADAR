import importlib
import os
import sys

# ensure backend in sys.path
THIS_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(THIS_DIR, "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.rq_helper import enqueue_job


def test_enqueue_job_no_redis(monkeypatch):
    # simulate no redis by patching get_queue to return None
    import app.services.rq_helper as helper

    monkeypatch.setattr(helper, "get_queue", lambda name='default': None)

    # define a simple function to be called synchronously
    def add(a, b):
        return a + b

    res = enqueue_job(add, 2, 3)
    assert res == 5

    # also test string import path
    res2 = enqueue_job('app.tests.test_enqueue_helper.add_local', 4, 5)
    # add_local will be created below in module scope
    assert res2 == 9


def add_local(a, b):
    return a + b
