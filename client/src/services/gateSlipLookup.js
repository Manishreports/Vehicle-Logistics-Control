import { GATE_HEADERS, findHeader, groupKey, normalizeDate, normalizeText } from './normalization';

function buildColumns(rows) {
  const headers = Object.keys(rows[0] || {});
  return {
    sto: findHeader(headers, GATE_HEADERS.sto),
    slip: findHeader(headers, GATE_HEADERS.slip),
    inDate: findHeader(headers, GATE_HEADERS.inDate),
    outDate: findHeader(headers, GATE_HEADERS.outDate),
    vehicleNumber: findHeader(headers, GATE_HEADERS.vehicleNumber),
    date: findHeader(headers, GATE_HEADERS.date),
    cfa: findHeader(headers, GATE_HEADERS.cfa),
    loading: findHeader(headers, GATE_HEADERS.loading)
  };
}

function collectDirectStoMatches(rows, cols) {
  const map = new Map();
  if (!cols.sto || !cols.slip) return map;
  rows.forEach((row) => {
    const slip = String(row[cols.slip] ?? '').trim();
    if (!slip) return;
    String(row[cols.sto] ?? '').split(/[,;\n|]+/).map((s) => s.trim()).filter(Boolean).forEach((sto) => {
      const key = normalizeText(sto);
      if (!key) return;
      const existing = map.get(key) || new Set();
      existing.add(slip);
      map.set(key, existing);
    });
  });
  return map;
}

export function indexGateInRows(rows) {
  const cols = buildColumns(rows);
  const stoToSlips = collectDirectStoMatches(rows, cols);
  const slipMap = new Map();
  rows.forEach((row) => {
    const slip = String(row[cols.slip] ?? '').trim();
    if (!slip) return;
    const current = slipMap.get(slip) || { slipNumber: slip, vehicleIn: '', vehicleNumber: '', date: '', cfa: '', loading: '' };
    current.vehicleIn ||= cols.inDate ? row[cols.inDate] : '';
    current.vehicleNumber ||= cols.vehicleNumber ? row[cols.vehicleNumber] : '';
    current.date ||= cols.date ? row[cols.date] : '';
    current.cfa ||= cols.cfa ? row[cols.cfa] : '';
    current.loading ||= cols.loading ? row[cols.loading] : '';
    slipMap.set(slip, current);
  });
  return { cols, stoToSlips, slipMap };
}

export function indexGateOutRows(rows) {
  const cols = buildColumns(rows);
  const slipMap = new Map();
  rows.forEach((row) => {
    const slip = String(row[cols.slip] ?? '').trim();
    if (!slip) return;
    const current = slipMap.get(slip) || { slipNumber: slip, vehicleOut: '' };
    current.vehicleOut ||= cols.outDate ? row[cols.outDate] : '';
    slipMap.set(slip, current);
  });
  return { cols, slipMap };
}

