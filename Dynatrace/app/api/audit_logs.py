from datetime import datetime, timedelta, timezone
from fastapi import APIRouter

from app.core.dt_client import get_audit_logs

router = APIRouter()

@router.get("/audit-logs")
def audit_logs():
    """Return the last 24 hours of audit logs as JSON."""
    now = datetime.now(timezone.utc)
    start = int((now - timedelta(days=1)).timestamp() * 1000)
    end = int(now.timestamp() * 1000)

    logs = get_audit_logs(start, end)
    return logs or []
