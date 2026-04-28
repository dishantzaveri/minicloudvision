import React, { useMemo, useState } from 'react';
import type { Device } from '../types';

interface DeviceTableProps {
  devices: Device[];
  selectedDeviceId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => Promise<void>;
  onAddClick: () => void;
}

const TYPE_ICON: Record<string, string> = {
  switch: '⇄',
  router: '⤴',
  firewall: '🛡',
};

function statusClass(status: Device['status']) {
  if (status === 'online') return 'success';
  if (status === 'degraded') return 'warning';
  return 'danger';
}

export default function DeviceTable({
  devices,
  selectedDeviceId,
  onSelect,
  onDelete,
  onAddClick,
}: DeviceTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  const filteredDevices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return devices;
    return devices.filter((device) =>
      [device.hostname, device.ip_address, device.model, device.location, device.device_type]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [devices, query]);

  const handleDelete = async (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    if (!window.confirm('Delete this device and its associated links?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="device-table-shell">
      <div className="device-table-toolbar">
        <div className="table-search-wrap">
          <span className="table-search-icon">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by hostname, IP, model, or location"
            className="table-search-input"
          />
        </div>
        <button className="btn btn-primary" onClick={onAddClick}>
          + Add Device
        </button>
      </div>

      <div className="device-table-scroll">
        <table className="device-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Hostname</th>
              <th>IP Address</th>
              <th>Model</th>
              <th>Location</th>
              <th>Status</th>
              <th>OS</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => {
              const isSelected = device.id === selectedDeviceId;
              return (
                <tr
                  key={device.id}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => onSelect(device.id)}
                >
                  <td>
                    <div className="device-type-pill">
                      <span className="device-type-icon">{TYPE_ICON[device.device_type] ?? '•'}</span>
                      <span>{device.device_type}</span>
                    </div>
                  </td>
                  <td>
                    <div className="hostname-block">
                      <strong>{device.hostname}</strong>
                      <span>ID #{device.id}</span>
                    </div>
                  </td>
                  <td className="mono">{device.ip_address}</td>
                  <td>{device.model || '—'}</td>
                  <td>{device.location || '—'}</td>
                  <td>
                    <span className={`status-badge ${statusClass(device.status)}`}>{device.status}</span>
                  </td>
                  <td className="mono muted">{device.os_version || '—'}</td>
                  <td>
                    <button
                      className="icon-button danger"
                      disabled={deletingId === device.id}
                      onClick={(event) => handleDelete(event, device.id)}
                      title="Delete device"
                    >
                      {deletingId === device.id ? '…' : '✕'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-table-state">
                    <strong>No devices matched your search.</strong>
                    <span>Try another hostname, IP address, or clear the current filter.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
