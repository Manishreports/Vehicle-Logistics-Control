const DATA_VERSION_KEY = 'vlc.dataVersion';
export const CURRENT_DATA_VERSION = 'date-v5';

const DATE_KEYS = [
  'vlc.vehiclePlanningData', 'vlc.vehiclePlanningRawData',
  'vlc.vehicleStatusTrackingData', 'vlc.vehicleStatusTrackingRawData',
  'vlc.gateInData', 'vlc.gateOutData', 'vlc.gateInMeta', 'vlc.gateOutMeta',
  'vlc.raipurDatabaseData', 'vlc.raipurDatabaseRawData'
];

export function ensureDateDataVersion() {
  const current = window.localStorage.getItem(DATA_VERSION_KEY);
  if (current === CURRENT_DATA_VERSION) return { migrated: false, previous: current };
  const legacyPrefix = `vlc.legacy.${current || 'unknown'}.`;
  DATE_KEYS.forEach((key) => {
    const value = window.localStorage.getItem(key);
    if (value !== null) window.localStorage.setItem(`${legacyPrefix}${key}`, value);
    window.localStorage.removeItem(key);
  });
  window.localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
  return { migrated: true, previous: current || null };
}
