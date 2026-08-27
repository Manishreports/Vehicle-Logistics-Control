# Date Runtime Trace - 234151

Target record supplied by the user:
- Gate Slip: 234151
- Vehicle: RJ11GD3059
- STO: 4210086451
- Business date: 26-08-2026

## Deployment root cause found

The live GitHub Pages repository was serving `index.html` with:

`./assets/app.js`

The live `assets/app.js` was an older static bundle whose Excel file handler still used `cellDates:true`. The corrected V3 bundle existed separately as `assets/app-v20260827.js`, but the live `index.html` was not loading it.

Therefore the previous V3 Excel-date fix was not the bundle being executed by the live site.

## Permanent fix

The deployable artifact now:
1. Loads the corrected `assets/app.js` with a cache-busting version query.
2. Uses `cellDates:false` and `raw:true` for Excel reads.
3. Keeps native Excel dates as serial/calendar values until explicit date-column conversion.
4. Converts Excel serials to calendar dates without timezone conversion.
5. Stores business dates as calendar strings for downstream grouping/storage/display.

No `+1 day` or `-1 day` workaround is used.

## Exact supplied-record path

The supplied user row has business date `26-08-2026`. In the Excel 1900 date system, that calendar date corresponds to serial `46260`.

The corrected runtime path resolves:

`46260 -> 2026-08-26 -> 26-Aug-2026`

and preserves the Gate Slip as text `"234151"`.

Because the user supplied the problematic row as text rather than the workbook bytes, this report does not claim to have captured the source cell's XML `v/t/w/z` for that particular row.

## Live repository evidence (2026-08-27)

The live repository `main/index.html` loads `./assets/app.js`, not the V3 `app-v20260827.js` bundle.
The live `assets/app.js` Excel file handler was using `cellDates:true` before this patch.
The corrected deployable artifact now puts the corrected runtime in `assets/app.js` and adds a cache-busting query to `index.html`.

No blind day arithmetic is used for business dates.
