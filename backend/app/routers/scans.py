from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.scan import ScanCreate, ScanRead
from app.schemas.test_run import TestRunRead
from app.services import test_runner_service
from app.services.project_service import get_project
from app.models.scan import Scan
from app.models.test_run_model import TestRun

router = APIRouter()


@router.post("/projects/{project_id}/scans", response_model=ScanRead, status_code=status.HTTP_201_CREATED, tags=["scans"])
def create_scan(project_id: int, scan_in: ScanCreate, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        scan = test_runner_service.start_scan(db, project_id, scan_type=scan_in.scan_type)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return scan


@router.get("/projects/{project_id}/scans", response_model=List[ScanRead], tags=["scans"])
def list_scans(project_id: int, db: Session = Depends(get_db)):
    scans = db.query(Scan).filter(Scan.project_id == project_id).all()
    return scans


@router.get("/scans/{scan_id}", response_model=ScanRead, tags=["scans"])
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/scans/{scan_id}/runs", response_model=List[TestRunRead], tags=["scans"])
def get_scan_runs(scan_id: int, db: Session = Depends(get_db)):
    runs = db.query(TestRun).filter(TestRun.scan_id == scan_id).order_by(TestRun.timestamp.desc()).all()
    return runs
