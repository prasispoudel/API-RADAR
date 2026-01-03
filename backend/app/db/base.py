from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import models so Alembic can detect them via Base.metadata
from app.models import project, endpoint, scan, test_run, anomaly  # noqa: F401
