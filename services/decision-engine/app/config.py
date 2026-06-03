import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # ── Veritabanı ────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///aeroagent.sqlite3"

    # ── Uygulama ──────────────────────────────────────────────────────────────
    APP_NAME: str = "JetNexus AI"
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_VERSION: str = "1.0.0"

    # ── Güvenlik / JWT ────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    AES_ENCRYPTION_KEY: str = os.getenv("AES_ENCRYPTION_KEY", "0123456789abcdef0123456789abcdef")
    JWT_EXPIRE_MINUTES: int = 480
    JWT_ALGORITHM: str = "HS256"

    # ── OpenAI (isteğe bağlı — boşsa Ollama veya kural tabanlı devreye girer) ─
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.1
    LLM_MAX_TOKENS: int = 4096

    # ── Ollama / Llama 3.2 (isteğe bağlı — yerel, ücretsiz) ─────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # ── Amadeus PSS (isteğe bağlı — boşsa mock veri) ─────────────────────────
    AMADEUS_CLIENT_ID: str = "sandbox_client_id"
    AMADEUS_CLIENT_SECRET: str = "sandbox_client_secret"

    # ── Cirium AODB (isteğe bağlı — boşsa mock veri) ─────────────────────────
    CIRIUM_APP_ID: str = "your_cirium_app_id"
    CIRIUM_APP_KEY: str = "your_cirium_app_key"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000,https://*.vercel.app,https://jetnexus.vercel.app"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def openai_configured(self) -> bool:
        return bool(self.OPENAI_API_KEY and not self.OPENAI_API_KEY.startswith("sk-proj-BURAYA"))

    @property
    def ollama_configured(self) -> bool:
        return self.OLLAMA_BASE_URL != ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
