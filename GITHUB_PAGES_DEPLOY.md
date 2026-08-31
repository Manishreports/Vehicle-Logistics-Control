# GitHub Pages Deployment

The application is deployed through GitHub Actions.

## Deployment flow

GitHub repository (`main`)
→ GitHub Actions
→ Node.js 22
→ `npm install`
→ `npm run build`
→ Vite `dist/`
→ GitHub Pages

The repository root is source code. Root-level compiled `assets/app.js` / `assets/app.css`
are not committed deployment artifacts. Vite generates the browser assets inside `dist/`.

The workflow is `.github/workflows/deploy-pages.yml`.
