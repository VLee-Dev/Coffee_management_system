"""Chọn sản phẩm cho Bộ sưu tập nổi bật: 2 coffee + 2 equipment theo lượt bán, random khi chưa bán / hòa, cho phép lặp khi thiếu."""

from __future__ import annotations

import random
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app import models

_TAG_LOAD = (
	joinedload(models.Product.tag_items)
	.joinedload(models.ProductTagItem.tag)
	.joinedload(models.ProductTag.group)
)


def _sold_subquery(db: Session):
	return (
		db.query(
			models.OrderItem.product_id.label("pid"),
			func.coalesce(func.sum(models.OrderItem.quantity), 0).label("sold"),
		)
		.join(models.Order, models.Order.id == models.OrderItem.order_id)
		.filter(models.Order.status != models.OrderStatus.cancelled)
		.group_by(models.OrderItem.product_id)
		.subquery()
	)


def _candidates_for_type(db: Session, product_type: models.ProductType, sold_sq) -> list[tuple[models.Product, int]]:
	rows = (
		db.query(models.Product, func.coalesce(sold_sq.c.sold, 0))
		.options(_TAG_LOAD)
		.outerjoin(sold_sq, models.Product.id == sold_sq.c.pid)
		.filter(models.Product.product_type == product_type)
		.filter(models.Product.status == models.ProductStatus.active)
		.all()
	)
	if not rows:
		prods = (
			db.query(models.Product)
			.options(_TAG_LOAD)
			.filter(models.Product.product_type == product_type)
			.order_by(models.Product.id.desc())
			.limit(100)
			.all()
		)
		return [(p, 0) for p in prods]
	return [(p, int(s or 0)) for p, s in rows]


def _pick_n_with_repeat(candidates: list[tuple[models.Product, int]], n: int) -> list[tuple[models.Product, int]]:
	if not candidates:
		return []
	# Điểm xếp hạng = lượt bán (đơn không hủy) + featured_boost (chỉnh tay sau này)
	weighted = [
		(p, sold, sold + int(getattr(p, "featured_boost", 0) or 0))
		for p, sold in candidates
	]
	max_score = max(t[2] for t in weighted)
	if max_score <= 0:
		pool = [(p, sold) for p, sold, _ in weighted]
		random.shuffle(pool)
		ordered = pool
	else:
		by_score: dict[int, list[tuple[models.Product, int]]] = {}
		for p, sold, score in weighted:
			by_score.setdefault(score, []).append((p, sold))
		ordered: list[tuple[models.Product, int]] = []
		for level in sorted(by_score.keys(), reverse=True):
			group = by_score[level][:]
			random.shuffle(group)
			ordered.extend(group)
	out: list[tuple[models.Product, int]] = []
	for i in range(n):
		out.append(ordered[i % len(ordered)])
	return out


def pick_featured_collection(db: Session) -> tuple[list[tuple[models.Product, int]], list[tuple[models.Product, int]]]:
	sold_sq = _sold_subquery(db)
	coffee_c = _candidates_for_type(db, models.ProductType.coffee, sold_sq)
	equip_c = _candidates_for_type(db, models.ProductType.equipment, sold_sq)
	return (
		_pick_n_with_repeat(coffee_c, 2),
		_pick_n_with_repeat(equip_c, 2),
	)
