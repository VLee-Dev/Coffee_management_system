from fastapi import FastAPI

from app.database import Base, engine
from app.core.config import settings
from app import models  # noqa: F401


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)


@app.on_event("startup")
def create_tables() -> None:
	Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["system"])
def health_check():
	return {"status": "ok", "environment": settings.APP_ENV}

