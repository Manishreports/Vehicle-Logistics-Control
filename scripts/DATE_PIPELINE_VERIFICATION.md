# Excel Business-Date Pipeline Verification

## Root cause identified
The upload path was using `cellDates: true` in SheetJS. Excel date codes were therefore converted into JavaScript Date objects before the application normalized them. SheetJS documents that `cellDates` forces date cells to Date objects and that date/time handling depends on local/UTC interpretation. For business calendar dates this creates an avoidable timezone boundary.

## Permanent fix
- Excel files are now read with `cellDates: false`, keeping date cells as Excel serial numbers.
- Date cells in date-named columns are converted with `XLSX.SSF.parse_date_code(serial, { date1904 })`.
- Workbook `date1904` is read from `workbook.Workbook.WBProps.date1904`.
- The application stores normalized business dates as `YYYY-MM-DD` strings.
- Display formatting operates on calendar components and does not pass canonical date strings through `new Date('YYYY-MM-DD')`, ISO conversion, or timezone conversion.
- No +1/-1 day compensation exists in the Excel business-date path.

## Actual attached workbook evidence
Workbook: e84054e4-5f4b-4c81-9000-247c62170a5c.XLSX
Sheet: Sheet1
Date system: 1900 (epoch 1899-12-30)
Gate In Date: A
Gate Slip No.: B
Vehicle No.: C
STO No.: E
Gate Out Date: T
Populated date cells: A2:A4 and T2:T4, all 11-Aug-2026.
The attached file does not contain Gate Slip 234151 or a 26-Aug-2026 date cell.

## Regression execution
10 text calendar dates passed normalization unchanged.
Excel serial 46260 passed as 2026-08-26.
Excel serial 46245 passed as 2026-08-11.
Native JS Date 2026-08-26 passed as 2026-08-26.
Static upload code check confirms cellDates:false and SSF parse_date_code usage.
