# Vehicle Planning Display Model

Vehicle Planning remains grouped by `Date + CFA + Loading`.

The processed plan contains a nested `locations` structure:

```text
Plan
  Location
    STO
    STO
  Location
    STO
```

The plan-level Weight is the total of all source-row weights converted to MT and is rendered once for the parent plan.

Business Location rendering is based only on the actual normalized Location records. It is never created from STO count.

A single location with multiple STOs therefore renders one Location cell with multiple child STO rows.

Multiple locations with different STO counts render each location according to its own STO count.
