import React from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import DataTable from '../components/DataTable';

export default function VehicleStatus() {
  return (
    <div className="page-content">
      <PageHeader
        title="Vehicle Status Tracking"
        description="Operational tracking workspace for vehicle movement and status."
        actions={<button className="button secondary" onClick={() => window.location.reload()}>↻ Refresh</button>}
      />
      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Status Records</h2><p>Prepared for future Gate In, Gate Out, vehicle and STO integrations.</p></div></div>
        <Toolbar>
          <div className="field-group search-field"><label htmlFor="status-search">Search</label><input id="status-search" placeholder="Search records (future)" disabled /></div>
          <div className="field-group"><label htmlFor="status-filter">Status</label><select id="status-filter" disabled><option>All statuses</option></select></div>
          <button className="button secondary" disabled>Clear</button>
        </Toolbar>
        <DataTable columns={[]} rows={[]} emptyTitle="No vehicle status records available." emptyDescription="Status data will be connected in a future business-logic phase." />
      </section>
    </div>
  );
}
