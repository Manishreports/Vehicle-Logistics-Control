import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getVehiclePlanningData } from '../services/vehiclePlanningService';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { displayDate } from '../services/normalization';
import { previewBulkPaste, aggregatePlanningRows } from '../services/bulkPasteService';

export default function VehiclePlanning() {
  const [rows, setRows] = useState([]); const [pasteText, setPasteText] = useState(''); const [preview, setPreview] = useState(null); const [message, setMessage] = useState(''); const [query, setQuery] = useState('');
  const refresh = useCallback(() => setRows(getVehiclePlanningData()), []);
  useEffect(() => { refresh(); return useDataStoreSubscription(refresh); }, [refresh]);
  const filteredRows = useMemo(() => rows.filter((row) => !query || JSON.stringify(row).toLowerCase().includes(query.toLowerCase())).map((row) => ({ ...row, date: displayDate(row.date), vehicleIn: displayDate(row.vehicleIn), vehicleOut: displayDate(row.vehicleOut) })), [rows, query]);
  const loadingPending = useMemo(() => rows.reduce((counts, row) => { const loading = String(row.loading || '').toUpperCase(); if (!row.vehicleIn && loading.includes('BAKAL')) counts.B += 1; if (!row.vehicleIn && loading.includes('TOLAGAON')) counts.T += 1; return counts; }, { B: 0, T: 0 }), [rows]);  function buildPreview() { const result = previewBulkPaste(pasteText, 'planning'); if (!result.rawRowCount) { setMessage('No valid planning rows found in the pasted data.'); setPreview(null); return; } setPreview(result); setMessage('Preview ready. Review the grouped result before importing.'); }
  function importPreview(mode) {
    if (!preview?.rows.length) return;
    const existingFinal = dataStore.getPlanning();
    const existingRaw = dataStore.getPlanningRaw();
    if (mode === 'replace' && !window.confirm(`Replace existing data?\n\nYou currently have ${existingFinal.length} plans. Replacing will remove the existing dataset.`)) return;
    const combinedRaw = mode === 'append' ? existingRaw.concat(preview.rows.map((row, i) => i === 0 ? { ...row, __batchBoundary: true } : row)) : preview.rows;
    const finalRows = aggregatePlanningRows(combinedRaw);
    const cleanRaw = combinedRaw.map((row) => { const next = { ...row }; delete next.__batchBoundary; return next; });
    dataStore.setPlanning(finalRows, cleanRaw);
    setPasteText(''); setPreview(null); setMessage(`${mode === 'append' ? 'Appended' : 'Replaced'} data. Final plans: ${finalRows.length}.`); refresh();
  }
  function clearPlanning() { dataStore.clearPlanning(); setPreview(null); setPasteText(''); setMessage('Vehicle planning data cleared.'); refresh(); }

  return <div className="page-content">
    <section className="section-panel"><div className="section-panel-header"><div><h2>Bulk Paste Planning Data</h2><p>Paste the complete planning extract. Plans are grouped by Date + CFA + Loading; Loc and STO do not split a plan.</p></div></div><div className="section-panel-body">
      <textarea className="paste-area" value={pasteText} onChange={(e) => { setPasteText(e.target.value); setPreview(null); }} placeholder="Date\tLoc\tPlant\tCFA\tWeight\tSTO\tSTO\tLoading\n17-Aug-2026\tDEHR\tDrools Pet Food Pvt. Ltd.\tGhaziabad 1\t300 Kgs.\t4210085514\t\tBAKAL LOADING" />
      <div className="input-action-row"><button className="button primary" onClick={buildPreview}>Preview Bulk Paste</button><button className="button secondary" onClick={clearPlanning}>Clear Planning Data</button>{message && <span className="inline-message">{message}</span>}</div>
      {preview && <BulkPreview result={preview} onImport={importPreview} kind="Vehicle Planning" existingCount={dataStore.getPlanning().length} />}
    </div></section>
    <section className="section-panel"><div className="section-panel-body"><div className="toolbar"><div className="field-group search-field"><label htmlFor="planning-search">Search Vehicle Planning</label><input id="planning-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Vehicle Planning..." /></div></div></div></section>
    <section className="section-panel"><div className="section-panel-header"><div><h2>Vehicle Planning Records</h2><p>{filteredRows.length} final plan(s). Gate fields are enriched from separate Gate In / Gate Out datasets.</p></div></div><div className="section-panel-body table-section-body"><GroupedPlanningTable rows={filteredRows} loadingPending={loadingPending} /></div></section>
  </div>;
}


