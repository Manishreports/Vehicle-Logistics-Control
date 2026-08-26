import React from 'react';

export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">□</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
