from typing import Optional

from pydantic import BaseModel, ConfigDict

from models import OrderType, OrderKind


class UserCreate(BaseModel):
    name: str


class UserOut(UserCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ItemOut(ItemCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    side: OrderType
    kind: OrderKind = OrderKind.Limit
    item_id: int
    user_id: int
    price: float


class OrderOut(BaseModel):
    id: int
    side: OrderType
    kind: OrderKind
    item_id: int
    user_id: int
    price: Optional[float]

    model_config = ConfigDict(from_attributes=True)


class TradeOut(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    item_id: int
    price: float

    model_config = ConfigDict(from_attributes=True)
