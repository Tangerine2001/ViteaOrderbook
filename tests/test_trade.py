def test_trade_execution(client):
    buyer = client.post("/users/", json={"name": "Charlie"}).json()
    seller = client.post("/users/", json={"name": "Dave"}).json()
    item = client.post("/items/", json={"name": "Bronze Coin", "description": "Old"}).json()

    # Seller posts ask
    client.post("/orders/", json={
        "type": "Ask",
        "item_id": item["id"],
        "user_id": seller["id"],
        "price": 100
    })

    # Buyer posts bid (executes trade)
    client.post("/orders/", json={
        "type": "Bid",
        "item_id": item["id"],
        "user_id": buyer["id"],
        "price": 120
    })

    response = client.get(f"/trades/?item_id={item['id']}")
    trades = response.json()
    assert len(trades) == 1
    trade = trades[0]
    assert trade["buyer_id"] == buyer["id"]
    assert trade["seller_id"] == seller["id"]
    assert trade["price"] == 100
