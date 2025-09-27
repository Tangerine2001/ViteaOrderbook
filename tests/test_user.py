def test_create_user(client):
    response = client.post("/users/", json={"name": "Alice"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alice"

def test_get_users(client):
    client.post("/users/", json={"name": "Bob"})
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert any(user["name"] == "Bob" for user in data)
