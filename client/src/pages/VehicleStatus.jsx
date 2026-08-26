import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import DataTable from '../components/DataTable';
import { VEHICLE_STATUS_COLUMNS } from '../data/vehicleStatusTrackingData';
import { getVehicleStatusData, saveVehicleStatusData } from '../services/vehicleStatusService';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { displayDate } from '../services/normalization';

const FILTERS = [
  ['status-demanded-date', 'Demanded Date', 'demandedDate'], ['status-required-date', 'Required Date', 'requiredDate'],
  ['status-loading-point', 'Loading Pt.', 'loadingPoint'], ['status-location', 'Location', 'location'],
  ['status-remarks', 'Remarks', 'remarks'], ['status-gate-slip', 'Gate Slip No.', 'gateSlipNo']
];

function parsePastedRows(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const first = lines[0].split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const headers = first.map((cell) => cell.toLowerCase());
  const aliases = {
    demandedDate: ['demanded date', 'demand date', 'date'], requiredDate: ['required date'], location: ['location', 'cfa'],
    loadingPoint: ['loading pt.', 'loading pt', 'loading point', 'loading'], weight: ['weight']
  };
  const indexOf = (names) => headers.findIndex((h) => names.includes(h));
  const idx = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, indexOf(names)]));
  const hasHeader = Object.values(idx).some((value) => value >= 0);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const keys = Object.keys(aliases);
  return dataLines.map((line) => {
    const cells = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(keys.map((key, i) => [key, hasHeader ? (idx[key] >= 0 ? cells[idx[key]] ?? '' : '') : (cells[i] ?? '')]));
  }).filter((row) => Object.values(row).some(Boolean));
}

export default function VehicleStatus() {
  const [rows, setRows] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const refresh = useCallback(() => setRows(getVehicleStatusData()), []);
  useEffect(() => { refresh(); return useDataStoreSubscription(refresh); }, [refresh]);

  const filteredRows = useMemo(() => rows.filter((row) => Object.entries(filterValues).every(([key, value]) => !value || String(row[key] ?? '').toLowerCase().includes(value.toLowerCase()))).map((row) => ({
    ...row, demandedDate: displayDate(row.demandedDate), requiredDate: displayDate(row.requiredDate), vehicleArrived: displayDate(row.vehicleArrived), vehicleDispatch: displayDate(row.vehicleDispatch)
  })), [rows, filterValues]);

  function loadPastedData() {
    const parsed = parsePastedRows(pasteText);
    if (!parsed.length) { setMessage('No valid vehicle status rows found in the pasted data.'); return; }
    saveVehicleStatusData(parsed); setPasteText(''); setMessage(`${parsed.length} vehicle demand record(s) loaded.`); refresh();
  }

  function clearFilters() { setFilterValues({}); }
  function clearStatus() { dataStore.setStatus([]); setMessage('Vehicle status data cleared.'); refresh(); }

  return (
    <div className="page-content">
      <PageHeader title="Vehicle Status Tracking" description="Vehicle demand and operational status workspace." actions={(
        <><button className="button secondary" onClick={refresh}>↻ Refresh</button><button className="button secondary" onClick={clearFilters}>Clear Filters</button></>
      )} />
      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Vehicle Demand Input</h2><p>Paste demanded date, required date, location, loading point and weight. These fields are never overwritten by Gate Excel data.</p></div></div>
        <div className="section-panel-body"><textarea className="paste-area" value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder="Paste: Demanded Date, Required Date, Location, Loading Pt., Weight\n20-Jul-2026\t21-Jul-2026\tGhaziabad\tB-0 T-0\t17.300 MT" /><div className="input-action-row"><button className="button primary" onClick={loadPastedData}>Load Vehicle Demand</button><button className="button secondary" onClick={clearStatus}>Clear Status Data</button>{message && <span className="inline-message">{message}</span>}</div></div>
      </section>
      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Status Filters</h2><p>Filters operate on the current enriched Page 2 dataset.</p></div></div>
        <div className="section-panel-body"><Toolbar>{FILTERS.map(([id, label, key]) => <div className="field-group" key={id}><label htmlFor={id}>{label}</label><input id={id} value={filterValues[key] || ''} onChange={(event) => setFilterValues((current) => ({ ...current, [key]: event.target.value }))} placeholder={label} /></div>)}</Toolbar></div>
      </section>
      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Vehicle Status Records</h2><p>Page 2 group key: Demanded Date + Location + Loading Pt. It matches Page 1 Date + CFA + Loading and then uses Gate Slip for arrival/dispatch.</p></div></div>
        <div className="section-panel-body table-section-body"><DataTable columns={VEHICLE_STATUS_COLUMNS} rows={filteredRows} emptyTitle="No vehicle status records available." emptyDescription="Paste vehicle demand data above to create Page 2 records." showHeaderWhenEmpty /></div>
      </section>
    </div>
  );
}
