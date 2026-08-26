import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import DataTable from '../components/DataTable';
import { VEHICLE_PLANNING_COLUMNS } from '../data/vehiclePlanningData';
import { getVehiclePlanningData, saveVehiclePlanningData } from '../services/vehiclePlanningService';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { displayDate } from '../services/normalization';

const FILTERS = [
  ['planning-date', 'Date', 'Date'], ['planning-loc', 'Loc', 'Loc'], ['planning-plant', 'Plant', 'Plant'],
  ['planning-cfa', 'CFA', 'CFA'], ['planning-loading', 'Loading', 'Loading'], ['planning-sto', 'STO', 'STO'],
  ['planning-vehicle-number', 'Vehicle Number', 'Vehicle Number']
];

function parsePastedRows(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const first = lines[0].split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const headers = first.map((h) => h.toLowerCase());
  const aliases = {
    date: ['date'], loc: ['loc', 'location'], plant: ['plant'], cfa: ['cfa'], weight: ['weight'], sto: ['sto', 'sto number', 'sto no', 'sto no.'], loading: ['loading', 'loading point', 'loading pt.']
  };
  const indexOf = (names) => headers.findIndex((h) => names.includes(h));
  const idx = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, indexOf(names)]));
  const hasHeader = Object.values(idx).some((value) => value >= 0);
  const dataLines = hasHeader ? lines.slice(1) : lines;
  if (!hasHeader) {
    const keys = Object.keys(aliases);
    return dataLines.map((line) => {
      const cells = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
      return Object.fromEntries(keys.map((key, i) => [key, cells[i] ?? '']));
    }).filter((row) => Object.values(row).some(Boolean));
  }
  return dataLines.map((line) => {
    const cells = line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(Object.keys(aliases).map((key) => [key, idx[key] >= 0 ? cells[idx[key]] ?? '' : '']));
  }).filter((row) => Object.values(row).some(Boolean));
}

export default function VehiclePlanning() {
  const [rows, setRows] = useState([]);
  const [pasteText, setPasteText] = useState('');
  const [message, setMessage] = useState('');
  const [filterValues, setFilterValues] = useState({});

  const refresh = useCallback(() => setRows(getVehiclePlanningData()), []);
  useEffect(() => { refresh(); return useDataStoreSubscription(refresh); }, [refresh]);

  const filteredRows = useMemo(() => rows.filter((row) => Object.entries(filterValues).every(([key, value]) => !value || String(row[key] ?? '').toLowerCase().includes(value.toLowerCase()))).map((row) => ({
    ...row,
    date: displayDate(row.date), vehicleIn: displayDate(row.vehicleIn), vehicleOut: displayDate(row.vehicleOut)
  })), [rows, filterValues]);

  function loadPastedData() {
    const parsed = parsePastedRows(pasteText);
    if (!parsed.length) { setMessage('No valid planning rows found in the pasted data.'); return; }
    saveVehiclePlanningData(parsed);
    setPasteText('');
    setMessage(`${parsed.length} planning record(s) loaded.`);
    refresh();
  }

  function clearFilters() {
    setFilterValues({});
  }

  function clearPlanning() {
    dataStore.setPlanning([]);
    setMessage('Vehicle planning data cleared.');
    refresh();
  }

  return (
    <div className="page-content">
      <PageHeader title="Vehicle Planning" description="Vehicle / STO plan shared with the mother warehouse." actions={(
        <>
          <button className="button secondary" onClick={refresh}>↻ Refresh</button>
          <button className="button secondary" onClick={clearFilters}>Clear Filters</button>
        </>
      )} />

      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Planning Data Input</h2><p>Paste tab-separated or comma-separated planning rows. User-supplied fields remain the primary source.</p></div></div>
        <div className="section-panel-body">
          <textarea className="paste-area" value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder="Paste: Date, Loc, Plant, CFA, Weight, STO, Loading\n20-Jul-2026\tMain\t9911\tGhaziabad\t17.300 MT\tSTO001\tB-0 T-0" />
          <div className="input-action-row"><button className="button primary" onClick={loadPastedData}>Load Planning Data</button><button className="button secondary" onClick={clearPlanning}>Clear Planning Data</button>{message && <span className="inline-message">{message}</span>}</div>
        </div>
      </section>

      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Planning Filters</h2><p>Client-side filters over the current Page 1 dataset.</p></div></div>
        <div className="section-panel-body"><Toolbar>{FILTERS.map(([id, label]) => {
          const key = label === 'Vehicle Number' ? 'vehicleNumber' : label.toLowerCase();
          return <div className="field-group" key={id}><label htmlFor={id}>{label}</label><input id={id} value={filterValues[key] || ''} onChange={(event) => setFilterValues((current) => ({ ...current, [key]: event.target.value }))} placeholder={label} /></div>;
        })}</Toolbar></div>
      </section>

      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Vehicle Planning Records</h2><p>Gate Slip is resolved at Date + CFA + Loading group level; Gate In/Out data enriches vehicle fields only when available.</p></div></div>
        <div className="section-panel-body table-section-body"><DataTable columns={VEHICLE_PLANNING_COLUMNS} rows={filteredRows} emptyTitle="No vehicle planning data available." emptyDescription="Paste planning data above to create Page 1 records." showHeaderWhenEmpty /></div>
      </section>
    </div>
  );
}
