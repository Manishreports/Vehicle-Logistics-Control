# GitHub Pages deployment

This project contains a browser-ready root `index.html`, so GitHub Pages can publish the repository root directly without a Vite build.

## Recommended Pages setting
Settings -> Pages -> Build and deployment -> Source -> Deploy from a branch -> `main` -> `/ (root)`.

The repository root already contains the files required by GitHub Pages.

The React/Vite source remains under `client/` and `vite.config.js` for future development. The root page is a deployment-safe fallback for Phase 1 so the site does not depend on Actions or a server runtime.
