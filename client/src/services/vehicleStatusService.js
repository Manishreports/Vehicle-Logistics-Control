import { dataStore } from './dataStore';
import { resolvePlanningEnrichment, resolveStatusEnrichment } from './gateSlipLookup';

export function getVehicleStatusData() {
  const basePlanning = dataStore.getPlanning();
  const enrichedPlanning = resolvePlanningEnrichment(basePlanning, dataStore.getGateIn(), dataStore.getGateOut());
  const status = dataStore.getStatus();
  return resolveStatusEnrichment(status, enrichedPlanning, dataStore.getGateIn(), dataStore.getGateOut());
}

export function saveVehicleStatusData(rows) {
  const clean = rows.map((row) => ({
    demandedDate: row.demandedDate ?? '', requiredDate: row.requiredDate ?? '', location: row.location ?? '',
    loadingPoint: row.loadingPoint ?? '', weight: row.weight ?? ''
  }));
  dataStore.setStatus(clean);
  return clean;
}
