"""
routes/stats.py — Simulated real-time device metrics.

In a real product these numbers would come from an EOS eAPI call or a
telemetry pipeline (gNMI/gRPC streaming — Arista's modern stack).
For this project we generate plausible random values so the UI feels live.

Endpoints:
  GET /api/summary             — aggregate counts (online/offline/degraded)
  GET /api/devices/<id>/stats  — per-device CPU, memory, interface stats
"""

import random
from flask import Blueprint, jsonify
from models import Device

stats_bp = Blueprint("stats", __name__)


def _uptime_str(seconds: int) -> str:
    """Convert seconds to a human-readable uptime string."""
    days    = seconds // 86400
    hours   = (seconds % 86400) // 3600
    minutes = (seconds % 3600)  // 60
    return f"{days}d {hours}h {minutes}m"


@stats_bp.route("/summary", methods=["GET"])
def get_summary():
    """Dashboard summary card data."""
    devices  = Device.query.all()
    online   = sum(1 for d in devices if d.status == "online")
    offline  = sum(1 for d in devices if d.status == "offline")
    degraded = sum(1 for d in devices if d.status == "degraded")
    return jsonify({
        "total_devices": len(devices),
        "online":   online,
        "offline":  offline,
        "degraded": degraded,
        "alerts":   offline + degraded,
    })


@stats_bp.route("/devices/<int:device_id>/stats", methods=["GET"])
def get_device_stats(device_id: int):
    """
    Per-device telemetry. Offline devices return zeroes.
    Degraded devices show elevated CPU to simulate a realistic fault.
    """
    device = Device.query.get_or_404(device_id)

    if device.status == "offline":
        return jsonify({
            "device_id":      device_id,
            "cpu_percent":    0,
            "memory_percent": 0,
            "uptime":         "0d 0h 0m",
            "interfaces":     [],
        })

    # Degraded → high CPU
    base_cpu = 72 if device.status == "degraded" else 18
    cpu    = round(min(99, max(1, base_cpu + random.gauss(0, 6))),  1)
    memory = round(min(92, max(10, 48   + random.gauss(0, 10))), 1)
    uptime_secs = random.randint(86400, 86400 * 365)

    # Simulate per-interface stats (8 ports for switches, 4 for routers/firewalls)
    num_ifaces = 8 if device.device_type == "switch" else 4
    interfaces = []
    for i in range(num_ifaces):
        up = random.random() > 0.12   # ~88% of interfaces are up
        interfaces.append({
            "name":    f"Ethernet{i + 1}",
            "status":  "up" if up else "down",
            "rx_mbps": round(random.uniform(0, 950), 1) if up else 0,
            "tx_mbps": round(random.uniform(0, 950), 1) if up else 0,
            "errors":  random.randint(0, 8)                if up else 0,
        })

    return jsonify({
        "device_id":      device_id,
        "cpu_percent":    cpu,
        "memory_percent": memory,
        "uptime":         _uptime_str(uptime_secs),
        "interfaces":     interfaces,
    })
