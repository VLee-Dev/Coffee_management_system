from sqlalchemy.orm import Session

from app import models

BREWING_METHOD_TAGS: list[str] = [
	"Pour-Over (V60)",
	"Cold Brew",
	"Phin",
	"Coffee Sữa",
	"Latte",
	"Cappuccino",
	"Espresso",
]


def seed_brewing_method_tags(db: Session) -> None:
	group = db.query(models.FlavorGroup).filter(models.FlavorGroup.name == "Cách pha").first()
	if not group:
		group = models.FlavorGroup(name="Cách pha", sort_order=99)
		db.add(group)
		db.flush()

	existing_names = {t.name for t in group.tags}
	for name in BREWING_METHOD_TAGS:
		if name not in existing_names:
			db.add(models.ProductTag(name=name, group_id=group.id))

	db.commit()
CANONICAL_FLAVOR_GROUPS: list[tuple[str, int]] = [
	("Trái cây", 1),
	("Hoa", 2),
	("Vị ngọt & Đường", 3),
	("Hạt & Caocao", 4),
	("Thảo mộc & thực vật", 5),
	("Gia vị", 6),
	("Lên men & Rượu", 7),
	("Hương rang", 8),
]

# Nhóm cũ từ bản seed trước — gỡ khi khởi động
LEGACY_GROUP_NAMES = {
	"trái cây",
	"hoa",
	"chocolate",
	"hạt rang",
	"ngọt",
	"trà",
	"gia vị",
	"thảo mộc",
	"rang khói",
	"khác",
}


def _prune_legacy_groups(db: Session) -> None:
	canonical_names = {name for name, _ in CANONICAL_FLAVOR_GROUPS}
	for group in db.query(models.FlavorGroup).all():
		if group.name in canonical_names:
			continue
		if group.name not in LEGACY_GROUP_NAMES:
			continue
		for tag in list(group.tags):
			db.query(models.ProductTagItem).filter(models.ProductTagItem.tag_id == tag.id).delete(
				synchronize_session=False
			)
			db.delete(tag)
		db.delete(group)


def seed_flavor_catalog(db: Session) -> None:
	_prune_legacy_groups(db)

	canonical_names = {name for name, _ in CANONICAL_FLAVOR_GROUPS}
	for group_name, sort_order in CANONICAL_FLAVOR_GROUPS:
		group = db.query(models.FlavorGroup).filter(models.FlavorGroup.name == group_name).first()
		if not group:
			db.add(models.FlavorGroup(name=group_name, sort_order=sort_order))
		else:
			group.sort_order = sort_order

	# Gỡ nhóm lạ (không thuộc danh sách cố định) nếu không còn tag
	for group in db.query(models.FlavorGroup).all():
		if group.name in canonical_names:
			continue
		if not group.tags:
			db.delete(group)

	db.commit()
