# STO & Vehicle Management System

Phase 1 SAP-inspired internal logistics UI with Dashboard, Vehicle Planning, Vehicle Status Tracking, Raipur Database and Excel Upload/Preview.

## GitHub Pages Deployment

Production deployment uses GitHub Actions:

`main` → `npm install` → `npm run build` → `dist/` → GitHub Pages.

The browser executes the Vite-generated files from `dist`, not manually maintained root `assets/` files.
