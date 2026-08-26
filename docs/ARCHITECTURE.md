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
