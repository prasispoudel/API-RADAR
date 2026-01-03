from typing import Optional
from sqlalchemy.orm import Session

from app.models.endpoint import Endpoint


def list_endpoints(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    return db.query(Endpoint).filter(Endpoint.project_id == project_id).offset(skip).limit(limit).all()


def get_endpoint(db: Session, endpoint_id: int) -> Optional[Endpoint]:
    return db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()


def upsert_endpoint(db: Session, project_id: int, path: str, method: str, requires_auth: bool = False, source: Optional[str] = None) -> Endpoint:
    ep = (
        db.query(Endpoint)
        .filter(Endpoint.project_id == project_id, Endpoint.path == path, Endpoint.method == method)
        .first()
    )
    if ep:
        ep.requires_auth = requires_auth
        ep.source = source
        db.add(ep)
        db.commit()
        db.refresh(ep)
        return ep

    ep = Endpoint(
        project_id=project_id,
        path=path,
        method=method,
        requires_auth=requires_auth,
        source=source,
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return ep
