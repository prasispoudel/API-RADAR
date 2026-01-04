"""initial migration

Revision ID: 0001_initial
Revises: 
Create Date: 2026-01-04 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
import sys
import os

# ensure backend package importable
THIS_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(THIS_DIR, "..", ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.db.base import Base

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    # create all tables from SQLAlchemy metadata
    Base.metadata.create_all(bind=bind)


def downgrade():
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
