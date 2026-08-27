# Excel Date Source Verification

## Source workbook

- Workbook: user-provided Gate In / Gate Out workbook
- Sheet: `Sheet1`
- Used range: `A1:T4`
- Header row: row 1

## Relevant columns

- Gate In Date: column `A`, header `Gate In Date`
- Gate Slip Number: column `B`, header `Gate Slip No.`
- Vehicle Number: column `C`, header `Vehicle No.`
- STO: column `E`, header `STO No.`
- Gate Out Date: column `T`, header `Gate_Out_Date`

## Actual Excel representation

The workbook stores the date cells as native Excel numeric date serials, not date text.

Examples from the workbook XML:

- `A2`, `A3`, `A4`: raw value `46245`, date style `mm-dd-yy`
- `T2`, `T3`, `T4`: raw value `46245`, date style `mm-dd-yy`

The Excel serial `46245` resolves to `11-Aug-2026` using the standard Excel 1900 date system (`1899-12-30 + serial days`). OpenPyXL independently decoded the same cells to `2026-08-11`.

## Fix applied

The XLSX reader now preserves native date cells with `cellDates: true` and `raw: true` instead of formatting them into ambiguous strings such as `8/11/26` before application parsing.

Date columns are then normalized deterministically:

- Native JavaScript `Date` -> canonical display date
- Numeric Excel serial in a date column -> Excel serial conversion
- Explicit date text -> existing date normalization
- Ambiguous host `Date.parse()` fallback is not used for incomplete numeric date text

## Regression evidence

Using the workbook-derived rows:

- STO `4210085013` -> Gate Slip `233756` -> Vehicle `RJ27GD5303` -> Gate In `11-Aug-2026` -> Gate Out `11-Aug-2026`
- STO `4210085078` -> Gate Slip `233757` -> Vehicle `HR61D0264` -> Gate In `11-Aug-2026` -> Gate Out `11-Aug-2026`

These values were resolved through the existing Gate Slip lookup services after the date parser change.
