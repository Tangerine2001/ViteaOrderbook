import enum

from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    orders = relationship("ItemOrder", back_populates="user")
    trades_bought = relationship("Trade", back_populates="buyer", foreign_keys="Trade.buyer_id")
    trades_sold = relationship("Trade", back_populates="seller", foreign_keys="Trade.seller_id")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)

    orders = relationship("ItemOrder", back_populates="item")
    trades = relationship("Trade", back_populates="item")


class OrderType(str, enum.Enum):
    Bid = "Bid"   # Buy
    Ask = "Ask"   # Sell


class OrderKind(str, enum.Enum):
    Limit = "Limit"
    Market = "Market"


class ItemOrder(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    side = Column(Enum(OrderType), nullable=False)          # Bid or Ask
    kind = Column(Enum(OrderKind), default=OrderKind.Limit, nullable=False)  # Limit or Market
    price = Column(Float, nullable=True)  # nullable since market orders may not need a price
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    item = relationship("Item", back_populates="orders")
    user = relationship("User", back_populates="orders")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    price = Column(Float, nullable=False)

    buyer = relationship("User", back_populates="trades_bought", foreign_keys=[buyer_id])
    seller = relationship("User", back_populates="trades_sold", foreign_keys=[seller_id])
    item = relationship("Item", back_populates="trades")