from typing import Tuple
from sqlalchemy.orm import Session
from app.models.project import Project
from app.services import endpoint_service


def discover_from_openapi(db: Session, project: Project) -> Tuple[int, int]:
    """Attempt to fetch an OpenAPI JSON spec from common locations and upsert discovered operations.

    Returns (added, updated).
    """
    added = 0
    updated = 0

    candidates = ["/openapi.json", "/openapi.yaml", "/swagger.json", "/swagger.yaml"]
    base = project.base_url.rstrip("/")

    # import httpx lazily to avoid hard dependency at import time
    try:
        import httpx  # type: ignore
    except Exception:
        return added, updated

    for cand in candidates:
        url = f"{base}{cand}"
        try:
            resp = httpx.get(url, timeout=5.0)
            if resp.status_code != 200:
                continue
            # Try parse as JSON first
            try:
                spec = resp.json()
            except Exception:
                # YAML parsing could be added later; skip for now
                continue

            paths = spec.get("paths", {})
            for path, ops in paths.items():
                for method in ops.keys():
                    method_upper = method.upper()
                    ep, created = endpoint_service.upsert_endpoint(db, project.id, path, method_upper, requires_auth=False, source="openapi")
                    if created:
                        added += 1
                    else:
                        updated += 1
            # If we parsed a spec, stop trying other candidates
            break
        except Exception:
            continue

    return added, updated


def discover_by_crawling(db: Session, project: Project) -> Tuple[int, int]:
    """Placeholder for crawling-based discovery."""
    return 0, 0


def discover_by_probing(db: Session, project: Project) -> Tuple[int, int]:
    """Placeholder for probing-based discovery."""
    return 0, 0


def discover_endpoints_for_project(db: Session, project: Project) -> dict:
    added_total = 0
    updated_total = 0

    a, u = discover_from_openapi(db, project)
    added_total += a
    updated_total += u

    a, u = discover_by_crawling(db, project)
    added_total += a
    updated_total += u

    a, u = discover_by_probing(db, project)
    added_total += a
    updated_total += u

    # Fallback: if nothing discovered, ensure at least a simple health endpoint exists
    if added_total == 0 and updated_total == 0:
        ep, created = endpoint_service.upsert_endpoint(db, project.id, "/health", "GET", requires_auth=False, source="fallback")
        if created:
            added_total += 1
        else:
            updated_total += 1

    return {
        "project_id": project.id,
        "status": "completed",
        "added": added_total,
        "updated": updated_total,
    }
