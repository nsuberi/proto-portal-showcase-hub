"""Configuration settings for Code Dojo."""

import os
from dotenv import load_dotenv

load_dotenv()


def _build_database_uri():
    """Build database URI: prefer DATABASE_URL, fall back to individual env vars (ECS), then SQLite."""
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    db_host = os.getenv("DB_HOST")
    if db_host:
        db_user = os.getenv("DB_USER", "code_dojo_user")
        db_password = os.getenv("DB_PASSWORD", "")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "tsr_db")
        return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    return "sqlite:///code_dojo.db"


class Config:
    """Application configuration."""

    SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

    # GitHub API
    # With token: 5000 req/hr, without: 60 req/hr
    GITHUB_API_BASE = "https://api.github.com"
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", None)

    # PR Validation Settings
    PR_BASE_VALIDATION_STRICT = True  # Enforce base repo must match starter repo
    PR_CACHE_DURATION = 3600  # Cache PR metadata for 1 hour (future enhancement)

    # Debug mode
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"

    # Calendly scheduling
    CALENDLY_URL = os.getenv(
        "CALENDLY_URL", ""
    )  # e.g., https://calendly.com/instructor-name/30min

    # LangSmith configuration for tracing
    LANGCHAIN_TRACING_V2 = os.getenv("LANGCHAIN_TRACING_V2", "true")
    LANGCHAIN_API_KEY = os.getenv("LANGSMITH_API_KEY", "")
    LANGCHAIN_PROJECT = os.getenv("LANGCHAIN_PROJECT", "code-dojo")

    # OpenAI configuration for Whisper transcription
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", os.getenv("OPENAPI_KEY", ""))

    # Architectural Analysis configuration
    ARCH_ANALYSIS_ENABLED = os.getenv("ARCH_ANALYSIS_ENABLED", "true").lower() == "true"
    ARCH_ANALYSIS_TIMEOUT = int(os.getenv("ARCH_ANALYSIS_TIMEOUT", "30"))  # seconds
    ARCH_SKIP_SMALL_PRS = (
        os.getenv("ARCH_SKIP_SMALL_PRS", "true").lower() == "true"
    )  # Skip if <5 files
    ARCH_DETAIL_LEVEL = os.getenv("ARCH_DETAIL_LEVEL", "medium")  # basic/medium/deep
