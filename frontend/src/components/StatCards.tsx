import React from 'react';
import type { Summary } from '../types';

interface Props {
  summary: Summary | null;
  deviceCount: number;
  linkCount: number;
  onlinePct: number;
}

interface CardItem {
  label: string;
  value: string | number;
  tone: 'cyan' | 'green' | 'amber' | 'rose' | 'slate';
  footnote: string;
}

export default function StatCards({ summary, deviceCount, linkCount, onlinePct }: Props) {
  const items: CardItem[] = [
    {
      label: 'Devices monitored',
      value: summary?.total_devices ?? deviceCount,
      tone: 'cyan',
      footnote: `${linkCount} topology links discovered`,
    },
    {
      label: 'Online coverage',
      value: `${onlinePct}%`,
      tone: 'green',
      footnote: `${summary?.online ?? 0} healthy devices`,
    },
    {
      label: 'Needs attention',
      value: (summary?.degraded ?? 0) + (summary?.offline ?? 0),
      tone: 'amber',
      footnote: `${summary?.degraded ?? 0} degraded · ${summary?.offline ?? 0} offline`,
    },
    {
      label: 'Open alerts',
      value: summary?.alerts ?? 0,
      tone: (summary?.alerts ?? 0) > 0 ? 'rose' : 'slate',
      footnote: (summary?.alerts ?? 0) > 0 ? 'Investigate highlighted nodes' : 'No active incidents',
    },
  ];

  return (
    <section className="stat-grid">
      {items.map((item) => (
        <article key={item.label} className={`stat-card tone-${item.tone}`}>
          <div className="stat-card-head">
            <span className="stat-label">{item.label}</span>
            <span className="stat-pulse" />
          </div>
          <div className="stat-value">{item.value}</div>
          <div className="stat-footnote">{item.footnote}</div>
        </article>
      ))}
    </section>
  );
}
