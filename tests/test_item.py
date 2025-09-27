def test_create_item(client):
    response = client.post("/items/", json={"name": "Rare Coin", "description": "Gold coin"})
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["name"] == "Rare Coin"

def test_get_items(client):
    # Create an item first
    client.post("/items/", json={"name": "Rare Coin", "description": "Gold coin"})

    # Then get all items
    response = client.get("/items/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert any(item["name"] == "Rare Coin" for item in data)
