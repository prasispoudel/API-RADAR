from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.project import ProjectCreate, ProjectRead
from app.db.session import get_db
from app.services import project_service

router = APIRouter()


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED, tags=["projects"])
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    try:
        project = project_service.create_project(db, project_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return project


@router.get("/", response_model=List[ProjectRead], tags=["projects"])
def list_projects(skip: int = 0, limit: int = 100, environment: Optional[str] = None, db: Session = Depends(get_db)):
    projects = project_service.list_projects(db, skip=skip, limit=limit, environment=environment)
    return projects


@router.get("/{project_id}", response_model=ProjectRead, tags=["projects"])
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
