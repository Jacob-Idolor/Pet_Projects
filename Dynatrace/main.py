from fastapi import FastAPI
from app.api import problems, audit_logs
from app.core.config import settings
from app.core.dt_client import dynalink
from fastapi.staticfiles import StaticFiles
app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static/"), name="static")
app.mount("/css", StaticFiles(directory="app/static/css"), name="css")

@app.get("/")
def read_root():
    return {"message": "Dynatrace Self-Service Tower Running"}

app.include_router(problems.router)
app.include_router(audit_logs.router)

