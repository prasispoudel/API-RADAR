from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services import ml_service
from app.models.anomaly import Anomaly
from app.models.endpoint import Endpoint
from app.schemas.anomaly import AnomalyRead
from app.services.project_service import get_project
from app.services.endpoint_service import get_endpoint

router = APIRouter()


@router.get("/projects/{project_id}/anomalies", response_model=List[AnomalyRead], tags=["anomalies"])
def list_project_anomalies(project_id: int, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    anomalies = (
        db.query(Anomaly)
        .join(Endpoint, Anomaly.endpoint_id == Endpoint.id)
        .filter(Endpoint.project_id == project_id, Anomaly.metric_type == "latency")
        .all()
    )
    return anomalies


@router.get("/endpoints/{endpoint_id}/anomalies", response_model=List[AnomalyRead], tags=["anomalies"])
def list_endpoint_anomalies(endpoint_id: int, db: Session = Depends(get_db)):
    ep = get_endpoint(db, endpoint_id)
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    anomalies = db.query(Anomaly).filter(Anomaly.endpoint_id == endpoint_id).all()
    return anomalies


@router.post("/projects/{project_id}/anomalies/compute", tags=["anomalies"])
def compute_project_anomalies(project_id: int, window: int = 30, z_threshold: float = 3.0, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    results = ml_service.detect_anomalies(db, project_id=project_id, window=window, z_threshold=z_threshold)
    return {"results": results}
