from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models import StockChangeType


class InventoryAdjustIn(BaseModel):
	product_id: int
	change_type: StockChangeType = StockChangeType.import_
	quantity: int = Field(gt=0)
	note: Optional[str] = None
	imported_at: Optional[datetime] = None

	@field_validator("imported_at")
	@classmethod
	def imported_at_not_future(cls, value: Optional[datetime]) -> Optional[datetime]:
		if value is None:
			return value
		aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
		if aware > datetime.now(timezone.utc):
			raise ValueError("Thời điểm nhập không được vượt quá hiện tại")
		return aware


class InventoryLogUpdate(BaseModel):
	quantity: Optional[int] = Field(default=None, gt=0)
	note: Optional[str] = None
	imported_at: Optional[datetime] = None

	@field_validator("imported_at")
	@classmethod
	def imported_at_not_future(cls, value: Optional[datetime]) -> Optional[datetime]:
		if value is None:
			return value
		aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
		if aware > datetime.now(timezone.utc):
			raise ValueError("Thời điểm nhập không được vượt quá hiện tại")
		return aware


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
