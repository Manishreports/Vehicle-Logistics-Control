import * as XLSX from 'xlsx';
import { displayBusinessDate, excelSerialToDate } from './dateService.js';

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true, cellNF: true });
  const date1904 = Boolean(workbook?.Workbook?.WBProps?.date1904);
  const sheets = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });
    const firstRow = Array.isArray(matrix[0]) ? matrix[0] : [];
    const headers = firstRow.map((header, index) => String(header ?? '').trim() || `Column ${index + 1}`);
    const rows = matrix.slice(1)
      .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row) => headers.reduce((record, header, index) => ({ ...record, [header]: formatCell(row[index], header, date1904) }), {}));
    return { name, headers, rows, rowCount: rows.length, columnCount: headers.length };
  });
  return { sheets, sheetCount: sheets.length };
}

export function formatCell(value, header = '', date1904 = false) {
  if (value === null || value === undefined || value === '') return '';
  const isDateColumn = /date/i.test(String(header));
  if (!isDateColumn) return String(value);
  if (typeof value === 'number' && Number.isFinite(value)) return displayBusinessDate(excelSerialToDate(value, date1904));
  if (value instanceof Date) return displayBusinessDate(value);
  return displayBusinessDate(value);
}
