"""Audit log endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException

from app.core.dt_client import get_dynatrace_client

router = APIRouter(tags=["audit-logs"])


@router.get("/audit-logs")
def audit_logs() -> list[dict]:
    """Return the last 24 hours of audit logs as JSON."""

    now = datetime.now(timezone.utc)
    start = int((now - timedelta(days=1)).timestamp() * 1000)
    end = int(now.timestamp() * 1000)

    try:
        return get_dynatrace_client().list_audit_logs(start, end)
    except RuntimeError as exc:  # pragma: no cover - exercised via integration tests
        raise HTTPException(status_code=502, detail="Failed to reach Dynatrace API") from exc


__all__ = ["router"]
