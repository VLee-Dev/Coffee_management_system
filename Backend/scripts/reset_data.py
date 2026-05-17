"""
Xóa toàn bộ dữ liệu nghiệp vụ, giữ tài khoản admin + danh mục mặc định, seed lại flavor groups.

Chạy từ thư mục Backend:
  python -m scripts.reset_data
"""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
	sys.path.insert(0, str(ROOT))

from app.core.seed import seed_default_admin, seed_default_categories
from app.core.seed_flavors import seed_flavor_catalog
from app.database import SessionLocal
from app import models

# Thứ tự xóa: bảng con trước (tránh FK)
TABLES_TO_TRUNCATE = [
	"payments",
	"order_items",
	"orders",
	"inventory_logs",
	"product_tag_items",
	"product_pairings",
	"cart_items",
	"user_behaviors",
	"recommendation_logs",
	"user_preferences",
	"products",
	"product_tags",
	"flavor_groups",
]


def _truncate_tables(db) -> None:
	for table in TABLES_TO_TRUNCATE:
		db.execute(text(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE'))
	db.commit()


def _remove_customer_users(db) -> None:
	customers = db.query(models.User).filter(models.User.role == models.UserRole.customer).all()
	for user in customers:
		db.delete(user)
	db.commit()


def _clear_uploads() -> int:
	uploads_dir = ROOT / "static" / "uploads"
	if not uploads_dir.exists():
		return 0
	removed = 0
	for path in uploads_dir.iterdir():
		if path.is_file():
			path.unlink()
			removed += 1
	return removed


def main() -> None:
	print("Resetting database...")
	db = SessionLocal()
	try:
		_truncate_tables(db)
		_remove_customer_users(db)
		seed_default_admin(db)
		seed_default_categories(db)
		seed_flavor_catalog(db)
	except Exception as exc:
		db.rollback()
		print(f"Error: {exc}")
		raise
	finally:
		db.close()

	files_removed = _clear_uploads()
	print("Done. Cleared: products, orders, inventory, flavor tags, carts, customers.")
	print(f"Removed {files_removed} uploaded image(s). Kept admin account.")
	print("Reseeded: categories + 8 empty flavor groups.")
	print("Admin login: admin@meocoffee.com / 123456")


if __name__ == "__main__":
	main()
