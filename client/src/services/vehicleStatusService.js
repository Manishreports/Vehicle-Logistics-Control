import { dataStore } from './dataStore.js';
import { aggregateStatusRows } from './bulkPasteService.js';
import { getVehiclePlanningData } from './vehiclePlanningService.js';
import { buildVehicleStatusRecords } from './vehicleStatusEnrichmentService.js';

export function getVehicleStatusData() {
  const result = buildVehicleStatusRecords({
    statusRecords: dataStore.getStatus(),
    planningRecords: getVehiclePlanningData(),
    gateInRecords: dataStore.getGateIn(),
    gateOutRecords: dataStore.getGateOut()
  });
  return result.records;
}

export function getVehicleStatusExceptions() {
  const result = buildVehicleStatusRecords({
    statusRecords: dataStore.getStatus(),
    planningRecords: getVehiclePlanningData(),
    gateInRecords: dataStore.getGateIn(),
    gateOutRecords: dataStore.getGateOut()
  });
  return result.exceptions;
}

export function getVehicleStatusRawData() { return dataStore.getStatusRaw(); }
export function saveVehicleStatusData(rows, rawRows = rows) { const finalRows = aggregateStatusRows(rows); dataStore.setStatus(finalRows, rawRows); return finalRows; }
