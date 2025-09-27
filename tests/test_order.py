def test_create_order_bid(client):
    # Create a user
    user = client.post("/users/", json={"name": "Bob"}).json()
    # Create an item
    item = client.post("/items/", json={"name": "Silver Coin", "description": "Shiny"}).json()

    response = client.post("/orders/", json={
        "type": "Bid",
        "item_id": item["id"],
        "user_id": user["id"],
        "price": 120
    })
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "Bid"
    assert data["item_id"] == item["id"]

def test_get_orders_for_item(client):
    # Create an item first
    item = client.post("/items/", json={"name": "Test Item", "description": "For testing"}).json()
    item_id = item["id"]

    response = client.get(f"/orders/?item_id={item_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
