import { dataStore } from './dataStore';
import { resolvePlanningEnrichment, resolveStatusEnrichment } from './gateSlipLookup';
import { aggregateStatusRows } from './bulkPasteService';
import { getLoadingPointMappings } from './loadingPointMappingService';
export function getVehicleStatusData() { const enrichedPlanning = resolvePlanningEnrichment(dataStore.getPlanning(), dataStore.getGateIn(), dataStore.getGateOut()); return resolveStatusEnrichment(dataStore.getStatus(), enrichedPlanning, dataStore.getGateIn(), dataStore.getGateOut(), getLoadingPointMappings()); }
export function getVehicleStatusRawData() { return dataStore.getStatusRaw(); }
export function saveVehicleStatusData(rows, rawRows = rows) { const finalRows = aggregateStatusRows(rows); dataStore.setStatus(finalRows, rawRows); return finalRows; }
