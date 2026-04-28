from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "LedgerFlow"
    app_env: str = "development"
    secret_key: str = "changeme"
    access_token_expire_minutes: int = 60

    # Database
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/ledgerai"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""


    # AI
    openai_api_key:    str = ""
    openai_model:      str = "gpt-4o"
    gemini_api_key:    str = ""
    gemini_model:      str = "gemini-1.5-pro"
    anthropic_api_key: str = ""

    # AWS
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-2"
    s3_bucket_name: str = "novala-documents"

    # SendGrid
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = ""
    sendgrid_from_name: str = "LedgerFlow"

    # CORS
    allowed_origins: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()