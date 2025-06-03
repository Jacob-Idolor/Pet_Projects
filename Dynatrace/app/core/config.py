from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    dynatrace_api_url: str
    dynatrace_api_token: str

    class Config:
        env_file = ".env"

settings = Settings()
