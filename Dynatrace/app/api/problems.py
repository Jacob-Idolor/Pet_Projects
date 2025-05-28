from fastapi import APIRouter, Request, HTTPException , Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.core.dt_client import get_problems, convert_epoch, dynalink
from app.core.config import settings

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
templates.env.filters["convert_epoch"] = convert_epoch  
templates.env.filters["dynalink"] = dynalink

# Register custom filter here
def dynalink(problem_id):
    return f"{settings.dynatrace_api_url}/ui/problems/{problem_id}"

templates.env.filters["dynalink"] = dynalink

from fastapi import HTTPException

@router.get("/problems", response_class=HTMLResponse)
def problems_view(
    request: Request,
    impact: str = Query(None, alias="impact"),
    status: str = Query(None, alias="status"),
    zone: str = Query(None, alias="zone")
):
    try:
        problems = get_problems()

        if not problems:
            return templates.TemplateResponse("problems.html", {
                "request": request,
                "problems": [],
                "message": "No problems found."
            })

        # Filtering
        if impact:
            problems = [p for p in problems if p.get("impactLevel") == impact]

        if status:
            problems = [p for p in problems if p.get("status") == status]

        if zone:
            problems = [
                p for p in problems
                if any(z.get("name") == zone for z in p.get("managementZones", []))
            ]

        return templates.TemplateResponse("problems.html", {
            "request": request,
            "problems": problems
        })

    except Exception as e:
        print("Error in /problems route:", e)
        raise HTTPException(status_code=500, detail="Problem fetching data")