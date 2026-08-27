import { ensureDateDataVersion } from './services/dataVersion';
import React, { useMemo, useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import VehiclePlanning from './pages/VehiclePlanning';
import VehicleStatus from './pages/VehicleStatus';
import RaipurDatabase from './pages/RaipurDatabase';
import ExcelUpload from './pages/ExcelUpload';
import { dataStore } from './services/dataStore';
import BackToTop from './components/BackToTop';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/vehicle-planning', label: 'Vehicle Planning', icon: '▣' },
  { path: '/vehicle-status', label: 'Vehicle Status Records', icon: '◈' },
  { path: '/raipur-database', label: 'Raipur Database', icon: '▤' },
  { path: '/excel-upload', label: 'Excel Upload', icon: '⇧' }
];

const PAGE_NAMES = Object.fromEntries(NAV_ITEMS.map((item) => [item.path, item.label]));

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [headerSettings, setHeaderSettings] = useState(dataStore.getHeaderSettings());
  const location = useLocation();
  const pageName = useMemo(() => PAGE_NAMES[location.pathname] || 'Dashboard', [location.pathname]);

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <header className="top-header">
        <div className="brand-block">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle navigation">
            ☰
          </button>
          <div className="brand-mark" aria-hidden="true">SV</div>
          <div>
            <div className="brand-title">STO &amp; Vehicle Management System</div>
            <div className="brand-subtitle">Supply Chain Operations</div>
          </div>
        </div>
        <div className="header-actions"><div className="period-block"><div className="period-summary">FY ({headerSettings.fy}) ({headerSettings.period}) {headerSettings.dateRange}</div><div className="header-period-editor"><label>FY <input value={headerSettings.fy} onChange={(e) => setHeaderSettings((s) => ({ ...s, fy: e.target.value }))} /></label><label>Period <input value={headerSettings.period} onChange={(e) => setHeaderSettings((s) => ({ ...s, period: e.target.value }))} /></label><label>Date Range <input value={headerSettings.dateRange} onChange={(e) => setHeaderSettings((s) => ({ ...s, dateRange: e.target.value }))} /></label><button className="header-save-button" onClick={() => dataStore.setHeaderSettings(headerSettings)}>Save</button></div></div>
          <div className="header-date">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date())}</div>
          <button className="icon-button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Notifications">♢</button>
          <button className="profile-chip" aria-label="User profile">
            <span className="avatar">MU</span>
            <span className="profile-text"><strong>MIS User</strong><small>Standard user</small></span>
            <span className="chevron">⌄</span>
          </button>
        </div>
        {notificationsOpen && (
          <div className="notification-popover">
            <strong>Notifications</strong>
            <p>No new notifications.</p>
          </div>
        )}
      </header>

      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-section-title">Application</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="system-label">System</div>
          <div className="system-status"><span className="status-dot" /> Ready</div>
        </div>
      </aside>

      <main className="main-area"><div className="watermark" aria-hidden="true">Manish Pandey</div>
        <div className="breadcrumb-bar">
          <span>Home</span><span className="breadcrumb-separator">›</span><strong>{pageName}</strong>
        </div>
        <Outlet />
      </main>

      <BackToTop />
      <footer className="status-bar">
        <div>System Status: <strong>Ready</strong></div>
        <div>Environment: <strong>Foundation</strong></div>
        <div className="status-bar-spacer" />
        <div>STO &amp; Vehicle Management System&nbsp; | &nbsp;v0.4.0</div>
      </footer>
    </div>
  );
}

export default function App() {
  ensureDateDataVersion();
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehicle-planning" element={<VehiclePlanning />} />
        <Route path="/vehicle-status" element={<VehicleStatus />} />
        <Route path="/raipur-database" element={<RaipurDatabase />} />
        <Route path="/excel-upload" element={<ExcelUpload />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
