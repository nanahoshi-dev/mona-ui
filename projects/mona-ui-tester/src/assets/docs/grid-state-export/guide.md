## Overview

| Directive | State you bind | Methods |
| :--- | :--- | :--- |
| `monaGridStatePersistence` | `[(state)]`: `GridState \| null` | `captureState()`, `loadState(state)` |
| `monaGridExport` | — | `exportCsv(filename?)`, `exportExcel(filename?)`, `exportPdf(options?)` |

A `GridState` is JSON-safe, so it can go to `localStorage`, a user profile on your server, or a URL. The grid doesn't store it anywhere itself.

**Use something else when:**

- You need one value back, such as the sort. Bind that feature's own model (`[(sort)]`, `[(filter)]`, `[(group)]`, `[(pageSize)]`) instead.
- The export needs every record from a server, or a document of its own, such as an invoice or a report with charts. Produce it in your application from your data.

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
<button monaButton type="button" (click)="gridExport.exportPdf('orders.pdf')">Export as PDF</button>
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

The example reads a saved state when it starts and writes every new one to `localStorage`. Sort a column, change the page size or move a column, then reload the page: the grid comes back the same. The toolbar's buttons download the rows as `orders.csv`, `orders.xlsx` and `orders.pdf`. In the CSV file the customer `=Island Trading` is written as `'=Island Trading`, so a spreadsheet doesn't run it as a formula; the workbook holds it as text, so it needs no quote. The Order Date column is a real date in the workbook, shown in your spreadsheet's date format.

### PDF Options and Fonts

`exportPdf` takes a file name, or options:

```typescript
private readonly gridExport = viewChild.required(GridExportDirective);

protected exportPdf(): Promise<void> {
    return this.gridExport().exportPdf({
        filename: "orders.pdf",
        font: { regular: "/fonts/NotoSansJP-Regular.ttf", bold: "/fonts/NotoSansJP-Bold.ttf" },
        orientation: "landscape",
        paperSize: "Letter",
        title: "Orders, January"
    });
}
```

| Option | Default | What it does |
| :--- | :--- | :--- |
| `filename` | `"export.pdf"` | The downloaded file's name. |
| `title` | none | A heading above the table on the first page, and the document's title in the reader. |
| `paperSize` | `"A4"` | `"A3"`, `"A4"`, `"Legal"`, `"Letter"`, or `[width, height]` in points (1/72 inch). |
| `orientation` | `"portrait"` | `"portrait"` or `"landscape"`. |
| `margin` | `36` | The space around the table, in points. |
| `fontSize` | `9` | The text size in points, before a wide table shrinks to fit. |
| `font` | none | A TrueType font to embed: `regular`, an optional `bold`, and `collectionIndex` for a `.ttc` collection. |

Without `font`, the text is set in Helvetica, which every PDF reader has, so nothing is embedded and the file stays small. Helvetica shows Western European text only (the Windows-1252 characters); anything else, such as Chinese, Japanese, Korean, Greek or Cyrillic, prints as `?`. Give a font that has those characters, as a URL or as bytes you've loaded, and the export embeds only the glyphs the document uses, so the file grows by tens of kilobytes rather than by the font's size. Characters the font hasn't still print in Helvetica, or as `?`. Without a `bold` face, the header and title are drawn in the regular face, thickened.

The font needs TrueType outlines: a `.ttf` file, or a `.ttc` collection with `collectionIndex`. The export rejects most `.otf` files, which have CFF outlines, and web fonts (`.woff`, `.woff2`), with an error that says so. A variable font prints at its default instance, often its lightest weight, so use a static font of the weight you want. A URL is fetched at each export, so serve it with caching headers, or load it once and pass the bytes.

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

`exportPdf(options?)` prints the same rows and columns as a table, and returns a promise that resolves once the download starts, or rejects when a font can't be loaded or read.

| In the grid | In the PDF |
| :--- | :--- |
| Cell values | The text the cells show: each column's `format`, and numbers and dates in the grid's locale. Cell templates aren't used. |
| `number` columns | Aligned to the end of their cells. |
| Long text | Wrapped, at spaces or between Chinese, Japanese and Korean characters. A row never splits across pages; a cell taller than a page is cut short with an ellipsis. |
| Column groups | Header cells spanning their columns, above the column titles. |
| Column widths | The columns' widths, at 3/4 of a point per pixel. A table wider than the page shrinks to fit, and its text with it, to 65% at most and never below 5 points. |
| Many rows | Pages, each with the header on top and its number, such as `2 / 5`, at the bottom. |
| A right-to-left layout | The first column on the right. The text inside a cell isn't reordered or shaped, so Arabic and Hebrew don't read correctly: export those as CSV or Excel. |

Footers, aggregates and row groups aren't exported, in any format. In a [tree list](/components/grid-tree), every row is exported, collapsed or not, in tree order: the workbook groups each row's children into an outline you can collapse, and indents the tree column, as the PDF does. The workbook and the PDF are built in the browser, without a dependency, and compressed where the browser supports `CompressionStream`.

## Accessibility

Neither directive adds roles or keys. Put the export commands where people expect them, such as buttons in the toolbar, and give each a visible label that says what it downloads, such as "Export as Excel". A restored layout changes the column order and the sort that assistive technology reads, so restore it when the page loads rather than while someone is working in the grid.

### Keyboard

Neither directive adds keys. The grid's keys are on [Grid Overview](/components/grid#keyboard), and the toolbar's on the same page.
