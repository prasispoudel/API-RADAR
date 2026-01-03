from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.endpoint import EndpointRead, EndpointCreate
from app.services import endpoint_service
from app.services.project_service import get_project

router = APIRouter()


@router.get("/projects/{project_id}/endpoints", response_model=List[EndpointRead], tags=["endpoints"])
def list_project_endpoints(project_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return endpoint_service.list_endpoints(db, project_id, skip=skip, limit=limit)


@router.get("/endpoints/{endpoint_id}", response_model=EndpointRead, tags=["endpoints"])
def get_endpoint(endpoint_id: int, db: Session = Depends(get_db)):
    ep = endpoint_service.get_endpoint(db, endpoint_id)
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return ep


@router.post("/projects/{project_id}/endpoints", response_model=EndpointRead, status_code=status.HTTP_201_CREATED, tags=["endpoints"])
def create_endpoint(project_id: int, endpoint_in: EndpointCreate, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    ep = endpoint_service.upsert_endpoint(
        db,
        project_id=project_id,
        path=endpoint_in.path,
        method=endpoint_in.method,
        requires_auth=endpoint_in.requires_auth,
        source=endpoint_in.source,
    )
    return ep
