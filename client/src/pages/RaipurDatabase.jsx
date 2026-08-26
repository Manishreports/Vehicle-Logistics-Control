import React from 'react';
import PageHeader from '../components/PageHeader';
import Toolbar from '../components/Toolbar';
import DataTable from '../components/DataTable';

export default function RaipurDatabase() {
  return (
    <div className="page-content">
      <PageHeader
        title="Raipur Database"
        description="Independent Raipur dataset reserved as a future fallback source."
        actions={<><button className="button secondary" disabled>＋ Add</button><button className="button secondary" onClick={() => window.location.reload()}>↻ Refresh</button></>}
      />
      <section className="section-panel">
        <div className="section-panel-header"><div><h2>Raipur Records</h2><p>This dataset remains logically separate from Vehicle Planning and Vehicle Status Tracking.</p></div></div>
        <Toolbar>
          <div className="field-group search-field"><label htmlFor="raipur-search">Search</label><input id="raipur-search" placeholder="Search Raipur records (future)" disabled /></div>
          <div className="field-group"><label htmlFor="raipur-filter">Filter</label><select id="raipur-filter" disabled><option>All records</option></select></div>
          <button className="button secondary" disabled>Clear</button>
        </Toolbar>
        <DataTable columns={[]} rows={[]} emptyTitle="No Raipur database records available." emptyDescription="The Raipur dataset is ready to be connected without being merged into other datasets." />
      </section>
    </div>
  );
}
