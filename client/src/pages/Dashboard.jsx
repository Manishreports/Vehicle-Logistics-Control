import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/KPICard';
import SectionPanel from '../components/SectionPanel';
import EmptyState from '../components/EmptyState';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { calculateCorePending, calculatePartialPending, getDashboardAlertCounts, getDashboardAlerts, getDashboardMetrics, getVehiclePlanningOverview } from '../services/dashboardService';
import { displayBusinessDate } from '../services/dateService.js';
import { deleteLoadingPointMapping, getLoadingPointMappings, saveLoadingPointMapping, updateLoadingPointMapping } from '../services/loadingPointMappingService.js';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(getDashboardMetrics);
  const [alerts, setAlerts] = useState(getDashboardAlerts);
  const [overview, setOverview] = useState(getVehiclePlanningOverview);
  const [alertCounts, setAlertCounts] = useState(getDashboardAlertCounts);
  const [alertLimit, setAlertLimit] = useState(5);
  const refresh = useCallback(() => { setMetrics(getDashboardMetrics()); setAlerts(getDashboardAlerts()); setAlertCounts(getDashboardAlertCounts()); setOverview(getVehiclePlanningOverview()); }, []);
  useEffect(() => useDataStoreSubscription(refresh), [refresh]);

  const navigate = useNavigate();
  const alertTargetMap = {
    'Plan Pending': '/vehicle-status',
    'Vehicle Call Pending': '/vehicle-planning'
  };

  const buildAlertFocusParams = (alertsToFocus) => {
    const params = new URLSearchParams();
    const first = alertsToFocus[0] || {};
    params.set('alertType', String(first.remarks ?? ''));
    params.set('alertFocus', JSON.stringify(alertsToFocus.map((alert) => ({
      date: alert.date ?? '',
      name: alert.name ?? '',
      loading: alert.loading ?? '',
      remarks: alert.remarks ?? ''
    }))));
    return params;
  };

  const navigateToAlert = (alert) => {
    const target = alertTargetMap[alert.remarks] || '/vehicle-status';
    const params = buildAlertFocusParams([alert]);
    navigate(target + '?' + params.toString());
  };

  const navigateToAlertSummary = (type) => {
    const matching = alerts.filter((alert) => alert.remarks === type);
    const target = alertTargetMap[type] || '/vehicle-status';
    const params = buildAlertFocusParams(matching);
    navigate(target + '?' + params.toString());
  };

  const displayedAlerts = alertLimit === 'all' ? alerts : alerts.slice(0, Number(alertLimit));
  const overviewTotal = overview.dispatched + overview.onloading + overview.pending;
  const chartTotal = Math.max(overviewTotal, 1);
  const dispatchedPct = (overview.dispatched / chartTotal) * 100;
  const onloadingPct = ((overview.dispatched + overview.onloading) / chartTotal) * 100;

  function resetApplication() {
    if (!window.confirm('Are you sure you want to reset the application?\n\nAll planning, status, Raipur and uploaded Excel data will be removed.')) return;
    const keys = [
      'vlc.vehiclePlanningData','vlc.vehiclePlanningRawData',
      'vlc.vehicleStatusTrackingData','vlc.vehicleStatusTrackingRawData',
      'vlc.raipurDatabaseData','vlc.raipurDatabaseRawData',
      'vlc.gateInData','vlc.gateOutData','vlc.gateInMeta','vlc.gateOutMeta',
      'vlc.loadingPointMappings','vlc.headerSettings'
    ];
    keys.forEach((key) => window.localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('vlc-data-changed'));
    window.location.reload();
  }

  return (
    <div className="page-content">
      <section className="kpi-grid">
        <KPICard label="Total Planned Vehicles" value={metrics.totalPlannedVehicles} />
        <KPICard label="Vehicle Called" value={metrics.vehicleCalled} />
        <KPICard label="Pending Vehicles" value={metrics.pendingVehicles} tone="warning" />
        <KPICard label="Dispatched Vehicles" value={metrics.dispatchedVehicles} tone="success" />
        <KPICard label="Cancelled Vehicles" value={metrics.cancelledVehicles} tone="danger" />
      </section>

      <div className="dashboard-grid">
        <SectionPanel title="Vehicle Planning Overview">
          <div className="dashboard-chart-card">
            <div style={{ position: 'relative' }}>
              <div className="donut-chart" style={{ '--d': `${dispatchedPct}%`, '--o': `${onloadingPct}%` }} />
              <div className="chart-total"><strong>{overviewTotal}</strong><span>Total</span></div>
            </div>
            <div className="chart-legend">
              <div className="chart-legend-row"><span className="chart-legend-dot" style={{ background: '#2f8e67' }} /><span>Dispatched</span><strong>{overview.dispatched}</strong></div>
              <div className="chart-legend-row"><span className="chart-legend-dot" style={{ background: '#bc8a27' }} /><span>Onloading</span><strong>{overview.onloading}</strong></div>
              <div className="chart-legend-row"><span className="chart-legend-dot" style={{ background: '#a13b3b' }} /><span>Pending</span><strong>{overview.pending}</strong></div>
            </div>
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
        <LoadingPointMatchPanel />
        <SectionPanel title="Alerts / Exceptions" subtitle="Click an alert to open the relevant record(s).">
          <div className="alerts-panel-tools">
            <div className="alert-summary-row">
              <button type="button" className="alert-summary-button plan" onClick={() => navigateToAlertSummary('Plan Pending')}><span>Plan Pending</span><strong>{alertCounts.planPending}</strong></button>
              <button type="button" className="alert-summary-button call" onClick={() => navigateToAlertSummary('Vehicle Call Pending')}><span>Vehicle Call Pending</span><strong>{alertCounts.vehicleCallPending}</strong></button>
            </div>
            <label className="alert-limit">Show <select value={String(alertLimit)} onChange={(e) => setAlertLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}><option value="5">5</option><option value="10">10</option><option value="15">15</option><option value="all">All</option></select></label>
          </div>
          {alerts.length ? (
            <div className="table-wrap">
              <table className="enterprise-table dashboard-alert-table">
                <thead><tr><th>Date</th><th>Name</th><th>Loading</th><th>Remarks</th></tr></thead>
                <tbody>{displayedAlerts.map((alert, index) => <tr key={`${alert.remarks}-${alert.date}-${alert.name}-${alert.loading}-${index}`} className="dashboard-alert-row" tabIndex={0} onClick={() => navigateToAlert(alert)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigateToAlert(alert); } }}><td>{displayBusinessDate(alert.date)}</td><td>{alert.name}</td><td>{alert.loading}</td><td>{alert.remarks}</td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No alerts to display" description="Plan and vehicle-call groups are currently matched." />
          )}
        </SectionPanel>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <button className="button secondary reset-card" type="button" onClick={resetApplication}>Reset Application</button>
      </div>
    </div>
  );
}

