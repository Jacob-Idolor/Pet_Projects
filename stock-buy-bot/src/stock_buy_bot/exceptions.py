"""Custom exceptions for trading, audit, and broker workflows."""


class StockBuyBotError(Exception):
    """Base exception for the application."""


class BrokerLookupError(StockBuyBotError):
    """Raised when an existing broker order cannot be reconciled safely."""


class BrokerExecutionError(StockBuyBotError):
    """Raised when a broker request cannot be completed safely."""


class AuditLogError(StockBuyBotError):
    """Raised when append-only audit persistence fails."""


class StateStoreError(StockBuyBotError):
    """Raised when shared state persistence is unavailable."""


class TradeReplayConflictError(StockBuyBotError):
    """Raised when an idempotency key is reused with a different payload."""


class TradeRateLimitError(StockBuyBotError):
    """Raised when a principal exceeds the configured trade rate limit."""
