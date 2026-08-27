const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

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

function excelSerialCalendarDate(serial, date1904 = false) {
  const wholeDays = Math.floor(Number(serial));
  if (!Number.isFinite(wholeDays)) return null;
  const adjustedDays = wholeDays;
  // Civil-date conversion using integer day arithmetic; no timezone-sensitive Date object.
  const z = adjustedDays + (date1904 ? -24107 : -25569);
  let dayCount = z + 719468;
  const era = Math.floor(dayCount / 146097);
  const doe = dayCount - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  const year = y + (m <= 2 ? 1 : 0);
  return makeCalendarDate(year, m, d);
}

function makeCalendarDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return null;
  return { year: y, month: m, day: d };
}

export function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return makeCalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const numeric = Number(raw);
  if (/^\d+(?:\.\d+)?$/.test(raw) && numeric > 20000 && numeric < 80000) {
    return excelSerialCalendarDate(numeric);
  }
  const compact = raw.replace(/T.*$/, '').trim();
  let match = compact.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (match) return makeCalendarDate(match[1], match[2], match[3]);
  match = compact.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return makeCalendarDate(year, match[2], match[1]);
  }
  match = compact.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})(?:[-\s](\d{2,4}))?$/);
  if (match) {
    let year = match[3] ? Number(match[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) return makeCalendarDate(year, month + 1, match[1]);
  }
  return null;
}

export function normalizeDate(value) {
  const date = parseDateValue(value);
  if (!date) return '';
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function canonicalBusinessDate(value) {
  return normalizeDate(value);
}

export function displayDate(value) {
  const date = parseDateValue(value);
  if (!date) return String(value ?? '');
  const month = Object.keys(MONTHS).find((key) => MONTHS[key] === date.month - 1);
  return `${String(date.day).padStart(2, '0')}-${month[0].toUpperCase()}${month.slice(1)}-${date.year}`;
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
  const parts = [normalizeDate(date), normalizeText(cfa), normalizeText(loading)];
  return parts.join('|');
}

export function splitMultiValue(value) {
  return String(value ?? '')
    .split(/[,;\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
