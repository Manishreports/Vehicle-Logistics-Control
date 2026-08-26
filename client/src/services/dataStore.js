const KEYS = {
  planning: 'vlc.vehiclePlanningData', planningRaw: 'vlc.vehiclePlanningRawData',
  status: 'vlc.vehicleStatusTrackingData', statusRaw: 'vlc.vehicleStatusTrackingRawData',
  raipur: 'vlc.raipurDatabaseData', raipurRaw: 'vlc.raipurDatabaseRawData',
  gateIn: 'vlc.gateInData', gateOut: 'vlc.gateOutData', gateInMeta: 'vlc.gateInMeta', gateOutMeta: 'vlc.gateOutMeta', headerSettings: 'vlc.headerSettings'
};
function read(key, fallback = []) { try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function write(key, value) { window.localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent('vlc-data-changed', { detail: { key } })); }
export const dataStore = {
  getPlanning: () => read(KEYS.planning), getPlanningRaw: () => read(KEYS.planningRaw),
  getStatus: () => read(KEYS.status), getStatusRaw: () => read(KEYS.statusRaw),
  getRaipur: () => read(KEYS.raipur), getRaipurRaw: () => read(KEYS.raipurRaw),
  getGateIn: () => read(KEYS.gateIn), getGateOut: () => read(KEYS.gateOut), getGateInMeta: () => read(KEYS.gateInMeta, {}), getGateOutMeta: () => read(KEYS.gateOutMeta, {}), getHeaderSettings: () => read(KEYS.headerSettings, { fy: '2026-2027', period: 'P06', dateRange: '17 Aug - 13 Sep' }),
  setPlanning: (rows, raw = rows) => { write(KEYS.planning, rows); write(KEYS.planningRaw, raw); },
  setStatus: (rows, raw = rows) => { write(KEYS.status, rows); write(KEYS.statusRaw, raw); },
  setRaipur: (rows, raw = rows) => { write(KEYS.raipur, rows); write(KEYS.raipurRaw, raw); },
  setGateIn: (rows, meta = {}) => { write(KEYS.gateIn, rows); write(KEYS.gateInMeta, meta); },
  setGateOut: (rows, meta = {}) => { write(KEYS.gateOut, rows); write(KEYS.gateOutMeta, meta); }, setHeaderSettings: (value) => write(KEYS.headerSettings, value),
  clearPlanning: () => { window.localStorage.removeItem(KEYS.planning); window.localStorage.removeItem(KEYS.planningRaw); window.dispatchEvent(new CustomEvent('vlc-data-changed')); },
  clearStatus: () => { window.localStorage.removeItem(KEYS.status); window.localStorage.removeItem(KEYS.statusRaw); window.dispatchEvent(new CustomEvent('vlc-data-changed')); },
  clearRaipur: () => { window.localStorage.removeItem(KEYS.raipur); window.localStorage.removeItem(KEYS.raipurRaw); window.dispatchEvent(new CustomEvent('vlc-data-changed')); },
  clearAll: () => Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key))
};
export function useDataStoreSubscription(callback) { const handler = () => callback(); window.addEventListener('vlc-data-changed', handler); window.addEventListener('storage', handler); return () => { window.removeEventListener('vlc-data-changed', handler); window.removeEventListener('storage', handler); }; }
