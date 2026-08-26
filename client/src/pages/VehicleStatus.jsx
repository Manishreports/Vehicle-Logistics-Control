import React from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import DataTable from '../components/DataTable';
import { VEHICLE_STATUS_COLUMNS, vehicleStatusTrackingData } from '../data/vehicleStatusTrackingData';

const FILTERS = [
  ['status-demanded-date', 'Demanded Date', 'Demanded Date'],
  ['status-required-date', 'Required Date', 'Required Date'],
  ['status-loading-point', 'Loading Pt.', 'Loading Pt.'],
  ['status-location', 'Location', 'Location'],
  ['status-remarks', 'Remarks', 'Remarks'],
  ['status-gate-slip', 'Gate Slip No.', 'Gate Slip No.']
];

export default function VehicleStatus() {
  return (
    <div className="page-content">
      <PageHeader
        title="Vehicle Status Tracking"
        description="Vehicle demand and operational status workspace."
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
            <h2>Status Filters</h2>
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
            <h2>Vehicle Status Records</h2>
            <p>Page 2 dataset. Page 1 linkage, Gate In / Gate Out matching and automatic status calculation are intentionally not implemented.</p>
          </div>
        </div>
        <div className="section-panel-body table-section-body">
          <DataTable
            columns={VEHICLE_STATUS_COLUMNS}
            rows={vehicleStatusTrackingData}
            emptyTitle="No vehicle status records available."
            emptyDescription="Vehicle status records will appear here when data is introduced in a later phase."
            showHeaderWhenEmpty
          />
        </div>
      </section>
    </div>
  );
}
