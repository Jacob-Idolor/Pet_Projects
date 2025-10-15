"""FastAPI application entrypoint."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api import audit_logs, problems
from app.core.config import get_settings
from app.core.dt_client import reset_cached_client

logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Dynatrace Self-Service Tower",
        description="Surface Dynatrace problems and audit logs in a lightweight UI.",
        version="1.0.0",
    )

    app.mount("/static", StaticFiles(directory="app/static"), name="static")
    app.mount("/css", StaticFiles(directory="app/static/css"), name="css")

    @app.get("/", tags=["health"])
    def read_root() -> dict[str, str]:
        return {"message": "Dynatrace Self-Service Tower Running"}

    app.include_router(problems.router)
    app.include_router(audit_logs.router)

    @app.on_event("shutdown")
    def close_client() -> None:
        logger.debug("Shutting down Dynatrace client session")
        reset_cached_client()

    logger.info("Dynatrace application configured for %s", settings.base_url)
    return app


app = create_application()


__all__ = ["app", "create_application"]
