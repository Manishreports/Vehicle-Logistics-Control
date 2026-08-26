import { dataStore } from './dataStore';
import { aggregateRaipurRows } from './bulkPasteService';
export function getRaipurDatabaseData() { return dataStore.getRaipur(); }
export function getRaipurDatabaseRawData() { return dataStore.getRaipurRaw(); }
export function saveRaipurDatabaseData(rows, rawRows = rows) { const finalRows = aggregateRaipurRows(rows); dataStore.setRaipur(finalRows, rawRows); return finalRows; }
