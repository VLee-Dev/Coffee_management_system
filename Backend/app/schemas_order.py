from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class OrderItemOut(BaseModel):
	id: int
	product_name: str
	quantity: int
	subtotal: float
	model_config = ConfigDict(from_attributes=True)


class OrderListItem(BaseModel):
	id: int
	order_code: str
	receiver_name: str
	receiver_phone: str
	receiver_address: str
	status: str
	total_amount: float
	created_at: datetime
	items_summary: str
	items: list[OrderItemOut]


class OrderListResponse(BaseModel):
	items: list[OrderListItem]
	total: int
	page: int
	page_size: int


class OrderStatusUpdate(BaseModel):
	status: str
