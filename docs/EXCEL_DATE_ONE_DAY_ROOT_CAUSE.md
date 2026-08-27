# Excel Date One-Day Root Cause Fix

Root cause: XLSX native Excel date cells are returned as JavaScript `Date` objects representing local calendar midnight. The previous parser returned that object unchanged, but later normalization read `getUTCDate()` / UTC components. In a positive timezone such as Asia/Kolkata, local midnight is the previous UTC calendar date, so 26-Aug-2026 became 25-Aug-2026.

Fix: when a native JavaScript `Date` is received, the parser now extracts the local calendar components with `getFullYear()`, `getMonth()`, and `getDate()` and rebuilds a UTC calendar-only Date from those components. Downstream canonicalization continues to use UTC components, but now those UTC components represent the original Excel calendar date.

No +1/-1 day adjustment and no timezone offset arithmetic are used.

Workbook evidence: the attached workbook uses the Excel 1900 date system and native date cells. Existing workbook dates decode to 11-Aug-2026 in Python/OpenPyXL.
