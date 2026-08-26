const KEYS = {
  planning: 'vlc.vehiclePlanningData',
  status: 'vlc.vehicleStatusTrackingData',
  gateIn: 'vlc.gateInData',
  gateOut: 'vlc.gateOutData',
  gateInMeta: 'vlc.gateInMeta',
  gateOutMeta: 'vlc.gateOutMeta'
};

function read(key, fallback = []) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('vlc-data-changed', { detail: { key } }));
}

export const dataStore = {
  getPlanning: () => read(KEYS.planning),
  getStatus: () => read(KEYS.status),
  getGateIn: () => read(KEYS.gateIn),
  getGateOut: () => read(KEYS.gateOut),
  getGateInMeta: () => read(KEYS.gateInMeta, {}),
  getGateOutMeta: () => read(KEYS.gateOutMeta, {}),
  setPlanning: (rows) => write(KEYS.planning, rows),
  setStatus: (rows) => write(KEYS.status, rows),
  setGateIn: (rows, meta = {}) => { write(KEYS.gateIn, rows); write(KEYS.gateInMeta, meta); },
  setGateOut: (rows, meta = {}) => { write(KEYS.gateOut, rows); write(KEYS.gateOutMeta, meta); },
  clearAll: () => Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key))
};

export function useDataStoreSubscription(callback) {
  const handler = () => callback();
  window.addEventListener('vlc-data-changed', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('vlc-data-changed', handler);
    window.removeEventListener('storage', handler);
  };
}
