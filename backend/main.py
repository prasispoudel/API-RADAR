from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import projects
from app.routers import endpoints
from app.routers import scans
from app.routers import anomalies
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.tracing import configure_tracing, instrument_app, instrument_sqlalchemy
from app.db.base import Base
from app.db.session import engine
from app.services import scheduler
from app.core.middleware import RequestIDMiddleware

configure_logging(settings.LOG_LEVEL if hasattr(settings, "LOG_LEVEL") else "INFO")
configure_tracing()

app = FastAPI(title="API Test Tool - Backend")

# Instrument app with OpenTelemetry
instrument_app(app)
instrument_sqlalchemy(engine)

# add request id middleware early
app.add_middleware(RequestIDMiddleware)

# Configure CORS
origins = []
if settings.BACKEND_CORS_ORIGINS == "*":
    origins = ["*"]
elif isinstance(settings.BACKEND_CORS_ORIGINS, str):
    origins = [o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",") if o.strip()]
else:
    origins = list(settings.BACKEND_CORS_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(endpoints.router)
app.include_router(scans.router)
app.include_router(anomalies.router)


@app.on_event("startup")
def on_startup():
    # In dev mode create tables automatically for convenience.
    if settings.ENV == "dev":
        Base.metadata.create_all(bind=engine)
    # start anomaly detection scheduler
    try:
        scheduler.start_scheduler()
    except Exception:
        pass


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("shutdown")
def on_shutdown():
    try:
        scheduler.stop_scheduler()
    except Exception:
        pass
