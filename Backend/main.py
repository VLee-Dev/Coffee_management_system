from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy import inspect, text

from app.database import Base, engine
from app.core.config import settings
from app.core.seed import seed_default_admin, seed_default_categories
from app.core.seed_flavors import seed_flavor_catalog
from app.database import SessionLocal
from app import models  # noqa: F401
from app.routers import auth as auth_router
from app.routers import products as products_router
from app.routers import categories as categories_router
from app.routers import uploads as uploads_router
from app.routers import inventory as inventory_router
from app.routers import orders as orders_router
from app.routers import flavors as flavors_router


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:4173",
		"http://127.0.0.1:4173",
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


def _ensure_inventory_imported_at_column() -> None:
	insp = inspect(engine)
	if "inventory_logs" not in insp.get_table_names():
		return
	columns = {col["name"] for col in insp.get_columns("inventory_logs")}
	if "imported_at" in columns:
		return
	with engine.begin() as conn:
		conn.execute(text("ALTER TABLE inventory_logs ADD COLUMN imported_at TIMESTAMPTZ"))


def _migrate_flavor_tags_schema() -> None:
	insp = inspect(engine)
	if "product_tags" not in insp.get_table_names():
		return
	columns = {col["name"] for col in insp.get_columns("product_tags")}
	if "group_id" not in columns:
		with engine.begin() as conn:
			conn.execute(text("ALTER TABLE product_tags ADD COLUMN group_id INTEGER"))
	with engine.begin() as conn:
		conn.execute(text("ALTER TABLE product_tags DROP CONSTRAINT IF EXISTS product_tags_name_key"))


@app.on_event("startup")
def create_tables() -> None:
	Base.metadata.create_all(bind=engine)
	_ensure_inventory_imported_at_column()
	_migrate_flavor_tags_schema()
	with SessionLocal() as db:
		seed_default_admin(db)
		seed_default_categories(db)
		seed_flavor_catalog(db)


app.include_router(auth_router.router, prefix="/auth")
app.include_router(products_router.router)
app.include_router(categories_router.router)
app.include_router(uploads_router.router)
app.include_router(inventory_router.router)
app.include_router(orders_router.router)
app.include_router(flavors_router.router)

# serve uploaded static files
app.mount("/static", StaticFiles(directory="./static"), name="static")


@app.get("/health", tags=["system"])
def health_check():
	return {"status": "ok", "environment": settings.APP_ENV}
