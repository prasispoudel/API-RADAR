from typing import Optional
import os
from redis import Redis
from rq import Queue
from app.core.config import settings


_redis_conn: Optional[Redis] = None


def get_redis() -> Optional[Redis]:
    global _redis_conn
    if _redis_conn is not None:
        return _redis_conn
    url = getattr(settings, "REDIS_URL", None)
    if not url:
        return None
    try:
        _redis_conn = Redis.from_url(url)
        # quick ping to validate connection
        _redis_conn.ping()
        return _redis_conn
    except Exception:
        return None


def get_queue(name: str = "default") -> Optional[Queue]:
    r = get_redis()
    if r is None:
        return None
    return Queue(name, connection=r)


def enqueue_job(func, *args, queue_name: str = "default", **kwargs):
    """Helper to enqueue a job and automatically include request_id metadata if present.

    Usage: enqueue_job('module.path.func', arg1, arg2, queue_name='default', job_timeout=600)
    """
    q = get_queue(queue_name)
    if q is None:
        # No Redis/queue available; fall back to calling function directly
        # Attempt to import and call synchronously
        try:
            if isinstance(func, str):
                mod_name, fn_name = func.rsplit('.', 1)
                mod = __import__(mod_name, fromlist=[fn_name])
                fn = getattr(mod, fn_name)
            else:
                fn = func
            return fn(*args, **kwargs)
        except Exception:
            return None

    # gather request id if available
    try:
        from app.core.logging import get_request_id
        rid = get_request_id()
    except Exception:
        rid = None

    meta = kwargs.pop('meta', None) or {}
    if rid:
        meta['request_id'] = rid

    # enqueue with provided kwargs and meta
    try:
        return q.enqueue(func, *args, meta=meta if meta else None, **kwargs)
    except TypeError:
        # some RQ versions may not accept meta=None; pass meta only when non-empty
        if meta:
            return q.enqueue(func, *args, meta=meta, **kwargs)
        return q.enqueue(func, *args, **kwargs)
