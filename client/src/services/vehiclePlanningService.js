import { dataStore } from './dataStore';
import { resolvePlanningEnrichment } from './gateSlipLookup';
import { aggregatePlanningRows } from './bulkPasteService';
export function getVehiclePlanningData() { const raw = dataStore.getPlanningRaw(); const source = raw.length ? aggregatePlanningRows(raw) : dataStore.getPlanning(); return resolvePlanningEnrichment(source, dataStore.getGateIn(), dataStore.getGateOut()); }
export function getVehiclePlanningRawData() { return dataStore.getPlanningRaw(); }
export function saveVehiclePlanningData(rows, rawRows = rows) { const finalRows = aggregatePlanningRows(rows); dataStore.setPlanning(finalRows, rawRows); return finalRows; }
