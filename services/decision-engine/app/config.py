from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "jetnexus"
    POSTGRES_USER: str = "jetnexus"
    POSTGRES_PASSWORD: str = "jetnexus_secret_2024"
    
    # Can be overridden by DATABASE_URL env var
    DATABASE_URL: str = "sqlite+aiosqlite:///aeroagent.sqlite3"
    
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://localhost:6379/0"
    
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_FLIGHT_EVENTS_TOPIC: str = "flight-events"
    KAFKA_NOTIFICATION_TOPIC: str = "notifications"
    KAFKA_CONSUMER_GROUP: str = "jetnexus-decision"
    
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 4096
    
    NOTIFICATION_SERVICE_URL: str = "http://localhost:8001"
    INGESTION_SERVICE_URL: str = "http://localhost:8002"
    
    APP_NAME: str = "JetNexus AI"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_VERSION: str = "1.0.0"
    
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    AES_ENCRYPTION_KEY: str = "0123456789abcdef0123456789abcdef"
    API_KEY: str = "jetnexus-api-key-dev"
    
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000"
    
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
