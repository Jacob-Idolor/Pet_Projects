import json
import sqlite3
from contextlib import closing
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from stock_buy_bot.config import Settings
from stock_buy_bot.exceptions import (
    AuditLogError,
    StateStoreError,
    TradeRateLimitError,
    TradeReplayConflictError,
)


@dataclass(frozen=True)
class AuditEventRecord:
    timestamp: str
    event_type: str
    payload: dict[str, object]


class SQLiteStateStore:
    def __init__(self, path: Path):
        self._path = path

    def initialize(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with closing(self._connect()) as connection:
                connection.execute("PRAGMA journal_mode=WAL")
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS trade_replay_keys (
                        principal TEXT NOT NULL,
                        idempotency_key TEXT NOT NULL,
                        body_hash TEXT NOT NULL,
                        created_at REAL NOT NULL,
                        last_seen_at REAL NOT NULL,
                        PRIMARY KEY (principal, idempotency_key)
                    )
                    """
                )
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS trade_rate_limit_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        principal TEXT NOT NULL,
                        created_at REAL NOT NULL
                    )
                    """
                )
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS audit_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        payload_json TEXT NOT NULL
                    )
                    """
                )
                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_trade_rate_limit_events_principal_created_at
                    ON trade_rate_limit_events (principal, created_at)
                    """
                )
                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp
                    ON audit_events (timestamp DESC, id DESC)
                    """
                )
        except sqlite3.Error as exc:
            raise StateStoreError(f"Could not initialize SQLite state store at {self._path}") from exc

    def validate_trade_request(
        self,
        *,
        principal: str,
        idempotency_key: str,
        body_hash: str,
        now: datetime,
        settings: Settings,
    ) -> None:
        now_ts = now.timestamp()
        rate_cutoff = now_ts - float(settings.trade_rate_limit_window_seconds)
        replay_cutoff = now_ts - float(settings.trade_signature_ttl_seconds)

        try:
            with closing(self._connect()) as connection:
                connection.execute(
                    "DELETE FROM trade_rate_limit_events WHERE created_at < ?",
                    (rate_cutoff,),
                )
                connection.execute(
                    "DELETE FROM trade_replay_keys WHERE last_seen_at < ?",
                    (replay_cutoff,),
                )
                existing = connection.execute(
                    """
                    SELECT body_hash
                    FROM trade_replay_keys
                    WHERE principal = ? AND idempotency_key = ?
                    """,
                    (principal, idempotency_key),
                ).fetchone()

                if existing is not None:
                    if existing["body_hash"] != body_hash:
                        raise TradeReplayConflictError(
                            "Idempotency-Key was already used with a different request body"
                        )
                    connection.execute(
                        """
                        UPDATE trade_replay_keys
                        SET last_seen_at = ?
                        WHERE principal = ? AND idempotency_key = ?
                        """,
                        (now_ts, principal, idempotency_key),
                    )
                    return

                recent_count = connection.execute(
                    """
                    SELECT COUNT(*)
                    FROM trade_rate_limit_events
                    WHERE principal = ? AND created_at >= ?
                    """,
                    (principal, rate_cutoff),
                ).fetchone()[0]
                if recent_count >= settings.trade_rate_limit_requests:
                    raise TradeRateLimitError("Trade rate limit exceeded")

                connection.execute(
                    """
                    INSERT INTO trade_rate_limit_events (principal, created_at)
                    VALUES (?, ?)
                    """,
                    (principal, now_ts),
                )
                connection.execute(
                    """
                    INSERT INTO trade_replay_keys (
                        principal,
                        idempotency_key,
                        body_hash,
                        created_at,
                        last_seen_at
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (principal, idempotency_key, body_hash, now_ts, now_ts),
                )
        except (TradeRateLimitError, TradeReplayConflictError):
            raise
        except sqlite3.Error as exc:
            raise StateStoreError("Could not validate shared trade request state") from exc

    def append_audit_event(self, event_type: str, payload: dict[str, object]) -> AuditEventRecord:
        timestamp = datetime.now(UTC).isoformat()
        payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        try:
            with closing(self._connect()) as connection:
                connection.execute(
                    """
                    INSERT INTO audit_events (timestamp, event_type, payload_json)
                    VALUES (?, ?, ?)
                    """,
                    (timestamp, event_type, payload_json),
                )
        except sqlite3.Error as exc:
            raise AuditLogError("Could not persist audit event to SQLite") from exc
        return AuditEventRecord(
            timestamp=timestamp,
            event_type=event_type,
            payload=payload,
        )

    def list_recent_audit_events(self, *, limit: int) -> list[AuditEventRecord]:
        try:
            with closing(self._connect()) as connection:
                rows = connection.execute(
                    """
                    SELECT timestamp, event_type, payload_json
                    FROM audit_events
                    ORDER BY id DESC
                    LIMIT ?
                    """,
                    (limit,),
                ).fetchall()
        except sqlite3.Error as exc:
            raise StateStoreError("Could not load audit events from SQLite") from exc

        events: list[AuditEventRecord] = []
        for row in rows:
            try:
                payload = json.loads(row["payload_json"])
            except json.JSONDecodeError:
                continue
            if isinstance(payload, dict):
                events.append(
                    AuditEventRecord(
                        timestamp=row["timestamp"],
                        event_type=row["event_type"],
                        payload=payload,
                    )
                )
        return events

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._path, timeout=10.0, isolation_level=None)
        connection.row_factory = sqlite3.Row
        return connection
