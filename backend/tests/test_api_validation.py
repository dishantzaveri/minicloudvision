def valid_device():
    return {
        "hostname": "leaf-validate-01",
        "ip_address": "10.7.7.10",
        "device_type": "switch",
        "model": "Arista 7050X3",
        "os_version": "EOS 4.30.1F",
        "location": "Validation Rack A1",
        "status": "online",
        "pos_x": 400,
        "pos_y": 300
    }

def test_create_device_missing_hostname_returns_400(client):
    payload = valid_device()
    payload.pop("hostname")

    res = client.post("/api/devices", json=payload)

    assert res.status_code == 400

def test_create_device_missing_ip_address_returns_400(client):
    payload = valid_device()
    payload.pop("ip_address")

    res = client.post("/api/devices", json=payload)

    assert res.status_code == 400

def test_create_device_missing_device_type_returns_400(client):
    payload = valid_device()
    payload.pop("device_type")

    res = client.post("/api/devices", json=payload)

    assert res.status_code == 400

def test_create_device_with_empty_json_returns_400(client):
    res = client.post("/api/devices", json={})

    assert res.status_code == 400
