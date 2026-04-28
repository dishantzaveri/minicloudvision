from flask import Blueprint, jsonify, request, abort
from models import db, Link, Device

links_bp = Blueprint("links", __name__)

@links_bp.route("/links", methods=["GET"])
def list_links():
    return jsonify([l.to_dict() for l in Link.query.all()])

@links_bp.route("/links", methods=["POST"])
def create_link():
    data = request.get_json(silent=True) or {}
    if "source_id" not in data or "target_id" not in data:
        abort(400, description="source_id and target_id are required")
    db.get_or_404(Device, data["source_id"])
    db.get_or_404(Device, data["target_id"])
    link = Link(
        source_id=data["source_id"],
        target_id=data["target_id"],
        link_type=data.get("link_type", "ethernet"),
        bandwidth=data.get("bandwidth", "10G"),
    )
    db.session.add(link)
    db.session.commit()
    return jsonify(link.to_dict()), 201

@links_bp.route("/links/<int:link_id>", methods=["DELETE"])
def delete_link(link_id: int):
    link = db.get_or_404(Link, link_id)
    db.session.delete(link)
    db.session.commit()
    return jsonify({"message": f"Link {link_id} deleted"})