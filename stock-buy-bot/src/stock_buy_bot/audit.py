import json
import os
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Protocol


class AuditLogger(Protocol):
    def log_event(self, event_type: str, payload: dict[str, Any]) -> None:
        """Persist a structured audit event."""


class JsonLineAuditLogger:
    def __init__(self, path: Path):
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
            self._path.parent.mkdir(parents=True, exist_ok=True)
            with self._path.open("a", encoding="utf-8") as handle:
                handle.write(serialized)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())


class NullAuditLogger:
    def log_event(self, event_type: str, payload: dict[str, Any]) -> None:
        del event_type
        del payload
