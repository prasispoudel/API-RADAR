from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Use a synchronous SQLite URL by default for simple local development.
    DATABASE_URL: str = "sqlite:///./dev.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    BACKEND_CORS_ORIGINS: str | list[str] = "*"
    ENV: str = "dev"

    class Config:
        env_file = ".env"


settings = Settings()
