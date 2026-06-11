import json
import os
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol

from stock_buy_bot.exceptions import AuditLogError
from stock_buy_bot.metrics import record_audit_sink_failure
from stock_buy_bot.state import StateStore


class AuditLogger(Protocol):
    def log_event(self, event_type: str, payload: dict[str, Any]) -> None:
        """Persist a structured audit event."""


class JsonLineAuditLogger:
    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = threading.Lock()

    def log_event(self, event_type: str, payload: dict[str, Any]) -> None:
        entry = {
            "timestamp": datetime.now(UTC).isoformat(),
            "event_type": event_type,
            **payload,
        }
        serialized = json.dumps(entry, sort_keys=True, separators=(",", ":"), default=str)

        with self._lock:
            try:
                self._path.parent.mkdir(parents=True, exist_ok=True)
                with self._path.open("a", encoding="utf-8") as handle:
                    handle.write(serialized)
                    handle.write("\n")
                    handle.flush()
                    os.fsync(handle.fileno())
            except OSError as exc:
                raise AuditLogError(f"Could not write audit log to {self._path}") from exc


class DatabaseAuditLogger:
    def __init__(self, state_store: StateStore) -> None:
        self._state_store = state_store

    def log_event(self, event_type: str, payload: dict[str, Any]) -> None:
        self._state_store.append_audit_event(event_type, payload)


SQLiteAuditLogger = DatabaseAuditLogger


class FallbackAuditLogger:
    def __init__(self, primary: AuditLogger, fallback: AuditLogger) -> None:
        self._primary = primary
        self._fallback = fallback

    def log_event(self, event_type: str, payload: dict[str, Any]) -> None:
        try:
            self._primary.log_event(event_type, payload)
            return
        except AuditLogError as primary_error:
            record_audit_sink_failure(sink="primary")
            try:
                self._fallback.log_event(event_type, payload)
            except AuditLogError as fallback_error:
                record_audit_sink_failure(sink="fallback")
                raise AuditLogError("Both audit sinks failed") from fallback_error
            raise AuditLogError("Primary audit sink failed; event was written to fallback sink") from primary_error


class NullAuditLogger:
    def log_event(self, event_type: str, payload: dict[str, Any]) -> None:
        del event_type
        del payload
