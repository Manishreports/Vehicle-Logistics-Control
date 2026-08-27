import fs from 'fs';
const app = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
if (!app.includes('b.onclick=()=>{document.body.dataset.dateDebugClicked=\'yes\';openDateDiagnostic()}')) throw new Error('Direct onclick binding missing');
console.log('Direct DATE DEBUG click binding: PASS');
console.log('Handler response marker: document.body.dataset.dateDebugClicked=yes');
