import hashlib
import hmac
from dataclasses import dataclass
from datetime import UTC, datetime

from fastapi import Depends, Header, HTTPException, Request, status

from stock_buy_bot.config import Settings, get_settings
from stock_buy_bot.exceptions import StateStoreError, TradeRateLimitError, TradeReplayConflictError
from stock_buy_bot.state import StateStore, build_state_store


@dataclass(frozen=True)
class AuthenticatedTradeContext:
    principal: str
    idempotency_key: str
    timestamp: str
    signature: str


def get_state_store(settings: Settings) -> StateStore:
    return build_state_store(settings)


def build_trade_signature(*, secret: str, timestamp: str, body: bytes) -> str:
    payload = timestamp.encode("utf-8") + b"." + body
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256)
    return digest.hexdigest()


def authenticate_trade_request(
    *,
    settings: Settings,
    state_store: StateStore,
    body: bytes,
    trade_key: str,
    timestamp: str,
    signature: str,
    idempotency_key: str,
) -> AuthenticatedTradeContext:
    expected_key = settings.trade_api_key.get_secret_value()
    if not hmac.compare_digest(trade_key, expected_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid trade API key",
        )

    try:
        request_time = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid X-Trade-Timestamp header",
        ) from exc

    if request_time.tzinfo is None:
        request_time = request_time.replace(tzinfo=UTC)

    now = datetime.now(UTC)
    age_seconds = abs((now - request_time.astimezone(UTC)).total_seconds())
    if age_seconds > settings.trade_signature_ttl_seconds:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trade request signature has expired",
        )

    expected_signature = build_trade_signature(
        secret=settings.trade_signing_secret.get_secret_value(),
        timestamp=timestamp,
        body=body,
    )
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid trade request signature",
        )

    if not idempotency_key.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key header is required",
        )

    try:
        state_store.validate_trade_request(
            principal=trade_key,
            idempotency_key=idempotency_key.strip(),
            body_hash=hashlib.sha256(body).hexdigest(),
            now=now,
            settings=settings,
        )
    except TradeReplayConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except TradeRateLimitError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except StateStoreError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Trade request state store is unavailable",
        ) from exc

    return AuthenticatedTradeContext(
        principal=trade_key,
        idempotency_key=idempotency_key.strip(),
        timestamp=timestamp,
        signature=signature,
    )


async def verify_trade_request(
    request: Request,
    settings: Settings = Depends(get_settings),
    trade_key: str = Header(..., alias="X-Trade-Key"),
    timestamp: str = Header(..., alias="X-Trade-Timestamp"),
    signature: str = Header(..., alias="X-Trade-Signature"),
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
) -> AuthenticatedTradeContext:
    body = await request.body()
    return authenticate_trade_request(
        settings=settings,
        state_store=get_state_store(settings),
        body=body,
        trade_key=trade_key,
        timestamp=timestamp,
        signature=signature,
        idempotency_key=idempotency_key,
    )
