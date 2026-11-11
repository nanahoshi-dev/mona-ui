# State & Export

**Selectors:** `mona-grid[monaGridStatePersistence]`, `mona-grid[monaGridExport]`

`monaGridStatePersistence` captures what people changed (column order, widths and visibility, sort, filter, groups and page size) as a plain `GridState` object you can store and give back later. `monaGridExport` writes the rows of the current view to a CSV file.
