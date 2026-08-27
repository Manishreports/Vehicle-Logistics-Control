import React, { useCallback, useEffect, useState } from 'react';
import KPICard from '../components/KPICard';
import SectionPanel from '../components/SectionPanel';
import EmptyState from '../components/EmptyState';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { calculateCorePending, calculatePartialPending, getDashboardAlerts, getDashboardMetrics, getVehiclePlanningOverview } from '../services/dashboardService';
import { displayDate } from '../services/normalization';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(getDashboardMetrics);
  const [alerts, setAlerts] = useState(getDashboardAlerts);
  const [overview, setOverview] = useState(getVehiclePlanningOverview);
  const refresh = useCallback(() => { setMetrics(getDashboardMetrics()); setAlerts(getDashboardAlerts()); setOverview(getVehiclePlanningOverview()); }, []);
  useEffect(() => useDataStoreSubscription(refresh), [refresh]);

  return (
    <div className="page-content">
      <section className="kpi-grid">
        <KPICard label="Total Planned Vehicles" value={metrics.totalPlannedVehicles} />
        <KPICard label="Vehicle Called" value={metrics.vehicleCalled} />
        <KPICard label="Pending Vehicles" tone="warning" />
        <KPICard label="Dispatched Vehicles" tone="success" />
        <KPICard label="Cancelled Vehicles" tone="danger" />
      </section>

      <div className="dashboard-grid">
        <SectionPanel title="Vehicle Planning Overview">
          <div className="planning-overview">
            <OverviewBar label="Dispatched" value={overview.dispatched} total={Math.max(1, overview.dispatched + overview.onloading + overview.pending)} />
            <OverviewBar label="Onloading" value={overview.onloading} total={Math.max(1, overview.dispatched + overview.onloading + overview.pending)} />
            <OverviewBar label="Pending" value={overview.pending} total={Math.max(1, overview.dispatched + overview.onloading + overview.pending)} />
          </div>
        </SectionPanel>
        <SectionPanel title="Vehicle Status Overview" subtitle="Reserved for future status analytics">
          <EmptyState title="Vehicle status overview not yet connected" description="Additional operational status analytics can be connected in a later phase." />
        </SectionPanel>
        <SectionPanel title="STO Overview">
          <div className="sto-overview-grid">
            <div className="sto-metric"><span>Core Pending</span><strong>{calculateCorePending() ?? '—'}</strong></div>
            <div className="sto-metric"><span>Partial Pending</span><strong>{calculatePartialPending() ?? '—'}</strong></div>
          </div>
        </SectionPanel>
        <SectionPanel title="Alerts / Exceptions" subtitle="Plan and vehicle-call group comparison">
          {alerts.length ? (
            <div className="table-wrap">
              <table className="enterprise-table dashboard-alert-table">
                <thead><tr><th>Date</th><th>Name</th><th>Loading</th><th>Remarks</th></tr></thead>
                <tbody>{alerts.map((alert, index) => <tr key={`${alert.remarks}-${alert.date}-${alert.name}-${alert.loading}-${index}`}><td>{displayDate(alert.date)}</td><td>{alert.name}</td><td>{alert.loading}</td><td>{alert.remarks}</td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No alerts to display" description="Plan and vehicle-call groups are currently matched." />
          )}
        </SectionPanel>
      </div>
    </div>
  );
}

function OverviewBar({ label, value, total }) {
  const width = total ? Math.round((value / total) * 100) : 0;
  return <div className="overview-bar"><div className="overview-bar-head"><span>{label}</span><strong>{value}</strong></div><div className="overview-track"><div className="overview-fill" style={{ width: `${width}%` }} /></div></div>;
}
