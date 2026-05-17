from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.database import get_db
from app.schemas_inventory import (
	InventoryAdjustIn,
	InventoryAdjustOut,
	InventoryLogListItem,
	InventoryLogOut,
	InventoryLogUpdate,
)
from app.utils.inventory import record_import, resolve_imported_at, sync_product_status
from app.utils.security import require_admin

router = APIRouter(prefix="/inventory", tags=["inventory"])


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


@router.patch("/logs/{log_id}", response_model=InventoryLogListItem)
def update_import_log(
	log_id: int,
	body: InventoryLogUpdate,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	log = (
		db.query(models.InventoryLog)
		.options(
			joinedload(models.InventoryLog.product),
			joinedload(models.InventoryLog.creator),
		)
		.filter(models.InventoryLog.id == log_id)
		.first()
	)
	if not log:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
	if log.change_type != models.StockChangeType.import_:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ sửa được bản ghi nhập hàng")

	product = log.product
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	update_data = body.model_dump(exclude_unset=True)
	if not update_data:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu cập nhật")

	if "quantity" in update_data:
		new_qty = update_data["quantity"]
		delta = new_qty - log.quantity
		if delta < 0 and product.stock_quantity < abs(delta):
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail="Không thể giảm số lượng nhập vì kho hiện tại không đủ",
			)
		product.stock_quantity += delta
		log.quantity = new_qty
		sync_product_status(product)

	if "note" in update_data:
		log.note = update_data["note"]

	if "imported_at" in update_data:
		try:
			log.imported_at = resolve_imported_at(update_data["imported_at"])
		except ValueError as exc:
			raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

	db.commit()
	db.refresh(log)

	imported = log.imported_at or log.created_at
	return InventoryLogListItem(
		id=log.id,
		product_id=log.product_id,
		product_name=product.name,
		product_type=product.product_type.value,
		quantity=log.quantity,
		change_type=log.change_type.value,
		note=log.note,
		imported_at=imported,
		creator_name=log.creator.full_name if log.creator else None,
	)


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_import_log(
	log_id: int,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	log = (
		db.query(models.InventoryLog)
		.options(joinedload(models.InventoryLog.product))
		.filter(models.InventoryLog.id == log_id)
		.first()
	)
	if not log:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
	if log.change_type != models.StockChangeType.import_:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Chỉ xóa được bản ghi nhập hàng")

	product = log.product
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	if product.stock_quantity < log.quantity:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Không thể xóa vì kho hiện tại nhỏ hơn số lượng đã nhập trong bản ghi này",
		)

	product.stock_quantity -= log.quantity
	sync_product_status(product)
	db.delete(log)
	db.commit()
	return None


@router.post("/adjust", response_model=InventoryAdjustOut)
def adjust_stock(
	body: InventoryAdjustIn,
	db: Session = Depends(get_db),
	current_user: models.User = Depends(require_admin),
):
	product = db.query(models.Product).filter(models.Product.id == body.product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	try:
		imported_at = resolve_imported_at(body.imported_at)
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

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

	sync_product_status(product)

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
