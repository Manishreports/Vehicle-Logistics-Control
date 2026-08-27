import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
new vm.Script(app);
const required = [
  'back-to-top', 'B-${pc.B}', 'T-${pc.T}', 'displayPending', 'loadingPendingCounts',
  'vehiclePlanningOverview', 'calculateCorePending', 'calculatePartialPending',
  'Search Vehicle Planning...', 'Search Vehicle Status Records...', 'Vehicle Status Records',
  'd.getUTCMonth()'
];
for (const needle of required) { if (!app.includes(needle)) throw new Error(`Missing verification marker: ${needle}`); }
console.log('static verification: PASS');
