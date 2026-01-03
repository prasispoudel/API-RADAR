Backend — File-by-file TODO

This file lists concrete backend files and responsibilities so a developer can start implementing the FastAPI service.

1. Project root: `/backend`

- `pyproject.toml` or `requirements.txt`
  - Add dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary` or `asyncpg`, `alembic`, `pydantic-settings`, `httpx`, `python-dotenv`, `scikit-learn` (for ML later).

- `main.py`
  - Create `FastAPI()` app with title/version.
  - Load settings from `app.core.config.get_settings()`.
  - Include routers: `app.routers.projects`, `app.routers.endpoints`, `app.routers.scans`, `app.routers.anomalies` (prefix `/api` or `/api/v1`).
  - Add CORS middleware using `BACKEND_CORS_ORIGINS`.
  - Add startup/shutdown events to test DB connectivity if helpful.

2. `app/core`

- `config.py`
  - Define `Settings(BaseSettings)` with fields: `DATABASE_URL: str`, `REDIS_URL: str | None`, `BACKEND_CORS_ORIGINS: list[str] | str`, `ENV: str = "dev"`.
  - Load `.env` and expose `get_settings()` singleton.

- `logging.py` (optional)
  - Configure root logger and `get_logger(name: str)`.

3. `app/db`

- `session.py`
  - Create SQLAlchemy engine from `settings.DATABASE_URL` (decide sync vs async early).
  - Define `SessionLocal = sessionmaker(...)`.
  - Provide `get_db()` dependency that yields a session and closes it.

- `base.py`
  - Import all models and expose `Base` and `Base.metadata` for Alembic and `create_all`.

4. `app/models` (create `__init__.py` to expose models)

- `project.py`
  - `Project` model with `id`, `name`, `base_url`, `environment`, `auth_type`, `auth_config` (JSON), `created_at`, `updated_at`.
  - Relationships: `endpoints`, `scans`.

- `endpoint.py`
  - `Endpoint` model with `id`, `project_id`, `path`, `method`, `requires_auth`, `source`, `last_seen_at`.
  - Relations: `project`, `test_runs`.
  - Unique constraint on (`project_id`, `path`, `method`).

- `scan.py`
  - `Scan` model with `id`, `project_id`, `status`, `scan_type`, `started_at`, `finished_at`, `summary` (JSON).
  - Relations: `project`, `test_runs`.

- `test_run.py`
  - `TestRun` model with `id`, `scan_id`, `endpoint_id`, `status_code`, `success`, `latency_ms`, `response_size_bytes`, `validation_errors` (JSON), `timestamp`.
  - Index on (`endpoint_id`, `timestamp`).

- `anomaly.py`
  - `Anomaly` model with `id`, `endpoint_id`, `metric_type`, `score`, `is_anomalous`, `details` (JSON), `detected_at`.

5. `app/schemas` (create `__init__.py` and per-model files)

- `project.py`
  - `ProjectBase`, `ProjectCreate`, `ProjectUpdate` (all optional fields), `ProjectRead` (id, created_at, updated_at, optional `latest_scan_summary`).

- `endpoint.py`
  - `EndpointRead` — include `id`, `path`, `method`, `requires_auth`, `source`, `last_seen_at`, `last_status_code`, `last_latency_ms` (optional).

- `scan.py`
  - `ScanCreate` (Literal `"full" | "quick"`), `ScanRead` with timestamps and `summary`.

- `test_run.py`
  - `TestRunRead` with metrics and `validation_errors`.

- `anomaly.py`
  - `AnomalyRead` with `metric_type`, `score`, `is_anomalous`, `details`, `detected_at`.

Use these as `response_model` and request bodies in routers.

6. `app/services`

- `__init__.py`
- `project_service.py` — `create_project`, `list_projects`, `get_project`, `update_project`.
- `discovery_service.py` — `discover_endpoints_for_project`, `discover_from_openapi`, `discover_by_crawling`, `discover_by_probing`.
- `test_runner_service.py` — `start_scan`, `run_scan` (record `TestRun` rows, update `Scan.summary`).
- `ml_service.py` — `compute_endpoint_metrics`, `detect_anomalies` (start with z-score, later Isolation Forest).

7. `app/routers`

- `__init__.py` to export routers.
- `projects.py` — POST/GET/PUT/trigger discovery/trigger scan. Use `Depends(get_db)`.
- `endpoints.py` — list and detail endpoints + recent TestRuns.
- `scans.py` — list scans and scan details.
- `anomalies.py` — list anomalies per project or endpoint.

8. `app/workers`

- `worker.py` (Celery or RQ setup)
  - Configure with `REDIS_URL`.
  - Tasks: `run_discovery_task(project_id)`, `run_scan_task(scan_id)`, `run_ml_task(project_id)`.
  - Tasks must create their own DB sessions and handle exceptions.

9. `app/utils`

- `http_client.py` — `send_request(url, method, headers, body, timeout)` returning `{status_code, latency_ms, body, size_bytes, error}`.
- `openapi_parser.py` — fetch/parse OpenAPI spec (JSON/YAML) and return operations list.
- `auth_utils.py` — build headers from `auth_type` and `auth_config`.

10. `app/tests`

- Unit tests for `discovery_service`, `test_runner_service`, `ml_service`.
- Integration test using `fastapi.testclient.TestClient` to create project and exercise endpoints.

Notes / Implementation order suggestion
- Start with `app/core/config.py`, `app/db/session.py`, `app/db/base.py`.
- Add models and Alembic `env` config next (or use `Base.metadata.create_all` for dev).
- Implement `project_service` + `projects` router to create/list projects.
- Implement `discovery_service` strategies incrementally (OpenAPI first).
- Implement `test_runner_service` and `worker` to run scans asynchronously.
- Add `ml_service` after `test_run` data exists.

This TODO file maps exactly to the file-by-file responsibilities you supplied. Use it as the canonical implementation checklist for `/backend`.