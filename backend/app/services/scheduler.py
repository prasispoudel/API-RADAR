from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import SessionLocal
from app.models.project import Project
from app.services import ml_service
from app.services.rq_helper import get_queue
from app.core.config import settings

scheduler: Optional[object] = None


def _detect_all_projects():
    db: Session = SessionLocal()
    try:
        projects = db.query(Project).all()
        for p in projects:
            # Try to enqueue detection via RQ if available, otherwise run inline
            q = get_queue()
            if q is not None:
                try:
                    # include current request id metadata if present so worker logs can correlate
                    try:
                        from app.core.logging import get_request_id
                        rid = get_request_id()
                    except Exception:
                        rid = None
                    meta = {"request_id": rid} if rid else None
                    # use enqueue_job helper to attach request_id and handle fallbacks
                    from app.services.rq_helper import enqueue_job
                    enqueue_job("app.services.ml_service.detect_anomalies", p.id, job_timeout=600)
                except Exception:
                    # fall back to inline detection
                    try:
                        ml_service.detect_anomalies(db, project_id=p.id)
                    except Exception:
                        pass
            else:
                try:
                    ml_service.detect_anomalies(db, project_id=p.id)
                except Exception:
                    pass
    finally:
        db.close()


def start_scheduler(interval_seconds: int = 300):
    global scheduler
    if scheduler is not None:
        return scheduler
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.interval import IntervalTrigger
        # Try to use Redis jobstore when REDIS_URL set
        jobstores = None
        if hasattr(settings, "REDIS_URL") and settings.REDIS_URL:
            try:
                from apscheduler.jobstores.redis import RedisJobStore
                jobstores = {"default": RedisJobStore(host=settings.REDIS_URL)}
            except Exception:
                # redis jobstore not available; fall back
                jobstores = None

        if jobstores:
            scheduler = BackgroundScheduler(jobstores=jobstores)
        else:
            scheduler = BackgroundScheduler()

        scheduler.add_job(_detect_all_projects, IntervalTrigger(seconds=interval_seconds), next_run_time=datetime.utcnow())
        scheduler.start()
        return scheduler
    except Exception:
        # APScheduler not installed or failed to initialize; no-op scheduler
        scheduler = None
        return None


def stop_scheduler():
    global scheduler
    if scheduler:
        try:
            scheduler.shutdown()
        except Exception:
            pass
        scheduler = None
