from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.database import get_db
from app.schemas_order import CheckoutRequest, CheckoutResponse, OrderItemOut, OrderListItem, OrderListResponse, OrderStatusUpdate
from app.utils.checkout import generate_order_code, record_export
from app.utils.inventory import sync_product_status
from app.utils.security import get_current_user, require_admin

router = APIRouter(prefix="/orders", tags=["orders"])

def _items_summary(items: list[models.OrderItem]) -> str:
	if not items:
		return "—"
	parts = [f"{item.product_name} x{item.quantity}" for item in items[:3]]
	text = ", ".join(parts)
	if len(items) > 3:
		text += "..."
	return text


def _to_list_item(order: models.Order) -> OrderListItem:
	return OrderListItem(
		id=order.id,
		order_code=order.order_code,
		receiver_name=order.receiver_name,
		receiver_phone=order.receiver_phone,
		receiver_address=order.receiver_address,
		status=order.status.value,
		total_amount=float(order.total_amount),
		created_at=order.created_at,
		items_summary=_items_summary(order.items),
		items=[OrderItemOut.model_validate(i) for i in order.items],
	)


@router.get("/my-orders", response_model=OrderListResponse)
def get_my_orders(
	db: Session = Depends(get_db),
	user: models.User = Depends(get_current_user),
	page: int = Query(default=1, ge=1),
	page_size: int = Query(default=10, ge=1, le=50),
):
	query = (
		db.query(models.Order)
		.options(joinedload(models.Order.items))
		.filter(models.Order.user_id == user.id)
	)

	total = query.count()
	orders = (
		query.order_by(models.Order.created_at.desc())
		.offset((page - 1) * page_size)
		.limit(page_size)
		.all()
	)

	return OrderListResponse(
		items=[_to_list_item(o) for o in orders],
		total=total,
		page=page,
		page_size=page_size,
	)


@router.get("", response_model=OrderListResponse)
def list_orders(
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
	search: str | None = Query(default=None, min_length=1),
	status: models.OrderStatus | None = None,
	page: int = Query(default=1, ge=1),
	page_size: int = Query(default=10, ge=1, le=50),
):
	query = db.query(models.Order).options(joinedload(models.Order.items))

	if search:
		keyword = f"%{search}%"
		query = query.filter(
			models.Order.order_code.ilike(keyword)
			| models.Order.receiver_name.ilike(keyword)
			| models.Order.receiver_phone.ilike(keyword)
		)
	if status is not None:
		query = query.filter(models.Order.status == status)

	total = query.count()
	orders = (
		query.order_by(models.Order.created_at.desc())
		.offset((page - 1) * page_size)
		.limit(page_size)
		.all()
	)

	return OrderListResponse(
		items=[_to_list_item(o) for o in orders],
		total=total,
		page=page,
		page_size=page_size,
	)


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout(
	body: CheckoutRequest,
	db: Session = Depends(get_db),
	user: models.User = Depends(get_current_user),
):
	if not body.items:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Giỏ hàng trống")

	try:
		payment_method = models.PaymentMethod(body.payment_method)
	except ValueError as exc:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Phương thức thanh toán không hợp lệ",
		) from exc

	phone = body.receiver_phone.strip()
	address_line = body.receiver_address.strip()
	district = body.district.strip()
	if len(phone) < 8:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Số điện thoại không hợp lệ")
	if not address_line or not district:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vui lòng nhập đầy đủ địa chỉ")

	full_address = f"{address_line}, {district}"
	subtotal = 0.0
	line_payload: list[tuple[models.Product, int, float]] = []

	for line in body.items:
		if line.quantity < 1:
			raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Số lượng không hợp lệ")
		product = db.query(models.Product).filter(models.Product.id == line.product_id).first()
		if not product:
			raise HTTPException(
				status_code=status.HTTP_404_NOT_FOUND,
				detail=f"Sản phẩm #{line.product_id} không tồn tại",
			)
		if product.status != models.ProductStatus.active:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"{product.name} hiện không bán",
			)
		if product.stock_quantity < line.quantity:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"{product.name} không đủ tồn kho (còn {product.stock_quantity})",
			)
		price = float(product.price)
		subtotal += price * line.quantity
		line_payload.append((product, line.quantity, price))

	shipping = max(0.0, float(body.shipping_fee))
	total_amount = subtotal + shipping

	order_code = generate_order_code()
	while db.query(models.Order).filter(models.Order.order_code == order_code).first():
		order_code = generate_order_code()

	order = models.Order(
		user_id=user.id,
		order_code=order_code,
		receiver_name=user.full_name.strip() or "Khách Meo Coffee",
		receiver_phone=phone,
		receiver_address=full_address,
		status=models.OrderStatus.pending,
		total_amount=total_amount,
	)
	db.add(order)
	db.flush()

	for product, qty, price in line_payload:
		sub = price * qty
		db.add(
			models.OrderItem(
				order_id=order.id,
				product_id=product.id,
				product_name=product.name,
				product_price=price,
				quantity=qty,
				subtotal=sub,
			)
		)
		record_export(
			db,
			product=product,
			quantity=qty,
			creator_id=user.id,
			note=f"Đơn {order_code}",
		)

	payment_status = (
		models.PaymentStatus.paid
		if payment_method == models.PaymentMethod.qr
		else models.PaymentStatus.pending
	)
	db.add(
		models.Payment(
			order_id=order.id,
			method=payment_method,
			amount=total_amount,
			qr_content=order_code if payment_method == models.PaymentMethod.qr else None,
			status=payment_status,
			paid_at=None,
		)
	)

	db.commit()
	db.refresh(order)

	return CheckoutResponse(
		id=order.id,
		order_code=order.order_code,
		total_amount=float(order.total_amount),
		status=order.status.value,
		payment_method=payment_method.value,
	)


