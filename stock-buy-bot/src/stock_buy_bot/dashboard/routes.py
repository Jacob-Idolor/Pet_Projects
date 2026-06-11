import json
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi import Request
from fastapi import Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from stock_buy_bot.dependencies import get_dashboard_service
from stock_buy_bot.dashboard_models import DashboardSummary
from stock_buy_bot.metrics import metrics_response
from stock_buy_bot.services.dashboard import DashboardService


router = APIRouter()

TEMPLATES = Jinja2Templates(directory=str(Path(__file__).resolve().parents[1] / "templates"))
@router.get("/", include_in_schema=False)
def root_redirect() -> RedirectResponse:
    return RedirectResponse(url="/dashboard", status_code=307)


@router.get("/dashboard", response_class=HTMLResponse)
def dashboard_page(
    request: Request,
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> HTMLResponse:
    dashboard_data = service.build_dashboard_summary()
    return TEMPLATES.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "request": request,
            "dashboard_data_json": json.dumps(dashboard_data.model_dump()),
            "portfolio_name": dashboard_data.portfolio_name,
        },
    )


@router.get("/api/dashboard/summary")
def dashboard_summary(
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> DashboardSummary:
    return service.build_dashboard_summary()


@router.get("/metrics", include_in_schema=False)
def metrics() -> Response:
    return metrics_response()
