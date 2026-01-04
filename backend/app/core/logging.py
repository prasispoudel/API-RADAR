import logging
from pythonjsonlogger import jsonlogger
from typing import Optional
import contextvars


# Context variable for request id so logs can include it per-request
request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="")


class RequestIDFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            rid = request_id_var.get()
        except Exception:
            rid = ""
        setattr(record, "request_id", rid)
        return True


def configure_logging(level: Optional[str] = "INFO"):
    log_level = getattr(logging, level.upper() if isinstance(level, str) else "INFO")
    fmt = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')

    handler = logging.StreamHandler()
    handler.setFormatter(fmt)
    # attach request id filter so every record has `request_id`
    handler.addFilter(RequestIDFilter())

    root = logging.getLogger()
    # Clear existing handlers to avoid duplicate logs in some environments
    if root.handlers:
        root.handlers = []
    root.setLevel(log_level)
    root.addHandler(handler)

    # Configure uvicorn/access logs
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(name)
        logger.handlers = []
        logger.setLevel(log_level)
        logger.addHandler(handler)

    # FastAPI/Starlette logger
    logging.getLogger("fastapi").handlers = []
    logging.getLogger("fastapi").setLevel(log_level)
    logging.getLogger("fastapi").addHandler(handler)


def set_request_id(rid: str):
    try:
        request_id_var.set(rid)
    except Exception:
        pass


def get_request_id() -> str:
    try:
        return request_id_var.get()
    except Exception:
        return ""
