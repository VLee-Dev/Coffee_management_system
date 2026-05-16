from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.database import get_db
from app.schemas_inventory import (
	InventoryAdjustIn,
	InventoryAdjustOut,
	InventoryLogListItem,
	InventoryLogOut,
)
from app.utils.security import require_admin

router = APIRouter(prefix="/inventory", tags=["inventory"])

LOW_STOCK_THRESHOLD = 10


def _sync_product_status(product: models.Product) -> None:
	if product.stock_quantity <= 0:
		product.status = models.ProductStatus.out_of_stock
	elif product.status == models.ProductStatus.out_of_stock:
		product.status = models.ProductStatus.active


def _resolve_imported_at(imported_at: date | None) -> datetime:
	if imported_at is None:
		return datetime.now(timezone.utc)
	if imported_at > date.today():
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Ngày nhập không được vượt quá ngày hiện tại",
		)
	return datetime.combine(imported_at, datetime.min.time(), tzinfo=timezone.utc)


@router.get("/logs", response_model=list[InventoryLogListItem])
def list_import_logs(
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
	change_type: models.StockChangeType | None = models.StockChangeType.import_,
	product_type: models.ProductType | None = None,
	limit: int = Query(default=50, ge=1, le=200),
):
	query = (
		db.query(models.InventoryLog)
		.options(
			joinedload(models.InventoryLog.product),
			joinedload(models.InventoryLog.creator),
		)
		.join(models.Product)
	)
	if change_type is not None:
		query = query.filter(models.InventoryLog.change_type == change_type)
	if product_type is not None:
		query = query.filter(models.Product.product_type == product_type)

	logs = (
		query.order_by(
			models.InventoryLog.imported_at.desc().nullslast(),
			models.InventoryLog.created_at.desc(),
		)
		.limit(limit)
		.all()
	)

	result: list[InventoryLogListItem] = []
	for log in logs:
		imported = log.imported_at or log.created_at
		result.append(
			InventoryLogListItem(
				id=log.id,
				product_id=log.product_id,
				product_name=log.product.name if log.product else "—",
				product_type=log.product.product_type.value if log.product else "",
				quantity=log.quantity,
				change_type=log.change_type.value,
				note=log.note,
				imported_at=imported,
				creator_name=log.creator.full_name if log.creator else None,
			)
		)
	return result


@router.post("/adjust", response_model=InventoryAdjustOut)
def adjust_stock(
	body: InventoryAdjustIn,
	db: Session = Depends(get_db),
	current_user: models.User = Depends(require_admin),
):
	product = db.query(models.Product).filter(models.Product.id == body.product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	if body.change_type == models.StockChangeType.import_:
		product.stock_quantity += body.quantity
	elif body.change_type == models.StockChangeType.export:
		if product.stock_quantity < body.quantity:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Insufficient stock for export",
			)
		product.stock_quantity -= body.quantity
	else:
		product.stock_quantity = body.quantity

	_sync_product_status(product)

	imported_at = _resolve_imported_at(body.imported_at)

	log = models.InventoryLog(
		product_id=product.id,
		creator_id=current_user.id,
		change_type=body.change_type,
		quantity=body.quantity,
		note=body.note,
		imported_at=imported_at,
	)
	db.add(log)
	db.commit()
	db.refresh(product)
	db.refresh(log)

	return InventoryAdjustOut(
		product_id=product.id,
		stock_quantity=product.stock_quantity,
		status=product.status.value,
		log=InventoryLogOut.model_validate(log),
	)
