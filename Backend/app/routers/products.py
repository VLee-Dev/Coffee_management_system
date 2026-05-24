from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import models
from app.database import get_db
from app.schemas_product import FeaturedCollectionOut, ProductCreate, ProductOut, ProductUpdate
from app.utils.flavor_tags import sync_product_flavor_tags
from app.utils.inventory import record_import, sync_product_status
from app.utils.featured_collection import pick_featured_collection
from app.utils.product_serialize import product_to_out
from app.utils.security import require_admin

router = APIRouter(prefix="/products", tags=["products"])

_PRODUCT_TAG_LOAD = joinedload(models.Product.tag_items).joinedload(models.ProductTagItem.tag).joinedload(
	models.ProductTag.group
)


@router.get("", response_model=list[ProductOut])
def list_products(
	db: Session = Depends(get_db),
	search: str | None = Query(default=None, min_length=1),
	category_id: int | None = None,
	status: models.ProductStatus | None = None,
	product_type: models.ProductType | None = None,
	flavor_tag_ids: list[int] | None = Query(default=None),
	skip: int = 0,
	limit: int = 100,
	sort: str | None = Query(default=None, pattern="^(id_desc|stock_asc|stock_desc)$"),
):
	query = db.query(models.Product).options(_PRODUCT_TAG_LOAD)
	if flavor_tag_ids:
		query = (
			query.join(models.ProductTagItem)
			.filter(models.ProductTagItem.tag_id.in_(flavor_tag_ids))
			.distinct()
		)
	if search:
		keyword = f"%{search}%"
		query = (
			query.outerjoin(models.ProductTagItem)
			.outerjoin(models.ProductTag)
			.filter(
				models.Product.name.ilike(keyword)
				| models.Product.flavor.ilike(keyword)
				| models.Product.description.ilike(keyword)
				| models.ProductTag.name.ilike(keyword)
			)
			.distinct()
		)
	if category_id is not None:
		query = query.filter(models.Product.category_id == category_id)
	if status is not None:
		query = query.filter(models.Product.status == status)
	if product_type is not None:
		query = query.filter(models.Product.product_type == product_type)
	if sort == "stock_asc":
		order = models.Product.stock_quantity.asc()
	elif sort == "stock_desc":
		order = models.Product.stock_quantity.desc()
	else:
		order = models.Product.id.desc()
	products = query.order_by(order).offset(skip).limit(limit).all()
	return [product_to_out(p) for p in products]


@router.get("/featured-collection", response_model=FeaturedCollectionOut)
def get_featured_collection(db: Session = Depends(get_db)):
	"""Hai sản phẩm coffee + hai dụng cụ: ưu tiên lượt đã bán (đơn không hủy); không bán hoặc hòa điểm thì ngẫu nhiên; thiếu SKU thì lặp lại."""
	coffee_pairs, equipment_pairs = pick_featured_collection(db)
	return FeaturedCollectionOut(
		coffee=[product_to_out(p, sold_units=s) for p, s in coffee_pairs],
		equipment=[product_to_out(p, sold_units=s) for p, s in equipment_pairs],
	)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
	product = db.query(models.Product).options(_PRODUCT_TAG_LOAD).filter(models.Product.id == product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
	return product_to_out(product)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
	product_in: ProductCreate,
	db: Session = Depends(get_db),
	current_user: models.User = Depends(require_admin),
):
	category = db.query(models.Category).filter(models.Category.id == product_in.category_id).first()
	if not category:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

	payload = product_in.model_dump()
	flavor_tag_ids = payload.pop("flavor_tag_ids", [])
	initial_stock = payload.pop("stock_quantity", 0) or 0
	brewing_method_raw = payload.pop("brewing_method", None)

	if brewing_method_raw:
		payload["brewing_method"] = models.BrewingMethod(brewing_method_raw)

	if payload.get("product_type") == models.ProductType.equipment.value:
		flavor_tag_ids = []

	product = models.Product(**payload, stock_quantity=0)
	db.add(product)
	db.flush()

	try:
		sync_product_flavor_tags(db, product, flavor_tag_ids)
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

	if initial_stock > 0:
		now = datetime.now(timezone.utc)
		record_import(
			db,
			product=product,
			quantity=initial_stock,
			creator_id=current_user.id,
			note="Tự động: thêm sản phẩm mới",
			imported_at=now,
		)
	else:
		sync_product_status(product)

	db.commit()
	product = db.query(models.Product).options(_PRODUCT_TAG_LOAD).filter(models.Product.id == product.id).first()
	return product_to_out(product)


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
	product_id: int,
	product_in: ProductUpdate,
	db: Session = Depends(get_db),
	current_user: models.User = Depends(require_admin),
):
	product = db.query(models.Product).options(_PRODUCT_TAG_LOAD).filter(models.Product.id == product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	update_data = product_in.model_dump(exclude_unset=True)
	flavor_tag_ids = update_data.pop("flavor_tag_ids", None)
	brewing_method_raw = update_data.pop("brewing_method", None)

	if "category_id" in update_data:
		category = db.query(models.Category).filter(models.Category.id == update_data["category_id"]).first()
		if not category:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

	old_stock = product.stock_quantity
	new_stock = update_data.get("stock_quantity", old_stock)

	pt_raw = update_data.get("product_type", product.product_type)
	pt = pt_raw.value if isinstance(pt_raw, models.ProductType) else str(pt_raw)

	for field, value in update_data.items():
		if field in ("stock_quantity", "flavor_tag_ids", "brewing_method"):
			continue
		if field == "product_type" and value is not None:
			value = models.ProductType(value)
		setattr(product, field, value)

	if brewing_method_raw is not None:
		if brewing_method_raw == "" or brewing_method_raw is None:
			product.brewing_method = None
		else:
			try:
				product.brewing_method = models.BrewingMethod(brewing_method_raw)
			except ValueError:
				pass

	if pt == models.ProductType.equipment.value and flavor_tag_ids is not None:
		flavor_tag_ids = []

	if flavor_tag_ids is not None:
		try:
			sync_product_flavor_tags(db, product, flavor_tag_ids)
		except ValueError as exc:
			raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

	if "stock_quantity" in update_data:
		delta = new_stock - old_stock
		if delta > 0:
			now = datetime.now(timezone.utc)
			record_import(
				db,
				product=product,
				quantity=delta,
				creator_id=current_user.id,
				note="Tự động: cập nhật số lượng kho",
				imported_at=now,
			)
		elif delta < 0:
			product.stock_quantity = new_stock
			sync_product_status(product)

	db.commit()
	product = db.query(models.Product).options(_PRODUCT_TAG_LOAD).filter(models.Product.id == product_id).first()
	return product_to_out(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
	product_id: int,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	product = db.query(models.Product).filter(models.Product.id == product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	order_refs = (
		db.query(models.OrderItem.id).filter(models.OrderItem.product_id == product_id).limit(1).first()
	)
	if order_refs:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Không thể xóa sản phẩm đã có trong đơn hàng",
		)

	try:
		img = product.image_url
		if img and not img.startswith("http") and "static/uploads" in img:
			idx = img.find("static/uploads")
			rel_path = img[idx:]
			base = Path(__file__).resolve().parents[2]
			file_path = base.joinpath(rel_path)
			if file_path.exists():
				file_path.unlink()
	except OSError:
		pass

	try:
		db.delete(product)
		db.commit()
	except IntegrityError as exc:
		db.rollback()
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Không thể xóa sản phẩm vì còn dữ liệu liên quan",
		) from exc
	return None
