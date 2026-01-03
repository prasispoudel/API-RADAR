API Test Tool — Architecture

Monorepo layout:
- /backend — FastAPI service (discovery, testing, ML)
- /frontend — React single-page app dashboard
- /infra — docker-compose, Dockerfiles, env examples
- /docs — design notes and API docs

Backend recommended structure:
- app/core, db, models, schemas, routers, services, workers, utils

Frontend recommended structure:
- src/app/routes, components, api, state, utils

Infra:
- docker-compose to orchestrate backend, frontend, Postgres, Redis

Design rationale: separation of concerns, easy extension, and deployability.
