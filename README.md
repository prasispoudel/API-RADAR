Below is a detailed README you can paste and then adjust as the project evolves.

***

# API Radar

API Radar is an automated API endpoint discovery and testing platform. It scans a base URL to build a live inventory of REST endpoints, runs concurrent checks for availability and correctness, and (optionally) applies ML-based anomaly detection over historical API behavior.[1][2][3]

## Features

- **Automatic endpoint discovery** from:
  - OpenAPI/Swagger specifications (URL or uploaded file).  
  - Documentation pages and HTML crawling.  
  - Pattern-based probing of common REST paths (for “hidden” or undocumented endpoints).[4][5][6]

- **Automated API testing**
  - Concurrent HTTP requests to each discovered endpoint.  
  - Status code and availability checks.  
  - Basic contract validation when OpenAPI specs are available (status codes, content type, simple schema checks).[2][7]
  - Latency and response size measurement for each request.

- **Health and observability**
  - Per-endpoint history of test runs (status, latency, failures).  
  - Project-level summaries: number of endpoints, pass rate, slowest endpoints, most failing endpoints.  
  - Exportable results (planned) for further analysis.

- **ML-based anomaly detection (planned)**
  - Aggregation of historical metrics per endpoint (average latency, error rate, request count).  
  - Unsupervised anomaly detection to highlight unusual spikes in latency or failures.[3][8][9]
  - UI indicators for “risky” endpoints that deserve deeper testing.

- **Developer-friendly stack**
  - Backend: FastAPI + SQLAlchemy + PostgreSQL.  
  - Frontend: React SPA for dashboards and configuration.  
  - Background workers for long-running discovery, scan, and ML tasks.

## Architecture

API Radar is organized as a full-stack application with clear separation of concerns:

- **Backend (FastAPI)**  
  - `core/`: configuration and environment settings.  
  - `db/`: database sessions and migrations.  
  - `models/`: SQLAlchemy models (`Project`, `Endpoint`, `Scan`, `TestRun`, `Anomaly`).  
  - `schemas/`: Pydantic models for request/response validation.  
  - `services/`: business logic for projects, discovery, scanning, and ML.  
  - `routers/`: HTTP endpoints for projects, endpoints, scans, and anomalies.  
  - `workers/`: background tasks for discovery, scans, and anomaly detection.[10][11][12]

- **Database (PostgreSQL)**  
  - Relational storage for all domain entities, with JSONB fields for flexible data like `auth_config`, `scan.summary`, and validation errors.[11][13]

- **Frontend (React)**  
  - Projects view: create/configure projects, trigger discovery and scans.  
  - Endpoints view: browse discovered endpoints, filter by method/status.  
  - Endpoint detail: inspect recent test runs and anomalies.  
  - Scan history: see previous runs and their summaries.

## Getting Started

> Note: Commands and paths below are illustrative; adjust to your final structure and tooling.

### Prerequisites

- Python 3.11+  
- Node.js (for the React frontend)  
- PostgreSQL 14+  
- Redis (or another broker) for background jobs (optional but recommended).[14][11]

### Backend setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/api-radar.git
cd api-radar/backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Configure environment variables (e.g. in `.env`):

```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/api_radar
REDIS_URL=redis://localhost:6379/0
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://localhost:3000"]
ENV=dev
```

Run migrations or create tables (depending on how you wire Alembic):

```bash
alembic upgrade head
```

Start the backend server:

```bash
uvicorn main:app --reload
```

The API docs should be available at:

- `http://localhost:8000/docs` (Swagger UI)  
- `http://localhost:8000/redoc` (ReDoc)

### Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Then open the printed URL (e.g. `http://localhost:5173`) in your browser.

## Usage

1. **Create a project**
   - In the UI, create a new project with:
     - Base URL of the target API.  
     - Environment (dev/staging/prod).  
     - Optional OpenAPI/Swagger URL or file.  
     - Optional authentication configuration (headers, bearer token, API key).

2. **Discover endpoints**
   - Click “Discover endpoints” for the project.  
   - API Radar crawls the base URL, parses docs/specs, and probes common paths to build an endpoint inventory.

3. **Run a scan**
   - Choose “Quick scan” (subset of endpoints) or “Full scan” (all endpoints).  
   - The backend enqueues a scan job, which sends HTTP requests to each endpoint, records results, and computes a summary.

4. **Inspect results**
   - View endpoints table, filter by method or last status.  
   - Open an endpoint detail page to see recent test runs and metrics.  
   - Check scan history for overall health trends.

5. **Anomalies (when ML is implemented)**
   - Enable anomaly detection for a project.  
   - Review flagged endpoints with abnormal latency or error behavior and prioritize them for further testing.

## Roadmap

- [ ] Implement advanced schema validation against OpenAPI (deep JSON schema checks).  
- [ ] Add authenticated scan scheduling (e.g. nightly scans).  
- [ ] Improve anomaly detection with time-series models and richer feature sets.  
- [ ] Add export to JSON/CSV and simple PDF reports.  
- [ ] Provide Docker-based one-command setup (backend + frontend + DB + worker).

## License

MIT (or your chosen license)

# API Radar (Backend)

API Radar is a FastAPI + PostgreSQL backend that performs pattern-based probing of common REST endpoints for a given base URL, recording availability, status codes, response times, and basic response structure. Projects can include optional authentication (API key header or Bearer token), and scan histories are persisted for later review.

## Features (current)

- Pattern-based endpoint probing of common REST paths (e.g., auth, users, admin)
- Async HTTP checks (availability, status code, latency)
- Basic response shape check (JSON object/array)
- Per-project configuration (base URL, auth headers)
- Persistence of scan/test results in PostgreSQL

## Not Implemented (yet)

- OpenAPI/Swagger parsing
- Documentation crawling
- ML-based anomaly detection
- React/frontend UI
- Docker or docker-compose setup
- Background workers / Redis queue

## Tech Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- HTTP client for probing (async)

## Setup

Prerequisites:
- Python 3.11+
- PostgreSQL running and reachable

Steps:
```bash
git clone https://github.com/<your-username>/api-radar.git
cd api-radar
python -m venv .venv
. .venv/Scripts/activate    # Windows
pip install -r requirements.txt
```

Set environment (example):
```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/api_radar
```

Create the database (if not existing):
```sql
CREATE DATABASE api_radar;
```

Start the API:
```bash
uvicorn main:app --reload
```

API docs:
- http://localhost:8000/docs
- http://localhost:8000/redoc

## Usage (high level)

1) Create or choose a project with a base URL and optional auth (API key header or Bearer token).
2) Trigger a scan to probe common endpoints for that project.
3) Retrieve stored results to review status codes and latencies.

## Roadmap

- OpenAPI/Swagger-based discovery and validation
- Documentation crawling for endpoint discovery
- Scheduled scans and richer reporting/export
- ML-based anomaly detection on historical metrics
- React frontend dashboard
- Docker-based one-command setup

## License

MIT (or your chosen license)



