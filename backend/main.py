from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import projects
from app.routers import endpoints
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

app = FastAPI(title="API Test Tool - Backend")

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


@app.on_event("startup")
def on_startup():
    # In dev mode create tables automatically for convenience.
    if settings.ENV == "dev":
        Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health():
    return {"status": "ok"}
