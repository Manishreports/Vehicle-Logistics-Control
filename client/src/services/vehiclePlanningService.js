import { dataStore } from './dataStore';
import { resolvePlanningEnrichment } from './gateSlipLookup';

export function getVehiclePlanningData() {
  const planning = dataStore.getPlanning();
  return resolvePlanningEnrichment(planning, dataStore.getGateIn(), dataStore.getGateOut());
}

export function saveVehiclePlanningData(rows) {
  const clean = rows.map((row) => ({
    date: row.date ?? '', loc: row.loc ?? '', plant: row.plant ?? '', cfa: row.cfa ?? '',
    weight: row.weight ?? '', sto: row.sto ?? '', loading: row.loading ?? ''
  }));
  dataStore.setPlanning(clean);
  return clean;
}