function LoadingPointMatchPanel() {
  const [mappings, setMappings] = useState(getLoadingPointMappings);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => useDataStoreSubscription(() => setMappings(getLoadingPointMappings())), []);

  function resetForm() { setSource(''); setTarget(''); setEditingId(''); }

  function save() {
    const result = editingId
      ? updateLoadingPointMapping(editingId, source, target)
      : saveLoadingPointMapping(source, target);
    if (!result.ok) { setMessage(result.message); return; }
    setMessage(editingId ? 'Loading Point mapping updated.' : 'Loading Point mapping saved.');
    setMappings(getLoadingPointMappings());
    resetForm();
  }

  function edit(mapping) {
    setEditingId(mapping.id); setSource(mapping.source); setTarget(mapping.target); setMessage('');
  }

  function remove(mapping) {
    if (!window.confirm(`Delete mapping \"${mapping.source} = ${mapping.target}\"?`)) return;
    deleteLoadingPointMapping(mapping.id);
    setMappings(getLoadingPointMappings());
    setMessage('Loading Point mapping deleted.');
    if (editingId === mapping.id) resetForm();
  }

  return (
    <SectionPanel title="Loading Point Match" subtitle="Define equivalent Page 1 and Page 2 Loading Point names for matching.">
      <div className="loading-map-form">
        <label>Source Loading Point<input value={source} onChange={(e) => setSource(e.target.value)} placeholder="TOLAGAON LOADING" /></label>
        <span className="loading-map-equals">=</span>
        <label>Match With<input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Tolagaon" /></label>
        <button className="button primary" onClick={save}>{editingId ? 'Update Mapping' : '+ Add Mapping'}</button>
        {editingId && <button className="button secondary" onClick={resetForm}>Cancel</button>}
      </div>
      {message && <div className="inline-message">{message}</div>}
      <div className="loading-map-list">
        {mappings.length ? mappings.map((mapping) => (
          <div className="loading-map-row" key={mapping.id}>
            <span>{mapping.source}</span><strong>=</strong><span>{mapping.target}</span>
            <div className="loading-map-actions"><button className="text-button" onClick={() => edit(mapping)}>Edit</button><button className="text-button danger" onClick={() => remove(mapping)}>Delete</button></div>
          </div>
        )) : <div className="loading-map-empty">No Loading Point mappings saved.</div>}
      </div>
    </SectionPanel>
  );
}

function OverviewBar({ label, value, total }) {
  const width = total ? Math.round((value / total) * 100) : 0;
  return <div className="overview-bar"><div className="overview-bar-head"><span>{label}</span><strong>{value}</strong></div><div className="overview-track"><div className="overview-fill" style={{ width: `${width}%` }} /></div></div>;
}
