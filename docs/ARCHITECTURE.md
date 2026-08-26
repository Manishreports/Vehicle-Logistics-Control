# Architecture — Phase 1

## Application shell

React + React Router provide client-side navigation under a persistent ERP-style shell. The Dashboard is the default route.

## Data boundaries

UI pages are not allowed to silently merge source datasets. The intended boundaries are:

```text
VehiclePlanningData
VehicleStatusTrackingData
RaipurDatabaseData
UploadedExcelData
```

## Excel flow

```text
Excel File
  -> parseExcelFile()
  -> Workbook
  -> Sheet Selection
  -> headers + rows
  -> Preview
```

Excel files are parsed in the browser for preview. No upload storage or business processing is performed by the server in Phase 1.

## Future service boundaries

The project intentionally leaves room for:

```text
services/
  excelService
  vehiclePlanningService
  vehicleStatusService
  raipurDatabaseService
  dashboardService
```

Future business rules should be implemented behind these boundaries rather than embedded in page components.


### Vehicle and gate data flow (0.2.0)

`VehiclePlanningData`, `VehicleStatusTrackingData`, `GateInData`, and `GateOutData` remain separate datasets in browser storage. Gate In is indexed by Gate Slip Number and STO; Gate Out is indexed by Gate Slip Number. Page 1 resolves Gate Slip at `Date + CFA + Loading` group level, propagating only the slip to all STO rows in that group. Vehicle In, Vehicle Number, and Vehicle Out are populated only for STO rows with direct Gate In evidence, preventing partial-match fabrication. Page 2 matches `Demanded Date + Location + Loading Pt.` to the enriched Page 1 group key and then uses the group Gate Slip for Vehicle Arrived, Vehicle Dispatch, and Remarks. Multiple slips for a single group are treated as a conflict and are not silently resolved.
