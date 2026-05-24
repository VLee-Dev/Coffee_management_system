from __future__ import annotations

import random
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app import models
from app.utils.inventory import sync_product_status


def generate_order_code() -> str:
	ts = datetime.now(timezone.utc).strftime("%y%m%d%H%M%S")
	return f"MEO-{ts}-{random.randint(100, 999)}"


def record_export(
	db: Session,
	*,
	product: models.Product,
	quantity: int,
	creator_id: int | None,
	note: str | None = None,
) -> models.InventoryLog:
	if quantity <= 0:
		raise ValueError("quantity must be positive")
	if product.stock_quantity < quantity:
		raise ValueError(f"Không đủ tồn kho cho {product.name}")
	product.stock_quantity -= quantity
	product.total_units_sold = (product.total_units_sold or 0) + quantity
	sync_product_status(product)
	log = models.InventoryLog(
		product_id=product.id,
		creator_id=creator_id,
		change_type=models.StockChangeType.export,
		quantity=quantity,
		note=note,
		imported_at=datetime.now(timezone.utc),
	)
	db.add(log)
	return log


def restore_export(
	db: Session,
	*,
	product: models.Product,
	quantity: int,
	creator_id: int | None,
	note: str | None = None,
) -> models.InventoryLog:
	if quantity <= 0:
		raise ValueError("quantity must be positive")
	product.stock_quantity += quantity
	product.total_units_sold = max(0, (product.total_units_sold or 0) - quantity)
	sync_product_status(product)
	log = models.InventoryLog(
		product_id=product.id,
		creator_id=creator_id,
		change_type=models.StockChangeType.import_,
		quantity=quantity,
		note=note or "Hoàn kho do hủy đơn",
		imported_at=datetime.now(timezone.utc),
	)
	db.add(log)
	return log
