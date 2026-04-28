"""
routes/devices.py — Full CRUD for the Device resource.

REST conventions followed:
  GET    /api/devices        → list all
  GET    /api/devices/<id>   → get one
  POST   /api/devices        → create
  PUT    /api/devices/<id>   → update (full or partial)
  DELETE /api/devices/<id>   → delete (cascades to links)

Interview tip: always validate your inputs! We use a simple required-fields
check here; in production you'd use marshmallow or pydantic.
"""

from flask import Blueprint, jsonify, request, abort
from models import db, Device, Link

devices_bp = Blueprint("devices", __name__)

REQUIRED_FIELDS = {"hostname", "ip_address", "device_type"}


@devices_bp.route("/devices", methods=["GET"])
def list_devices():
    """Return every device. Optionally filter by ?status=online"""
    status = request.args.get("status")
    query = Device.query
    if status:
        query = query.filter_by(status=status)
    return jsonify([d.to_dict() for d in query.all()])


@devices_bp.route("/devices/<int:device_id>", methods=["GET"])
def get_device(device_id: int):
    device = db.get_or_404(Device, device_id)
    return jsonify(device.to_dict())


@devices_bp.route("/devices", methods=["POST"])
def create_device():
    data = request.get_json(silent=True) or {}

    # Validate required fields
    missing = REQUIRED_FIELDS - data.keys()
    if missing:
        abort(400, description=f"Missing required fields: {missing}")

    device = Device(
        hostname    = data["hostname"],
        ip_address  = data["ip_address"],
        device_type = data["device_type"],
        model       = data.get("model", ""),
        os_version  = data.get("os_version", ""),
        location    = data.get("location", ""),
        status      = data.get("status", "online"),
        pos_x       = float(data.get("pos_x", 400)),
        pos_y       = float(data.get("pos_y", 300)),
    )
    db.session.add(device)
    db.session.commit()
    return jsonify(device.to_dict()), 201


@devices_bp.route("/devices/<int:device_id>", methods=["PUT"])
def update_device(device_id: int):
    device = db.get_or_404(Device, device_id)
    data = request.get_json(silent=True) or {}

    updatable = ["hostname", "ip_address", "device_type", "model",
                 "os_version", "location", "status", "pos_x", "pos_y"]
    for field in updatable:
        if field in data:
            setattr(device, field, data[field])

    db.session.commit()
    return jsonify(device.to_dict())


@devices_bp.route("/devices/<int:device_id>", methods=["DELETE"])
def delete_device(device_id: int):
    device = db.get_or_404(Device, device_id)

    # Cascade-delete all links that reference this device
    Link.query.filter(
        (Link.source_id == device_id) | (Link.target_id == device_id)
    ).delete(synchronize_session=False)

    db.session.delete(device)
    db.session.commit()
    return jsonify({"message": f"Device {device_id} deleted"})
