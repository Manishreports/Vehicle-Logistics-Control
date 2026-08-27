import { dataStore } from './dataStore';
import { normalizeDate, normalizeText } from './normalization';

function groupKey(date, name, loading) {
  const datePart = normalizeDate(date) || '';
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
