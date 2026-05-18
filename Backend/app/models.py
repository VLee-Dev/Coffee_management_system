from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
	Boolean,
	DateTime,
	Enum,
	ForeignKey,
	Integer,
	Numeric,
	String,
	Text,
	UniqueConstraint,
	func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
	pass


class TimestampMixin:
	created_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(), 
		nullable=False)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True),
		server_default=func.now(),
		onupdate=func.now(),
		nullable=False,
	)

class UserRole(str, enum.Enum):
	admin = "admin"
	customer = "customer"

class ProductStatus(str, enum.Enum):
	active = "active"
	out_of_stock = "out_of_stock"
	inactive = "inactive"


class ProductType(str, enum.Enum):
	coffee = "coffee"
	equipment = "equipment"

class OrderStatus(str, enum.Enum):
	pending = "pending"
	confirmed = "confirmed"
	shipping = "shipping"
	completed = "completed"
	cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
	qr = "qr"

class PaymentStatus(str, enum.Enum):
	pending = "pending"
	paid = "paid"
	failed = "failed"

class StockChangeType(str, enum.Enum):
	import_ = "import"
	export = "export"
	adjust = "adjust"

class BehaviorType(str, enum.Enum):
	view = "view"
	search = "search"
	add_to_cart = "add_to_cart"
	purchase = "purchase"

class User(Base, TimestampMixin):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	full_name: Mapped[str] = mapped_column(String(150), nullable=False)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
	phone: Mapped[str | None] = mapped_column(String(20))
	address: Mapped[str | None] = mapped_column(String(255))
	role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.customer)
	must_change_password: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

	cart: Mapped[Cart | None] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)
	orders: Mapped[list[Order]] = relationship(back_populates="user")
	inventory_logs: Mapped[list[InventoryLog]] = relationship(back_populates="creator")
	preferences: Mapped[list[UserPreference]] = relationship(back_populates="user", cascade="all, delete-orphan")
	behaviors: Mapped[list[UserBehavior]] = relationship(back_populates="user", cascade="all, delete-orphan")
	recommendation_logs: Mapped[list[RecommendationLog]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Category(Base, TimestampMixin):
	__tablename__ = "categories"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
	description: Mapped[str | None] = mapped_column(Text)

	products: Mapped[list[Product]] = relationship(back_populates="category", cascade="all, delete-orphan")

class Product(Base, TimestampMixin):
	__tablename__ = "products"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
	name: Mapped[str] = mapped_column(String(150), nullable=False)
	description: Mapped[str | None] = mapped_column(Text)
	price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
	stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
	flavor: Mapped[str | None] = mapped_column(String(120))
	status: Mapped[ProductStatus] = mapped_column(
		Enum(ProductStatus, name="product_status"),
		nullable=False,
		default=ProductStatus.active,
	)

	product_type: Mapped[ProductType] = mapped_column(
		Enum(ProductType, name="product_type"),
		nullable=False,
		default=ProductType.coffee,
	)
	image_url: Mapped[str | None] = mapped_column(String(500))
	# Thống kê / gợi ý trưng bày (đồng bộ từ đơn hàng khi khởi động; có thể cập nhật job sau)
	total_units_sold: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
	featured_boost: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

	category: Mapped[Category] = relationship(back_populates="products")
	cart_items: Mapped[list[CartItem]] = relationship(back_populates="product")
	order_items: Mapped[list[OrderItem]] = relationship(back_populates="product")
	inventory_logs: Mapped[list[InventoryLog]] = relationship(back_populates="product")
	tag_items: Mapped[list[ProductTagItem]] = relationship(back_populates="product", cascade="all, delete-orphan")


class Cart(Base, TimestampMixin):
	__tablename__ = "carts"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

	user: Mapped[User] = relationship(back_populates="cart")
	items: Mapped[list[CartItem]] = relationship(back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base, TimestampMixin):
	__tablename__ = "cart_items"
	__table_args__ = (UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),)

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	cart_id: Mapped[int] = mapped_column(ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
	product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
	quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
	is_selected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

	cart: Mapped[Cart] = relationship(back_populates="items")
	product: Mapped[Product] = relationship(back_populates="cart_items")

class Order(Base, TimestampMixin):
	__tablename__ = "orders"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
	order_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
	receiver_name: Mapped[str] = mapped_column(String(150), nullable=False)
	receiver_phone: Mapped[str] = mapped_column(String(20), nullable=False)
	receiver_address: Mapped[str] = mapped_column(String(255), nullable=False)
	status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus, name="order_status"), nullable=False, default=OrderStatus.pending)
	total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

	user: Mapped[User] = relationship(back_populates="orders")
	items: Mapped[list[OrderItem]] = relationship(back_populates="order", cascade="all, delete-orphan")
	payment: Mapped[Payment | None] = relationship(back_populates="order", cascade="all, delete-orphan", uselist=False)

