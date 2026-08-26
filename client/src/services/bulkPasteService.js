import { groupKey, normalizeText, splitMultiValue, normalizeDate, displayDate } from './normalization.js';

const FIELD_ALIASES = {
  planning: {
    date: ['date', 'plan date'], loc: ['loc', 'location'], plant: ['plant'], cfa: ['cfa', 'cfa name'],
    weight: ['weight', 'wt'], loading: ['loading', 'loading point', 'loading pt', 'loading pt.']
  },
  status: {
    demandedDate: ['demanded date', 'demand date', 'date'], requiredDate: ['required date'], location: ['location', 'cfa'],
    loadingPoint: ['loading pt', 'loading pt.', 'loading point', 'loading'], weight: ['weight', 'wt']
  },
  raipur: {
    date: ['date', 'plan date'], loc: ['loc', 'location'], plant: ['plant'], cfa: ['cfa', 'cfa name'],
    weight: ['weight', 'wt'], loading: ['loading', 'loading point', 'loading pt', 'loading pt.'],
    vehicleIn: ['vehicle in', 'vehicle in date', 'gate in date', 'in date'],
    vehicleNumber: ['vehicle number', 'vehicle no', 'vehicle no.'], vehicleOut: ['vehicle out', 'vehicle out date', 'gate out date', 'out date'],
    slipNumber: ['slip number', 'gate slip number', 'gate slip no', 'gate slip no.']
  }
};

function cleanCell(value) { return String(value ?? '').replace(/^\uFEFF/, '').trim().replace(/^"|"$/g, ''); }
function delimiterFor(line) { if (line.includes('\t')) return '\t'; if (line.includes('|')) return '|'; return ','; }
function splitLine(line, delimiter) { return line.split(delimiter).map(cleanCell); }
function normalizedHeader(value) { return normalizeText(value).replace(/[.]/g, ''); }
function findHeaderIndex(headers, aliases) {
  const normalized = headers.map(normalizedHeader);
  for (const alias of aliases) {
    const target = normalizedHeader(alias);
    const i = normalized.indexOf(target);
    if (i >= 0) return i;
  }
  for (const alias of aliases) {
    const target = normalizedHeader(alias);
    const i = normalized.findIndex((h) => h.includes(target) || target.includes(h));
    if (i >= 0) return i;
  }
  return -1;
}

export function parseBulkPaste(text, kind) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.replace(/\r$/, '')).filter((line) => line.trim());
  if (!lines.length) return { headers: [], rows: [], hadHeader: false };
  const delimiter = delimiterFor(lines[0]);
  const first = splitLine(lines[0], delimiter);
  const aliases = FIELD_ALIASES[kind];
  const headerMatchCount = Object.values(aliases).filter((names) => findHeaderIndex(first, names) >= 0).length;
  const isHeader = headerMatchCount >= (kind === 'planning' ? 4 : kind === 'raipur' ? 6 : 3);
  const headers = isHeader ? first : [];

  // Planning accepts variable STO columns. Any source header containing STO is collected.
  if (kind === 'planning' || kind === 'raipur') {
    if (!isHeader) {
      const data = lines.map((line) => splitLine(line, delimiter));
      if (kind === 'planning') {
        return { headers: [], rows: data.map((cells) => ({
          date: cells[0] ?? '', loc: cells[1] ?? '', plant: cells[2] ?? '', cfa: cells[3] ?? '', weight: cells[4] ?? '',
          sto: cells.slice(5, Math.max(5, cells.length - 1)).flatMap(splitMultiValue), loading: cells[cells.length - 1] ?? ''
        })).filter((r) => Object.values(r).some(Boolean)), hadHeader: false };
      }
      const keys = ['date', 'loc', 'plant', 'cfa', 'weight', 'sto', 'loading', 'vehicleIn', 'vehicleNumber', 'vehicleOut', 'slipNumber'];
      return { headers: [], rows: data.map((cells) => Object.fromEntries(keys.map((key, i) => [key, cells[i] ?? '']))).filter((r) => Object.values(r).some(Boolean)), hadHeader: false };
    }
    const indexes = {
      date: findHeaderIndex(headers, aliases.date), loc: findHeaderIndex(headers, aliases.loc), plant: findHeaderIndex(headers, aliases.plant),
      cfa: findHeaderIndex(headers, aliases.cfa), weight: findHeaderIndex(headers, aliases.weight), loading: findHeaderIndex(headers, aliases.loading),
      vehicleIn: findHeaderIndex(headers, aliases.vehicleIn || []), vehicleNumber: findHeaderIndex(headers, aliases.vehicleNumber || []),
      vehicleOut: findHeaderIndex(headers, aliases.vehicleOut || []), slipNumber: findHeaderIndex(headers, aliases.slipNumber || [])
    };
    const stoIndexes = headers.map((h, i) => ({ h: normalizedHeader(h), i })).filter(({ h }) => h === 'STO' || h.startsWith('STO') || h.includes('STONUMBER')).map(({ i }) => i);
    const rows = lines.slice(1).map((line) => {
      const cells = splitLine(line, delimiter);
      const row = {
        date: indexes.date >= 0 ? cells[indexes.date] ?? '' : '', loc: indexes.loc >= 0 ? cells[indexes.loc] ?? '' : '',
        plant: indexes.plant >= 0 ? cells[indexes.plant] ?? '' : '', cfa: indexes.cfa >= 0 ? cells[indexes.cfa] ?? '' : '',
        weight: indexes.weight >= 0 ? cells[indexes.weight] ?? '' : '', loading: indexes.loading >= 0 ? cells[indexes.loading] ?? '' : '',
        sto: stoIndexes.flatMap((i) => splitMultiValue(cells[i] ?? '')),
        vehicleIn: indexes.vehicleIn >= 0 ? cells[indexes.vehicleIn] ?? '' : '', vehicleNumber: indexes.vehicleNumber >= 0 ? cells[indexes.vehicleNumber] ?? '' : '',
        vehicleOut: indexes.vehicleOut >= 0 ? cells[indexes.vehicleOut] ?? '' : '', slipNumber: indexes.slipNumber >= 0 ? cells[indexes.slipNumber] ?? '' : ''
      };
      return row;
    }).filter((r) => Object.entries(r).some(([key, value]) => key === 'sto' ? value.length : value));
    return { headers, rows, hadHeader: true };
  }

  const indexes = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, findHeaderIndex(headers, names)]));
  const keys = Object.keys(aliases);
  const rows = (isHeader ? lines.slice(1) : lines).map((line) => {
    const cells = splitLine(line, delimiter);
    if (!isHeader) return Object.fromEntries(keys.map((key, i) => [key, cells[i] ?? '']));
    return Object.fromEntries(keys.map((key) => [key, indexes[key] >= 0 ? cells[indexes[key]] ?? '' : '']));
  }).filter((r) => Object.values(r).some(Boolean));
  return { headers, rows, hadHeader: isHeader };
}