function buildPlanningDisplayRows(row) {
  const locations = Array.isArray(row.locations) && row.locations.length
    ? row.locations.map((location) => ({ loc: location.loc, stos: Array.isArray(location.stos) ? location.stos : [] }))
    : [{ loc: Array.isArray(row.loc) ? (row.loc[0] || '—') : (row.loc || '—'), stos: Array.isArray(row.sto) ? row.sto : String(row.sto || '').split(/[,;\n|\/]+/).map((value) => value.trim()).filter(Boolean) }];
  return locations.flatMap((location) => {
    const stos = location.stos.length ? location.stos : [''];
    return stos.map((sto, index) => ({ loc: location.loc, sto, locFirst: index === 0, locSpan: stos.length }));
  });
}

function GroupedPlanningTable({ rows, loadingPending = { B: 0, T: 0 } }) {
  const columns = ['S.No', 'Date', 'Loc', 'Plant', 'CFA', 'Weight', 'STO', 'Loading', 'Vehicle In', 'Vehicle Number', 'Vehicle Out', 'Slip Number'];
  if (!rows.length) return <div className="table-wrap"><table className="enterprise-table grouped-planning-table"><thead><tr>{columns.map((label) => <th key={label}>{label === 'Loading' ? <>Loading <span className="loading-status">B-{loadingPending.B}<br />T-{loadingPending.T}</span></> : label}</th>)}</tr></thead><tbody><tr className="table-empty-row"><td colSpan={12}>No vehicle planning data available.</td></tr></tbody></table></div>;

  return <div className="table-wrap"><table className="enterprise-table grouped-planning-table"><thead><tr>{columns.map((label) => <th key={label}>{label === 'Loading' ? <>Loading <span className="loading-status">B-{loadingPending.B}<br />T-{loadingPending.T}</span></> : label}</th>)}</tr></thead><tbody>
    {rows.map((row, rowIndex) => {
      const displayRows = buildPlanningDisplayRows(row);
      const totalRows = displayRows.length || 1;
      return displayRows.map((item, childIndex) => <tr key={`${row.groupKey}-${childIndex}`} className={row.conflict ? 'conflict-row' : ''}>
        {childIndex === 0 && <>
          <td rowSpan={totalRows} className="plan-parent-cell">{row.serialNo}</td>
          <td rowSpan={totalRows} className="plan-parent-cell">{displayDate(row.date)}</td>
        </>}
        {item.locFirst && <td rowSpan={item.locSpan} className="location-parent-cell">{item.loc}</td>}
        {childIndex === 0 && <>
          <td rowSpan={totalRows} className="plan-parent-cell">{Array.isArray(row.plant) ? row.plant[0] : row.plant}</td>
          <td rowSpan={totalRows} className="plan-parent-cell">{row.cfa}</td>
          <td rowSpan={totalRows} className="plan-parent-cell">{row.weight}</td>
        </>}
        <td>{item.sto}</td>
        {childIndex === 0 && <>
          <td rowSpan={totalRows} className="plan-parent-cell">{row.loading}</td>
          <td rowSpan={totalRows} className="plan-parent-cell">{displayOrPending(displayDate(row.vehicleIn))}</td>
          <td rowSpan={totalRows} className="plan-parent-cell">{displayOrPending(row.vehicleNumber)}</td>
          <td rowSpan={totalRows} className="plan-parent-cell">{displayOrPending(displayDate(row.vehicleOut))}</td>
          <td rowSpan={totalRows} className="plan-parent-cell">{displayOrPending(row.slipNumber)}</td>
        </>}
      </tr>);
    })}
  </tbody></table></div>;
}

function BulkPreview({ result, onImport, kind, existingCount }) {
  const sample = result.finalRows.slice(0, 20);
  return <div style={{ marginTop: 14, border: '1px solid #d6dde1', background: '#fafcfc' }}>
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #d6dde1', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong>Bulk Paste Preview</strong><span>Raw Rows: <b>{result.rawRowCount}</b> · Final Plans: <b>{result.finalRowCount}</b> · Existing: <b>{existingCount}</b></span></div>
    <div className="table-wrap"><table className="enterprise-table"><thead><tr><th>S.No</th><th>Date</th><th>Loc</th><th>Plant</th><th>CFA</th><th>Weight</th><th>STO</th><th>Loading</th></tr></thead><tbody>{sample.map((row, i) => <tr key={row.groupKey || i}><td>{row.serialNo}</td><td>{displayDate(row.date)}</td><td>{row.loc}</td><td>{row.plant}</td><td>{row.cfa}</td><td>{row.weight}</td><td>{row.sto}</td><td>{row.loading}</td></tr>)}{!sample.length && <tr><td colSpan="8">No grouped plans were produced.</td></tr>}</tbody></table></div>
    <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}><button className="button secondary" disabled={!result.finalRows.length} onClick={() => onImport('append')}>APPEND</button><button className="button primary" disabled={!result.finalRows.length} onClick={() => onImport('replace')}>REPLACE</button></div>
  </div>;
}

function displayOrPending(value) { return value ? value : 'Pending'; }
