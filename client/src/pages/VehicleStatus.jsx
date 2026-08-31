import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../components/DataTable';
import { VEHICLE_STATUS_COLUMNS } from '../data/vehicleStatusTrackingData';
import { getVehicleStatusData } from '../services/vehicleStatusService';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { displayBusinessDate, normalizeBusinessDate } from '../services/dateService.js';
import { previewBulkPaste, aggregateStatusRows } from '../services/bulkPasteService';

export default function VehicleStatus() {
  const [rows, setRows] = useState([]); const [pasteText, setPasteText] = useState(''); const [preview, setPreview] = useState(null); const [message, setMessage] = useState(''); const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const alertType = searchParams.get('alertType') || '';
  const alertFocus = useMemo(() => {
    try {
      const raw = searchParams.get('alertFocus');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }, [searchParams]);
  const hasAlertFocus = Boolean(alertType || alertFocus.length);
  const refresh = useCallback(() => setRows(getVehicleStatusData()), []); useEffect(() => { refresh(); return useDataStoreSubscription(refresh); }, [refresh]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const focusedRows = hasAlertFocus ? rows.filter((row) => alertFocus.some((focus) => {
      const dateMatches = !focus.date || normalizeBusinessDate(row.demandedDate) === normalizeBusinessDate(focus.date);
      const locationMatches = !focus.name || String(row.location ?? '').trim().toLowerCase() === String(focus.name ?? '').trim().toLowerCase();
      const loadingMatches = !focus.loading || String(row.loadingPoint ?? '').trim().toLowerCase() === String(focus.loading ?? '').trim().toLowerCase();
      if (!(dateMatches && locationMatches && loadingMatches)) return false;
      return alertType === 'Plan Pending' ? row.conflict?.type === 'NO_PAGE1_MATCH' : true;
    })) : rows;
    return focusedRows.filter((row) => !normalizedQuery || JSON.stringify(row).toLowerCase().includes(normalizedQuery)).map((row) => ({ ...row, demandedDate: displayBusinessDate(row.demandedDate), requiredDate: (row.requiredDates || []).map((value) => displayBusinessDate(value)).join(' / '), vehicleArrived: displayBusinessDate(row.vehicleArrived), vehicleDispatch: displayBusinessDate(row.vehicleDispatch) }));
  }, [rows, query, alertType, alertFocus, hasAlertFocus]);  function buildPreview() { const result = previewBulkPaste(pasteText, 'status'); if (!result.rawRowCount) { setMessage('No valid vehicle status rows found in the pasted data.'); setPreview(null); return; } setPreview(result); setMessage('Preview ready. Review the grouped demand before importing.'); }
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
    <section className="section-panel"><div className="section-panel-body"><div className="toolbar"><div className="field-group search-field"><label htmlFor="status-search">Search Vehicle Status Records</label><input id="status-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Vehicle Status Records..." /></div>{hasAlertFocus && <button className="button secondary" type="button" onClick={() => { setSearchParams({}); setQuery(''); }}>Clear Alert Focus</button>}</div></div></section>
    <section className="section-panel"><div className="section-panel-header"><div><h2>Vehicle Status Records</h2><p>{filteredRows.length} final demand group(s). Gate/vehicle fields are enriched through the existing Page 1 group relationship.</p></div></div><div className="section-panel-body table-section-body">{hasAlertFocus && <div className="inline-message">Alert focus active: showing only records related to {alertType}.</div>}<DataTable columns={VEHICLE_STATUS_COLUMNS} rows={filteredRows} emptyTitle={hasAlertFocus ? "No matching Vehicle Status Record found for this alert." : "No vehicle status records available."} emptyDescription={hasAlertFocus ? "Clear Alert Focus to return to the complete Vehicle Status Records dataset." : "Paste vehicle demand data above and preview the grouped result before import."} showHeaderWhenEmpty /></div></section>
  </div>;
}

function BulkPreview({ result, onImport, existingCount }) {
  const sample = result.finalRows.slice(0, 20);
  return <div style={{ marginTop: 14, border: '1px solid #d6dde1', background: '#fafcfc' }}>
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #d6dde1', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>Bulk Paste Preview</strong><span>Raw Rows: <b>{result.rawRowCount}</b> · Final Groups: <b>{result.finalRowCount}</b> · Existing: <b>{existingCount}</b></span></div>
    <div className="table-wrap"><table className="enterprise-table"><thead><tr><th>S No</th><th>Demanded Date</th><th>Required Date</th><th>Location</th><th>Loading Pt.</th><th>Weight</th></tr></thead><tbody>{sample.map((row, i) => <tr key={row.groupKey || i}><td>{row.serialNo}</td><td>{displayBusinessDate(row.demandedDate)}</td><td>{(row.requiredDates || []).map((value) => displayBusinessDate(value)).join(' / ')}</td><td>{row.location}</td><td>{row.loadingPoint}</td><td>{row.weight}</td></tr>)}{!sample.length && <tr><td colSpan="6">No grouped demand was produced.</td></tr>}</tbody></table></div>
    <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="button secondary" disabled={!result.finalRows.length} onClick={() => onImport('append')}>APPEND</button><button className="button primary" disabled={!result.finalRows.length} onClick={() => onImport('replace')}>REPLACE</button></div>
  </div>;
}

function displayOrPending(value) { return value ? value : 'Pending'; }
