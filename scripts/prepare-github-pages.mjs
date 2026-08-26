import { copyFileSync, existsSync } from 'node:fs';

const indexFile = 'dist/index.html';
const fallbackFile = 'dist/404.html';

if (!existsSync(indexFile)) {
  throw new Error(`Expected ${indexFile} after the Vite build.`);
}

copyFileSync(indexFile, fallbackFile);
console.log(`Created ${fallbackFile} for GitHub Pages SPA fallback.`);
