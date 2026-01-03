from fastapi import FastAPI

from app.routers import projects

app = FastAPI(title="API Test Tool - Backend")

app.include_router(projects.router, prefix="/projects", tags=["projects"])

@app.get("/health")
async def health():
    return {"status": "ok"}
