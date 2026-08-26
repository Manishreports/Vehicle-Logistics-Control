import React from 'react';

export default function DataTable({ columns = [], rows = [], emptyTitle, emptyDescription }) {
  if (!rows.length) {
    return (
      <div className="table-empty">
        <div className="table-empty-icon">▤</div>
        <strong>{emptyTitle || 'No records available.'}</strong>
        {emptyDescription && <span>{emptyDescription}</span>}
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="enterprise-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id ?? index}>{columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
