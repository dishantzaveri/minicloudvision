/**
 * api/client.ts
 *
 * A thin typed wrapper around fetch. All API calls go through here.
 *
 * Benefits vs. calling fetch() directly everywhere:
 *  - One place to add auth headers, error handling, base URL
 *  - TypeScript generics give you type safety on every response
 *  - Easy to swap out for axios or React Query later
 */

import type { Device, DeviceFormData, DeviceStats, Link, Summary } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/** Generic fetch helper — throws if response is not 2xx */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export const devicesApi = {
  list:   ()                            => request<Device[]>('/devices'),
  get:    (id: number)                  => request<Device>(`/devices/${id}`),
  create: (data: DeviceFormData)        => request<Device>('/devices',
                                              { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<DeviceFormData>) =>
                                           request<Device>(`/devices/${id}`,
                                              { method: 'PUT',  body: JSON.stringify(data) }),
  delete: (id: number)                  => request<{ message: string }>(`/devices/${id}`,
                                              { method: 'DELETE' }),
};

// ─── Links ───────────────────────────────────────────────────────────────────

export const linksApi = {
  list:   ()                            => request<Link[]>('/links'),
  create: (data: Partial<Link>)         => request<Link>('/links',
                                              { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number)                  => request<{ message: string }>(`/links/${id}`,
                                              { method: 'DELETE' }),
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const statsApi = {
  deviceStats: (id: number) => request<DeviceStats>(`/devices/${id}/stats`),
  summary:     ()           => request<Summary>('/summary'),
};
