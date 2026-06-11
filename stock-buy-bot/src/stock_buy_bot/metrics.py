from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.responses import Response


HTTP_REQUEST_COUNT = Counter(
    "stock_buy_bot_http_requests_total",
    "Total HTTP requests served by the application",
    ["method", "path", "status_code"],
)
HTTP_REQUEST_LATENCY_SECONDS = Histogram(
    "stock_buy_bot_http_request_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
)
TRADE_ORDER_COUNT = Counter(
    "stock_buy_bot_trade_orders_total",
    "Total trade orders processed",
    ["side", "result"],
)
AUDIT_SINK_FAILURE_COUNT = Counter(
    "stock_buy_bot_audit_sink_failures_total",
    "Audit sink failures and fallbacks",
    ["sink"],
)


def record_http_request(*, method: str, path: str, status_code: int, duration_seconds: float) -> None:
    HTTP_REQUEST_COUNT.labels(method=method, path=path, status_code=str(status_code)).inc()
    HTTP_REQUEST_LATENCY_SECONDS.labels(method=method, path=path).observe(duration_seconds)


def record_trade_result(*, side: str, result: str) -> None:
    TRADE_ORDER_COUNT.labels(side=side, result=result).inc()


def record_audit_sink_failure(*, sink: str) -> None:
    AUDIT_SINK_FAILURE_COUNT.labels(sink=sink).inc()


def metrics_response() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
