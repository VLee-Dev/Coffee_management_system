from sqlalchemy.orm import Session

from app import models


def sync_product_flavor_tags(db: Session, product: models.Product, tag_ids: list[int] | None) -> None:
	if tag_ids is None:
		return

	unique_ids = list(dict.fromkeys(tag_ids))
	if unique_ids:
		existing = (
			db.query(models.ProductTag.id)
			.filter(models.ProductTag.id.in_(unique_ids))
			.all()
		)
		found_ids = {row[0] for row in existing}
		missing = set(unique_ids) - found_ids
		if missing:
			raise ValueError(f"Flavor tag not found: {sorted(missing)}")

	for item in list(product.tag_items):
		db.delete(item)
	db.flush()

	for tag_id in unique_ids:
		db.add(models.ProductTagItem(product_id=product.id, tag_id=tag_id))

	if unique_ids:
		tags = (
			db.query(models.ProductTag)
			.join(models.ProductTagItem, models.ProductTagItem.tag_id == models.ProductTag.id)
			.join(models.FlavorGroup, models.FlavorGroup.id == models.ProductTag.group_id)
			.filter(models.ProductTagItem.product_id == product.id)
			.order_by(models.FlavorGroup.sort_order, models.ProductTag.name)
			.all()
		)
		product.flavor = ", ".join(t.name for t in tags)
	else:
		product.flavor = None


def flavor_tags_for_product(product: models.Product) -> list[dict]:
	result = []
	for item in product.tag_items:
		tag = item.tag
		if not tag or not tag.group:
			continue
		result.append(
			{
				"id": tag.id,
				"name": tag.name,
				"group_id": tag.group_id,
				"group_name": tag.group.name,
			}
		)
	result.sort(key=lambda t: (t["group_name"], t["name"]))
	return result
