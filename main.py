from typing import List, Optional

from fastapi import FastAPI, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from database import SessionLocal, engine
from models import *
from schemas import ItemOut, ItemCreate, OrderOut, OrderCreate, UserOut, UserCreate, TradeOut

Base.metadata.create_all(bind=engine)
app = FastAPI()

origins = [
    "http://localhost:3000",  # React dev server
    "http://localhost",       # fallback
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # or ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/items/", response_model=ItemOut)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = Item(name=item.name, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.get("/items/", response_model=list[ItemOut])
def read_items(db: Session = Depends(get_db)):
    return db.query(Item).all()


@app.post("/users/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@app.post("/orders/", response_model=OrderOut)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Ensure item & user exist
    item = db.query(Item).filter(Item.id == order.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db_order = ItemOrder(type=order.type, item_id=order.item_id, user_id=order.user_id, price=order.price)
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Try to match. Ensures user gets "best deal"
    if order.type == OrderType.Bid:
        matching_ask = (
            db.query(ItemOrder)
            .filter(ItemOrder.item_id == order.item_id)
            .filter(ItemOrder.type == OrderType.Ask)
            .filter(ItemOrder.price <= order.price)
            .order_by(ItemOrder.price.asc())
            .first()
        )
        if matching_ask:
            # Execute trade at the ask price
            trade = Trade(
                buyer_id=db_order.user_id,
                seller_id=matching_ask.user_id,
                item_id=order.item_id,
                price=matching_ask.price,
            )
            db.add(trade)
            db.delete(matching_ask)
            db.delete(db_order)
            db.commit()
            db.refresh(trade)
            return db_order  # returning order object (though matched)

    elif order.type == OrderType.Ask:
        matching_bid = (
            db.query(ItemOrder)
            .filter(ItemOrder.item_id == order.item_id)
            .filter(ItemOrder.type == OrderType.Bid)
            .filter(ItemOrder.price >= order.price)
            .order_by(ItemOrder.price.desc())
            .first()
        )
        if matching_bid:
            # Execute trade at the bid price
            trade = Trade(
                buyer_id=matching_bid.user_id,
                seller_id=db_order.user_id,
                item_id=order.item_id,
                price=matching_bid.price,
            )
            db.add(trade)
            db.delete(matching_bid)
            db.delete(db_order)
            db.commit()
            db.refresh(trade)
            return db_order

    return db_order


@app.get("/orders/", response_model=List[OrderOut])
def get_orders(item_id: int = Query(...), db: Session = Depends(get_db)):
    return db.query(ItemOrder).filter(ItemOrder.item_id == item_id).all()


@app.get("/trades/", response_model=List[TradeOut])
def get_trades(item_id: int = Query(...),db: Session = Depends(get_db)):
    return db.query(Trade).filter(Trade.item_id == item_id).all()