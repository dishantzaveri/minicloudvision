def sample_device():
    return {
        "hostname": "leaf-test-01",
        "ip_address": "10.9.9.10",
        "device_type": "switch",
        "model": "Arista 7050X3",
        "os_version": "EOS 4.30.1F",
        "location": "Test Rack A1",
        "status": "online",
        "pos_x": 420,
        "pos_y": 280
    }

def test_create_device_returns_success(client):
    payload = sample_device()

    res = client.post("/api/devices", json=payload)

    assert res.status_code in (200, 201)

def test_create_device_returns_json(client):
    payload = sample_device()

    res = client.post("/api/devices", json=payload)
    data = res.get_json()

    assert isinstance(data, dict)

def test_create_device_returns_expected_fields(client):
    payload = sample_device()

    res = client.post("/api/devices", json=payload)
    data = res.get_json()

    assert data["hostname"] == payload["hostname"]
    assert data["ip_address"] == payload["ip_address"]
    assert data["device_type"] == payload["device_type"]
    assert data["status"] == payload["status"]

def test_create_device_returns_id(client):
    payload = sample_device()

    res = client.post("/api/devices", json=payload)
    data = res.get_json()

    assert "id" in data
    assert isinstance(data["id"], int)
