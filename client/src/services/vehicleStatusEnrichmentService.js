import { normalizeText, groupKey, normalizeGateSlipNumber } from './normalization.js';
import { normalizeBusinessDate } from './dateService.js';
import { indexGateInRows, indexGateOutRows } from './gateSlipLookup.js';
import { getLoadingPointMappings, loadingPointsMatch } from './loadingPointMappingService.js';

export const VEHICLE_STATUS_ENRICHMENT_VERSION = 'fresh-v1';

function clean(value) {
  return String(value ?? '').trim();
}

function buildPlanningIndex(planningRecords) {
  const index = new Map();
  for (const row of planningRecords) {
    const key = groupKey({ date: row.date, cfa: row.cfa, loading: row.loading });
    if (!key || key === '||') continue;
    const slip = normalizeGateSlipNumber(row.slipNumber);
    const entry = index.get(key) || { key, slips: new Set(), rows: [] };
    entry.rows.push(row);
    if (slip) entry.slips.add(slip);
    index.set(key, entry);
  }
  return index;
}

function findMappedPlanningGroup(statusRow, planningRecords, planningIndex, loadingMappings) {
  const demandedDate = normalizeBusinessDate(statusRow.demandedDate);
  const location = normalizeText(statusRow.location);
  const loadingPoint = clean(statusRow.loadingPoint);
  if (!demandedDate || !location || !loadingPoint) return null;

  const exactKey = groupKey({ date: demandedDate, cfa: statusRow.location, loading: loadingPoint });
  const exact = planningIndex.get(exactKey);
  if (exact) return { ...exact, matchType: 'exact' };

  const candidates = [];
  for (const [key, entry] of planningIndex) {
    if (normalizeBusinessDate(entry.rows[0]?.date) !== demandedDate) continue;
    if (normalizeText(entry.rows[0]?.cfa) !== location) continue;
    if (loadingPointsMatch(entry.rows[0]?.loading, loadingPoint, loadingMappings)) {
      candidates.push({ ...entry, matchType: 'mapped' });
    }
  }
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) return { key: exactKey, slips: new Set(candidates.flatMap((c) => Array.from(c.slips))), rows: candidates.flatMap((c) => c.rows), matchType: 'conflict' };
  return null;
}

function hasSameDateAndLocationPlanning(statusRow, planningRecords) {
  const demandedDate = normalizeBusinessDate(statusRow.demandedDate);
  const location = normalizeText(statusRow.location);
  if (!demandedDate || !location) return false;
  return planningRecords.some((planning) =>
    normalizeBusinessDate(planning.date) === demandedDate
    && normalizeText(planning.cfa) === location
  );
}

function getSingleSlip(group) {
  const slips = Array.from(group?.slips || []).filter(Boolean);
  return slips.length === 1 ? slips[0] : '';
}

function buildException(statusRow, type, extra = {}) {
  return {
    type,
    date: statusRow.demandedDate,
    name: statusRow.location,
    loading: statusRow.loadingPoint,
    ...extra
  };
}

export function buildVehicleStatusRecords({
  statusRecords = [],
  planningRecords = [],
  gateInRecords = [],
  gateOutRecords = [],
  loadingPointMappings = getLoadingPointMappings()
}) {
  const planningIndex = buildPlanningIndex(planningRecords);
  const gateIn = indexGateInRows(gateInRecords);
  const gateOut = indexGateOutRows(gateOutRecords);
  const exceptions = [];

  const records = statusRecords.map((sourceRow, index) => {
    const row = { ...sourceRow };
    const match = findMappedPlanningGroup(row, planningRecords, planningIndex, loadingPointMappings);
    let gateSlipNo = '';
    let vehicleArrived = '';
    let vehicleDispatch = '';
    let remarks = 'Pending';
    let exception = null;

    if (!match) {
      const type = hasSameDateAndLocationPlanning(row, planningRecords)
        ? 'LOADING_POINT_MATCH_REQUIRED'
        : 'NO_PAGE1_MATCH';
      exception = buildException(row, type);
      exceptions.push(exception);
    } else if (match.matchType === 'conflict' || match.slips.size > 1) {
      exception = buildException(row, 'GATE_SLIP_CONFLICT', { slips: Array.from(match.slips) });
      exceptions.push(exception);
    } else {
      gateSlipNo = getSingleSlip(match);
      if (!gateSlipNo) {
        exception = buildException(row, 'GATE_SLIP_MISSING');
        exceptions.push(exception);
      } else {
        const inInfo = gateIn.slipMap.get(gateSlipNo) || null;
        const outInfo = gateOut.slipMap.get(gateSlipNo) || null;
        vehicleArrived = inInfo?.vehicleIn || '';
        vehicleDispatch = outInfo?.vehicleOut || '';
        if (!inInfo) exceptions.push(buildException(row, 'GATE_IN_MISSING', { gateSlipNo }));
        if (!outInfo) exceptions.push(buildException(row, 'GATE_OUT_MISSING', { gateSlipNo }));
        if (vehicleArrived && vehicleDispatch) remarks = 'Dispatched';
        else if (vehicleArrived) remarks = 'Onloading';
      }
    }

    return {
      ...row,
      serialNo: index + 1,
      gateSlipNo,
      vehicleArrived,
      vehicleDispatch,
      remarks,
      statusMatch: match ? match.matchType : 'none',
      conflict: exception
    };
  });

  return { records, exceptions };
}
