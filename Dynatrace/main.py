from fastapi import FastAPI
from app.api import problems
from app.core.config import settings
from fastapi.staticfiles import StaticFiles
app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static/"), name="static")
app.mount("/css", StaticFiles(directory="app/static/css"), name="css")

@app.get("/")
def read_root():
    return {"message": "Dynatrace Self-Service Tower Running"}

app.include_router(problems.router)

def dynalink(problem_id):
    return f"{settings.dynatrace_api_url}/ui/problems/{problem_id}"

