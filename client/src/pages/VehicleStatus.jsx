import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import { VEHICLE_STATUS_COLUMNS } from '../data/vehicleStatusTrackingData';
import { getVehicleStatusData } from '../services/vehicleStatusService';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { displayDate } from '../services/normalization';
import { previewBulkPaste, aggregateStatusRows } from '../services/bulkPasteService';

export default function VehicleStatus() {
  const [rows, setRows] = useState([]); const [pasteText, setPasteText] = useState(''); const [preview, setPreview] = useState(null); const [message, setMessage] = useState(''); const [search, setSearch] = useState('');
  const refresh = useCallback(() => setRows(getVehicleStatusData()), []); useEffect(() => { refresh(); return useDataStoreSubscription(refresh); }, [refresh]);
  const filteredRows = useMemo(() => { const q = search.trim().toLowerCase(); return rows.filter((row) => !q || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(q))).map((row) => ({ ...row, demandedDate: displayDate(row.demandedDate), requiredDate: displayDate(row.requiredDate), vehicleArrived: displayDate(row.vehicleArrived), vehicleDispatch: displayDate(row.vehicleDispatch) })); }, [rows, search]);
  function buildPreview() { const result = previewBulkPaste(pasteText, 'status'); if (!result.rawRowCount) { setMessage('No valid vehicle status rows found in the pasted data.'); setPreview(null); return; } setPreview(result); setMessage('Preview ready. Review the grouped demand before importing.'); }
  function importPreview(mode) {
    if (!preview?.rows.length) return;
    const existingFinal = dataStore.getStatus();
    const existingRaw = dataStore.getStatusRaw();
    if (mode === 'replace' && !window.confirm(`Replace existing data?\n\nYou currently have ${existingFinal.length} groups. Replacing will remove the existing dataset.`)) return;
    const combinedRaw = mode === 'append' ? existingRaw.concat(preview.rows.map((row, i) => i === 0 ? { ...row, __batchBoundary: true } : row)) : preview.rows;
    const finalRows = aggregateStatusRows(combinedRaw);
    const cleanRaw = combinedRaw.map((row) => { const next = { ...row }; delete next.__batchBoundary; return next; });
    dataStore.setStatus(finalRows, cleanRaw);
    setPasteText(''); setPreview(null); setMessage(`${mode === 'append' ? 'Appended' : 'Replaced'} data. Final groups: ${finalRows.length}.`); refresh();
  }
  function clearStatus() { dataStore.clearStatus(); setPasteText(''); setPreview(null); setMessage('Vehicle status data cleared.'); refresh(); }
  return <div className="page-content">
    <section className="section-panel"><div className="section-panel-header"><div><h2>Bulk Paste Vehicle Demand</h2><p>Paste Demanded Date, Required Date, Location, Loading Pt. and Weight. Page 2 groups by Demanded Date + Location + Loading Pt.</p></div></div><div className="section-panel-body">
      <textarea className="paste-area" value={pasteText} onChange={(e) => { setPasteText(e.target.value); setPreview(null); }} placeholder="Demanded Date\tRequired Date\tLocation\tLoading Pt.\tWeight\n20-Jul-2026\t21-Jul-2026\tGhaziabad\tB-0 T-0\t17.300 MT" />
      <div className="input-action-row"><button className="button primary" onClick={buildPreview}>Preview Bulk Paste</button><button className="button secondary" onClick={clearStatus}>Clear Status Data</button>{message && <span className="inline-message">{message}</span>}</div>
      {preview && <BulkPreview result={preview} onImport={importPreview} existingCount={dataStore.getStatus().length} />}
    </div></section>
    <section className="section-panel"><div className="section-panel-body"><div className="field-group search-field"><label htmlFor="status-search">Search</label><input id="status-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Vehicle Status Records..." /></div></div></section>
    <section className="section-panel"><div className="section-panel-header"><div><h2>Vehicle Status Records</h2><p>{filteredRows.length} final demand group(s). Gate/vehicle fields are enriched through the existing Page 1 group relationship.</p></div></div><div className="section-panel-body table-section-body"><DataTable columns={VEHICLE_STATUS_COLUMNS} rows={filteredRows} emptyTitle="No vehicle status records available." emptyDescription="Paste vehicle demand data above and preview the grouped result before import." showHeaderWhenEmpty /></div></section>
  </div>;
}

function BulkPreview({ result, onImport, existingCount }) {
  const sample = result.finalRows.slice(0, 20);
  return <div style={{ marginTop: 14, border: '1px solid #d6dde1', background: '#fafcfc' }}>
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #d6dde1', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>Bulk Paste Preview</strong><span>Raw Rows: <b>{result.rawRowCount}</b> · Final Groups: <b>{result.finalRowCount}</b> · Existing: <b>{existingCount}</b></span></div>
    <div className="table-wrap"><table className="enterprise-table"><thead><tr><th>S No</th><th>Demanded Date</th><th>Required Date</th><th>Location</th><th>Loading Pt.</th><th>Weight</th></tr></thead><tbody>{sample.map((row, i) => <tr key={row.groupKey || i}><td>{row.serialNo}</td><td>{displayDate(row.demandedDate)}</td><td>{row.requiredDate}</td><td>{row.location}</td><td>{row.loadingPoint}</td><td>{row.weight}</td></tr>)}{!sample.length && <tr><td colSpan="6">No grouped demand was produced.</td></tr>}</tbody></table></div>
    <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="button secondary" disabled={!result.finalRows.length} onClick={() => onImport('append')}>APPEND</button><button className="button primary" disabled={!result.finalRows.length} onClick={() => onImport('replace')}>REPLACE</button></div>
  </div>;
}
