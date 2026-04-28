/**
 * types/index.ts
 *
 * All TypeScript interfaces live here. This is the "contract" between
 * your frontend and backend. When you change a backend model, update here first.
 *
 * Interview tip: Keeping types in one file makes it trivial to answer
 * "walk me through your data model."
 */

// ─── Device ──────────────────────────────────────────────────────────────────

export type DeviceType   = 'switch' | 'router' | 'firewall';
export type DeviceStatus = 'online' | 'offline' | 'degraded';

export interface Device {
  id:          number;
  hostname:    string;
  ip_address:  string;
  device_type: DeviceType;
  model:       string;
  os_version:  string;
  location:    string;
  status:      DeviceStatus;
  pos_x:       number;
  pos_y:       number;
  created_at:  string;
}

// Form data when creating/editing a device (id + created_at are server-generated)
export type DeviceFormData = Omit<Device, 'id' | 'created_at'>;

// ─── Link ────────────────────────────────────────────────────────────────────

export interface Link {
  id:               number;
  source_id:        number;
  target_id:        number;
  link_type:        string;
  bandwidth:        string;
  source_hostname:  string;
  target_hostname:  string;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface NetworkInterface {
  name:    string;
  status:  'up' | 'down';
  rx_mbps: number;
  tx_mbps: number;
  errors:  number;
}

export interface DeviceStats {
  device_id:      number;
  cpu_percent:    number;
  memory_percent: number;
  uptime:         string;
  interfaces:     NetworkInterface[];
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface Summary {
  total_devices: number;
  online:        number;
  offline:       number;
  degraded:      number;
  alerts:        number;
}

// ─── UI State ────────────────────────────────────────────────────────────────

export type ActiveView = 'dashboard' | 'topology' | 'devices';
