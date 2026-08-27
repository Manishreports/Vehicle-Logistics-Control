import { normalizeBusinessDate } from './dateService.js';

export function normalizeText(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function normalizeLooseText(value) {
  return normalizeText(value).replace(/[\s\-_\/]+/g, '');
}

export function normalizeGateSlipNumber(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\u00A0/g, ' ').trim();
}

export function findHeader(headers, aliases) {
  const normalized = headers.map((h) => ({ raw: h, key: normalizeLooseText(h) }));
  for (const alias of aliases) {
    const target = normalizeLooseText(alias);
    const exact = normalized.find((h) => h.key === target);
    if (exact) return exact.raw;
  }
  for (const alias of aliases) {
    const target = normalizeLooseText(alias);
    const fuzzy = normalized.find((h) => h.key.includes(target) || target.includes(h.key));
    if (fuzzy) return fuzzy.raw;
  }
  return '';
}

export const GATE_HEADERS = {
  sto: ['STO', 'STO Number', 'STO No', 'STO Number(s)', 'Stock Transfer Order', 'STO No.'],
  slip: ['Gate Slip Number', 'Gate Slip No', 'Gate Slip No.', 'Slip Number', 'Slip No', 'Slip No.'],
  inDate: ['Gate In Date', 'Vehicle In', 'Vehicle In Date', 'In Date', 'Gate_In_Date'],
  outDate: ['Gate Out Date', 'Vehicle Out', 'Vehicle Out Date', 'Out Date', 'Gate_Out_Date'],
  vehicleNumber: ['Vehicle Number', 'Vehicle No', 'Vehicle No.', 'Registration Number', 'Vehicle Reg No'],
  date: ['Date', 'Plan Date', 'Demanded Date'],
  cfa: ['CFA', 'CFA Name', 'Location'],
  loading: ['Loading', 'Loading Point', 'Loading Pt.', 'Loading Point Name']
};

export function groupKey({ date, cfa, loading }) {
  return [normalizeBusinessDate(date), normalizeText(cfa), normalizeText(loading)].join('|');
}

export function splitMultiValue(value) {
  return String(value ?? '')
    .split(/[,;\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
