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

export function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const excelSerial = Number(raw);
  if (/^\d+(\.\d+)?$/.test(raw) && excelSerial > 20000 && excelSerial < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + excelSerial * 86400000);
  }
  const cleaned = raw.replace(/[.]/g, '-').replace(/\//g, '-');
  const iso = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  const dmy = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})/);
  if (dmy) {
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, Number(dmy[2]) - 1, Number(dmy[1])));
  }
  const mon = cleaned.match(/^(\d{1,2})-([A-Za-z]{3,})-(\d{4})/);
  if (mon) {
    const month = MONTHS[mon[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) return new Date(Date.UTC(Number(mon[3]), month, Number(mon[1])));
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

export function normalizeDate(value) {
  const date = parseDateValue(value);
  if (!date) return '';
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function displayDate(value) {
  const date = parseDateValue(value);
  if (!date) return String(value ?? '');
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
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
