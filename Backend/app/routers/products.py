from fastapi import APIRouter, Depends, HTTPException, Query, status
from pathlib import Path
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.schemas_product import ProductCreate, ProductOut, ProductUpdate
from app.utils.security import require_admin

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(
	db: Session = Depends(get_db),
	search: str | None = Query(default=None, min_length=1),
	category_id: int | None = None,
	status: models.ProductStatus | None = None,
	product_type: models.ProductType | None = None,
	skip: int = 0,
	limit: int = 20,
):
	query = db.query(models.Product)
	if search:
		keyword = f"%{search}%"
		query = query.filter(
			models.Product.name.ilike(keyword)
			| models.Product.flavor.ilike(keyword)
			| models.Product.description.ilike(keyword)
		)
	if category_id is not None:
		query = query.filter(models.Product.category_id == category_id)
	if status is not None:
		query = query.filter(models.Product.status == status)
	if product_type is not None:
		query = query.filter(models.Product.product_type == product_type)
	return query.order_by(models.Product.id.desc()).offset(skip).limit(limit).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
	product = db.query(models.Product).filter(models.Product.id == product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
	return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
	product_in: ProductCreate,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	category = db.query(models.Category).filter(models.Category.id == product_in.category_id).first()
	if not category:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

	product = models.Product(**product_in.model_dump())
	db.add(product)
	db.commit()
	db.refresh(product)
	return product


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
	product_id: int,
	product_in: ProductUpdate,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	product = db.query(models.Product).filter(models.Product.id == product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	update_data = product_in.model_dump(exclude_unset=True)
	if "category_id" in update_data:
		category = db.query(models.Category).filter(models.Category.id == update_data["category_id"]).first()
		if not category:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

	for field, value in update_data.items():
		setattr(product, field, value)

	db.commit()
	db.refresh(product)
	return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
	product_id: int,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	product = db.query(models.Product).filter(models.Product.id == product_id).first()
	if not product:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

	# try to remove associated image file from disk if it's a local static upload
	try:
		img = product.image_url
		if img:
			# only handle local relative paths like "/static/uploads/..." or "static/uploads/..."
			if not img.startswith('http'):
				rel = img.lstrip('/')
				# ensure we're only deleting files under static/uploads
				if 'static/uploads' in img:
					# support both full urls (http://host/static/uploads/...) and relative paths
					idx = img.find('static/uploads')
					rel_path = img[idx:]
					base = Path(__file__).resolve().parents[2]
					file_path = base.joinpath(rel_path)
					if file_path.exists():
						file_path.unlink()
	except Exception:
		# don't block deletion if file remove fails
		pass

	db.delete(product)
	db.commit()
	return None