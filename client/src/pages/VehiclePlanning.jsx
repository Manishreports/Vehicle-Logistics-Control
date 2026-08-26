import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import DataTable from '../components/DataTable';
import { VEHICLE_PLANNING_COLUMNS } from '../data/vehiclePlanningData';
import { getVehiclePlanningData, saveVehiclePlanningData } from '../services/vehiclePlanningService';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { displayDate } from '../services/normalization';
import { previewBulkPaste } from '../services/bulkPasteService';

const FILTERS = [
  ['planning-date', 'Date', 'date'], ['planning-loc', 'Loc', 'loc'], ['planning-plant', 'Plant', 'plant'],
  ['planning-cfa', 'CFA', 'cfa'], ['planning-loading', 'Loading', 'loading'], ['planning-sto', 'STO', 'sto'], ['planning-vehicle-number', 'Vehicle Number', 'vehicleNumber']
];

export default function VehiclePlanning() {
  const [rows, setRows] = useState([]); const [pasteText, setPasteText] = useState(''); const [preview, setPreview] = useState(null); const [message, setMessage] = useState(''); const [filterValues, setFilterValues] = useState({});
  const refresh = useCallback(() => setRows(getVehiclePlanningData()), []);
  useEffect(() => { refresh(); return useDataStoreSubscription(refresh); }, [refresh]);
  const filteredRows = useMemo(() => rows.filter((row) => Object.entries(filterValues).every(([key, value]) => !value || String(row[key] ?? '').toLowerCase().includes(value.toLowerCase()))).map((row) => ({ ...row, date: displayDate(row.date), vehicleIn: displayDate(row.vehicleIn), vehicleOut: displayDate(row.vehicleOut) })), [rows, filterValues]);

  function buildPreview() { const result = previewBulkPaste(pasteText, 'planning'); if (!result.rawRowCount) { setMessage('No valid planning rows found in the pasted data.'); setPreview(null); return; } setPreview(result); setMessage('Preview ready. Review the grouped result before importing.'); }
  function importPreview() { if (!preview?.rows.length) return; saveVehiclePlanningData(preview.rows, preview.rows); setPasteText(''); setPreview(null); setMessage(`${preview.finalRowCount} vehicle plan(s) imported from ${preview.rawRowCount} raw row(s).`); refresh(); }
  function clearPlanning() { dataStore.clearPlanning(); setPreview(null); setPasteText(''); setMessage('Vehicle planning data cleared.'); refresh(); }

  return <div className="page-content">
    <PageHeader title="Vehicle Planning" description="Vehicle / STO plan shared with the mother warehouse." actions={<><button className="button secondary" onClick={refresh}>↻ Refresh</button><button className="button secondary" onClick={() => setFilterValues({})}>Clear Filters</button></>} />
    <section className="section-panel"><div className="section-panel-header"><div><h2>Bulk Paste Planning Data</h2><p>Paste the complete planning extract. Plans are grouped by Date + CFA + Loading; Loc and STO do not split a plan.</p></div></div><div className="section-panel-body">
      <textarea className="paste-area" value={pasteText} onChange={(e) => { setPasteText(e.target.value); setPreview(null); }} placeholder="Date\tLoc\tPlant\tCFA\tWeight\tSTO\tSTO\tLoading\n17-Aug-2026\tDEHR\tDrools Pet Food Pvt. Ltd.\tGhaziabad 1\t300 Kgs.\t4210085514\t\tBAKAL LOADING" />
      <div className="input-action-row"><button className="button primary" onClick={buildPreview}>Preview Bulk Paste</button><button className="button secondary" onClick={clearPlanning}>Clear Planning Data</button>{message && <span className="inline-message">{message}</span>}</div>
      {preview && <BulkPreview result={preview} onImport={importPreview} kind="Vehicle Planning" />}
    </div></section>
    <section className="section-panel"><div className="section-panel-header"><div><h2>Planning Filters</h2><p>Filters operate on the grouped and enriched Page 1 dataset.</p></div></div><div className="section-panel-body"><Toolbar>{FILTERS.map(([id, label, key]) => <div className="field-group" key={id}><label htmlFor={id}>{label}</label><input id={id} value={filterValues[key] || ''} onChange={(e) => setFilterValues((current) => ({ ...current, [key]: e.target.value }))} placeholder={label} /></div>)}</Toolbar></div></section>
    <section className="section-panel"><div className="section-panel-header"><div><h2>Vehicle Planning Records</h2><p>{filteredRows.length} final plan(s). Gate fields are enriched from separate Gate In / Gate Out datasets.</p></div></div><div className="section-panel-body table-section-body"><DataTable columns={VEHICLE_PLANNING_COLUMNS} rows={filteredRows} emptyTitle="No vehicle planning data available." emptyDescription="Paste planning data above and preview the grouped result before import." showHeaderWhenEmpty /></div></section>
  </div>;
}

function BulkPreview({ result, onImport, kind }) {
  const sample = result.finalRows.slice(0, 20);
  return <div style={{ marginTop: 14, border: '1px solid #d6dde1', background: '#fafcfc' }}>
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #d6dde1', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>Bulk Paste Preview</strong><span>Raw Rows: <b>{result.rawRowCount}</b> · Final Plans: <b>{result.finalRowCount}</b></span></div>
    <div className="table-wrap"><table className="enterprise-table"><thead><tr><th>S.No</th><th>Date</th><th>Loc</th><th>Plant</th><th>CFA</th><th>Weight</th><th>STO</th><th>Loading</th></tr></thead><tbody>{sample.map((row, i) => <tr key={row.groupKey || i}><td>{row.serialNo}</td><td>{displayDate(row.date)}</td><td>{row.loc}</td><td>{row.plant}</td><td>{row.cfa}</td><td>{row.weight}</td><td>{row.sto}</td><td>{row.loading}</td></tr>)}{!sample.length && <tr><td colSpan="8">No grouped plans were produced.</td></tr>}</tbody></table></div>
    <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end' }}><button className="button primary" disabled={!result.finalRows.length} onClick={onImport}>Import {kind}</button></div>
  </div>;
}
