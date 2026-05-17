from app import models
from app.schemas_product import FlavorTagOut, ProductOut
from app.utils.flavor_tags import flavor_tags_for_product


def product_to_out(product: models.Product) -> ProductOut:
	tag_dicts = flavor_tags_for_product(product)
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
		flavor_tags=[FlavorTagOut(**t) for t in tag_dicts],
		flavor_tag_ids=[t["id"] for t in tag_dicts],
	)