import { dataStore } from './dataStore';
import { normalizeText } from './normalization';
import { normalizeBusinessDate } from './dateService.js';
import { resolvePlanningEnrichment } from './gateSlipLookup';
import { getLoadingPointMappings, loadingPointsMatch } from './loadingPointMappingService.js';

function groupKey(date, name, loading) {
  const datePart = normalizeBusinessDate(date) || '';
  return `${datePart}|${normalizeText(name)}|${normalizeText(loading)}`;
}

export function getDashboardAlerts() {
  const planning = dataStore.getPlanning();
  const status = dataStore.getStatus();
  const mappings = getLoadingPointMappings();
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

  const matchedPlanning = new Set();
  const matchedStatus = new Set();
  const alerts = [];

  planningGroups.forEach((plan, planKey) => {
    if (statusGroups.has(planKey)) {
      matchedPlanning.add(planKey); matchedStatus.add(planKey); return;
    }
    const mappedMatches = Array.from(statusGroups.entries()).filter(([statusKey, call]) =>
      normalizeBusinessDate(call.demandedDate) === normalizeBusinessDate(plan.date)
      && normalizeText(call.location) === normalizeText(plan.cfa)
      && loadingPointsMatch(plan.loading, call.loadingPoint, mappings));
    if (mappedMatches.length === 1) {
      matchedPlanning.add(planKey); matchedStatus.add(mappedMatches[0][0]);
    } else if (mappedMatches.length > 1) {
      alerts.push({ date: plan.date, name: plan.cfa, loading: plan.loading, remarks: 'Loading Point Match Required' });
    } else {
      const sameDateCfa = Array.from(statusGroups.values()).some((call) =>
        normalizeBusinessDate(call.demandedDate) === normalizeBusinessDate(plan.date)
        && normalizeText(call.location) === normalizeText(plan.cfa));
      if (sameDateCfa) alerts.push({ date: plan.date, name: plan.cfa, loading: plan.loading, remarks: 'Loading Point Match Required' });
      else alerts.push({ date: plan.date, name: plan.cfa, loading: plan.loading, remarks: 'Vehicle Call Pending' });
    }
  });

  statusGroups.forEach((call, statusKey) => {
    if (matchedStatus.has(statusKey)) return;
    const sameDateCfaPlan = Array.from(planningGroups.entries()).some(([planKey, plan]) =>
      normalizeBusinessDate(plan.date) === normalizeBusinessDate(call.demandedDate)
      && normalizeText(plan.cfa) === normalizeText(call.location));
    if (sameDateCfaPlan) alerts.push({ date: call.demandedDate, name: call.location, loading: call.loadingPoint, remarks: 'Loading Point Match Required' });
    else alerts.push({ date: call.demandedDate, name: call.location, loading: call.loadingPoint, remarks: 'Plan Pending' });
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
