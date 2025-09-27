from typing import Optional

from pydantic import BaseModel

from models import OrderType


class UserCreate(BaseModel):
    name: str


class UserOut(UserCreate):
    id: int

    class Config:
        from_attributes = True


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ItemOut(ItemCreate):
    id: int

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    type: OrderType
    item_id: int
    user_id: int
    price: float


class OrderOut(BaseModel):
    id: int
    type: OrderType
    item_id: int
    user_id: int
    price: float

    class Config:
        from_attributes = True


class TradeOut(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    item_id: int
    price: float

    class Config:
        from_attributes = True