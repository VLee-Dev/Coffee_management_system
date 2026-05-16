from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import StockChangeType


class InventoryAdjustIn(BaseModel):
	product_id: int
	change_type: StockChangeType = StockChangeType.import_
	quantity: int = Field(gt=0)
	note: Optional[str] = None
	imported_at: Optional[date] = None

	@field_validator("imported_at")
	@classmethod
	def imported_at_not_future(cls, value: Optional[date]) -> Optional[date]:
		if value is not None and value > date.today():
			raise ValueError("Ngày nhập không được vượt quá ngày hiện tại")
		return value


class InventoryLogOut(BaseModel):
	id: int
	product_id: int
	change_type: StockChangeType
	quantity: int
	note: Optional[str] = None
	imported_at: Optional[datetime] = None
	created_at: datetime
	model_config = ConfigDict(from_attributes=True)


class InventoryLogListItem(BaseModel):
	id: int
	product_id: int
	product_name: str
	product_type: str
	quantity: int
	change_type: str
	note: Optional[str] = None
	imported_at: datetime
	creator_name: Optional[str] = None


class InventoryAdjustOut(BaseModel):
	product_id: int
	stock_quantity: int
	status: str
	log: InventoryLogOut
