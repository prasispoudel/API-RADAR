FROM python:3.11-slim
WORKDIR /app
COPY ./backend /app
RUN pip install --no-cache-dir "fastapi[all]" uvicorn SQLAlchemy httpx alembic
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
