from urllib.parse import urlparse
from typing import Optional
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate


def create_project(db: Session, project_in: ProjectCreate) -> Project:
    parsed = urlparse(project_in.base_url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("`base_url` must include a scheme and host, e.g. 'https://api.example.com'")

    project = Project(
        name=project_in.name,
        base_url=project_in.base_url,
        environment=project_in.environment,
        auth_type=project_in.auth_type,
        auth_config=project_in.auth_config,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, skip: int = 0, limit: int = 100, environment: Optional[str] = None):
    q = db.query(Project)
    if environment:
        q = q.filter(Project.environment == environment)
    return q.offset(skip).limit(limit).all()


def get_project(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()
