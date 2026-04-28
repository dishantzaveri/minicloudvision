import React, { useCallback, useRef, useState } from 'react';
import type { Device, Link } from '../types';
import { devicesApi } from '../api/client';

interface Props {
  devices: Device[];
  links: Link[];
  selectedDeviceId: number | null;
  onSelectDevice: (id: number) => void;
  onDevicesMoved: (updated: Device[]) => void;
}

const STATUS_COLOR: Record<Device['status'], string> = {
  online: '#22c55e',
  degraded: '#f59e0b',
  offline: '#f43f5e',
};

const TYPE_GLYPH: Record<Device['device_type'], string> = {
  switch: 'SW',
  router: 'RT',
  firewall: 'FW',
};

function lineStyle(bandwidth: string) {
  if (bandwidth.includes('100')) return { stroke: '#38bdf8', width: 3.2 };
  if (bandwidth.includes('40')) return { stroke: '#818cf8', width: 2.8 };
  if (bandwidth.includes('10')) return { stroke: '#60a5fa', width: 2.2 };
  return { stroke: '#64748b', width: 1.8 };
}

export default function TopologyGraph({
  devices,
  links,
  selectedDeviceId,
  onSelectDevice,
  onDevicesMoved,
}: Props) {
  const dragging = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const [positions, setPositions] = useState<Record<number, { x: number; y: number }>>({});

  const posX = (device: Device) => positions[device.id]?.x ?? device.pos_x;
  const posY = (device: Device) => positions[device.id]?.y ?? device.pos_y;

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGGElement>, id: number) => {
      event.preventDefault();
      const device = devices.find((item) => item.id === id);
      if (!device) return;
      dragging.current = {
        id,
        ox: event.clientX - posX(device),
        oy: event.clientY - posY(device),
      };
    },
    [devices, positions]
  );

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const { id, ox, oy } = dragging.current;
    setPositions((prev) => ({
      ...prev,
      [id]: {
        x: event.clientX - ox,
        y: event.clientY - oy,
      },
    }));
  }, []);

  const handleMouseUp = useCallback(async () => {
    if (!dragging.current) return;
    const { id } = dragging.current;
    dragging.current = null;
    const next = positions[id];
    if (!next) return;
    await devicesApi.update(id, { pos_x: next.x, pos_y: next.y });
    const updated = devices.map((device) =>
      device.id === id ? { ...device, pos_x: next.x, pos_y: next.y } : device
    );
    onDevicesMoved(updated);
  }, [devices, onDevicesMoved, positions]);

  return (
    <div className="topology-shell">
      <div className="topology-meta-row">
        <div className="topology-stat-chip">
          <span className="dot success" />
          <span>{devices.filter((device) => device.status === 'online').length} online</span>
        </div>
        <div className="topology-stat-chip">
          <span className="dot warning" />
          <span>{devices.filter((device) => device.status === 'degraded').length} degraded</span>
        </div>
        <div className="topology-stat-chip">
          <span className="dot danger" />
          <span>{devices.filter((device) => device.status === 'offline').length} offline</span>
        </div>
      </div>

      <div className="topology-canvas-wrap">
        <svg
          className="topology-canvas"
          viewBox="0 0 1280 780"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="1" />
            </pattern>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="rgba(15,23,42,0.26)" />
            </filter>
          </defs>

          <rect x="0" y="0" width="1280" height="780" fill="url(#grid)" />

          {links.map((link) => {
            const source = devices.find((item) => item.id === link.source_id);
            const target = devices.find((item) => item.id === link.target_id);
            if (!source || !target) return null;

            const x1 = posX(source);
            const y1 = posY(source);
            const x2 = posX(target);
            const y2 = posY(target);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const { stroke, width } = lineStyle(link.bandwidth);

            return (
              <g key={link.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={width}
                  strokeOpacity="0.82"
                  strokeDasharray={link.link_type === 'ethernet' ? '8 8' : undefined}
                />
                <text x={mx} y={my - 10} className="topology-link-label" fill={stroke}>
                  {link.bandwidth}
                </text>
              </g>
            );
          })}

          {devices.map((device) => {
            const x = posX(device);
            const y = posY(device);
            const selected = device.id === selectedDeviceId;
            const color = STATUS_COLOR[device.status];

            return (
              <g
                key={device.id}
                transform={`translate(${x}, ${y})`}
                className="topology-node"
                onMouseDown={(event) => handleMouseDown(event, device.id)}
                onClick={() => onSelectDevice(device.id)}
              >
                {selected && <circle r="58" fill="none" stroke={color} strokeWidth="2" strokeDasharray="8 8" opacity="0.55" />}
                <circle r="48" fill="rgba(15,23,42,0.72)" stroke={selected ? color : 'rgba(148,163,184,0.45)'} strokeWidth="2" filter="url(#nodeGlow)" />
                <circle r="36" fill="rgba(255,255,255,0.06)" stroke={color} strokeWidth="1.6" />
                <text textAnchor="middle" dominantBaseline="middle" className="topology-node-glyph" fill={color}>
                  {TYPE_GLYPH[device.device_type]}
                </text>
                <circle cx="28" cy="-28" r="7" fill={color} />
                <text y="72" textAnchor="middle" className="topology-node-label">
                  {device.hostname}
                </text>
                <text y="90" textAnchor="middle" className="topology-node-subtitle">
                  {device.ip_address}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
