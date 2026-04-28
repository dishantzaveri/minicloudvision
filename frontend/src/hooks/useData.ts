/**
 * hooks/useData.ts
 *
 * Custom hooks that encapsulate data fetching + polling.
 *
 * Pattern: each hook returns { data, loading, error, refetch }
 * This is the same shape React Query uses, so migrating later is trivial.
 *
 * Auto-refresh: pass refreshInterval (ms) to get live updates.
 * The topology & stats panels poll every 30 seconds.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { devicesApi, linksApi, statsApi } from '../api/client';
import type { Device, DeviceStats, Link, Summary } from '../types';

// ─── Generic fetch hook ───────────────────────────────────────────────────────

function useAsync<T>(
  fetcher: () => Promise<T>,
  refreshInterval?: number
): { data: T | null; loading: boolean; error: string | null; refetch: () => void } {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);   // eslint-disable-line

  // Initial fetch
  useEffect(() => { fetch(); }, [fetch]);

  // Optional polling
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!refreshInterval) return;
    intervalRef.current = setInterval(fetch, refreshInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetch, refreshInterval]);

  return { data, loading, error, refetch: fetch };
}

// ─── Public hooks ─────────────────────────────────────────────────────────────

/** All devices — refreshes every 30s */
export function useDevices() {
  return useAsync<Device[]>(devicesApi.list, 30_000);
}

/** All topology links */
export function useLinks() {
  return useAsync<Link[]>(linksApi.list, 30_000);
}

/** Dashboard summary counts — refreshes every 20s */
export function useSummary() {
  return useAsync<Summary>(statsApi.summary, 20_000);
}

/** Stats for a single device — refreshes every 10s when mounted */
export function useDeviceStats(deviceId: number | null) {
  return useAsync<DeviceStats>(
    () => deviceId ? statsApi.deviceStats(deviceId) : Promise.resolve(null as any),
    deviceId ? 10_000 : undefined
  );
}
