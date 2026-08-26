import React from 'react';

export default function KPICard({ label, value = '0', tone = 'neutral' }) {
  return (
    <div className={`kpi-card tone-${tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-footnote">Foundation metric</div>
    </div>
  );
}
