import json
from dataclasses import dataclass
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path
from typing import Protocol

from sqlalchemy import (
    Column,
    Float,
    Integer,
    MetaData,
    PrimaryKeyConstraint,
    String,
    Table,
    Text,
    create_engine,
    delete,
    func,
    insert,
    select,
    update,
)
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import NullPool

from stock_buy_bot.config import Settings
from stock_buy_bot.exceptions import (
    AuditLogError,
    StateStoreError,
    TradeRateLimitError,
    TradeReplayConflictError,
)


metadata = MetaData()

trade_replay_keys = Table(
    "trade_replay_keys",
    metadata,
    Column("principal", String, nullable=False),
    Column("idempotency_key", String, nullable=False),
    Column("body_hash", String, nullable=False),
    Column("created_at", Float, nullable=False),
    Column("last_seen_at", Float, nullable=False),
    PrimaryKeyConstraint("principal", "idempotency_key"),
)

trade_rate_limit_events = Table(
    "trade_rate_limit_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("principal", String, nullable=False, index=True),
    Column("created_at", Float, nullable=False, index=True),
)

audit_events = Table(
    "audit_events",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("timestamp", String, nullable=False, index=True),
    Column("event_type", String, nullable=False),
    Column("payload_json", Text, nullable=False),
)


@dataclass(frozen=True)
class AuditEventRecord:
    timestamp: str
    event_type: str
    payload: dict[str, object]


class StateStore(Protocol):
    def initialize(self) -> None:
        """Create storage resources if they do not exist."""

    def validate_trade_request(
        self,
        *,
        principal: str,
        idempotency_key: str,
        body_hash: str,
        now: datetime,
        settings: Settings,
    ) -> None:
        """Validate idempotency and rate limits."""

    def append_audit_event(self, event_type: str, payload: dict[str, object]) -> AuditEventRecord:
        """Persist an audit event."""

    def list_recent_audit_events(self, *, limit: int) -> list[AuditEventRecord]:
        """Return recent audit events newest-first."""


class DatabaseStateStore:
    def __init__(self, database_url: str) -> None:
        self._database_url = database_url
        self._engine: Engine = create_engine(database_url, future=True, poolclass=NullPool)

    def initialize(self) -> None:
        try:
            metadata.create_all(self._engine)
        except SQLAlchemyError as exc:
            raise StateStoreError(
                f"Could not initialize database state store at {self._database_url}"
            ) from exc

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
            with self._engine.begin() as connection:
                connection.execute(
                    delete(trade_rate_limit_events).where(
                        trade_rate_limit_events.c.created_at < rate_cutoff
                    )
                )
                connection.execute(
                    delete(trade_replay_keys).where(trade_replay_keys.c.last_seen_at < replay_cutoff)
                )
                existing = connection.execute(
                    select(trade_replay_keys.c.body_hash).where(
                        trade_replay_keys.c.principal == principal,
                        trade_replay_keys.c.idempotency_key == idempotency_key,
                    )
                ).mappings().first()

                if existing is not None:
                    if existing["body_hash"] != body_hash:
                        raise TradeReplayConflictError(
                            "Idempotency-Key was already used with a different request body"
                        )
                    connection.execute(
                        update(trade_replay_keys)
                        .where(
                            trade_replay_keys.c.principal == principal,
                            trade_replay_keys.c.idempotency_key == idempotency_key,
                        )
                        .values(last_seen_at=now_ts)
                    )
                    return

                recent_count = connection.execute(
                    select(func.count())
                    .select_from(trade_rate_limit_events)
                    .where(
                        trade_rate_limit_events.c.principal == principal,
                        trade_rate_limit_events.c.created_at >= rate_cutoff,
                    )
                ).scalar_one()
                if recent_count >= settings.trade_rate_limit_requests:
                    raise TradeRateLimitError("Trade rate limit exceeded")

                connection.execute(
                    insert(trade_rate_limit_events).values(
                        principal=principal,
                        created_at=now_ts,
                    )
                )
                connection.execute(
                    insert(trade_replay_keys).values(
                        principal=principal,
                        idempotency_key=idempotency_key,
                        body_hash=body_hash,
                        created_at=now_ts,
                        last_seen_at=now_ts,
                    )
                )
        except (TradeRateLimitError, TradeReplayConflictError):
            raise
        except SQLAlchemyError as exc:
            raise StateStoreError("Could not validate shared trade request state") from exc

    def append_audit_event(self, event_type: str, payload: dict[str, object]) -> AuditEventRecord:
        timestamp = datetime.now(UTC).isoformat()
        payload_json = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        try:
            with self._engine.begin() as connection:
                connection.execute(
                    insert(audit_events).values(
                        timestamp=timestamp,
                        event_type=event_type,
                        payload_json=payload_json,
                    )
                )
        except SQLAlchemyError as exc:
            raise AuditLogError("Could not persist audit event to the shared store") from exc
        return AuditEventRecord(timestamp=timestamp, event_type=event_type, payload=payload)

    def list_recent_audit_events(self, *, limit: int) -> list[AuditEventRecord]:
        try:
            with self._engine.connect() as connection:
                rows = connection.execute(
                    select(
                        audit_events.c.timestamp,
                        audit_events.c.event_type,
                        audit_events.c.payload_json,
                    )
                    .order_by(audit_events.c.id.desc())
                    .limit(limit)
                ).mappings()
                records = rows.all()
        except SQLAlchemyError as exc:
            raise StateStoreError("Could not load audit events from the shared store") from exc

        events: list[AuditEventRecord] = []
        for row in records:
            try:
                payload = json.loads(row["payload_json"])
            except json.JSONDecodeError:
                continue
            if isinstance(payload, dict):
                events.append(
                    AuditEventRecord(
                        timestamp=str(row["timestamp"]),
                        event_type=str(row["event_type"]),
                        payload=payload,
                    )
                )
        return events


class SQLiteStateStore(DatabaseStateStore):
    def __init__(self, path: Path) -> None:
        self._path = path
        super().__init__(sqlite_database_url(path))


def sqlite_database_url(path: Path) -> str:
    return f"sqlite+pysqlite:///{path}"


def resolve_state_database_url(settings: Settings) -> str:
    if settings.state_database_url:
        return settings.state_database_url
    return sqlite_database_url(settings.state_db_path)


@lru_cache(maxsize=8)
def get_state_store_from_url(database_url: str) -> DatabaseStateStore:
    state_store = DatabaseStateStore(database_url)
    state_store.initialize()
    return state_store


def build_state_store(settings: Settings) -> DatabaseStateStore:
    return get_state_store_from_url(resolve_state_database_url(settings))
