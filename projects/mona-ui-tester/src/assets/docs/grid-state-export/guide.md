## Overview

| Directive | State you bind | Methods |
| :--- | :--- | :--- |
| `monaGridStatePersistence` | `[(state)]`: `GridState \| null` | `captureState()`, `loadState(state)` |
| `monaGridExport` | — | `exportCsv(filename?)`, `exportExcel(filename?)` |

A `GridState` is JSON-safe, so it can go to `localStorage`, a user profile on your server, or a URL. The grid doesn't store it anywhere itself.

**Use something else when:**

- You need one value back, such as the sort. Bind that feature's own model (`[(sort)]`, `[(filter)]`, `[(group)]`, `[(pageSize)]`) instead.
- The export needs every record from a server, or a format other than CSV and Excel, such as PDF. Produce it in your application from your data.

## Import & Quick Start

```typescript
import { GridComponent, GridExportDirective, type GridState, GridStatePersistenceDirective } from "@nanahoshi/mona-ui/grid";
```

```typescript
protected readonly state = signal<GridState | null>(null);
```

```html
<button monaButton type="button" (click)="gridExport.exportCsv('orders.csv')">Export as CSV</button>
<button monaButton type="button" (click)="gridExport.exportExcel('orders.xlsx')">Export as Excel</button>
<mona-grid
    #gridExport="monaGridExport"
    aria-label="Orders"
    [data]="orders()"
    monaGridExport
    [monaGridStatePersistence]="{ persistPageSize: true }"
    [(state)]="state">
    ...
</mona-grid>
```

## Examples

### Saving the State in the Browser

```example
grid-state-export/saved-state
```

The example reads a saved state when it starts and writes every new one to `localStorage`. Sort a column, change the page size or move a column, then reload the page: the grid comes back the same. The toolbar's buttons download the rows as `orders.csv` and `orders.xlsx`. In the CSV file the customer `=Island Trading` is written as `'=Island Trading`, so a spreadsheet doesn't run it as a formula; the workbook holds it as text, so it needs no quote. The Order Date column is a real date in the workbook, shown in your spreadsheet's date format.

### Applying a State from Code

`captureState()` returns the current state at once, without waiting for the model to update, and `loadState(state)` applies one and says how it went:

```typescript
private readonly persistence = viewChild.required(GridStatePersistenceDirective);

protected restore(saved: GridState): void {
    const result = this.persistence().loadState(saved);
    if (result.status !== "applied") {
        console.warn("The saved layout no longer fits", result.status, result.missingColumns);
    }
}
```

`status` is `"applied"`, `"empty"` (no state), `"rejected-invalid"` (not well formed: a missing array, a duplicate column id, an unknown filter operator, a page size or width that isn't a positive number, and nothing changes), `"rejected-schema"` or `"rejected-version"`. `ignoredColumns` lists saved columns the grid no longer has, and `missingColumns` the grid's columns the state didn't mention.

## Behavior

### What the state holds

| Field | Holds |
| :--- | :--- |
| `columns` | Each column's `id`, `order`, `width` and `hidden`. The id is the column's `stateKey`, or its `field` without one. |
| `sort`, `filter`, `group` | The descriptors, as plain values. |
| `pageSize` | The page size, unless `persistPageSize` is `false`. |
| `version` | The library's state format, so an older format is rejected (`"rejected-version"`). |
| `schemaVersion` | The `schemaVersion` option, so a state saved for an older set of columns is rejected (`"rejected-schema"`). |

The page offset, the selection, expanded rows and row order aren't part of the state. Give a column a `stateKey` when its `field` is empty or may change, so its saved width and position still find it. The command column's `stateKey` is `"commands"` by default.

### When the state changes

The `state` model updates after each change people make, and a column resize is reported once, when the drag ends. A state bound before the grid renders is applied once the columns exist. Setting `state` later applies it, unless it equals what the grid already shows. With server binding, a restored state triggers one `dataStateChange` at `skip: 0`.

### What the export contains

`exportCsv(filename?)` exports the visible columns of every row in the current view: filtered and sorted, all pages. With server binding it exports only the loaded page. Dates are written as the local calendar date (`YYYY-MM-DD`), and text starting with `=`, `+`, `-`, `@`, a tab or a carriage return is prefixed with `'` so spreadsheets don't run it as a formula. The column titles form the header row. Formatters and cell templates aren't used: the file has the raw values.

`exportExcel(filename?)` writes the same rows and columns to an `.xlsx` workbook with one sheet, named after the file (`export.xlsx` without a name), and returns a promise that resolves once the download starts.

| In the grid | In the workbook |
| :--- | :--- |
| A `number`, `boolean` or `date` column's values | Numbers, `TRUE`/`FALSE` and dates, which sort and add up there. Dates use the spreadsheet's short date format, by the local calendar day. A value of another type is written as text. |
| Text | Text, as it is: a cell's text is never run as a formula, so nothing is prefixed. Empty values leave the cell empty. |
| Column groups | Merged header cells above the column titles, in bold; a column outside a group has its title merged down to the titles' row. |
| The header and left-locked columns | Frozen, so they stay in view while the sheet scrolls. |
| Column widths | The columns' widths. |
| A right-to-left layout | A right-to-left sheet. |

Footers, aggregates and row groups aren't exported, in either format. The workbook is built in the browser, without a dependency, and compressed where the browser supports `CompressionStream`.

## Accessibility

Neither directive adds roles or keys. Put the export commands where people expect them, such as buttons in the toolbar, and give each a visible label that says what it downloads, such as "Export as Excel". A restored layout changes the column order and the sort that assistive technology reads, so restore it when the page loads rather than while someone is working in the grid.

### Keyboard

Neither directive adds keys. The grid's keys are on [Grid Overview](/components/grid#keyboard), and the toolbar's on the same page.
