from collections.abc import Awaitable, Callable

from fastapi import Request, Response

from stock_buy_bot.config import Settings


def apply_security_headers(response: Response, settings: Settings) -> Response:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "font-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'; "
        "form-action 'self'"
    )

    if settings.environment != "dev":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


async def security_headers_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
    settings: Settings,
) -> Response:
    response = await call_next(request)
    return apply_security_headers(response=response, settings=settings)
