"""
models.py — SQLAlchemy database models.

Two tables:
  Device  — a network node (switch, router, firewall)
  Link    — a cable / connection between two devices
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Device(db.Model):
    """
    Represents one physical/virtual network device.

    Fields that might surprise you:
      pos_x / pos_y  — pixel coordinates stored in the DB so the topology
                        layout persists between page loads (users can drag nodes).
    """
    __tablename__ = "device"

    id          = db.Column(db.Integer, primary_key=True)
    hostname    = db.Column(db.String(100), nullable=False, unique=True)
    ip_address  = db.Column(db.String(15),  nullable=False)
    device_type = db.Column(db.String(50),  nullable=False)   # switch | router | firewall
    model       = db.Column(db.String(100), default="")
    os_version  = db.Column(db.String(50),  default="")
    location    = db.Column(db.String(100), default="")
    status      = db.Column(db.String(20),  default="online") # online | offline | degraded
    pos_x       = db.Column(db.Float, default=300.0)
    pos_y       = db.Column(db.Float, default=200.0)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":          self.id,
            "hostname":    self.hostname,
            "ip_address":  self.ip_address,
            "device_type": self.device_type,
            "model":       self.model,
            "os_version":  self.os_version,
            "location":    self.location,
            "status":      self.status,
            "pos_x":       self.pos_x,
            "pos_y":       self.pos_y,
            "created_at":  self.created_at.isoformat(),
        }


class Link(db.Model):
    """
    Directed edge between two Devices.
    Even though a cable is bidirectional we store it once (source < target by convention).
    """
    __tablename__ = "link"

    id         = db.Column(db.Integer, primary_key=True)
    source_id  = db.Column(db.Integer, db.ForeignKey("device.id"), nullable=False)
    target_id  = db.Column(db.Integer, db.ForeignKey("device.id"), nullable=False)
    link_type  = db.Column(db.String(50), default="ethernet") # ethernet | fiber | lag
    bandwidth  = db.Column(db.String(20), default="10G")       # 1G | 10G | 100G

    # Relationships let us do link.source.hostname without extra queries
    source = db.relationship("Device", foreign_keys=[source_id])
    target = db.relationship("Device", foreign_keys=[target_id])

    def to_dict(self):
        return {
            "id":               self.id,
            "source_id":        self.source_id,
            "target_id":        self.target_id,
            "link_type":        self.link_type,
            "bandwidth":        self.bandwidth,
            "source_hostname":  self.source.hostname,
            "target_hostname":  self.target.hostname,
        }