export function resolvePlanningEnrichment(planningRows, gateInRows, gateOutRows) {
  const gateIn = indexGateInRows(gateInRows);
  const gateOut = indexGateOutRows(gateOutRows);
  const groupSlips = new Map();
  const conflicts = [];

  planningRows.forEach((row, index) => {
    const group = groupKey({ date: row.date, cfa: row.cfa, loading: row.loading });
    if (!group || group === '||') return;
    const candidateSlips = new Set();
    const stoValues = String(row.sto ?? '').split(/[,;\n|]+/).map((s) => s.trim()).filter(Boolean);
    stoValues.forEach((sto) => {
      (gateIn.stoToSlips.get(normalizeText(sto)) || new Set()).forEach((slip) => candidateSlips.add(slip));
    });
    if (gateIn.slipMap.size) {
      gateIn.slipMap.forEach((item) => {
        if (normalizeDate(item.date) === normalizeDate(row.date)
          && normalizeText(item.cfa) === normalizeText(row.cfa)
          && normalizeText(item.loading) === normalizeText(row.loading)
          && item.slipNumber) {
          candidateSlips.add(item.slipNumber);
        }
      });
    }
    if (candidateSlips.size > 1) conflicts.push({ type: 'MULTIPLE_GATE_SLIPS', groupKey: group, rowIndex: index, slips: Array.from(candidateSlips) });
    const slip = candidateSlips.size === 1 ? Array.from(candidateSlips)[0] : '';
    if (slip) {
      const existing = groupSlips.get(group);
      if (existing && existing !== slip) conflicts.push({ type: 'GROUP_SLIP_CONFLICT', groupKey: group, slips: [existing, slip] });
      else groupSlips.set(group, slip);
    }
  });

  return planningRows.map((row, index) => {
    const group = groupKey({ date: row.date, cfa: row.cfa, loading: row.loading });
    const slip = groupSlips.get(group) || '';
    const matchedSlipSet = new Set();
    String(row.sto ?? '').split(/[,;\n|]+/).map((s) => s.trim()).filter(Boolean).forEach((sto) => {
      (gateIn.stoToSlips.get(normalizeText(sto)) || new Set()).forEach((candidate) => matchedSlipSet.add(candidate));
    });
    const rowHasDirectGateIn = slip && matchedSlipSet.has(slip);
    const gateInInfo = rowHasDirectGateIn ? gateIn.slipMap.get(slip) : null;
    const gateOutInfo = rowHasDirectGateIn ? gateOut.slipMap.get(slip) : null;
    return {
      ...row,
      serialNo: index + 1,
      vehicleIn: gateInInfo?.vehicleIn ? gateInInfo.vehicleIn : '',
      vehicleNumber: gateInInfo?.vehicleNumber ? gateInInfo.vehicleNumber : '',
      vehicleOut: gateOutInfo?.vehicleOut ? gateOutInfo.vehicleOut : '',
      slipNumber: slip,
      conflict: conflicts.find((item) => item.rowIndex === index || item.groupKey === group) || null
    };
  });
}

export function resolveStatusEnrichment(statusRows, planningRows, gateInRows, gateOutRows) {
  const gateIn = indexGateInRows(gateInRows);
  const gateOut = indexGateOutRows(gateOutRows);
  const page1Groups = new Map();
  const conflicts = [];
  planningRows.forEach((row, index) => {
    const key = groupKey({ date: row.date, cfa: row.cfa, loading: row.loading });
    const slip = String(row.slipNumber ?? '').trim();
    if (!key || !slip) return;
    const existing = page1Groups.get(key) || new Set();
    existing.add(slip);
    page1Groups.set(key, existing);
  });
  page1Groups.forEach((slips, key) => {
    if (slips.size > 1) conflicts.push({ type: 'PAGE1_GROUP_CONFLICT', groupKey: key, slips: Array.from(slips) });
  });

  return statusRows.map((row, index) => {
    const key = groupKey({ date: row.demandedDate, cfa: row.location, loading: row.loadingPoint });
    const slips = page1Groups.get(key) || new Set();
    if (slips.size > 1) conflicts.push({ type: 'PAGE2_GROUP_CONFLICT', groupKey: key, slips: Array.from(slips) });
    const slip = slips.size === 1 ? Array.from(slips)[0] : '';
    const inInfo = slip ? gateIn.slipMap.get(slip) : null;
    const outInfo = slip ? gateOut.slipMap.get(slip) : null;
    const vehicleArrived = inInfo?.vehicleIn ? inInfo.vehicleIn : '';
    const vehicleDispatch = outInfo?.vehicleOut ? outInfo.vehicleOut : '';
    let remarks = 'Pending';
    if (vehicleArrived && vehicleDispatch) remarks = 'Dispatched';
    else if (vehicleArrived) remarks = 'Onloading';
    return {
      ...row,
      serialNo: index + 1,
      vehicleArrived,
      vehicleDispatch,
      remarks,
      gateSlipNo: slip,
      conflict: conflicts.find((item) => item.groupKey === key) || null
    };
  });
}
