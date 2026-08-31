import { dataStore } from './dataStore';
import { normalizeText } from './normalization';
import { normalizeBusinessDate } from './dateService.js';
import { resolvePlanningEnrichment } from './gateSlipLookup';
import { getVehiclePlanningData } from './vehiclePlanningService.js';
import { getVehicleStatusExceptions } from './vehicleStatusService.js';
import { getLoadingPointMappings, loadingPointsMatch } from './loadingPointMappingService.js';

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

  const mappedStatus = getVehicleStatusExceptions();
  const matchedStatusKeys = new Set();
  const alerts = [];

  for (const plan of planningGroups.values()) {
    const exactKey = groupKey(plan.date, plan.cfa, plan.loading);
    if (statusGroups.has(exactKey)) {
      matchedStatusKeys.add(exactKey);
      continue;
    }
    const mapped = Array.from(statusGroups.entries()).filter(([statusKey, call]) =>
      normalizeBusinessDate(call.demandedDate) === normalizeBusinessDate(plan.date)
      && normalizeText(call.location) === normalizeText(plan.cfa)
      && loadingPointsMatch(plan.loading, call.loadingPoint, getLoadingPointMappings())
    );
    if (mapped.length === 1) {
      matchedStatusKeys.add(mapped[0][0]);
      continue;
    }
    if (mapped.length > 1) {
      alerts.push({ date: plan.date, name: plan.cfa, loading: plan.loading, remarks: 'Loading Point Match Required' });
      continue;
    }
    const sameDateCfa = Array.from(statusGroups.values()).some((call) =>
      normalizeBusinessDate(call.demandedDate) === normalizeBusinessDate(plan.date)
      && normalizeText(call.location) === normalizeText(plan.cfa)
    );
    alerts.push({
      date: plan.date,
      name: plan.cfa,
      loading: plan.loading,
      remarks: sameDateCfa ? 'Loading Point Match Required' : 'Vehicle Call Pending'
    });
  }

  for (const [statusKey, call] of statusGroups.entries()) {
    if (matchedStatusKeys.has(statusKey)) continue;
    const sameDateCfaPlan = Array.from(planningGroups.values()).some((plan) =>
      normalizeBusinessDate(plan.date) === normalizeBusinessDate(call.demandedDate)
      && normalizeText(plan.cfa) === normalizeText(call.location)
    );
    if (sameDateCfaPlan) {
      alerts.push({ date: call.demandedDate, name: call.location, loading: call.loadingPoint, remarks: 'Loading Point Match Required' });
    } else {
      alerts.push({ date: call.demandedDate, name: call.location, loading: call.loadingPoint, remarks: 'Plan Pending' });
    }
  }

  // Add fresh Vehicle Status exceptions only for matched Page 1 groups where gate data is missing/conflicted.
  // Page 1/2 existence exceptions above remain the authoritative group-level alerts.
  for (const exception of mappedStatus) {
    if (exception.type === 'GATE_SLIP_CONFLICT' || exception.type === 'GATE_SLIP_MISSING'
      || exception.type === 'GATE_IN_MISSING' || exception.type === 'GATE_OUT_MISSING') {
      alerts.push({
        date: exception.date,
        name: exception.name,
        loading: exception.loading,
        remarks: exception.type === 'GATE_SLIP_CONFLICT' ? 'Gate Slip Conflict'
          : exception.type === 'GATE_SLIP_MISSING' ? 'Gate Slip Missing'
            : exception.type === 'GATE_IN_MISSING' ? 'Gate In Missing' : 'Gate Out Missing'
      });
    }
  }
  return alerts;
}

function isCancelledPlanningRecord(row) {
  const fields = [row.vehicleIn, row.vehicleNumber, row.vehicleOut, row.slipNumber];
  return fields.some((value) => /cancel/i.test(String(value ?? '').trim()));
}

function getVehiclePlanningDataForMetrics() {
  return getVehiclePlanningData();
}

function isPendingVehicleIn(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return !normalized || normalized === 'pending';
}

export function getPendingVehicleCount() {
  return getVehiclePlanningDataForMetrics().filter((row) => isPendingVehicleIn(row.vehicleIn) && !isCancelledPlanningRecord(row)).length;
}

export function getDispatchedVehicleCount() {
  return getVehiclePlanningDataForMetrics().filter((row) => !isCancelledPlanningRecord(row) && Boolean(String(row.vehicleOut ?? '').trim())).length;
}

export function getCancelledVehicleCount() {
  return getVehiclePlanningDataForMetrics().filter(isCancelledPlanningRecord).length;
}

export function getDashboardAlertCounts() {
  return getDashboardAlerts().reduce((counts, alert) => {
    if (alert.remarks === 'Plan Pending') counts.planPending += 1;
    if (alert.remarks === 'Vehicle Call Pending') counts.vehicleCallPending += 1;
    return counts;
  }, { planPending: 0, vehicleCallPending: 0 });
}

export function getDashboardMetrics() {
  const planning = getVehiclePlanningDataForMetrics();
  return {
    totalPlannedVehicles: planning.length,
    vehicleCalled: dataStore.getStatus().length,
    pendingVehicles: planning.filter((row) => isPendingVehicleIn(row.vehicleIn) && !isCancelledPlanningRecord(row)).length,
    dispatchedVehicles: planning.filter((row) => !isCancelledPlanningRecord(row) && Boolean(String(row.vehicleOut ?? '').trim())).length,
    cancelledVehicles: planning.filter(isCancelledPlanningRecord).length
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
