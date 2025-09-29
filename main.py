from typing import List, Optional

from fastapi import FastAPI, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from database import SessionLocal, engine
from models import *
from schemas import ItemOut, ItemCreate, OrderOut, OrderCreate, UserOut, UserCreate, TradeOut, DeleteOrderRequest

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
    # Validate item & user
    item = db.query(Item).filter(Item.id == order.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    user = db.query(User).filter(User.id == order.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ---- MARKET ORDERS ----
    if order.kind == OrderKind.Market:
        if order.side == OrderType.Bid:
            # Match buy market against lowest-price sell limit
            best_ask = (
                db.query(ItemOrder)
                .filter(ItemOrder.item_id == order.item_id)
                .filter(ItemOrder.side == OrderType.Ask)
                .filter(ItemOrder.kind == OrderKind.Limit)
                .order_by(ItemOrder.price.asc())
                .first()
            )
            if best_ask:
                # Ensure buyer and seller are different
                if order.user_id == best_ask.user_id:
                    # Create an ItemOrder without making a trade
                    db_order = ItemOrder(
                        side=order.side,
                        kind=order.kind,
                        price=None,
                        item_id=order.item_id,
                        user_id=order.user_id,
                    )
                    db.add(db_order)
                    db.commit()
                    db.refresh(db_order)
                    return db_order

                trade = Trade(
                    buyer_id=order.user_id,
                    seller_id=best_ask.user_id,
                    item_id=order.item_id,
                    price=best_ask.price,
                )
                db.add(trade)
                db.delete(best_ask)
                db.commit()
                db.refresh(trade)
                # return a pseudo order
                return OrderOut(
                    id=-1,
                    side=order.side,
                    kind=order.kind,
                    price=best_ask.price,
                    item_id=order.item_id,
                    user_id=order.user_id,
                )

        elif order.side == OrderType.Ask:
            # Match sell market against highest-price buy limit
            best_bid = (
                db.query(ItemOrder)
                .filter(ItemOrder.item_id == order.item_id)
                .filter(ItemOrder.side == OrderType.Bid)
                .filter(ItemOrder.kind == OrderKind.Limit)
                .order_by(ItemOrder.price.desc())
                .first()
            )
            if best_bid:
                # Ensure buyer and seller are different
                if order.user_id == best_bid.user_id:
                    # Create an ItemOrder without making a trade
                    db_order = ItemOrder(
                        side=order.side,
                        kind=order.kind,
                        price=None,
                        item_id=order.item_id,
                        user_id=order.user_id,
                    )
                    db.add(db_order)
                    db.commit()
                    db.refresh(db_order)
                    return db_order

                trade = Trade(
                    buyer_id=best_bid.user_id,
                    seller_id=order.user_id,
                    item_id=order.item_id,
                    price=best_bid.price,
                )
                db.add(trade)
                db.delete(best_bid)
                db.commit()
                db.refresh(trade)
                return OrderOut(
                    id=-1,
                    side=order.side,
                    kind=order.kind,
                    price=best_bid.price,
                    item_id=order.item_id,
                    user_id=order.user_id,
                )

        # If no limit orders exist → keep the market order in the book
        db_order = ItemOrder(
            side=order.side,
            kind=order.kind,
            price=None,
            item_id=order.item_id,
            user_id=order.user_id,
        )
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order

    # ---- LIMIT ORDERS ----
    if order.kind == OrderKind.Limit and order.price is None:
        raise HTTPException(status_code=400, detail="Limit orders require a price")

    db_order = ItemOrder(
        side=order.side,
        kind=order.kind,
        price=order.price,
        item_id=order.item_id,
        user_id=order.user_id,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Try to match if limit
    if db_order.kind == OrderKind.Limit:
        if order.side == OrderType.Bid:
            # First check for opposite Market orders
            market_ask = (
                db.query(ItemOrder)
                .filter(ItemOrder.item_id == order.item_id)
                .filter(ItemOrder.side == OrderType.Ask)
                .filter(ItemOrder.kind == OrderKind.Market)
                .order_by(ItemOrder.id.asc())  # FIFO
                .first()
            )
            if market_ask:
                # Ensure buyer and seller are different
                if db_order.user_id == market_ask.user_id:
                    # Skip trade creation and keep the order
                    return OrderOut(
                        id=db_order.id,
                        side=db_order.side,
                        kind=db_order.kind,
                        price=db_order.price,
                        item_id=db_order.item_id,
                        user_id=db_order.user_id,
                    )

                trade = Trade(
                    buyer_id=db_order.user_id,
                    seller_id=market_ask.user_id,
                    item_id=order.item_id,
                    price=db_order.price,  # trade at limit price
                )
                db.add(trade)
                db.delete(market_ask)
                db.delete(db_order)
                db.commit()
                db.refresh(trade)
                return OrderOut(
                    id=db_order.id,
                    side=db_order.side,
                    kind=db_order.kind,
                    price=db_order.price,
                    item_id=db_order.item_id,
                    user_id=db_order.user_id,
                )

            # If no market ask, check for matching limit asks
            matching_ask = (
                db.query(ItemOrder)
                .filter(ItemOrder.item_id == order.item_id)
                .filter(ItemOrder.side == OrderType.Ask)
                .filter(ItemOrder.kind == OrderKind.Limit)
                .filter(ItemOrder.price <= order.price)
                .order_by(ItemOrder.price.asc())
                .first()
            )
            if matching_ask:
                # Ensure buyer and seller are different
                if db_order.user_id == matching_ask.user_id:
                    # Skip trade creation and keep the order
                    return OrderOut(
                        id=db_order.id,
                        side=db_order.side,
                        kind=db_order.kind,
                        price=db_order.price,
                        item_id=db_order.item_id,
                        user_id=db_order.user_id,
                    )

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
                return OrderOut(
                    id=db_order.id,
                    side=db_order.side,
                    kind=db_order.kind,
                    price=db_order.price,
                    item_id=db_order.item_id,
                    user_id=db_order.user_id,
                )

        elif order.side == OrderType.Ask:
            # First check for opposite Market orders
            market_bid = (
                db.query(ItemOrder)
                .filter(ItemOrder.item_id == order.item_id)
                .filter(ItemOrder.side == OrderType.Bid)
                .filter(ItemOrder.kind == OrderKind.Market)
                .order_by(ItemOrder.id.asc())
                .first()
            )
            if market_bid:
                # Ensure buyer and seller are different
                if db_order.user_id == market_bid.user_id:
                    # Skip trade creation and keep the order
                    return OrderOut(
                        id=db_order.id,
                        side=db_order.side,
                        kind=db_order.kind,
                        price=db_order.price,
                        item_id=db_order.item_id,
                        user_id=db_order.user_id,
                    )

                trade = Trade(
                    buyer_id=market_bid.user_id,
                    seller_id=db_order.user_id,
                    item_id=order.item_id,
                    price=db_order.price,  # trade at limit price
                )
                db.add(trade)
                db.delete(market_bid)
                db.delete(db_order)
                db.commit()
                db.refresh(trade)
                return OrderOut(
                    id=db_order.id,
                    side=db_order.side,
                    kind=db_order.kind,
                    price=db_order.price,
                    item_id=db_order.item_id,
                    user_id=db_order.user_id,
                )

            # If no market bid, check for matching limit bids
            matching_bid = (
                db.query(ItemOrder)
                .filter(ItemOrder.item_id == order.item_id)
                .filter(ItemOrder.side == OrderType.Bid)
                .filter(ItemOrder.kind == OrderKind.Limit)
                .filter(ItemOrder.price >= order.price)
                .order_by(ItemOrder.price.desc())
                .first()
            )
            if matching_bid:
                # Ensure buyer and seller are different
                if db_order.user_id == matching_bid.user_id:
                    # Skip trade creation and keep the order
                    return OrderOut(
                        id=db_order.id,
                        side=db_order.side,
                        kind=db_order.kind,
                        price=db_order.price,
                        item_id=db_order.item_id,
                        user_id=db_order.user_id,
                    )

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
                return OrderOut(
                    id=db_order.id,
                    side=db_order.side,
                    kind=db_order.kind,
                    price=db_order.price,
                    item_id=db_order.item_id,
                    user_id=db_order.user_id,
                )

    return db_order


@app.get("/orders/", response_model=List[OrderOut])
def get_orders(item_id: int = Query(...), user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ItemOrder).filter(ItemOrder.item_id == item_id)

    if user_id is not None:
        query = query.filter(ItemOrder.user_id == user_id)

    orders = query.all()
    return [
        OrderOut(
            id=o.id,
            side=o.side,
            kind=o.kind,
            price=o.price,
            item_id=o.item_id,
            user_id=o.user_id,
        )
        for o in orders
    ]



@app.get("/trades/", response_model=List[TradeOut])
def get_trades(item_id: int = Query(...),db: Session = Depends(get_db)):
    return db.query(Trade).filter(Trade.item_id == item_id).all()


@app.post("/orders/delete/")
def delete_order(request: DeleteOrderRequest, db: Session = Depends(get_db)):
    order = db.query(ItemOrder).filter(ItemOrder.id == request.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully"}
