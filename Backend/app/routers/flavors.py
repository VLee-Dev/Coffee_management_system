from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.database import get_db
from app.schemas_flavor import FlavorGroupOut, FlavorTagBrief, FlavorTagCreate, FlavorTagOut
from app.utils.security import require_admin

router = APIRouter(prefix="/flavors", tags=["flavors"])


@router.get("/catalog", response_model=list[FlavorGroupOut])
def list_flavor_catalog(db: Session = Depends(get_db)):
	groups = (
		db.query(models.FlavorGroup)
		.options(joinedload(models.FlavorGroup.tags))
		.order_by(models.FlavorGroup.sort_order, models.FlavorGroup.name)
		.all()
	)
	result: list[FlavorGroupOut] = []
	for group in groups:
		tags = sorted(group.tags, key=lambda t: t.name.lower())
		result.append(
			FlavorGroupOut(
				id=group.id,
				name=group.name,
				sort_order=group.sort_order,
				tags=[FlavorTagBrief.model_validate(t) for t in tags],
			)
		)
	return result


@router.post("/tags", response_model=FlavorTagOut, status_code=status.HTTP_201_CREATED)
def create_flavor_tag(
	body: FlavorTagCreate,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	group = db.query(models.FlavorGroup).filter(models.FlavorGroup.id == body.group_id).first()
	if not group:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flavor group not found")

	name = body.name.strip()
	if not name:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tên tag không hợp lệ")

	existing = (
		db.query(models.ProductTag)
		.filter(models.ProductTag.group_id == body.group_id, models.ProductTag.name == name)
		.first()
	)
	if existing:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tag đã tồn tại trong nhóm này")

	tag = models.ProductTag(group_id=body.group_id, name=name)
	db.add(tag)
	db.commit()
	db.refresh(tag)

	return FlavorTagOut(
		id=tag.id,
		name=tag.name,
		group_id=tag.group_id,
		group_name=group.name,
	)
