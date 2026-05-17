from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app import models


def sync_product_status(product: models.Product) -> None:
	if product.stock_quantity <= 0:
		product.status = models.ProductStatus.out_of_stock
	elif product.status == models.ProductStatus.out_of_stock:
		product.status = models.ProductStatus.active


def resolve_imported_at(imported_at: datetime | None) -> datetime:
	if imported_at is None:
		return datetime.now(timezone.utc)
	value = imported_at
	if value.tzinfo is None:
		value = value.replace(tzinfo=timezone.utc)
	now = datetime.now(timezone.utc)
	if value > now:
		raise ValueError("Thời điểm nhập không được vượt quá hiện tại")
	return value


def record_import(
	db: Session,
	*,
	product: models.Product,
	quantity: int,
	creator_id: int | None,
	note: str | None = None,
	imported_at: datetime | None = None,
) -> models.InventoryLog:
	if quantity <= 0:
		raise ValueError("quantity must be positive")
	product.stock_quantity += quantity
	sync_product_status(product)
	at = resolve_imported_at(imported_at)
	log = models.InventoryLog(
		product_id=product.id,
		creator_id=creator_id,
		change_type=models.StockChangeType.import_,
		quantity=quantity,
		note=note,
		imported_at=at,
	)
	db.add(log)
	return log
