import React, { useMemo, useState } from 'react';
import SectionPanel from '../components/SectionPanel';
import { parseExcelFile } from '../services/excelService';
import { dataStore } from '../services/dataStore';
import { GATE_HEADERS, findHeader } from '../services/normalization';

const PAGE_SIZE_OPTIONS = [5, 10, 15];

export default function ExcelUpload() {
  const [workbook, setWorkbook] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [dataRole, setDataRole] = useState('gateIn');

  const activeSheet = workbook?.sheets.find((sheet) => sheet.name === selectedSheet) || workbook?.sheets[0];
  const filteredRows = useMemo(() => {
    if (!activeSheet) return [];
    const search = query.trim().toLowerCase();
    if (!search) return activeSheet.rows;
    return activeSheet.rows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(search)));
  }, [activeSheet, query]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function handleFile(file) {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
      setWorkbook(null); setFileMeta(null); setStatus({ type: 'error', message: 'Invalid file format. Please upload an .xlsx or .xls file.' }); return;
    }
    setStatus({ type: 'loading', message: 'Reading workbook…' });
    try {
      const parsed = await parseExcelFile(file);
      const firstSheet = parsed.sheets[0];
      setWorkbook(parsed); setSelectedSheet(firstSheet?.name || '');
      setFileMeta({ name: file.name, size: formatBytes(file.size), sheets: parsed.sheetCount, type: extension.toUpperCase() });
      setQuery(''); setPage(1);
      setStatus({ type: 'success', message: 'Workbook ready for preview.' });
    } catch (error) {
      console.error(error); setWorkbook(null); setFileMeta(null); setStatus({ type: 'error', message: 'The workbook could not be read. Please check the file and try again.' });
    }
  }

  function importSelectedSheet() {
    if (!activeSheet) return;
    const headers = activeSheet.headers;
    const required = dataRole === 'gateIn'
      ? { slip: GATE_HEADERS.slip, inDate: GATE_HEADERS.inDate, vehicleNumber: GATE_HEADERS.vehicleNumber, sto: GATE_HEADERS.sto }
      : { slip: GATE_HEADERS.slip, outDate: GATE_HEADERS.outDate };
    const missing = Object.entries(required).filter(([, aliases]) => !findHeader(headers, aliases)).map(([key]) => key);
    if (!findHeader(headers, GATE_HEADERS.slip)) {
      setStatus({ type: 'error', message: 'Gate Slip Number column could not be detected in the selected sheet.' }); return;
    }
    if (missing.length) {
      const allowed = dataRole === 'gateIn' ? 'Gate Slip, STO, Gate In Date and Vehicle Number' : 'Gate Slip and Gate Out Date';
      setStatus({ type: 'error', message: `The selected sheet is missing required ${dataRole === 'gateIn' ? 'Gate In' : 'Gate Out'} headers. Expected: ${allowed}.` }); return;
    }
    const meta = { fileName: fileMeta?.name || '', sheetName: activeSheet.name, importedAt: new Date().toISOString() };
    if (dataRole === 'gateIn') dataStore.setGateIn(activeSheet.rows, meta);
    else dataStore.setGateOut(activeSheet.rows, meta);
    setStatus({ type: 'success', message: `${dataRole === 'gateIn' ? 'Gate In' : 'Gate Out'} data imported. Page 1 and Page 2 will re-evaluate using the new gate data.` });
  }

  function resetUpload() {
    setWorkbook(null); setFileMeta(null); setSelectedSheet(''); setQuery(''); setPage(1); setStatus({ type: 'idle', message: '' });
  }
  function onDrop(event) { event.preventDefault(); setDragActive(false); handleFile(event.dataTransfer.files?.[0]); }
  const startRow = filteredRows.length ? (safePage - 1) * pageSize + 1 : 0;
  const endRow = Math.min(safePage * pageSize, filteredRows.length);
  const gateMeta = dataRole === 'gateIn' ? dataStore.getGateInMeta() : dataStore.getGateOutMeta();

  return (
    <div className="page-content">
      <SectionPanel title="Upload Excel Workbook" subtitle="Supported formats: .xlsx and .xls">
        <div className="field-group" style={{ maxWidth: 360, marginBottom: 12 }}><label htmlFor="excel-role">Import as</label><select id="excel-role" value={dataRole} onChange={(event) => setDataRole(event.target.value)}><option value="gateIn">Gate In Data</option><option value="gateOut">Gate Out Data</option></select></div>
        <label className={`upload-zone ${dragActive ? 'drag-active' : ''}`} onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }} onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }} onDrop={onDrop}>
          <input type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(event) => handleFile(event.target.files?.[0])} />
          <div className="upload-symbol">⇧</div><strong>Drag &amp; Drop Excel File Here</strong><span>or</span><span className="button primary choose-file">Select Excel File</span><small>Supported: .xlsx, .xls</small>
        </label>
        {status.message && <div className={`alert ${status.type}`} role="status">{status.message}</div>}
      </SectionPanel>

      <SectionPanel title="Imported Gate Data" subtitle="Only the selected Gate In or Gate Out dataset is stored; raw Excel rows remain separate from planning/status datasets.">
        <div className="file-info-grid">
          <InfoItem label="Current Role" value={dataRole === 'gateIn' ? 'Gate In Data' : 'Gate Out Data'} />
          <InfoItem label="Last Imported File" value={gateMeta?.fileName || '—'} />
          <InfoItem label="Sheet" value={gateMeta?.sheetName || '—'} />
          <InfoItem label="Status" value={gateMeta?.fileName ? 'Ready' : 'Not imported'} valueClass={gateMeta?.fileName ? 'success-text' : ''} />
        </div>
      </SectionPanel>

      {fileMeta && <SectionPanel title="File Information" subtitle="Workbook metadata detected from the selected file."><div className="file-info-grid"><InfoItem label="File Name" value={fileMeta.name} /><InfoItem label="File Size" value={fileMeta.size} /><InfoItem label="Sheets" value={fileMeta.sheets} /><InfoItem label="Status" value="Ready" valueClass="success-text" /></div></SectionPanel>}

      {workbook && <SectionPanel title="Excel Preview" subtitle="Preview uses detected headers and rows; no fixed column positions are assumed.">
        <div className="preview-controls">
          <div className="field-group preview-sheet"><label htmlFor="sheet-select">Select Sheet</label><select id="sheet-select" value={selectedSheet} onChange={(event) => { setSelectedSheet(event.target.value); setPage(1); setQuery(''); }}>{workbook.sheets.map((sheet) => <option key={sheet.name} value={sheet.name}>{sheet.name}</option>)}</select></div>
          <div className="field-group preview-search"><label htmlFor="preview-search">Search</label><input id="preview-search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search preview rows…" /></div>
          <div className="preview-actions"><button className="button primary" onClick={importSelectedSheet}>Import {dataRole === 'gateIn' ? 'Gate In' : 'Gate Out'}</button><button className="button secondary" onClick={resetUpload}>Clear</button></div>
        </div>
        {!activeSheet || !activeSheet.rows.length ? <div className="sheet-empty">This sheet contains no data.</div> : <>
          <div className="preview-summary"><span>Rows: <strong>{filteredRows.length.toLocaleString('en-IN')}</strong>{query ? ` of ${activeSheet.rowCount.toLocaleString('en-IN')}` : ''}</span><span>Columns: <strong>{activeSheet.columnCount}</strong></span><span>Showing <strong>{startRow}–{endRow}</strong></span><div className="rows-control"><label htmlFor="page-size">Rows</label><select id="page-size" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}<option value={activeSheet.rowCount || 1}>All</option></select></div></div>
          <div className="preview-table-wrap"><table className="enterprise-table preview-table"><thead><tr><th className="row-number-head">#</th>{activeSheet.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{visibleRows.map((row, index) => <tr key={`${safePage}-${index}`}><td className="row-number">{(safePage - 1) * pageSize + index + 1}</td>{activeSheet.headers.map((header) => <td key={header} title={String(row[header] ?? '')}>{row[header] ?? ''}</td>)}</tr>)}</tbody></table></div>
          <div className="pagination"><span>Showing {startRow}–{endRow} of {filteredRows.length.toLocaleString('en-IN')} rows</span><div className="pagination-buttons"><button className="button pagination-button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button><span className="page-indicator">Page {safePage} of {totalPages}</span><button className="button pagination-button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>›</button></div></div>
        </>}
      </SectionPanel>}
    </div>
  );
}
function InfoItem({ label, value, valueClass = '' }) { return <div className="info-item"><span>{label}</span><strong className={valueClass}>{value}</strong></div>; }
function formatBytes(bytes) { if (!Number.isFinite(bytes) || bytes === 0) return '0 Bytes'; const units = ['Bytes', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`; }
