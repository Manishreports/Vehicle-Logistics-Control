# STO & Vehicle Management System — Phase 1 Foundation

SAP ERP / SAP Fiori-inspired foundation for the Vehicle Planning / STO Management application.

## Included in Phase 1

- Dashboard as the default landing page
- Persistent collapsible enterprise sidebar
- SAP-style header, breadcrumb and status bar
- Vehicle Planning page
- Vehicle Status Tracking page
- Raipur Database page as a separate logical dataset
- Dedicated Excel Upload page
- `.xlsx` and `.xls` browser-side parsing using SheetJS (`xlsx`)
- Dynamic workbook sheet detection and sheet selection
- Dynamic headers / column order detection
- Excel preview with search, row counts, column counts and pagination
- Empty-sheet and invalid-file handling
- Reusable UI/data-service components
- Node.js + Express service foundation with health endpoint
- Separate service-layer structure ready for future business logic

## Architecture

```text
client/
  src/
    components/
    pages/
    services/
    styles/
server/
  src/
docs/
```

The four primary datasets remain conceptually separate:

- `VehiclePlanningData`
- `VehicleStatusTrackingData`
- `RaipurDatabaseData`
- `UploadedExcelData`

No STO matching, Gate In/Out matching, Raipur fallback logic, dashboard calculations, deduplication or business validations are implemented in this phase.

## Run locally

Requires Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend health: `http://localhost:4000/api/health`

Production build check:

```bash
npm run check
```

## GitHub

This repository is currently empty, so this Phase 1 archive can be extracted and uploaded to:

`https://github.com/Manishreports/Vehicle-Logistics-Control`
