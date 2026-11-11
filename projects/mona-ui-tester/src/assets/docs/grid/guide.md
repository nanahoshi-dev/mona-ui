## Overview

The grid renders `data` as rows against the `mona-grid-column` definitions projected into `<mona-grid>`. Paging is always on. Every other feature is opt-in through a directive on the same `mona-grid` element, such as `monaGridSortable` or `monaGridEditable`, and that directive also emits the feature's events. Columns are a flat list: there are no column groups or nested columns.

| Feature | Directive on `<mona-grid>` | Page |
| :--- | :--- | :--- |
| Sorting, filtering | `monaGridSortable`, `monaGridFilterable` | [Sorting & Filtering](/components/grid-sorting-filtering) |
| Grouping, aggregates | `monaGridGroupable`, column `aggregate` | [Grouping & Aggregates](/components/grid-grouping) |
| Row selection | `monaGridSelectable` | [Selection](/components/grid-selection) |
| Inline editing | `monaGridEditable`, `mona-grid-command-column` | [Editing](/components/grid-editing) |
| Resizing, reordering, locking, hiding columns | `monaGridResizable`, `monaGridReorderable`, column `locked` | [Columns](/components/grid-columns) |
| Detail rows, row reordering, row classes | `monaGridDetailTemplate`, `monaGridRowReorderable` | [Rows](/components/grid-rows) |
| Server pages, virtual scrolling | `monaGridServerBinding`, `monaGridVirtualScroll` | [Server Binding & Virtualization](/components/grid-server) |
| Saved state, CSV export | `monaGridStatePersistence`, `monaGridExport` | [State & Export](/components/grid-state-export) |

**Use Grid when:**

- Data is naturally tabular, with a fixed set of typed columns, and people need to page, sort, filter or edit it.
- Rows need per-cell or per-row editing backed by Angular Signal Forms.

**Use something else when:**

- Data is hierarchical and people mostly expand and collapse nodes. Use [Tree View](/components/tree-view).
- Rows are single-value items without columns. Use [List View](/components/list-view).

## Import & Quick Start

```typescript
import { GridColumnComponent, GridComponent } from "@nanahoshi/mona-ui/grid";
```

```typescript
protected readonly orders = signal([
    { orderId: 1, shipName: "Sea Explorer", freight: 42.5 },
    { orderId: 2, shipName: "Ocean Vision", freight: 18.75 }
]);
```

```html
<mona-grid aria-label="Orders" rowKey="orderId" [data]="orders()" [pageSize]="10">
    <mona-grid-column field="orderId" title="Order ID" type="number"></mona-grid-column>
    <mona-grid-column field="shipName" title="Ship Name" type="string"></mona-grid-column>
    <mona-grid-column field="freight" title="Freight" type="number"></mona-grid-column>
</mona-grid>
```

Without a feature directive the grid above only pages. Give it an `aria-label`, and a height through `class` when it should scroll inside a fixed area.

## Anatomy

A column's `type` (`"string"`, `"number"`, `"date"` or `"boolean"`) decides how its cells are formatted, which filter operators it offers and which editor it uses. `field` names the property each row is read from, and `title` is the header text.

The templates below are placed inside `<mona-grid-column>` or `<mona-grid>`. The other pages describe the ones that belong to a feature: [edit templates](/components/grid-editing), [footer and group footer templates](/components/grid-grouping) and [detail templates](/components/grid-rows).

| Directive | Selector | Placed inside | Template context | Replaces |
| --- | --- | --- | --- | --- |
| `GridCellTemplateDirective` | `ng-template[monaGridCellTemplate]` | `mona-grid-column` or `mona-grid-command-column` | `{ $implicit: dataItem, column: string }` | The column's formatted cell text |
| `GridHeaderTemplateDirective` | `ng-template[monaGridHeaderTemplate]` | `mona-grid-column` | `{ $implicit: column, column: Column }` | The whole header text |
| `GridColumnTitleTemplateDirective` | `[monaGridColumnTitleTemplate]` | `mona-grid-column` | None | The header's title text, keeping its sort and filter buttons. Ignored when a header template is present. |
| `GridNoDataTemplateDirective` | `ng-template[monaGridNoDataTemplate]` | `mona-grid` | None | The grid's empty-state message |
| `GridToolbarTemplateDirective` | `ng-template[monaGridToolbarTemplate]` | `mona-grid` | `GridToolbarTemplateContext`: `addRowData`, `addRowVisible`, `cancelAdd()`, `cancelEdit()`, `dataState`, `editSession`, `saveAdd()`, `selectedKeys`, `startAdd()`; the same object is also `$implicit` | Nothing: it adds a toolbar above the column headers |

```html
<mona-grid [data]="orders()">
    <mona-grid-column field="shipName" title="Ship Name">
        <ng-template monaGridCellTemplate let-dataItem>
            <strong>{{ dataItem.shipName }}</strong>
        </ng-template>
        <ng-template monaGridHeaderTemplate let-column>
            <span class="uppercase">{{ column.title }}</span>
        </ng-template>
    </mona-grid-column>
</mona-grid>
```

