def test_get_devices_returns_200(client):
    res = client.get("/api/devices")
    assert res.status_code == 200

def test_get_devices_returns_list(client):
    res = client.get("/api/devices")
    data = res.get_json()

    assert isinstance(data, list)

def test_get_summary_returns_200(client):
    res = client.get("/api/summary")
    assert res.status_code == 200

def test_get_summary_has_expected_keys(client):
    res = client.get("/api/summary")
    data = res.get_json()

    assert isinstance(data, dict)
    assert "total_devices" in data
    assert "online" in data
    assert "offline" in data
    assert "degraded" in data
    assert "alerts" in data

def test_summary_values_are_integers(client):
    res = client.get("/api/summary")
    data = res.get_json()

    assert isinstance(data["total_devices"], int)
    assert isinstance(data["online"], int)
    assert isinstance(data["offline"], int)
    assert isinstance(data["degraded"], int)
    assert isinstance(data["alerts"], int)
