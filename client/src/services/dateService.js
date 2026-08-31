const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MIN_EXCEL_SERIAL = 1;
const MAX_EXCEL_SERIAL = 2958465;

function pad2(value) { return String(value).padStart(2, '0'); }
function pad4(value) { return String(value).padStart(4, '0'); }

function isValidBusinessDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

function toCanonical(year, month, day) {
  return isValidBusinessDate(year, month, day) ? `${pad4(year)}-${pad2(month)}-${pad2(day)}` : '';
}

function fromYearMonthDay(year, month, day) {
  return toCanonical(Number(year), Number(month), Number(day));
}

function currentYear() {
  const now = new Date();
  return now.getFullYear();
}

function parseTextDate(value, fallbackYear) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  let match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) return fromYearMonthDay(match[1], match[2], match[3]);

  match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})(?:\s|$)/);
  if (match) {
    const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);
    return fromYearMonthDay(year, match[2], match[1]);
  }

  match = raw.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})(?:[-\s](\d{2,4}))?(?:\s|$)/);
  if (match) {
    const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
    const year = match[3] ? (Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3])) : fallbackYear;
    if (month) return fromYearMonthDay(year, month, match[1]);
  }

  return '';
}

export function excelSerialToDate(serial, date1904 = false) {
  const numeric = Number(serial);
  const minSerial = date1904 ? 0 : MIN_EXCEL_SERIAL;
  if (!Number.isFinite(numeric) || numeric < minSerial || numeric > MAX_EXCEL_SERIAL) return '';
  // SheetJS SSF.parse_date_code returns calendar components without creating a JS Date.
  const whole = Math.floor(numeric);
  let days = whole;
  let year = date1904 ? 1904 : 1900;
  // Excel 1900 dates are one-based (serial 1 = 1900-01-01) and retain the
  // historical fake 1900-02-29 at serial 60. Excel 1904 dates are zero-based
  // (serial 0 = 1904-01-01). No JavaScript Date is created here.
  if (!date1904) {
    if (days >= 60) days -= 1;
    days -= 1;
  }
  while (true) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const yearDays = leap ? 366 : 365;
    if (days < yearDays) break;
    days -= yearDays;
    year += 1;
  }
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 1;
  for (const count of monthDays) {
    if (days < count) break;
    days -= count;
    month += 1;
  }
  return fromYearMonthDay(year, month, days + 1);
}

function fromDateObject(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
  return fromYearMonthDay(value.getFullYear(), value.getMonth() + 1, value.getDate());
}

export function parseBusinessDate(value, options = {}) {
  const fallback = Number.isInteger(options.fallbackYear) ? options.fallbackYear : currentYear();
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d+(?:\.\d+)?$/.test(trimmed) && Number(trimmed) >= MIN_EXCEL_SERIAL && Number(trimmed) <= MAX_EXCEL_SERIAL) {
      return excelSerialToDate(Number(trimmed), Boolean(options.date1904));
    }
    return parseTextDate(trimmed, fallback);
  }
  if (typeof value === 'number') return excelSerialToDate(value, Boolean(options.date1904));
  if (value instanceof Date) return fromDateObject(value);
  return '';
}

export function normalizeBusinessDate(value, options = {}) {
  return parseBusinessDate(value, options);
}

export function formatBusinessDate(value, options = {}) {
  const canonical = parseBusinessDate(value, options);
  if (!canonical) return String(value ?? '');
  const [year, month, day] = canonical.split('-').map(Number);
  return `${pad2(day)}-${MONTH_NAMES[month - 1]}-${year}`;
}

export function displayBusinessDate(value, options = {}) {
  return formatBusinessDate(value, options);
}

