import React from 'react';

export default function SectionPanel({ title, subtitle, children, className = '' }) {
  return (
    <section className={`section-panel ${className}`}>
      <div className="section-panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="section-panel-body">{children}</div>
    </section>
  );
}