The cell template's `$implicit` is the row's item from `data`, the same object, and `column` is the column's `field`. None of the grid's template directives has an `ngTemplateContextGuard`, so with strict templates `let-dataItem` is typed `any`: the template compiles, but member access on it isn't checked. To have it checked, pass the item to a method of your component that takes your row type.

## Examples

### Cell Formatting

Without a `format`, a `date` column shows the locale's numeric date (`03/15/2024` in en-US, `15.03.2024` in de-DE), and every other value shows as it is. `format` takes one of two things:

- A date format string, using Angular's `formatDate` patterns (`"yyyy-MM-dd"`, `"MMM d, y"`). It applies only to `type="date"` columns, where the filter menu and the filter row use it too, and it formats with the application's `LOCALE_ID`. Other columns ignore a string.
- A function `(value, row, column) => string`, for any column. What it returns replaces the cell text. `value` is the cell's value, `row` the row's data item, and `column` the `Column`.

```example
grid/cell-formatting
```

A formatter can be typed for the column's value, as `formatFreight` is. There is no format string for numbers or currency: use a formatter function, or a `monaGridCellTemplate` with Angular's `currency` or `number` pipe. A cell template replaces the cell text, formatted or not. `format` only changes what the cell shows. Sorting, filtering, aggregates and CSV export use the raw value.

### Paging

`pageSize` and `pageSizeValues` control the built-in pager; `[(pageSize)]` and `[(skip)]` are two-way, and `pageChange` reports the user's page and page-size changes (not values set from code). A new page size keeps the first row of the current page in view. The pager shows a page-size picker only when `pageSizeValues` lists some sizes; it's empty by default. `responsivePager` collapses the pager into a dropdown when the grid narrows.

```html
<mona-grid [data]="orders()" [pageSize]="10" [pageSizeValues]="[10, 20, 30]" [responsivePager]="true"></mona-grid>
```

When the rows shrink below the current page (new data, a removed row, a filter), the grid moves to the last page and reports it through `pageChange` and `skipChange`.

### Changing the Data

Bind the whole data set to `data`; the grid never changes the array. When `data` is replaced, the grid keeps its sort, filter and group descriptors and applies them to the new rows. It also keeps the current page, unless the new rows no longer reach it.

To show a subset that your own controls choose, bind a filtered `computed`:

```typescript
protected readonly search = signal("");
protected readonly shownOrders = computed(() => {
    const text = this.search().toLowerCase();
    return this.orders().filter(order => order.shipName.toLowerCase().includes(text));
});
```

```html
<mona-text-box aria-label="Search orders" [(value)]="search"></mona-text-box>
<mona-grid [data]="shownOrders()">...</mona-grid>
```

To show the condition in a column's filter UI as well, set the `filter` model of `monaGridFilterable` instead, see [Sorting & Filtering](/components/grid-sorting-filtering). To have a server page, sort and filter, see [Server Binding & Virtualization](/components/grid-server).

### Row Identity

`rowKey` names the property, or gives the function, that identifies a row. Selection, detail rows and editing use it to find a row again after `data` is replaced, so set it whenever rows have an id. A column whose `field` is the `rowKey` isn't editable unless it says so.

### Toolbar and the Columns Button

`monaGridToolbarTemplate` adds a toolbar above the column headers, for your own buttons and for commands such as Add. The toolbar also shows a built-in Columns button (the `columns` message). It opens a popup that lists every column, with a box to filter the list by title. Apply shows the checked columns and hides the others; Cancel drops the changes. A column's `hidden` input sets where it starts. Without a toolbar template there is no Columns button. See [Columns](/components/grid-columns).

## Appearance & Styling

| Input | What it changes |
| :--- | :--- |
| `class` | Classes on the grid element, merged with `tailwind-merge`. Set a height here for a grid that scrolls inside a fixed area. |
| `rounded` | The corner radius: `"none"`, `"small"`, `"medium"` (default) or `"large"`. |
| `rowClass` | A function that returns classes for each data row, such as a muted row for a cancelled order. See [Rows](/components/grid-rows). |
| `resizeMethod` | How columns without a `width` get one: `"fitView"` (default) shares the free width, `"auto"` fits the content, and a number gives each of them that many pixels. See [Columns](/components/grid-columns). |

Grid styling is implemented with Tailwind utility classes internally; there are no public CSS custom properties to override.

## Behavior

### Events come from the feature directives

`mona-grid` reports only paging (`pageChange`, `skipChange`, `pageSizeChange`) and detail rows (`expandedKeysChange`). Every other event comes from the directive that turns its feature on: `columnSort`, `columnResize`, `columnReorder`, `groupChange`, `selectedKeysChange`, `rowReorder`, `cellEdit`, `rowEdit`, `save`, `remove`, `cancel`, `add`, `edit`, `dataStateChange` and `scrollEnd`.

### Cancelable events

