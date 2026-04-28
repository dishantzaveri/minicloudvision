def sample_device():
    return {
        "hostname": "leaf-delete-01",
        "ip_address": "10.8.8.10",
        "device_type": "switch",
        "model": "Arista 7050X3",
        "os_version": "EOS 4.30.1F",
        "location": "Delete Rack A1",
        "status": "online",
        "pos_x": 300,
        "pos_y": 200
    }

def test_delete_device_removes_created_device(client):
    # 1. create
    create_res = client.post("/api/devices", json=sample_device())
    assert create_res.status_code in (200, 201)

    created = create_res.get_json()
    device_id = created["id"]

    # 2. delete
    delete_res = client.delete(f"/api/devices/{device_id}")
    assert delete_res.status_code in (200, 204)

    # 3. verify it is gone from device list
    list_res = client.get("/api/devices")
    assert list_res.status_code == 200

    devices = list_res.get_json()
    ids = [device["id"] for device in devices]

    assert device_id not in ids

def test_delete_device_reduces_device_count(client):
    before_res = client.get("/api/devices")
    before_count = len(before_res.get_json())

    create_res = client.post("/api/devices", json=sample_device())
    created = create_res.get_json()
    device_id = created["id"]

    delete_res = client.delete(f"/api/devices/{device_id}")
    assert delete_res.status_code in (200, 204)

    after_res = client.get("/api/devices")
    after_count = len(after_res.get_json())

    assert after_count == before_count

def test_delete_unknown_device_does_not_return_success(client):
    res = client.delete("/api/devices/999999")

    assert res.status_code in (404, 400)