class OrderItem(Base, TimestampMixin):
	__tablename__ = "order_items"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
	product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
	product_name: Mapped[str] = mapped_column(String(150), nullable=False)
	product_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
	quantity: Mapped[int] = mapped_column(Integer, nullable=False)
	subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

	order: Mapped[Order] = relationship(back_populates="items")
	product: Mapped[Product] = relationship(back_populates="order_items")

class Payment(Base, TimestampMixin):
	__tablename__ = "payments"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
	method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod, name="payment_method"), nullable=False, default=PaymentMethod.qr)
	amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
	qr_content: Mapped[str | None] = mapped_column(Text)
	status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus, name="payment_status"), nullable=False, default=PaymentStatus.pending)
	paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

	order: Mapped[Order] = relationship(back_populates="payment")

class InventoryLog(Base, TimestampMixin):
	__tablename__ = "inventory_logs"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
	creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
	change_type: Mapped[StockChangeType] = mapped_column(Enum(StockChangeType, name="stock_change_type"), nullable=False)
	quantity: Mapped[int] = mapped_column(Integer, nullable=False)
	note: Mapped[str | None] = mapped_column(Text)
	imported_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

	product: Mapped[Product] = relationship(back_populates="inventory_logs")
	creator: Mapped[User | None] = relationship(back_populates="inventory_logs")

class UserPreference(Base, TimestampMixin):
	__tablename__ = "user_preferences"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
	flavor: Mapped[str | None] = mapped_column(String(100))
	brewing_method: Mapped[str | None] = mapped_column(String(100))

	user: Mapped[User] = relationship(back_populates="preferences")


class FlavorGroup(Base, TimestampMixin):
	__tablename__ = "flavor_groups"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
	sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

	tags: Mapped[list[ProductTag]] = relationship(back_populates="group", cascade="all, delete-orphan")


class ProductTag(Base, TimestampMixin):
	__tablename__ = "product_tags"
	__table_args__ = (UniqueConstraint("group_id", "name", name="uq_flavor_tag_group_name"),)

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	group_id: Mapped[int] = mapped_column(ForeignKey("flavor_groups.id", ondelete="RESTRICT"), nullable=False)
	name: Mapped[str] = mapped_column(String(100), nullable=False)

	group: Mapped[FlavorGroup] = relationship(back_populates="tags")
	items: Mapped[list[ProductTagItem]] = relationship(back_populates="tag", cascade="all, delete-orphan")


class ProductTagItem(Base, TimestampMixin):
	__tablename__ = "product_tag_items"
	__table_args__ = (UniqueConstraint("product_id", "tag_id", name="uq_product_tag"),)

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
	tag_id: Mapped[int] = mapped_column(ForeignKey("product_tags.id", ondelete="CASCADE"), nullable=False)

	product: Mapped[Product] = relationship(back_populates="tag_items")
	tag: Mapped[ProductTag] = relationship(back_populates="items")


class UserBehavior(Base, TimestampMixin):
	__tablename__ = "user_behaviors"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
	product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
	behavior_type: Mapped[BehaviorType] = mapped_column(Enum(BehaviorType, name="behavior_type"), nullable=False)

	user: Mapped[User] = relationship(back_populates="behaviors")


class RecommendationLog(Base, TimestampMixin):
	__tablename__ = "recommendation_logs"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
	title: Mapped[str | None] = mapped_column(String(255))
	pitch: Mapped[str | None] = mapped_column(Text)

	user: Mapped[User] = relationship(back_populates="recommendation_logs")


class ProductPairing(Base, TimestampMixin):
	__tablename__ = "product_pairings"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	source_product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
	target_product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
	ai_pitch: Mapped[str | None] = mapped_column(Text)
