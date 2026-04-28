import React, { useState } from 'react';
import type { DeviceFormData } from '../types';

interface Props {
  onClose: () => void;
  onSubmit: (data: DeviceFormData) => Promise<void>;
}

const DEFAULT_FORM: DeviceFormData = {
  hostname: '',
  ip_address: '',
  device_type: 'switch',
  model: '',
  os_version: '',
  location: '',
  status: 'online',
  pos_x: 420,
  pos_y: 280,
};

export default function DeviceModal({ onClose, onSubmit }: Props) {
  const [form, setForm] = useState<DeviceFormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof DeviceFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function updateField<K extends keyof DeviceFormData>(key: K, value: DeviceFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof DeviceFormData, string>> = {};

    if (!form.hostname.trim()) nextErrors.hostname = 'Hostname is required.';
    if (!form.ip_address.trim()) nextErrors.ip_address = 'IP address is required.';
    if (form.ip_address && !/^\d{1,3}(\.\d{1,3}){3}$/.test(form.ip_address)) {
      nextErrors.ip_address = 'Use a valid IPv4 address, for example 10.0.1.10';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unable to save this device.');
    } finally {
      setSaving(false);
    }
  }

  function closeOnBackdrop(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={closeOnBackdrop}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Add device">
        <div className="modal-header">
          <div>
            <div className="panel-kicker">Provision new node</div>
            <h2 className="modal-title">Add Device</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-grid two-column">
            <Field label="Hostname" error={errors.hostname}>
              <input value={form.hostname} onChange={(event) => updateField('hostname', event.target.value)} placeholder="leaf-04" />
            </Field>
            <Field label="IP Address" error={errors.ip_address}>
              <input value={form.ip_address} onChange={(event) => updateField('ip_address', event.target.value)} placeholder="10.0.1.4" />
            </Field>
            <Field label="Device Type">
              <select value={form.device_type} onChange={(event) => updateField('device_type', event.target.value as DeviceFormData['device_type'])}>
                <option value="switch">Switch</option>
                <option value="router">Router</option>
                <option value="firewall">Firewall</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(event) => updateField('status', event.target.value as DeviceFormData['status'])}>
                <option value="online">Online</option>
                <option value="degraded">Degraded</option>
                <option value="offline">Offline</option>
              </select>
            </Field>
            <Field label="Model">
              <input value={form.model} onChange={(event) => updateField('model', event.target.value)} placeholder="Arista 7050X3" />
            </Field>
            <Field label="OS Version">
              <input value={form.os_version} onChange={(event) => updateField('os_version', event.target.value)} placeholder="EOS 4.30.1F" />
            </Field>
          </div>

          <Field label="Location">
            <input value={form.location} onChange={(event) => updateField('location', event.target.value)} placeholder="DC1 / Rack B4" />
          </Field>

          {apiError && <div className="alert-banner modal-alert">{apiError}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
