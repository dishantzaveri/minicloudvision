import React, { useEffect, useMemo, useState } from 'react';
import { devicesApi, linksApi, statsApi } from './api/client';
import type { ActiveView, Device, DeviceFormData, Link, Summary } from './types';
import StatCards from './components/StatCards';
import DeviceTable from './components/DeviceTable';
import TopologyGraph from './components/TopologyGraph';
import StatsPanel from './components/StatsPanel';
import DeviceModal from './components/DeviceModal';

const NAV_ITEMS: Array<{ key: ActiveView; label: string; icon: string; hint: string }> = [
  { key: 'dashboard', label: 'Overview', icon: '◫', hint: 'Command center' },
  { key: 'topology', label: 'Topology', icon: '◎', hint: 'Live fabric map' },
  { key: 'devices', label: 'Devices', icon: '▣', hint: 'Inventory & health' },
];

function greetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatLastUpdated() {
  return new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function App() {
  const [view, setView] = useState<ActiveView>('dashboard');
  const [devices, setDevices] = useState<Device[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(formatLastUpdated());

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [devs, lnks, sum] = await Promise.all([
          devicesApi.list(),
          linksApi.list(),
          statsApi.summary(),
        ]);
        setDevices(devs);
        setLinks(lnks);
        setSummary(sum);
        setLastUpdated(formatLastUpdated());
        if (!selectedDeviceId && devs.length > 0) {
          setSelectedDeviceId(devs[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [selectedDeviceId]);

  async function refreshSummary() {
    const sum = await statsApi.summary();
    setSummary(sum);
    setLastUpdated(formatLastUpdated());
  }

  async function handleAddDevice(data: DeviceFormData) {
    setMutating(true);
    try {
      const created = await devicesApi.create(data);
      setDevices((prev) => [...prev, created]);
      setSelectedDeviceId(created.id);
      await refreshSummary();
    } finally {
      setMutating(false);
    }
  }

  async function handleDeleteDevice(id: number) {
    setMutating(true);
    try {
      await devicesApi.delete(id);
      setDevices((prev) => prev.filter((device) => device.id !== id));
      setLinks((prev) => prev.filter((link) => link.source_id !== id && link.target_id !== id));
      if (selectedDeviceId === id) {
        const next = devices.find((device) => device.id !== id);
        setSelectedDeviceId(next?.id ?? null);
      }
      await refreshSummary();
    } finally {
      setMutating(false);
    }
  }

  function handleDevicesMoved(updated: Device[]) {
    setDevices(updated);
  }

  const selectedDevice = devices.find((device) => device.id === selectedDeviceId) ?? null;

  const onlinePct = useMemo(() => {
    if (!summary || summary.total_devices === 0) return 0;
    return Math.round((summary.online / summary.total_devices) * 100);
  }, [summary]);

  const degradedOrOffline = (summary?.degraded ?? 0) + (summary?.offline ?? 0);

  const topologyHealth = useMemo(() => {
    if (devices.length === 0) return 'Awaiting telemetry';
    if ((summary?.offline ?? 0) > 0) return 'Attention required';
    if ((summary?.degraded ?? 0) > 0) return 'Stable with warnings';
    return 'Healthy fabric';
  }, [devices.length, summary]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">◈</div>
          <div>
            <div className="brand-title">NetWatch</div>
            <div className="brand-subtitle">Arista NOC</div>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav className="nav-stack">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-button ${view === item.key ? 'active' : ''}`}
              onClick={() => setView(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-copy">
                <span className="nav-label">{item.label}</span>
                <span className="nav-hint">{item.hint}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-card status-rail">
          <div className="sidebar-card-title">Fabric snapshot</div>
          <div className="mini-stat-row">
            <span>Total devices</span>
            <strong>{summary?.total_devices ?? devices.length}</strong>
          </div>
          <div className="mini-stat-row success">
            <span>Online</span>
            <strong>{summary?.online ?? 0}</strong>
          </div>
          <div className="mini-stat-row warning">
            <span>Degraded</span>
            <strong>{summary?.degraded ?? 0}</strong>
          </div>
          <div className="mini-stat-row danger">
            <span>Offline</span>
            <strong>{summary?.offline ?? 0}</strong>
          </div>
          <div className="sidebar-divider" />
          <div className="coverage-block">
            <span className="coverage-label">Operational coverage</span>
            <strong className="coverage-value">{onlinePct}%</strong>
            <div className="progress-track compact">
              <div className="progress-fill" style={{ width: `${onlinePct}%` }} />
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-label">Last sync</div>
          <div className="sidebar-footer-value">{lastUpdated}</div>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">{greetingByTime()}, network team</div>
            <h1 className="page-title">
              {view === 'dashboard' && 'Network Operations Dashboard'}
              {view === 'topology' && 'Full-screen Topology Monitor'}
              {view === 'devices' && 'Device Inventory & Live Health'}
            </h1>
            <p className="page-subtitle">
              Real-time network visibility for your core, access, edge, and security layers.
            </p>
          </div>

          <div className="topbar-actions">
            <div className="hero-chip">
              <span className="hero-chip-label">Network state</span>
              <span className={`hero-chip-value ${degradedOrOffline > 0 ? 'warning' : 'success'}`}>
                {topologyHealth}
              </span>
            </div>
            <div className="hero-chip">
              <span className="hero-chip-label">Alerts</span>
              <span className={`hero-chip-value ${(summary?.alerts ?? 0) > 0 ? 'warning' : 'neutral'}`}>
                {summary?.alerts ?? 0}
              </span>
            </div>
            <button className="btn btn-primary hero-button" onClick={() => setShowModal(true)}>
              + Add Device
            </button>
          </div>
        </header>

        {error && (
          <div className="alert-banner">
            <span>Unable to refresh telemetry.</span>
            <strong>{error}</strong>
          </div>
        )}

        {loading ? (
          <section className="loading-shell">
            <div className="loading-card">
              <div className="loading-orb" />
              <div>
                <h3>Loading live network data…</h3>
                <p>Pulling devices, topology links, and summary health metrics.</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="content-shell">
            <StatCards summary={summary} deviceCount={devices.length} linkCount={links.length} onlinePct={onlinePct} />

            {view === 'dashboard' && (
              <div className="dashboard-grid full-bleed-grid">
                <section className="panel panel-topology wide-panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Live fabric</div>
                      <h2 className="panel-title">Topology Overview</h2>
                    </div>
                    <div className="panel-head-meta">{links.length} active links</div>
                  </div>
                  <TopologyGraph
                    devices={devices}
                    links={links}
                    selectedDeviceId={selectedDeviceId}
                    onSelectDevice={setSelectedDeviceId}
                    onDevicesMoved={handleDevicesMoved}
                  />
                </section>

                <section className="panel panel-insights side-panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Selected node</div>
                      <h2 className="panel-title">Telemetry Insights</h2>
                    </div>
                    <div className="panel-head-meta">Updated {lastUpdated}</div>
                  </div>
                  {selectedDevice ? (
                    <StatsPanel device={selectedDevice} />
                  ) : (
                    <div className="empty-state">Select a device from the topology to inspect its live metrics.</div>
                  )}
                </section>

                <section className="panel panel-table wide-panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Operations queue</div>
                      <h2 className="panel-title">Device Overview</h2>
                    </div>
                    <div className="panel-head-meta">{mutating ? 'Saving changes…' : 'Click a row for deep dive'}</div>
                  </div>
                  <DeviceTable
                    devices={devices}
                    selectedDeviceId={selectedDeviceId}
                    onSelect={setSelectedDeviceId}
                    onDelete={handleDeleteDevice}
                    onAddClick={() => setShowModal(true)}
                  />
                </section>
              </div>
            )}

            {view === 'topology' && (
              <div className="view-grid view-grid-topology">
                <section className="panel panel-topology tall-panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Topology workspace</div>
                      <h2 className="panel-title">Interactive Network Map</h2>
                    </div>
                    <div className="panel-head-meta">Drag nodes to re-arrange</div>
                  </div>
                  <TopologyGraph
                    devices={devices}
                    links={links}
                    selectedDeviceId={selectedDeviceId}
                    onSelectDevice={setSelectedDeviceId}
                    onDevicesMoved={handleDevicesMoved}
                  />
                </section>

                <section className="panel panel-insights">
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Telemetry spotlight</div>
                      <h2 className="panel-title">Device Details</h2>
                    </div>
                  </div>
                  {selectedDevice ? (
                    <StatsPanel device={selectedDevice} />
                  ) : (
                    <div className="empty-state">Select a topology node to inspect health, utilization, and interfaces.</div>
                  )}
                </section>
              </div>
            )}

            {view === 'devices' && (
              <div className="view-grid view-grid-devices">
                <section className="panel panel-table tall-panel">
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Inventory workspace</div>
                      <h2 className="panel-title">Managed Devices</h2>
                    </div>
                    <div className="panel-head-meta">{devices.length} devices under monitoring</div>
                  </div>
                  <DeviceTable
                    devices={devices}
                    selectedDeviceId={selectedDeviceId}
                    onSelect={setSelectedDeviceId}
                    onDelete={handleDeleteDevice}
                    onAddClick={() => setShowModal(true)}
                  />
                </section>

                <section className="panel panel-insights">
                  <div className="panel-head">
                    <div>
                      <div className="panel-kicker">Telemetry spotlight</div>
                      <h2 className="panel-title">Live Device Health</h2>
                    </div>
                  </div>
                  {selectedDevice ? (
                    <StatsPanel device={selectedDevice} />
                  ) : (
                    <div className="empty-state">Choose a device row to inspect live telemetry and port-level data.</div>
                  )}
                </section>
              </div>
            )}
          </section>
        )}
      </main>

      {showModal && (
        <DeviceModal onClose={() => setShowModal(false)} onSubmit={handleAddDevice} />
      )}
    </div>
  );
}
