from sqlalchemy.orm import Session

from app import models
from app.utils.security import get_password_hash

DEFAULT_ADMIN_EMAIL = "admin@meocoffee.com"
DEFAULT_ADMIN_PASSWORD = "123456"
DEFAULT_ADMIN_NAME = "admin"

DEFAULT_CATEGORIES = [
	{"name": "Coffee", "description": "Các loại cà phê và hạt rang"},
	{"name": "Equipment", "description": "Dụng cụ và thiết bị pha chế"},
]


def seed_default_admin(db: Session) -> None:
	existing_admin = db.query(models.User).filter(models.User.email == DEFAULT_ADMIN_EMAIL).first()
	if existing_admin:
		return

	admin = models.User(
		full_name=DEFAULT_ADMIN_NAME,
		email=DEFAULT_ADMIN_EMAIL,
		password_hash=get_password_hash(DEFAULT_ADMIN_PASSWORD),
		role=models.UserRole.admin,
		must_change_password=False,
	)
	db.add(admin)
	db.flush()

	admin_cart = models.Cart(user_id=admin.id)
	db.add(admin_cart)
	db.commit()


def seed_default_categories(db: Session) -> None:
	for category_data in DEFAULT_CATEGORIES:
		existing_category = db.query(models.Category).filter(models.Category.name == category_data["name"]).first()
		if existing_category:
			continue
		db.add(models.Category(**category_data))
	db.commit()