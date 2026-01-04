Backend (FastAPI) scaffold

Structure:
- main.py: FastAPI entrypoint
- app/core: settings
- app/routers: route modules

Next: implement models, schemas, services, and workers.

## Running the backend locally

- From the `backend` directory run:

```bash
uvicorn main:app --reload
```

## Background worker (Redis + RQ)

For production-like background processing use Redis + RQ. Set `REDIS_URL` in your `.env` or environment (e.g. `redis://localhost:6379/0`).

Start a worker:

```bash
pip install rq redis
python worker.py
```

The scheduler will attempt to enqueue anomaly detection jobs into Redis when available. If Redis is not reachable the scheduler falls back to running detection inline.

You can run Redis locally with Docker Compose from the `infra` directory:

```bash
cd infra
docker compose up -d redis
```

## Database migrations (Alembic)

Alembic is configured to use the application's SQLAlchemy metadata. To create and apply migrations:

1. Install Alembic (if not already):

```bash
pip install alembic
```

2. Create an autogenerate revision (run from the `backend` directory):

```bash
alembic revision --autogenerate -m "initial"
```

3. Apply migrations:

```bash
alembic upgrade head
```

If your database URL is not the default `sqlite:///./dev.db`, set it in `alembic.ini` or ensure `BACKEND_ENV` / application settings provide the correct `DATABASE_URL`.

## Logging

The backend uses structured JSON logs by default. You can control the log level with the `LOG_LEVEL` environment variable (e.g. `INFO`, `DEBUG`). Logs are written to stdout in JSON format so they integrate with log collectors.

Example to run with debug logs:

```bash
LOG_LEVEL=DEBUG uvicorn main:app --reload
```

Request ID header

Request ID header

The app attaches a per-request `X-Request-ID` header and includes it in structured logs as `request_id`. If the client provides `X-Request-ID` it will be preserved; otherwise the server generates a UUID. Use this header to correlate logs across services.

## OpenTelemetry Tracing

The backend is instrumented with OpenTelemetry for distributed tracing. To enable trace export, set the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable (e.g., to a Jaeger or Zipkin collector endpoint).

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
uvicorn main:app --reload
```

Traces will be exported to the configured endpoint via OTLP gRPC. Instrumentation includes FastAPI requests, SQLAlchemy queries, and Redis operations.