`columnSort`, `columnReorder`, `cellEdit`, `rowEdit`, `save`, `remove`, `cancel`, `add`, and `edit` are event objects with `preventDefault()` and `isDefaultPrevented()`. Calling `preventDefault()` stops the change: `columnReorder.preventDefault()` keeps the dragged column where it was. `columnResize` is a plain object with no `preventDefault()`.

### Directives combine

The feature directives work together on one grid, with three exceptions: `monaGridServerBinding` and an enabled `monaGridVirtualScroll` can't be combined, virtual rows don't show detail rows, and row reordering turns itself off while rows are sorted, filtered, grouped, edited, server-bound or virtual. Each page lists its own limits.

## Accessibility

The grid element has no name of its own: set `aria-label` or `aria-labelledby`. The feature pages describe the roles, names and keys their features add.

### Keyboard

The grid is one Tab stop. `Tab` moves into the grid at the cell that last had focus. The first time, that is the first body cell, or the first header cell when there are no rows. The next `Tab` leaves the grid. Inside, the keys below move between cells; the header, the filter row, the add row and the body rows are one column of rows.

| Key | Action |
| --- | --- |
| `ArrowDown` / `ArrowUp` | Move to the same column in the next/previous row, across the header, the filter row, the add row and the body. |
| `ArrowLeft` / `ArrowRight` | Move to the previous/next cell in the row (mirrored in right-to-left layouts). |
| `Home` / `End` | Move to the first/last cell in the row. |
| `Ctrl+Home` / `Ctrl+End` (`Cmd` too) | Move to the first/last cell in the grid. With virtual scrolling, the grid scrolls to the last row first. |
| `PageUp` / `PageDown` | Move up/down by the number of rows that fit in the body. |
| `Enter` | On a header, sorts the column. On a group row or the detail toggle, expands or collapses it. On an editable cell, starts editing. On any other cell, moves into its controls. |
| `F2` | Starts editing an editable cell; on any other cell, including a header or a filter-row cell, moves into its controls (links, buttons, the filter button, the filter input). |
| `Ctrl+C` / `Cmd+C` | Copies the focused cell's text (body rows, not while editing, and not when text is selected). |
| `Tab` / `Shift+Tab` | Leaves the grid. While editing a cell, commits it and edits the next/previous editable cell. |

Sorting, filtering, grouping, selection, column moves and row moves add keys of their own, listed on their pages. Headers list their shortcuts in `aria-keyshortcuts`.

Inside a cell's controls, `Tab`, `Shift+Tab` and the arrows move between them (text fields keep their arrow keys), `Tab` past the last control moves on to the next cell, and `Escape` returns to the cell.

The toolbar is a `role="toolbar"` named by the `toolbar` message. `ArrowLeft`/`ArrowRight` (mirrored in right-to-left layouts), `Home` and `End` move between its controls, except in text fields and other controls that use those keys; only one control is in the Tab order, including controls the toolbar template adds later.

### Focus

Grid cells use a roving `tabindex`: the cell that last had focus has `tabindex="0"`, every other cell and every control inside a cell has `tabindex="-1"`. Keyboard focus shows a solid 2px ring inside the cell. Cells moved to with the keys scroll clear of pinned columns. Focus returns to a header after it's dragged, and to a cell of a virtual grid when its row scrolls back into view. Changing the page from the pager scrolls the body to the first row.

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `role` | On the tabular content region | `"grid"`, or `"treegrid"` while rows are grouped |
| `aria-label` | On the tabular content region | The `aria-label` input; `aria-labelledby` likewise |
| `aria-rowcount` | On the tabular content region | Every row, or `-1` when paged groups or detail rows make it unknown |
| `aria-colcount` | On the tabular content region | Every column, including group indent and selection columns |
| `aria-readonly` | On the tabular content region | `"true"` while editing is off |
| `role` | On the header/body/footer row groups | `"rowgroup"` |
| `role` | On header cells | `"columnheader"` |
| `role` | On data/group/footer rows | `"row"` |
| `role` | On data cells | `"gridcell"` |
| `aria-rowindex` | On every row | 1-based position, counting header, filter and add rows and earlier pages |
| `aria-colindex` | On every cell | 1-based column position, accounting for group indent columns |
| `aria-keyshortcuts` | On a header cell with keyboard shortcuts | The keys that open its filter menu, move it or group by it |

<!-- verification-checklist
- [x] GridComponent inputs verified against grid.component.ts (aria-label, aria-labelledby, data, expandedKeys, pageSize, pageSizeValues, resizeMethod, responsivePager, rounded, rowClass, rowKey, skip, class); outputs limited to paging and expandedKeys
- [x] Template directive selectors and contexts verified against grid/directives/grid-*template*.directive.ts and the grid templates
- [x] Keyboard map verified against grid-logical-cell.directive.ts, grid-navigation.service.ts, grid.component.ts (onToolbarKeydown) and tests/grid-keyboard-navigation.spec.ts
- [x] Feature-specific keys, ARIA rows and limits moved to the feature pages, each verified against its directive
-->
