import * as XLSX from 'xlsx';

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  // Keep Excel dates as numeric serials. Converting them to JS Date objects here
  // can introduce timezone-dependent calendar shifts.
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true, cellNF: true });
  const date1904 = Boolean(workbook?.Workbook?.WBProps?.date1904);
  const sheets = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
    const firstRow = Array.isArray(matrix[0]) ? matrix[0] : [];
    const headers = firstRow.map((header, index) => String(header ?? '').trim() || `Column ${index + 1}`);
    const rows = matrix.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row) => headers.reduce((record, header, index) => ({ ...record, [header]: formatCell(row[index], header, date1904) }), {}));
    return { name, headers, rows, rowCount: rows.length, columnCount: headers.length };
  });

  return { sheets, sheetCount: sheets.length, date1904 };
}

function formatCell(value, header = '', date1904 = false) {
  if (value === null || value === undefined || value === '') return '';
  const isDateColumn = /date/i.test(String(header));
  if (isDateColumn) {
    const canonical = canonicalExcelDate(value, date1904);
    if (canonical) return canonical;
  }
  return String(value);
}

function canonicalExcelDate(value, date1904 = false) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value, { date1904: Boolean(date1904) });
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const raw = String(value ?? '').trim();
  let match = raw.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (match) return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
  match = raw.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})$/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return `${String(year).padStart(4, '0')}-${String(match[2]).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
  }
  return '';
}

function isExplicitDateText(value) {
  const raw = String(value).trim();
  return /^(?:\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}|\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})(?:\s+|$)/.test(raw)
    || /^\d{1,2}[-\s][A-Za-z]{3,}(?:[-\s]\d{2,4})?$/.test(raw);
}
