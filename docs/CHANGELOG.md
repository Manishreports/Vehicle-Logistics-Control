# Changelog

## 0.1.1 - GitHub Pages compatibility

- Added Vite base path `/Vehicle-Logistics-Control/`.
- Added GitHub Pages compatible React Router basename derived from `import.meta.env.BASE_URL`.
- Changed the HTML entry script to a relative source path.
- Added a React Error Boundary with a reload fallback.
- Added a GitHub Pages SPA fallback (`dist/404.html`) generated during the Pages build.
- Added a GitHub Actions workflow for building and deploying the Vite `dist` artifact.
- Kept the existing Phase-1 UI, navigation, and Excel preview architecture unchanged.
