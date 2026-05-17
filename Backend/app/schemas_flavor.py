from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class FlavorTagOut(BaseModel):
	id: int
	name: str
	group_id: int
	group_name: str
	model_config = ConfigDict(from_attributes=True)


class FlavorTagBrief(BaseModel):
	id: int
	name: str
	model_config = ConfigDict(from_attributes=True)


class FlavorGroupOut(BaseModel):
	id: int
	name: str
	sort_order: int
	tags: list[FlavorTagBrief] = []
	model_config = ConfigDict(from_attributes=True)


class FlavorTagCreate(BaseModel):
	name: str = Field(min_length=1, max_length=100)
	group_id: int
