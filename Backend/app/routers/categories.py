from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[dict])
def list_categories(db: Session = Depends(get_db)) -> list[dict]:
    cats = db.query(models.Category).order_by(models.Category.id).all()
    return [{"id": c.id, "name": c.name, "description": c.description} for c in cats]
