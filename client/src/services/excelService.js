import * as XLSX from 'xlsx';
import { displayDate } from './normalization';

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
  const sheets = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
    const firstRow = Array.isArray(matrix[0]) ? matrix[0] : [];
    const headers = firstRow.map((header, index) => String(header ?? '').trim() || `Column ${index + 1}`);
    const rows = matrix.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row) => headers.reduce((record, header, index) => ({ ...record, [header]: formatCell(row[index], header) }), {}));
    return { name, headers, rows, rowCount: rows.length, columnCount: headers.length };
  });

  return { sheets, sheetCount: sheets.length };
}

function formatCell(value, header = '') {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return displayDate(value);
  }
  if (value === null || value === undefined || value === '') return '';

  const isDateColumn = /date/i.test(String(header));
  if (isDateColumn && typeof value === 'number' && Number.isFinite(value)) {
    return displayDate(excelSerialToDate(value));
  }

  if (isDateColumn && typeof value === 'string' && isExplicitDateText(value)) {
    return displayDate(value);
  }

  return String(value);
}

function isExplicitDateText(value) {
  const raw = String(value).trim();
  return /^(?:\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}|\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})(?:\s+|$)/.test(raw)
    || /^\d{1,2}[-\s][A-Za-z]{3,}(?:[-\s]\d{2,4})?$/.test(raw);
}

function excelSerialToDate(serial) {
  return new Date(Date.UTC(1899, 11, 30) + Number(serial) * 86400000);
}
