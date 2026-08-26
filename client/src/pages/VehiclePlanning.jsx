import React from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import DataTable from '../components/DataTable';
import { VEHICLE_PLANNING_COLUMNS, vehiclePlanningData } from '../data/vehiclePlanningData';

const FILTERS = [
  ['planning-date', 'Date', 'Date'],
  ['planning-loc', 'Loc', 'Loc'],
  ['planning-plant', 'Plant', 'Plant'],
  ['planning-cfa', 'CFA', 'CFA'],
  ['planning-loading', 'Loading', 'Loading'],
  ['planning-sto', 'STO', 'STO'],
  ['planning-vehicle-number', 'Vehicle Number', 'Vehicle Number']
];

export default function VehiclePlanning() {
  return (
    <div className="page-content">
      <PageHeader
        title="Vehicle Planning"
        description="Vehicle / STO plan shared with the mother warehouse."
        actions={(
          <>
            <button className="button secondary" onClick={() => window.location.reload()}>↻ Refresh</button>
            <button className="button secondary" type="button" disabled>Clear Filters</button>
          </>
        )}
      />

      <section className="section-panel">
        <div className="section-panel-header">
          <div>
            <h2>Planning Filters</h2>
            <p>Filter structure is ready for the next business-logic phase.</p>
          </div>
        </div>
        <div className="section-panel-body">
          <Toolbar>
            {FILTERS.map(([id, label, placeholder]) => (
              <div className="field-group" key={id}>
                <label htmlFor={id}>{label}</label>
                <input id={id} placeholder={placeholder} disabled />
              </div>
            ))}
          </Toolbar>
        </div>
      </section>

      <section className="section-panel">
        <div className="section-panel-header">
          <div>
            <h2>Vehicle Planning Records</h2>
            <p>Page 1 dataset. Business matching and automatic enrichment are intentionally not implemented.</p>
          </div>
        </div>
        <div className="section-panel-body table-section-body">
          <DataTable
            columns={VEHICLE_PLANNING_COLUMNS}
            rows={vehiclePlanningData}
            emptyTitle="No vehicle planning data available."
            emptyDescription="Vehicle planning records will appear here when data is introduced in a later phase."
            showHeaderWhenEmpty
          />
        </div>
      </section>
    </div>
  );
}
