
## 0.2.0 - Page 1 & Page 2 business logic

- Added normalized Date + CFA + Loading group keys for Vehicle Planning.
- Added group-level Gate Slip propagation for multi-STO plans.
- Added direct-STO evidence gating so partial Gate In matches do not fabricate Vehicle In/Number/Out on unmatched STO rows.
- Added Gate Slip keyed Gate In and Gate Out enrichment services.
- Added Page 2 Demanded Date + Location + Loading Pt. to Page 1 Date + CFA + Loading matching.
- Added automatic Remarks: Pending / Onloading / Dispatched from arrival/dispatch availability.
- Added conflict detection when one group resolves to multiple Gate Slip Numbers.
- Added reusable browser data store separating planning, status, Gate In and Gate Out datasets.
- Added Gate In / Gate Out role selection on Excel Upload and import validation.
- Added paste input controls for Page 1 and Page 2 primary user data.

# Changelog

## 0.1.1 - GitHub Pages compatibility

- Added Vite base path `/Vehicle-Logistics-Control/`.
- Added GitHub Pages compatible React Router basename derived from `import.meta.env.BASE_URL`.
- Changed the HTML entry script to a relative source path.
- Added a React Error Boundary with a reload fallback.
- Added a GitHub Pages SPA fallback (`dist/404.html`) generated during the Pages build.
- Added a GitHub Actions workflow for building and deploying the Vite `dist` artifact.
- Kept the existing Phase-1 UI, navigation, and Excel preview architecture unchanged.

## Phase 1.1 - Page 1 and Page 2 Structure

- Added Vehicle Planning table definition with the exact required 12-column order.
- Added Vehicle Status Tracking table definition with the exact required 10-column order.
- Added separate empty datasets for Page 1 and Page 2.
- Added SAP-style filter structures and Refresh / Clear Filters actions.
- Updated the shared table component to keep column headers visible during empty states.
- Updated the GitHub Pages-safe static application so the deployed root app shows the same Page 1 and Page 2 structures.
- No business matching, status calculation, Raipur fallback, deduplication, or fake records added.

## 0.3.0 - Bulk Paste & Dataset Separation
- Added preview-before-import bulk paste for Vehicle Planning, Vehicle Status Tracking, and Raipur Database.
- Added raw vs grouped dataset storage separation.
- Added Date + CFA + Loading grouping for Vehicle Planning/Raipur.
- Added Demanded Date + Location + Loading Pt. grouping for Vehicle Status Tracking.
- Added MT weight normalization and aggregation.
- Added multi-STO and multi-location aggregation.
- Kept Raipur vehicle information user-sourced and independent from Gate Excel.

## 0.3.1 - Vehicle Planning display update
- Vehicle Planning grouped plans now render as parent/child multi-row groups.
- Plan-level Weight is shown once as the aggregated MT total.
- Location and STO values remain vertical child rows and are never slash-concatenated in the final planning table.
- Parent values use row-spanning cells where supported by the table layout.
- All application data tables are center aligned with vertical middle alignment.
- Short dates such as `17-Aug` are resolved/displayed in the current year (2026 in the current application context).
- Existing Date + CFA + Loading grouping, raw data storage, Excel enrichment, Page 2 grouping and Raipur data separation are unchanged.
