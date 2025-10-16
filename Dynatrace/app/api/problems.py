"""Endpoints for rendering Dynatrace problems."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.core.dt_client import convert_epoch, dynalink, get_dynatrace_client

router = APIRouter(tags=["problems"])

_templates = Jinja2Templates(directory="app/templates")
_templates.env.filters["convert_epoch"] = convert_epoch
_templates.env.filters["dynalink"] = dynalink


@router.get("/problems", response_class=HTMLResponse)
def problems_view(
    request: Request,
    impact: Optional[str] = Query(None, description="Filter by impact level"),
    status: Optional[str] = Query(None, description="Filter by problem status"),
    zone: Optional[str] = Query(None, description="Filter by management zone name"),
):
    """Render the problems template with optional filtering."""

    try:
        problems = get_dynatrace_client().list_problems()
    except RuntimeError as exc:  # pragma: no cover - exercised via integration tests
        raise HTTPException(status_code=502, detail="Failed to reach Dynatrace API") from exc

    filtered = problems
    if impact:
        filtered = [p for p in filtered if p.get("impactLevel") == impact]
    if status:
        filtered = [p for p in filtered if p.get("status") == status]
    if zone:
        filtered = [
            p
            for p in filtered
            if any(z.get("name") == zone for z in p.get("managementZones", []))
        ]

    context = {
        "request": request,
        "problems": filtered,
        "message": "No problems found." if not filtered else None,
        "impact": impact,
        "status": status,
        "zone": zone,
    }
    return _templates.TemplateResponse("problems.html", context)


__all__ = ["router"]