export function parseWeightToMT(value) {
  const raw = String(value ?? '').trim().replace(/,/g, '');
  if (!raw) return 0;
  const match = raw.match(/(-?\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|g|gram|grams|ton|tons|tonne|tonnes|mt|metric\s*ton|metric\s*tons)?/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  const unit = (match[2] || 'MT').toLowerCase().replace(/\s+/g, ' ');
  if (unit === 'g' || unit.startsWith('gram')) return amount / 1_000_000;
  if (unit === 'kg' || unit === 'kgs' || unit.startsWith('kilogram')) return amount / 1000;
  return amount;
}

function validMultiValue(value) {
  const clean = String(value ?? '').trim();
  return clean && !['-', '—', 'NA', 'N/A', 'NULL'].includes(clean.toUpperCase());
}

function carryForwardRows(rows, fields) {
  const previous = Object.fromEntries(fields.map((field) => [field, '']));
  return rows.map((row) => {
    const next = { ...row };
    fields.forEach((field) => {
      if (String(next[field] ?? '').trim()) previous[field] = next[field];
      else if (previous[field]) next[field] = previous[field];
    });
    return next;
  });
}

function uniqueOrdered(values) {
  const seen = new Set(); const result = [];
  values.forEach((value) => { const clean = String(value ?? '').trim(); const key = normalizeText(clean); if (clean && !seen.has(key)) { seen.add(key); result.push(clean); } });
  return result;
}

export function aggregatePlanningRows(rows) {
  const groups = new Map();
  const processedRows = carryForwardRows(rows, ['date', 'plant', 'cfa', 'loading']).map((row) => ({ ...row, sto: (Array.isArray(row.sto) ? row.sto : splitMultiValue(row.sto)).filter(validMultiValue) }));
  processedRows.forEach((row, rawIndex) => {
    const key = groupKey({ date: row.date, cfa: row.cfa, loading: row.loading });
    if (!key || key === '||') return;
    const group = groups.get(key) || { date: row.date, locs: [], plants: [], cfa: row.cfa, weights: 0, sto: [], loading: row.loading, rawRowIndexes: [], conflicts: [] };
    group.rawRowIndexes.push(rawIndex);
    group.locs.push(row.loc); group.plants.push(row.plant); group.weights += parseWeightToMT(row.weight); group.sto.push(...(Array.isArray(row.sto) ? row.sto : splitMultiValue(row.sto)));
    if (row.cfa && normalizeText(row.cfa) !== normalizeText(group.cfa)) group.conflicts.push({ field: 'CFA', values: [group.cfa, row.cfa] });
    if (row.loading && normalizeText(row.loading) !== normalizeText(group.loading)) group.conflicts.push({ field: 'Loading', values: [group.loading, row.loading] });
    groups.set(key, group);
  });
  return Array.from(groups.entries()).map(([key, group], index) => ({
    serialNo: index + 1, groupKey: key, date: group.date, loc: uniqueOrdered(group.locs).join(' / '), plant: uniqueOrdered(group.plants).join(' / '), cfa: group.cfa,
    weight: `${group.weights.toFixed(3)} MT`, weightMT: group.weights, sto: uniqueOrdered(group.sto).join(' / '), loading: group.loading,
    rawRowIndexes: group.rawRowIndexes, conflicts: group.conflicts
  }));
}

export function aggregateRaipurRows(rows) {
  const groups = new Map();
  const processedRows = carryForwardRows(rows, ['date', 'plant', 'cfa', 'loading']).map((row) => ({ ...row, sto: (Array.isArray(row.sto) ? row.sto : splitMultiValue(row.sto)).filter(validMultiValue) }));
  processedRows.forEach((row, rawIndex) => {
    const key = groupKey({ date: row.date, cfa: row.cfa, loading: row.loading });
    if (!key || key === '||') return;
    const group = groups.get(key) || { date: row.date, locs: [], plants: [], cfa: row.cfa, weights: 0, sto: [], loading: row.loading, rawRowIndexes: [], vehicleIn: [], vehicleNumber: [], vehicleOut: [], slipNumber: [], conflicts: [] };
    group.rawRowIndexes.push(rawIndex); group.locs.push(row.loc); group.plants.push(row.plant); group.weights += parseWeightToMT(row.weight); group.sto.push(...(Array.isArray(row.sto) ? row.sto : splitMultiValue(row.sto)));
    group.vehicleIn.push(row.vehicleIn); group.vehicleNumber.push(row.vehicleNumber); group.vehicleOut.push(row.vehicleOut); group.slipNumber.push(row.slipNumber);
    groups.set(key, group);
  });
  return Array.from(groups.entries()).map(([key, group], index) => {
    const values = { vehicleIn: uniqueOrdered(group.vehicleIn), vehicleNumber: uniqueOrdered(group.vehicleNumber), vehicleOut: uniqueOrdered(group.vehicleOut), slipNumber: uniqueOrdered(group.slipNumber) };
    Object.entries(values).forEach(([field, list]) => { if (list.length > 1) group.conflicts.push({ field, values: list }); });
    return {
      serialNo: index + 1, groupKey: key, date: group.date, loc: uniqueOrdered(group.locs).join(' / '), plant: uniqueOrdered(group.plants).join(' / '), cfa: group.cfa,
      weight: `${group.weights.toFixed(3)} MT`, weightMT: group.weights, sto: uniqueOrdered(group.sto).join(' / '), loading: group.loading,
      vehicleIn: values.vehicleIn[0] || '', vehicleNumber: values.vehicleNumber[0] || '', vehicleOut: values.vehicleOut[0] || '', slipNumber: values.slipNumber[0] || '',
      rawRowIndexes: group.rawRowIndexes, conflicts: group.conflicts
    };
  });
}

export function aggregateStatusRows(rows) {
  const groups = new Map();
  const processedRows = carryForwardRows(rows, ['demandedDate', 'requiredDate', 'location', 'loadingPoint']);
  processedRows.forEach((row, rawIndex) => {
    const key = groupKey({ date: row.demandedDate, cfa: row.location, loading: row.loadingPoint });
    if (!key || key === '||') return;
    const group = groups.get(key) || { demandedDate: row.demandedDate, requiredDates: [], location: row.location, loadingPoint: row.loadingPoint, weight: 0, rawRowIndexes: [] };
    group.rawRowIndexes.push(rawIndex); group.requiredDates.push(row.requiredDate); group.weight += parseWeightToMT(row.weight); groups.set(key, group);
  });
  return Array.from(groups.entries()).map(([key, group], index) => ({
    serialNo: index + 1, groupKey: key, demandedDate: group.demandedDate, requiredDate: uniqueOrdered(group.requiredDates).join(' / '), location: group.location,
    loadingPoint: group.loadingPoint, weight: `${group.weight.toFixed(3)} MT`, weightMT: group.weight, rawRowIndexes: group.rawRowIndexes
  }));
}

export function previewBulkPaste(text, kind) {
  const parsed = parseBulkPaste(text, kind);
  const finalRows = kind === 'planning' ? aggregatePlanningRows(parsed.rows) : kind === 'raipur' ? aggregateRaipurRows(parsed.rows) : aggregateStatusRows(parsed.rows);
  return { ...parsed, finalRows, rawRowCount: parsed.rows.length, finalRowCount: finalRows.length };
}
