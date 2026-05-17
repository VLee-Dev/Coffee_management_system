from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
	full_name: str
	email: EmailStr
	password: str
	phone: Optional[str] = None


class UserOut(BaseModel):
	id: int
	full_name: str
	email: str
	phone: Optional[str] = None
	role: str

	class Config:
		from_attributes = True


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


class TokenData(BaseModel):
	user_id: Optional[int] = None


class PasswordChangeIn(BaseModel):
	current_password: str
	new_password: str = Field(min_length=6)

