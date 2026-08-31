# GitHub Pages setup

Upload the complete repository contents, including the hidden `.github/workflows/deploy-pages.yml` file.

After the first push to `main`, open:

`Settings -> Pages -> Build and deployment -> Source -> GitHub Actions`

The deployment flow is:

`main -> npm install -> npm run build -> dist -> GitHub Pages`

Do not configure Pages to deploy from the repository root/branch folder. The Vite source `index.html` is an input file; the browser must receive the generated `dist/index.html` and `dist/assets/*` from the Actions deployment.

The application URL is:

`https://manishreports.github.io/Vehicle-Logistics-Control/`
