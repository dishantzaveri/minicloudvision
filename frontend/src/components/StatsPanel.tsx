import React from 'react';
import type { Device } from '../types';
import { useDeviceStats } from '../hooks/useData';

interface Props {
  device: Device;
}

function healthScore(cpu: number, memory: number, errors: number) {
  const penalty = cpu * 0.25 + memory * 0.2 + Math.min(errors * 2, 20);
  return Math.max(48, Math.round(100 - penalty));
}

function toneClass(value: number) {
  if (value >= 85) return 'danger';
  if (value >= 65) return 'warning';
  return 'success';
}

function ResourceBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="resource-block">
      <div className="resource-row">
        <span>{label}</span>
        <strong className={toneClass(value)}>{value}%</strong>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${toneClass(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function StatsPanel({ device }: Props) {
  const { data: stats, loading, error } = useDeviceStats(device.id);

  if (loading) {
    return (
      <div className="stats-panel loading-card-small">
        <div className="loading-orb small" />
        <div>
          <h3>Loading telemetry…</h3>
          <p>Gathering performance and interface counters for {device.hostname}.</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="stats-panel empty-state">
        Unable to load telemetry for <strong>{device.hostname}</strong>.
      </div>
    );
  }

  const activeInterfaces = stats.interfaces.filter((item) => item.status === 'up').length;
  const totalErrors = stats.interfaces.reduce((sum, item) => sum + item.errors, 0);
  const score = healthScore(stats.cpu_percent, stats.memory_percent, totalErrors);

  return (
    <div className="stats-panel">
      <div className="device-profile-card">
        <div>
          <div className="device-profile-title">{device.hostname}</div>
          <div className="device-profile-subtitle">
            {device.ip_address} · {device.model || device.device_type}
          </div>
        </div>
        <span className={`status-badge ${device.status === 'online' ? 'success' : device.status === 'degraded' ? 'warning' : 'danger'}`}>
          {device.status}
        </span>
      </div>

      <div className="score-grid">
        <div className="score-card score-highlight">
          <span className="score-label">Health score</span>
          <strong>{score}</strong>
          <span className="score-note">Composite health based on CPU, memory, and interface errors.</span>
        </div>
        <div className="score-card">
          <span className="score-label">Uptime</span>
          <strong>{stats.uptime}</strong>
          <span className="score-note">Stable runtime for this device.</span>
        </div>
        <div className="score-card">
          <span className="score-label">Interfaces up</span>
          <strong>{activeInterfaces}</strong>
          <span className="score-note">of {stats.interfaces.length} monitored interfaces.</span>
        </div>
      </div>

      <div className="surface-card">
        <div className="section-title">System utilization</div>
        <ResourceBar label="CPU" value={stats.cpu_percent} />
        <ResourceBar label="Memory" value={stats.memory_percent} />
      </div>

      <div className="surface-card">
        <div className="section-title">Interface telemetry</div>
        <div className="interface-list">
          <div className="interface-head">
            <span>Port</span>
            <span>RX</span>
            <span>TX</span>
            <span>Err</span>
          </div>
          {stats.interfaces.map((iface) => (
            <div key={iface.name} className={`interface-row ${iface.status === 'down' ? 'dim' : ''}`}>
              <span className="port-name">
                <span className={`port-dot ${iface.status === 'up' ? 'up' : 'down'}`} />
                {iface.name}
              </span>
              <span className="mono">{iface.rx_mbps}</span>
              <span className="mono">{iface.tx_mbps}</span>
              <span className={`mono ${iface.errors > 0 ? 'warning' : 'muted'}`}>{iface.errors}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