@router.patch("/{order_id}/status", response_model=OrderListItem)
def update_order_status(
	order_id: int,
	body: OrderStatusUpdate,
	db: Session = Depends(get_db),
	_: models.User = Depends(require_admin),
):
	order = (
		db.query(models.Order)
		.options(joinedload(models.Order.items))
		.filter(models.Order.id == order_id)
		.first()
	)
	if not order:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

	try:
		new_status = models.OrderStatus(body.status)
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status") from exc

	old_status = order.status
	order.status = new_status

	# Khôi phục stock khi hủy đơn
	if new_status == models.OrderStatus.cancelled and old_status != models.OrderStatus.cancelled:
		for item in order.items:
			product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
			if product:
				product.stock_quantity += item.quantity
				product.total_units_sold = max(0, (product.total_units_sold or 0) - item.quantity)
				sync_product_status(product)
				log = models.InventoryLog(
					product_id=product.id,
					creator_id=None,
					change_type=models.StockChangeType.import_,
					quantity=item.quantity,
					note=f"Hoàn kho do hủy đơn {order.order_code}",
					imported_at=datetime.now(timezone.utc),
				)
				db.add(log)

	db.commit()
	db.refresh(order)
	return _to_list_item(order)


@router.post("/{order_id}/cancel", response_model=OrderListItem)
def cancel_order(
	order_id: int,
	db: Session = Depends(get_db),
	user: models.User = Depends(get_current_user),
):
	order = (
		db.query(models.Order)
		.options(joinedload(models.Order.items))
		.filter(models.Order.id == order_id)
		.first()
	)
	if not order:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn hàng")
	if order.user_id != user.id:
		raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền hủy đơn này")
	if order.status not in (models.OrderStatus.pending, models.OrderStatus.confirmed):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể hủy đơn ở trạng thái này")

	old_status = order.status
	order.status = models.OrderStatus.cancelled

	if old_status != models.OrderStatus.cancelled:
		for item in order.items:
			product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
			if product:
				product.stock_quantity += item.quantity
				product.total_units_sold = max(0, (product.total_units_sold or 0) - item.quantity)
				sync_product_status(product)
				log = models.InventoryLog(
					product_id=product.id,
					creator_id=user.id,
					change_type=models.StockChangeType.import_,
					quantity=item.quantity,
					note=f"Hủy đơn {order.order_code} bởi khách",
					imported_at=datetime.now(timezone.utc),
				)
				db.add(log)

	db.commit()
	db.refresh(order)
	return _to_list_item(order)
