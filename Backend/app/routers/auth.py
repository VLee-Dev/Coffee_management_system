from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app import models
from app.schemas import PasswordChangeIn, UserCreate, UserOut, UserUpdate, Token
from app.database import get_db
from app.utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed = get_password_hash(user_in.password)
    user = models.User(
        full_name=user_in.full_name,
        email=user_in.email,
        phone=user_in.phone,
        password_hash=hashed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # create empty cart
    cart = models.Cart(user_id=user.id)
    db.add(cart)
    db.commit()
    db.refresh(user)
    return _user_out(user)


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


def _user_out(user: models.User) -> UserOut:
	return UserOut(
		id=user.id,
		full_name=user.full_name,
		email=user.email,
		phone=user.phone,
		address=user.address,
		role=user.role.value,
	)


@router.get("/me", response_model=UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
	return _user_out(current_user)


@router.patch("/me", response_model=UserOut)
def update_me(
	body: UserUpdate,
	db: Session = Depends(get_db),
	current_user: models.User = Depends(get_current_user),
):
	data = body.model_dump(exclude_unset=True)
	if not data:
		return _user_out(current_user)
	for field, value in data.items():
		if field == "phone" and value is not None:
			value = value.strip() or None
		if field == "address" and value is not None:
			value = value.strip() or None
		setattr(current_user, field, value)
	db.commit()
	db.refresh(current_user)
	return _user_out(current_user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: PasswordChangeIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không đúng",
        )
    current_user.password_hash = get_password_hash(body.new_password)
    current_user.must_change_password = False
    db.commit()
    return None
