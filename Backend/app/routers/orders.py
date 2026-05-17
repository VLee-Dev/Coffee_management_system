from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app import models
from app.database import get_db
from app.schemas_order import OrderItemOut, OrderListItem, OrderListResponse, OrderStatusUpdate
from app.utils.security import require_admin

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

	order.status = new_status
	db.commit()
	db.refresh(order)
	return _to_list_item(order)
