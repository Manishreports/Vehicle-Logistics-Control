import { dataStore } from './dataStore';
import { normalizeText } from './normalization';
import { normalizeBusinessDate } from './dateService.js';
import { resolvePlanningEnrichment } from './gateSlipLookup';

function groupKey(date, name, loading) {
  const datePart = normalizeBusinessDate(date) || '';
  return `${datePart}|${normalizeText(name)}|${normalizeText(loading)}`;
}

export function getDashboardAlerts() {
  const planning = dataStore.getPlanning();
  const status = dataStore.getStatus();
  const planningGroups = new Map();
  const statusGroups = new Map();

  planning.forEach((row) => {
    const key = groupKey(row.date, row.cfa, row.loading);
    if (key !== '||') planningGroups.set(key, row);
  });
  status.forEach((row) => {
    const key = groupKey(row.demandedDate, row.location, row.loadingPoint);
    if (key !== '||') statusGroups.set(key, row);
  });

  const alerts = [];
  planningGroups.forEach((row, key) => {
    if (!statusGroups.has(key)) alerts.push({ date: row.date, name: row.cfa, loading: row.loading, remarks: 'Vehicle Call Pending' });
  });
  statusGroups.forEach((row, key) => {
    if (!planningGroups.has(key)) alerts.push({ date: row.demandedDate, name: row.location, loading: row.loadingPoint, remarks: 'Plan Pending' });
  });

  return alerts;
}

export function getDashboardMetrics() {
  return {
    totalPlannedVehicles: dataStore.getPlanning().length,
    vehicleCalled: dataStore.getStatus().length
  };
}

export function getVehiclePlanningOverview() {
  const rows = resolvePlanningEnrichment(dataStore.getPlanning(), dataStore.getGateIn(), dataStore.getGateOut());
  return rows.reduce((acc, row) => {
    const hasIn = Boolean(String(row.vehicleIn ?? '').trim());
    const hasOut = Boolean(String(row.vehicleOut ?? '').trim());
    if (hasIn && hasOut) acc.dispatched += 1;
    else if (hasIn) acc.onloading += 1;
    else acc.pending += 1;
    return acc;
  }, { dispatched: 0, onloading: 0, pending: 0 });
}

export function calculateCorePending() { return null; }
export function calculatePartialPending() { return null; }
