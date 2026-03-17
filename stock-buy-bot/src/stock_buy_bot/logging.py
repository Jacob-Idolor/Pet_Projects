import logging
from typing import Any

try:
    import structlog
except ImportError:
    structlog = None


def configure_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    if structlog is None:
        return

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


class BoundLogger:
    def info(self, event: str, **kwargs: Any) -> None:
        raise NotImplementedError


class StdlibBoundLogger(BoundLogger):
    def __init__(self, name: str):
        self._logger = logging.getLogger(name)

    def info(self, event: str, **kwargs: Any) -> None:
        if kwargs:
            self._logger.info("%s %s", event, kwargs)
        else:
            self._logger.info("%s", event)


def get_logger(name: str) -> BoundLogger:
    if structlog is not None:
        return structlog.get_logger(name)
    return StdlibBoundLogger(name)
