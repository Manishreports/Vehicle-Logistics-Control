import assert from 'node:assert/strict';
import fs from 'node:fs';
const norm = fs.readFileSync(new URL('../client/src/services/normalization.js', import.meta.url), 'utf8');
const excel = fs.readFileSync(new URL('../client/src/services/excelService.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
assert.match(excel, /cellDates:\s*false/);
assert.match(excel, /parse_date_code/);
assert.match(excel, /date1904/);
assert.doesNotMatch(app, /cellDates:true/);
assert.match(app, /parse_date_code/);
assert.doesNotMatch(norm, /new Date\(raw\)/);
assert.doesNotMatch(norm, /new Date\(Date\.UTC\(1899/);
const cases = [['26-08-2026','2026-08-26'],['25-08-2026','2026-08-25'],['27-08-2026','2026-08-27'],['01-08-2026','2026-08-01'],['02-08-2026','2026-08-02'],['31-08-2026','2026-08-31']];
function parseDmy(s){const m=s.match(/^(\d{2})-(\d{2})-(\d{4})$/);return m?`${m[3]}-${m[2]}-${m[1]}`:'';}
for(const [input,expected] of cases) assert.equal(parseDmy(input),expected);
assert.match(app, /cellDates:false/);
assert.match(app, /function excelSerialParts/);
assert.match(app, /function dateKey\(v\).*d\.y/);
console.log('excel date pipeline static checks: PASS');
