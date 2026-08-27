const STORAGE_KEY = 'vlc.loadingPointMappings';

function clean(value) {
  return String(value ?? '').replace(/\u00a0/g, ' ').trim().replace(/\s+/g, ' ');
}

function key(value) {
  return clean(value).toUpperCase();
}

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item && clean(item.source) && clean(item.target)) : [];
  } catch {
    return [];
  }
}

function persist(rows) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent('vlc-data-changed', { detail: { key: STORAGE_KEY } }));
}

export function getLoadingPointMappings() {
  return read();
}

export function normalizeLoadingPoint(value) {
  return key(value);
}

export function loadingPointsMatch(page1Loading, page2Loading, mappings = read()) {
  const left = key(page1Loading);
  const right = key(page2Loading);
  if (!left || !right) return false;
  if (left === right) return true;
  return mappings.some((mapping) => key(mapping.source) === left && key(mapping.target) === right);
}

export function saveLoadingPointMapping(source, target) {
  const cleanSource = clean(source);
  const cleanTarget = clean(target);
  if (!cleanSource || !cleanTarget) return { ok: false, message: 'Both Loading Point values are required.' };
  const rows = read();
  const exists = rows.some((mapping) => key(mapping.source) === key(cleanSource) && key(mapping.target) === key(cleanTarget));
  if (exists) return { ok: false, message: 'This Loading Point mapping already exists.' };
  const next = [...rows, { id: `${key(cleanSource)}=>${key(cleanTarget)}`, source: cleanSource, target: cleanTarget }];
  persist(next);
  return { ok: true };
}

export function updateLoadingPointMapping(id, source, target) {
  const cleanSource = clean(source);
  const cleanTarget = clean(target);
  if (!cleanSource || !cleanTarget) return { ok: false, message: 'Both Loading Point values are required.' };
  const rows = read();
  const duplicate = rows.some((mapping) => mapping.id !== id && key(mapping.source) === key(cleanSource) && key(mapping.target) === key(cleanTarget));
  if (duplicate) return { ok: false, message: 'This Loading Point mapping already exists.' };
  const next = rows.map((mapping) => mapping.id === id ? { ...mapping, source: cleanSource, target: cleanTarget, id: `${key(cleanSource)}=>${key(cleanTarget)}` } : mapping);
  persist(next);
  return { ok: true };
}

export function deleteLoadingPointMapping(id) {
  persist(read().filter((mapping) => mapping.id !== id));
}

export { STORAGE_KEY as LOADING_POINT_MAPPING_STORAGE_KEY };
