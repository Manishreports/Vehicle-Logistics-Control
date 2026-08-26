import { dataStore } from './dataStore';
import { resolvePlanningEnrichment } from './gateSlipLookup';
import { aggregatePlanningRows } from './bulkPasteService';
export function getVehiclePlanningData() { return resolvePlanningEnrichment(dataStore.getPlanning(), dataStore.getGateIn(), dataStore.getGateOut()); }
export function getVehiclePlanningRawData() { return dataStore.getPlanningRaw(); }
export function saveVehiclePlanningData(rows, rawRows = rows) { const finalRows = aggregatePlanningRows(rows); dataStore.setPlanning(finalRows, rawRows); return finalRows; }
