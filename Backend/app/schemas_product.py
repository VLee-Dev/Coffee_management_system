from __future__ import annotations

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models import ProductStatus


class ProductBase(BaseModel):
	category_id: int
	name: str = Field(min_length=1, max_length=150)
	description: Optional[str] = None
	price: Decimal = Field(gt=0)
	stock_quantity: int = Field(ge=0)
	flavor: Optional[str] = Field(default=None, max_length=120)
	product_type: Optional[str] = Field(default="coffee")
	status: ProductStatus = ProductStatus.active
	image_url: Optional[str] = Field(default=None, max_length=500)


class ProductCreate(ProductBase):
	pass


class ProductUpdate(BaseModel):
	category_id: Optional[int] = None
	name: Optional[str] = Field(default=None, min_length=1, max_length=150)
	description: Optional[str] = None
	price: Optional[Decimal] = Field(default=None, gt=0)
	stock_quantity: Optional[int] = Field(default=None, ge=0)
	flavor: Optional[str] = Field(default=None, max_length=120)
	product_type: Optional[str] = Field(default=None)
	status: Optional[ProductStatus] = None
	image_url: Optional[str] = Field(default=None, max_length=500)


class ProductOut(ProductBase):
	id: int
	model_config = ConfigDict(from_attributes=True)
