"""
Simple RQ worker runner for local development.
Run with: `python worker.py` (requires `redis` and `rq` installed and Redis available)
This will start a worker listening to the default queue.
"""
import logging
from rq import Worker, Queue, Connection
from rq.job import Job
from app.services.rq_helper import get_redis
from app.core.logging import set_request_id

logger = logging.getLogger(__name__)


class LoggingWorker(Worker):
    """Custom worker that logs job metadata and sets request_id from job meta."""

    def perform_job(self, job: Job, queue):
        """Override perform_job to inject logging context before job execution."""
        # extract and log job metadata
        meta = getattr(job, 'meta', {})
        rid = meta.get('request_id') if meta else None
        if rid:
            set_request_id(rid)
            logger.info(f"Starting job {job.id} with request_id={rid}")
        else:
            logger.info(f"Starting job {job.id} (no request_id)")
        
        # call parent implementation
        return super().perform_job(job, queue)


def run_worker():
    r = get_redis()
    if r is None:
        print("Redis connection not available. Set REDIS_URL in environment.")
        return
    with Connection(r):
        qs = ["default"]
        worker = LoggingWorker(map(Queue, qs))
        worker.work()


if __name__ == "__main__":
    run_worker()
