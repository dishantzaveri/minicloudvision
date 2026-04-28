"""
seed_data.py — Populates the DB with a realistic Arista spine-leaf data centre topology.

Spine-leaf is Arista's bread-and-butter architecture:
  • 2 Spine switches (high-bandwidth core)
  • 4 Leaf switches (connect to servers, one is degraded for demo purposes)
  • 2 Border/Edge routers (uplink to WAN — one is offline to show alerts)
  • 1 Perimeter Firewall

This gives you a realistic scenario: 9 devices, mix of statuses, visible alerts.
"""

from models import Device, Link


def seed(db):
    # ── Devices ──────────────────────────────────────────────────────────────
    # Spine layer — high-bandwidth core switches that every leaf connects to
    devices = [
        Device(hostname="spine-01", ip_address="10.0.0.1", device_type="switch",
               model="Arista 7800R3", os_version="EOS 4.30.1F",
               location="DC1 / Rack A1", status="online",   pos_x=260, pos_y=80),
        Device(hostname="spine-02", ip_address="10.0.0.2", device_type="switch",
               model="Arista 7800R3", os_version="EOS 4.30.1F",
               location="DC1 / Rack A2", status="online",   pos_x=540, pos_y=80),

        # Leaf layer — access layer switches connecting servers to the fabric
        Device(hostname="leaf-01", ip_address="10.0.1.1", device_type="switch",
               model="Arista 7050X3", os_version="EOS 4.30.1F",
               location="DC1 / Rack B1", status="online",   pos_x=80,  pos_y=260),
        Device(hostname="leaf-02", ip_address="10.0.1.2", device_type="switch",
               model="Arista 7050X3", os_version="EOS 4.30.1F",
               location="DC1 / Rack B2", status="degraded", pos_x=260, pos_y=260),
        Device(hostname="leaf-03", ip_address="10.0.1.3", device_type="switch",
               model="Arista 7050X3", os_version="EOS 4.30.1F",
               location="DC1 / Rack B3", status="online",   pos_x=440, pos_y=260),
        Device(hostname="leaf-04", ip_address="10.0.1.4", device_type="switch",
               model="Arista 7050X3", os_version="EOS 4.30.1F",
               location="DC1 / Rack B4", status="online",   pos_x=620, pos_y=260),

        # Border routers — WAN uplinks, one is down to trigger alerts
        Device(hostname="border-01", ip_address="10.0.2.1", device_type="router",
               model="Arista 7280R3", os_version="EOS 4.29.3M",
               location="DC1 / Edge A", status="online",   pos_x=160, pos_y=440),
        Device(hostname="border-02", ip_address="10.0.2.2", device_type="router",
               model="Arista 7280R3", os_version="EOS 4.29.3M",
               location="DC1 / Edge B", status="offline",  pos_x=540, pos_y=440),

        # Perimeter firewall
        Device(hostname="fw-01", ip_address="10.0.3.1", device_type="firewall",
               model="Palo Alto PA-5450", os_version="PAN-OS 11.1",
               location="DC1 / DMZ",    status="online",   pos_x=350, pos_y=580),
    ]

    db.session.add_all(devices)
    db.session.commit()

    # Build a hostname → id lookup
    id_of = {d.hostname: d.id for d in Device.query.all()}

    # ── Links ─────────────────────────────────────────────────────────────────
    # Classic full-mesh spine-leaf: every leaf connects to every spine (100G fiber)
    links = []
    for leaf in ["leaf-01", "leaf-02", "leaf-03", "leaf-04"]:
        for spine in ["spine-01", "spine-02"]:
            links.append(Link(source_id=id_of[spine], target_id=id_of[leaf],
                              link_type="fiber", bandwidth="100G"))

    # Leaf → Border router connections
    links += [
        Link(source_id=id_of["leaf-01"], target_id=id_of["border-01"],
             link_type="ethernet", bandwidth="10G"),
        Link(source_id=id_of["leaf-04"], target_id=id_of["border-02"],
             link_type="ethernet", bandwidth="10G"),
    ]

    # Border routers → Firewall
    links += [
        Link(source_id=id_of["border-01"], target_id=id_of["fw-01"],
             link_type="ethernet", bandwidth="10G"),
        Link(source_id=id_of["border-02"], target_id=id_of["fw-01"],
             link_type="ethernet", bandwidth="10G"),
    ]

    db.session.add_all(links)
    db.session.commit()
    print(f"[seed] Added {len(devices)} devices and {len(links)} links.")
