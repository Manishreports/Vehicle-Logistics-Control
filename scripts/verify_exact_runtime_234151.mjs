import fs from 'fs';
import vm from 'vm';
const code = fs.readFileSync(new URL('../assets/app.js', import.meta.url), 'utf8');
const store = new Map([['vlcDateDebug','1']]);
const root = { innerHTML: '' };
const document = { getElementById(id){return id==='root'?root:null}, querySelectorAll(){return[]}, createElement(){return{}} };
class Event { constructor(type){this.type=type;} }
const window = { localStorage:{getItem(k){return store.has(k)?store.get(k):null},setItem(k,v){store.set(k,String(v))},removeItem(k){store.delete(k)}}, addEventListener(){}, dispatchEvent(){}, XLSX:{SSF:{parse_date_code(serial){const whole=Math.floor(Number(serial));const d=new Date(Date.UTC(1899,11,30)+whole*86400000);return{y:d.getUTCFullYear(),m:d.getUTCMonth()+1,d:d.getUTCDate()}}}}};
const sandbox={window,document,localStorage:window.localStorage,console,Intl,Event,Date,Number,String,Boolean,Map,Set,Object,Array,Math,JSON,RegExp,Error,isNaN,parseFloat,parseInt,NaN,undefined};
vm.createContext(sandbox); vm.runInContext(code,sandbox);
const dbg=window.__VLC_DATE_DEBUG__; if(!dbg) throw new Error('DATE DEBUG API unavailable');
const rawExcelSerial=46260;
const gateSlip='234151', vehicle='RJ11GD3059', sto='4210086451';
const preview=dbg.excelDateValue(rawExcelSerial,'Gate In Date');
const parsed=dbg.parseDate(preview); const canonical=dbg.dateKey(preview); const display=dbg.dateDisplay(preview);
const final={record:{gateSlip,vehicle,sto},stages:{rawExcelCell:{value:rawExcelSerial,type:typeof rawExcelSerial},excelDateValue:{value:preview,type:typeof preview},parseDate:{value:parsed,type:typeof parsed},normalizeDate:{value:canonical,type:typeof canonical},stored:{value:canonical,type:typeof canonical},ui:{value:display,type:typeof display}}};
if(canonical!=='2026-08-26'||display!=='26-Aug-2026') throw new Error(JSON.stringify(final));
console.log(JSON.stringify(final,null,2));
