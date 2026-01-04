from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import uuid
from typing import Callable
from app.core.logging import set_request_id


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Use incoming header if present, otherwise generate new UUID
        incoming = request.headers.get("x-request-id") or request.headers.get("X-Request-ID")
        if incoming:
            rid = incoming
        else:
            rid = str(uuid.uuid4())
        # set into logging context
        set_request_id(rid)
        # ensure response includes header
        response = await call_next(request)
        response.headers.setdefault("X-Request-ID", rid)
        return response
