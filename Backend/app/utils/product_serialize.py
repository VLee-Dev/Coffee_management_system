from app import models
from app.schemas_product import FlavorTagOut, ProductOut
from app.utils.flavor_tags import flavor_tags_for_product


def product_to_out(
	product: models.Product,
	*,
	sold_units: int | None = None,
) -> ProductOut:
	tag_dicts = flavor_tags_for_product(product)
	tus = int(sold_units) if sold_units is not None else int(getattr(product, "total_units_sold", 0) or 0)
	boost = int(getattr(product, "featured_boost", 0) or 0)
	return ProductOut(
		id=product.id,
		category_id=product.category_id,
		name=product.name,
		description=product.description,
		price=product.price,
		stock_quantity=product.stock_quantity,
		flavor=product.flavor,
		product_type=product.product_type.value if product.product_type else "coffee",
		status=product.status,
		image_url=product.image_url,
		brewing_method=product.brewing_method.value if product.brewing_method else None,
		flavor_tags=[FlavorTagOut(**t) for t in tag_dicts],
		flavor_tag_ids=[t["id"] for t in tag_dicts],
		total_units_sold=tus,
		featured_boost=boost,
	)