import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { displayDate } from '../services/normalization';
import { getRaipurDatabaseData } from '../services/raipurDatabaseService';
import { previewBulkPaste, aggregateRaipurRows } from '../services/bulkPasteService';

const COLUMNS = [
  { key: 'serialNo', label: 'S.No' }, { key: 'date', label: 'Date' }, { key: 'loc', label: 'Loc' }, { key: 'plant', label: 'Plant' }, { key: 'cfa', label: 'CFA' }, { key: 'weight', label: 'Weight' }, { key: 'sto', label: 'STO' }, { key: 'loading', label: 'Loading' }, { key: 'vehicleIn', label: 'Vehicle In' }, { key: 'vehicleNumber', label: 'Vehicle Number' }, { key: 'vehicleOut', label: 'Vehicle Out' }, { key: 'slipNumber', label: 'Slip Number' }
];

export default function RaipurDatabase() {
  const [rows, setRows] = useState([]); const [pasteText, setPasteText] = useState(''); const [preview, setPreview] = useState(null); const [message, setMessage] = useState(''); const [search, setSearch] = useState('');
  const refresh = useCallback(() => setRows(getRaipurDatabaseData()), []); useEffect(() => { refresh(); return useDataStoreSubscription(refresh); }, [refresh]);
  const visibleRows = useMemo(() => rows.filter((row) => !search || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(search.toLowerCase()))).map((row) => ({ ...row, date: displayDate(row.date), vehicleIn: displayDate(row.vehicleIn), vehicleOut: displayDate(row.vehicleOut) })), [rows, search]);
  function buildPreview() { const result = previewBulkPaste(pasteText, 'raipur'); if (!result.rawRowCount) { setMessage('No valid Raipur rows found in the pasted data.'); setPreview(null); return; } setPreview(result); setMessage('Preview ready. Review the grouped Raipur dataset before importing.'); }
  function importPreview(mode) {
    if (!preview?.rows.length) return;
    const existingFinal = dataStore.getRaipur();
    const existingRaw = dataStore.getRaipurRaw();
    if (mode === 'replace' && !window.confirm(`Replace existing data?\n\nYou currently have ${existingFinal.length} plans. Replacing will remove the existing dataset.`)) return;
    const combinedRaw = mode === 'append' ? existingRaw.concat(preview.rows.map((row, i) => i === 0 ? { ...row, __batchBoundary: true } : row)) : preview.rows;
    const finalRows = aggregateRaipurRows(combinedRaw);
    const cleanRaw = combinedRaw.map((row) => { const next = { ...row }; delete next.__batchBoundary; return next; });
    dataStore.setRaipur(finalRows, cleanRaw);
    setPasteText(''); setPreview(null); setMessage(`${mode === 'append' ? 'Appended' : 'Replaced'} data. Final plans: ${finalRows.length}.`); refresh();
  }
  function clearData() { dataStore.clearRaipur(); setPasteText(''); setPreview(null); setMessage('Raipur database cleared.'); refresh(); }
  return <div className="page-content">
    <PageHeader title="Raipur Database" description="Independent manually maintained Raipur dataset. Vehicle information is supplied by user paste and is never pulled from Gate Excel." actions={<><button className="button secondary" onClick={refresh}>↻ Refresh</button><button className="button secondary" onClick={clearData}>Clear Data</button></>} />
    <section className="section-panel"><div className="section-panel-header"><div><h2>Bulk Paste Raipur Data</h2><p>Paste planning and vehicle fields together. Grouping uses Date + CFA + Loading; Loc and STO do not split a plan.</p></div></div><div className="section-panel-body">
      <textarea className="paste-area" value={pasteText} onChange={(e) => { setPasteText(e.target.value); setPreview(null); }} placeholder="Date\tLoc\tPlant\tCFA\tWeight\tSTO\tLoading\tVehicle In\tVehicle Number\tVehicle Out\tSlip Number" />
      <div className="input-action-row"><button className="button primary" onClick={buildPreview}>Preview Bulk Paste</button><button className="button secondary" onClick={clearData}>Clear Raipur Data</button>{message && <span className="inline-message">{message}</span>}</div>
      {preview && <BulkPreview result={preview} onImport={importPreview} existingCount={dataStore.getRaipur().length} />}
    </div></section>
    <section className="section-panel"><div className="section-panel-header"><div><h2>Raipur Records</h2><p>{visibleRows.length} final plan(s). This dataset remains independent from Vehicle Planning and Vehicle Status Tracking.</p></div></div><Toolbar><div className="field-group search-field"><label htmlFor="raipur-search">Search</label><input id="raipur-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Raipur records" /></div></Toolbar><div className="section-panel-body table-section-body"><RaipurGroupedTable rows={visibleRows} /></div></section>
  </div>;
}
function RaipurGroupedTable({ rows }) {
  if (!rows.length) {
    return <div className="table-wrap"><table className="enterprise-table"><thead><tr>{COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody><tr className="table-empty-row"><td colSpan={COLUMNS.length}><div className="table-empty-inline"><div className="table-empty-icon">▤</div><strong>No Raipur database records available.</strong><span>Paste Raipur data above to create the independent master dataset.</span></div></td></tr></tbody></table></div>;
  }

  return <div className="table-wrap"><table className="enterprise-table grouped-plan-table"><thead><tr>{COLUMNS.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.flatMap((plan) => {
    const locations = Array.isArray(plan.locations) && plan.locations.length
      ? plan.locations.map((location) => ({ loc: location.loc || '—', stos: Array.isArray(location.stos) ? [...new Set(location.stos.filter(Boolean).map(String))] : [] }))
      : [{ loc: Array.isArray(plan.loc) ? plan.loc[0] || '—' : plan.loc || '—', stos: Array.isArray(plan.sto) ? [...new Set(plan.sto.filter(Boolean).map(String))] : [] }];
    const childRows = locations.flatMap((location) => (location.stos.length ? location.stos : ['']).map((sto, index) => ({ ...location, sto, locFirst: index === 0, locSpan: location.stos.length || 1 })));
    const planSpan = Math.max(childRows.length, 1);
    return childRows.map((child, index) => <tr key={`${plan.groupKey}-${index}`} className={plan.conflicts?.length ? 'conflict-row' : ''}>
      {index === 0 && <><td rowSpan={planSpan}>{plan.serialNo}</td><td rowSpan={planSpan}>{displayDate(plan.date)}</td></>}
      {child.locFirst && <td rowSpan={child.locSpan}>{child.loc}</td>}
      {child.locFirst && child.locSpan < 1 ? null : null}
      {index === 0 && <><td rowSpan={planSpan}>{Array.isArray(plan.plant) ? plan.plant[0] : plan.plant}</td><td rowSpan={planSpan}>{plan.cfa}</td><td rowSpan={planSpan}>{plan.weight}</td></>}
      <td>{child.sto}</td>
      {index === 0 && <><td rowSpan={planSpan}>{plan.loading}</td><td rowSpan={planSpan}>{displayDate(plan.vehicleIn)}</td><td rowSpan={planSpan}>{plan.vehicleNumber}</td><td rowSpan={planSpan}>{displayDate(plan.vehicleOut)}</td><td rowSpan={planSpan}>{plan.slipNumber}</td></>}
    </tr>);
  })}</tbody></table></div>;
}

function BulkPreview({ result, onImport, existingCount }) { const sample = result.finalRows.slice(0, 20); return <div style={{ marginTop: 14, border: '1px solid #d6dde1', background: '#fafcfc' }}><div style={{ padding: '10px 12px', borderBottom: '1px solid #d6dde1', display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>Bulk Paste Preview</strong><span>Raw Rows: <b>{result.rawRowCount}</b> · Final Plans: <b>{result.finalRowCount}</b> · Existing: <b>{existingCount}</b></span></div><div className="table-wrap"><table className="enterprise-table"><thead><tr><th>S.No</th><th>Date</th><th>Loc</th><th>Plant</th><th>CFA</th><th>Weight</th><th>STO</th><th>Loading</th><th>Vehicle In</th><th>Vehicle Number</th><th>Vehicle Out</th><th>Slip Number</th></tr></thead><tbody>{sample.map((row, i) => <tr key={row.groupKey || i}><td>{row.serialNo}</td><td>{displayDate(row.date)}</td><td>{Array.isArray(row.loc) ? row.loc.join(' / ') : row.loc}</td><td>{Array.isArray(row.plant) ? row.plant.join(' / ') : row.plant}</td><td>{row.cfa}</td><td>{row.weight}</td><td>{Array.isArray(row.sto) ? row.sto.map((sto) => <div key={sto}>{sto}</div>) : row.sto}</td><td>{row.loading}</td><td>{displayDate(row.vehicleIn)}</td><td>{row.vehicleNumber}</td><td>{displayDate(row.vehicleOut)}</td><td>{row.slipNumber}</td></tr>)}{!sample.length && <tr><td colSpan="12">No grouped Raipur plans were produced.</td></tr>}</tbody></table></div><div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="button secondary" disabled={!result.finalRows.length} onClick={() => onImport('append')}>APPEND</button><button className="button primary" disabled={!result.finalRows.length} onClick={() => onImport('replace')}>REPLACE</button></div></div>; }
