import * as XLSX from 'xlsx';

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false });
  const sheets = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    const firstRow = Array.isArray(matrix[0]) ? matrix[0] : [];
    const headers = firstRow.map((header, index) => String(header ?? '').trim() || `Column ${index + 1}`);
    const rows = matrix.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row) => headers.reduce((record, header, index) => ({ ...record, [header]: formatCell(row[index]) }), {}));
    return { name, headers, rows, rowCount: rows.length, columnCount: headers.length };
  });

  return { sheets, sheetCount: sheets.length };
}

function formatCell(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat('en-GB').format(value);
  }
  if (value === null || value === undefined) return '';
  return String(value);
}
