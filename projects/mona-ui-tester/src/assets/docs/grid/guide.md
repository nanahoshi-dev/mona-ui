## Overview

The grid renders `data` as rows against a set of `mona-grid-column` (and optionally `mona-grid-command-column`) definitions projected as content into `<mona-grid>`. Paging is always active; every other behavior — sorting, filtering, grouping, row selection, inline editing, column resizing, column reordering, virtualization, state persistence, and CSV export — is opt-in through a companion attribute directive applied to the same `mona-grid` host element (for example `monaGridSortable`, `monaGridEditable`). `mona-grid` reports only paging and detail-row changes (`pageChange`, `skipChange`, `pageSizeChange`, `expandedKeysChange`); every feature event (`columnSort`, `cellEdit`, `columnResize`, and so on) is emitted by the directive that enables the feature.

Columns are a flat, content-projected list — there is no column-group or nested-column concept.

**Use Grid when:**

- Data is naturally tabular (rows and columns) and the consumer needs paging, sorting, filtering, or editing over that shape.
- Rows need per-cell or per-row editing backed by Angular Signal Forms.

**Use `TreeView` instead when:**

- Data is hierarchical and the primary interaction is expanding and collapsing nodes, rather than editing tabular rows.

**Use `ListView` instead when:**

- Rows are single-value items without a fixed set of typed columns.

## Import & Quick Start

```typescript
import { GridComponent, GridColumnComponent } from "@nanahoshi/mona-ui/grid";
```

```typescript
protected readonly orders = signal([
    { orderId: 1, shipName: "Sea Explorer", freight: 42.5 },
    { orderId: 2, shipName: "Ocean Vision", freight: 18.75 }
]);
```

```html
<mona-grid [data]="orders()" [pageSize]="10">
    <mona-grid-column field="orderId" title="Order ID" type="number"></mona-grid-column>
    <mona-grid-column field="shipName" title="Ship Name" type="string"></mona-grid-column>
    <mona-grid-column field="freight" title="Freight" type="number"></mona-grid-column>
</mona-grid>
```

Without any behavior directive applied, the grid above only paginates; see [Examples](#examples) for sorting, filtering, grouping, selection, editing, and the other opt-in behaviors.

## Anatomy

Each directive below is an `ng-template` (or, for `monaGridColumnTitleTemplate`, an inline template) placed as projected content inside `<mona-grid-column>`, `<mona-grid-command-column>`, or `<mona-grid>` itself.

| Directive                          | Selector                                   | Placed inside                                    | Template context                                                                                                                                                                                                                                                                                                                                                        | Replaces                                                                                   |
| ---------------------------------- | ------------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `GridCellTemplateDirective`        | `ng-template[monaGridCellTemplate]`        | `mona-grid-column` or `mona-grid-command-column` | `{ $implicit: dataItem, column: string }`                                                                                                                                                                                                                                                                                                                               | The column's default formatted cell text                                                   |
| `GridColumnTitleTemplateDirective` | `[monaGridColumnTitleTemplate]`            | `mona-grid-column`                               | None                                                                                                                                                                                                                                                                                                                                                                    | The column header's default title text (used when `monaGridHeaderTemplate` is not present) |
| `GridEditTemplateDirective`        | `ng-template[monaGridEditTemplate]`        | `mona-grid-column`                               | `GridEditTemplateContext` — see [API](#gridedittemplatecontext)                                                                                                                                                                                                                                                                                                         | The built-in editor for that column while the cell or row is being edited                  |
| `GridFooterTemplateDirective`      | `ng-template[monaGridFooterTemplate]`      | `mona-grid-column`                               | `{ $implicit, aggregate, aggregates, column, columnIndex, rows }`: `$implicit` is the column's aggregate value, `aggregate` the column's bucket (`{ field, sum?, avg?, count?, min?, max? }`) or `null`, `aggregates` the buckets by field, `rows` the data items of the whole view. The context type isn't exported. | The column's default aggregate footer value                                                |
| `GridGroupFooterTemplateDirective` | `ng-template[monaGridGroupFooterTemplate]` | `mona-grid-column`                               | The footer context, plus `count`, `depth`, `groupKey` and `groupValue` for the group; `rows` and the aggregates cover that group's rows. The context type isn't exported.                                                                                                                                                                                                  | The default per-group aggregate footer, shown when a group is collapsed                    |
| `GridHeaderTemplateDirective`      | `ng-template[monaGridHeaderTemplate]`      | `mona-grid-column`                               | `{ $implicit: column, column: Column }`                                                                                                                                                                                                                                                                                                                                 | The column header's default title text                                                     |
| `GridDetailTemplateDirective`      | `ng-template[monaGridDetailTemplate]`      | `mona-grid`                                      | `{ $implicit: dataItem }`                                                                                                                                                                                                                                                                                                                                               | No default — renders as an expandable row beneath the data row when present                |
| `GridNoDataTemplateDirective`      | `ng-template[monaGridNoDataTemplate]`      | `mona-grid`                                      | None                                                                                                                                                                                                                                                                                                                                                                    | The grid's default empty-state message                                                     |
| `GridToolbarTemplateDirective`     | `ng-template[monaGridToolbarTemplate]`     | `mona-grid`                                      | `GridToolbarTemplateContext`: `addRowData`, `addRowVisible`, `cancelAdd()`, `cancelEdit()`, `dataState`, `editSession`, `saveAdd()`, `selectedKeys`, `startAdd()`; the same object is also `$implicit`. | No default — renders above the column headers |

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

Without a `format`, a `date` column shows the locale's numeric date (`03/15/2024` in en-US, `15.03.2024` in de-DE), and every other value shows as it is.

`format` takes one of two things:

- A date format string, using Angular's `formatDate` patterns (`"yyyy-MM-dd"`, `"MMM d, y"`). It applies only to `type="date"` columns, where the filter menu and the filter row use it too, and it formats with the application's `LOCALE_ID`. Other columns ignore a string.
- A function `(value, row, column) => string`, for any column. What it returns replaces the cell text. `value` is the cell's value, `row` the row's data item, and `column` the `Column`.

```html
<mona-grid-column field="orderDate" title="Ordered" type="date" format="MMM d, y"></mona-grid-column>
<mona-grid-column field="freight" title="Freight" type="number" [format]="formatCurrency"></mona-grid-column>
```

```typescript
readonly #currency = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" });

protected readonly formatCurrency = (value: number): string => this.#currency.format(value);
```

A formatter can be typed for the column's value, as above. There is no format string for numbers or currency: use a formatter function, or a `monaGridCellTemplate` with Angular's `currency` or `number` pipe. A cell template replaces the cell text, formatted or not. `format` only changes what the cell shows. Sorting, filtering, aggregates and CSV export use the raw value.

### Client Sorting, Filtering, and Paging

Without `monaGridServerBinding`, the grid sorts, filters, groups and pages `data` itself. Bind the whole data set to `data`; the grid never changes the array.

When `data` is replaced, the grid keeps its sort, filter and group descriptors and applies them to the new rows. It also keeps the current page, unless the new rows no longer reach it: then it moves to the last page and reports it through `pageChange` and `skipChange`. A user's sort or filter keeps the current page in the same way; only server binding goes back to the first page.

To filter from controls outside the grid, either bind a filtered `computed` to `data`:

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

or set the `filter` model of `monaGridFilterable`, which also shows the condition in that column's filter UI:

```typescript
protected readonly filter = signal<CompositeFilterDescriptor[]>([]);

protected onShipChange(shipName: string | null): void {
    this.filter.set(
        shipName ? [{ logic: "and", filters: [{ field: "shipName", operator: "eq", value: shipName }] }] : []
    );
}
```

```html
<mona-grid [data]="orders()" monaGridFilterable [(filter)]="filter">...</mona-grid>
```

The `filter` model needs `monaGridFilterable` on the grid. With `[monaGridFilterable]="{ enabled: false }"` the filter UI is hidden, but a `filter` set from code still applies. `CompositeFilterDescriptor` comes from `@nanahoshi/mona-ui/query`.

### Server Paging, Sorting, and Filtering

Import `GridServerBindingDirective` and `GridDataState` from `@nanahoshi/mona-ui/grid`. Apply `monaGridServerBinding` when `data` contains only the page returned by your server. Bind the server's matching record count to `total`, the page's zero-based offset to `skip`, and its size to the Grid's existing `pageSize` input.

```example
grid/server
```

`dataStateChange` supplies `{ skip, take, sort, filter }` once for a user page, page-size, sort, or filter action. All its properties are readonly, and each emission holds its own copies of the descriptors, including nested filter values. Use the grid's `pageSize` for the request's `take`; in server mode it must be a positive safe integer. The directive is enabled by its presence and adds no page-size input of its own. Sort and filter actions start at `skip: 0`; a page-size change keeps the first row of the page in view. Sort order follows multi-column sort priority. Bindings from the parent synchronize silently, and ordinary directive creation does not emit an initial request: load the initial page yourself.

The application owns HTTP requests, errors, and stale-response handling. The example ignores a response that arrives after a newer request started. `SortDescriptor` and `CompositeFilterDescriptor` come from `@nanahoshi/mona-ui/query`; the Grid has no endpoint or transport dependency.

The server must apply the descriptors to the whole matching dataset before paging. The Grid preserves returned row order and displays every supplied row, even when `skip` is nonzero. For example, ten supplied rows at `skip: 40`, `pageSize: 10`, and `total: 137` show page five and retain all ten rows.

While `loading` is true, the body shows a localized loading indicator, preserves existing rows, and suppresses the ordinary empty state. The grid element exposes `aria-busy`; the header and pager remain available for another request. Set `loading` back to false on both success and error.

Server mode has these boundaries:

- Grouping and aggregates operate on the loaded page. Each group direction controls the loaded page's group header order while preserving server row order within each leaf group. `group` is not part of `GridDataState`, and no remote aggregate protocol is provided.
- CSV export contains loaded data only. Fetch a full export through your application when needed.
- Select-all selects loaded rows only. Use `selectBy` and controlled `selectedKeys` to manage stable keys across pages; this does not select unloaded records.
- Editing events continue to describe loaded rows; the application saves changes to its server.
- Row reordering is disabled with an accessible, localized server-binding reason.
- `monaGridServerBinding` and enabled `monaGridVirtualScroll` cannot be combined; enabling both throws an error. This directive provides page-based loading rather than remote virtual scrolling.
- State persistence restores sort, filter, and page size (unless `persistPageSize` is `false`), then emits one consolidated refresh at `skip: 0`. The offset is not persisted. When providing a saved initial state, use that refresh to load the restored query instead of starting a competing initial request.

### Row Sizing

Ordinary rows fit their cell templates and editors. Short text stays compact with a 36px minimum under the default spacing scale, and default cell text still truncates horizontally. Avatars, stacked labels, and custom editors can make a row taller without setting a row height. Selection controls, detail toggles, command buttons, and locked cells align within the resulting row.

```html
<mona-grid [data]="users()">
    <mona-grid-column field="name" title="User">
        <ng-template monaGridCellTemplate let-user>
            <div class="flex items-center gap-3">
                <mona-avatar
                    [label]="user.initials"
                    [width]="48"
                    [height]="48"
                    labelColor="white"
                    backgroundColor="#44607e"
                    borderRadius="50%" />
                <div>
                    <div>{{ user.name }}</div>
                    <div>{{ user.email }}</div>
                </div>
            </div>
        </ng-template>
    </mona-grid-column>
</mona-grid>
```

Import `GridCellTemplateDirective` from `@nanahoshi/mona-ui/grid` and `AvatarComponent` from `@nanahoshi/mona-ui/avatar` alongside the Grid and column components.

Virtualization uses a fixed height in pixels for every rendered item and the scrolling calculations. The default is **36px**; set a larger height for templates, such as `[monaGridVirtualScroll]="{ height: 64 }"`. Oversized virtual templates are clipped to that height. Expanded detail rows add a separate row and are not supported by this fixed-item geometry; use ordinary rows for expanded details. Variable-height virtualization is not provided.

### Paging

`pageSize` and `pageSizeValues` control the built-in pager; `[(pageSize)]` and `[(skip)]` are two-way, and `pageChange` reports the user's page and page-size changes (not values set from code). A new page size keeps the first row of the current page in view. When the rows shrink below the current page (new data, a removed row, a filter), the grid moves to the last page and reports it. `responsivePager` collapses the pager into a dropdown when the grid narrows.

```html
<mona-grid [data]="orders()" [pageSize]="10" [pageSizeValues]="[10, 20, 30]" [responsivePager]="true"></mona-grid>
```

### Sorting

`monaGridSortable` enables column-header sorting; `sort` is a two-way bindable model of the current sort descriptors, and a restored grid state updates it. A `SortDescriptor` comes from `@nanahoshi/mona-ui/query`:

```typescript
import type { SortDescriptor } from "@nanahoshi/mona-ui/query";

interface SortDescriptor<TValue = unknown> {
    dir: "asc" | "desc";
    field: string;
    /** Compares two values of `field`; `dir: "desc"` reverses the result. */
    sort?(left: TValue, right: TValue): number;
}
```

```typescript
protected readonly sort = signal<SortDescriptor[]>([{ dir: "desc", field: "orderDate" }]);
```

```html
<mona-grid [data]="orders()" monaGridSortable [(sort)]="sort">...</mona-grid>
```

Descriptors are kept even when no column shows their field (a column added later shows the sort), and a repeated field keeps its last descriptor. A column's `sortComparator`, or the descriptor's own `sort` function, is kept when the user clicks the header.

```example
grid/sorting-filtering
```

Pass an object to `monaGridSortable` to configure sort mode, unsorting, or index display, as the example does with `{ mode: 'multiple', allowUnsort: true }`.

In multiple mode, sorted headers show their one-based priority next to the direction icon by default: the first sorted column is `1`, the next is `2`. Changing direction retains priority; unsorting a column renumbers the remaining columns. Set `showIndices: false` to hide the numbers. Single mode shows only the direction icon.

Set `[sortable]="false"` on a column to disable sorting through its header. Columns default to `sortable: true`, and grid-level sorting must also be enabled. This setting controls header interaction; existing or externally supplied `sort` descriptors remain applied. The example turns it off for the Order column.

### Filtering

`monaGridFilterable` renders filter UI either in the column header menu, a dedicated filter row, or both, per `type`. `filter` is a two-way bindable model of the applied `CompositeFilterDescriptor[]`, applied before the first render. Conditions on one field become that column's filter, and an `and` across fields is split per column; filters on the same field are combined with `and`. Filters that span columns (an `or` of two fields) are still applied, reported and sent to the server, without marking a column. Conditions with an unknown operator are ignored.

The [sorting example](#sorting) shows both the header menu and the filter row.

The header menu is a dialog named after its column (`filterByColumn`). It opens at the column type's first operator, keeps focus inside until it closes, and returns focus to its funnel button. `Enter` in a value applies the filter, and text that is only spaces is no value; text is trimmed before it is applied. A date column's menu and filter row use the column's string `format`, or the locale's date format without one. While a column is filtered, its funnel shows a dot as well as a colour, and its name says so (`filterByColumnFiltered`).

In the filter row, typing filters after a 300 ms pause; choosing an operator, picking a date or a Boolean value, and `Clear` filter at once and drop typing that has not filtered yet. An operator chosen without a value stays chosen until there is one. A cell follows only its own column's filter, and its own filter coming back does not overwrite newer typing. Its inputs are named `"Filter by {column}"`, its operator button `"Filter operator for {column}: {operator}"` (`filterOperator`), and its clear button `"Clear filter for {column}"` (`clearFilter`).

### Grouping

`monaGridGroupable` lets the consumer drag a column header into the group panel rendered above the grid. `group` is a two-way bindable model of the group descriptors: `groupChange` emits once for each user change (grouping, ungrouping, reordering or re-sorting groups) and after a state is restored, never for a value set from code. `null`, `undefined` and empty text form one group; `1` and `"1"` are different groups; dates group by their time.

```html
<mona-grid
    [data]="orders()"
    [monaGridGroupable]="{ enabled: true, showFooter: true }"
    [group]="group()"
    (groupChange)="group.set($event)">
</mona-grid>
```

### Row Selection

`monaGridSelectable` enables single or multiple row selection. `selectedKeys` binds the currently selected keys; `selectBy` (a field name or a function) chooses what identifies a row. Without `selectBy`, rows are selected by the grid's `rowKey` value, so the selection survives a refetch; without either, by the data item. `selectedKeysChange` reports user changes only.

```example
grid/selection
```

Set `showCheckboxes: true` to render a built-in checkbox selection column. The column is fixed at the left of the grid, is locked while horizontally scrolling, and never participates in sorting, filtering, grouping, resizing, reordering, or the column chooser. `rowAriaLabel` names each checkbox after its row.

Options:

- `mode`: `"single"` (default) or `"multiple"`.
- `showCheckboxes`: display the built-in checkbox selection column (default `false`).
- `showSelectAll`: display the select-all checkbox in the selection column header (default `true`, multiple mode only).
- `selectAllScope`: which rows the header checkbox affects — `"page"` (default) selects only rows on the current page; `"view"` selects every row in the current filtered and sorted view. Virtual scrolling has no logical pages, so `"page"` resolves to the full current view there. The header checkbox is checked when every row in scope is selected and indeterminate when only some are.
- `selectOnRowClick`: whether clicking a row changes its selection (default `false`, so clicking a row's content — a link, a button, an editable cell — never silently discards the current selection). Set to `true` to also select rows via a plain click, in addition to checkboxes or application code.

Selection state always lives in `selectedKeys`. Row clicks and checkbox clicks mutate the same state. When `selectOnRowClick` is enabled: in single mode, clicking a row replaces the previous selection; in multiple mode, a plain click replaces the selection with just that row, Ctrl/Cmd-click toggles a single row without disturbing the rest, and Shift-click range-selects from the last clicked row. Checkbox clicks always toggle the clicked row in place, regardless of `selectOnRowClick`. Bulk (de)selection preserves keys that are outside the current scope. Provide a stable `selectBy` when selection must survive data reloads, pagination, or remote data fetching.

### Virtualization

`monaGridVirtualScroll` renders only the rows currently in view, for large data sets. `scrollEndThreshold` (rows from the bottom) controls when `scrollEnd` fires, useful for loading more data incrementally.

```html
<mona-grid
    [data]="orders()"
    [monaGridVirtualScroll]="{ height: 36 }"
    [scrollEndThreshold]="5"
    (scrollEnd)="loadMoreOrders()">
</mona-grid>
```

While virtual scrolling is on, the grid shows no pager and no aggregate footer, and rejects detail rows and server binding.

`height` in the options defaults to **36px** and must be finite and greater than zero. It sets the rendered height and the virtual item size of every row, group header and group footer, and templates taller than it are clipped.

### Editing

`monaGridEditable` turns on inline editing, backed exclusively by Angular Signal Forms — see [Forms Integration](#forms-integration). `mode` chooses whether editing commits per cell or per row; `schema` validates the row being edited.

```example
grid/editing
```

A `mona-grid-command-column` without content shows the built-in Edit and Remove buttons, and `monaGridAddCommand` on a toolbar button opens the add row.

Each column's `type` (`"string"`, `"number"`, `"date"`, or `"boolean"`) selects the built-in editor rendered for that cell — a text box, numeric text box, date picker, or checkbox, respectively — unless the column provides its own `monaGridEditTemplate`. Every column is editable except the one whose `field` is the `rowKey`; set `[editable]` on a `mona-grid-column` to change that, for example `[editable]="true"` to type the key of a new row.

Each editor is named after its column title. Number text is read in the grid's locale (`1.234,5` in de-DE); a date picked in the calendar keeps the time of day the value had. A row without a value for an editable column starts that editor at `null`, and the field is left out of the saved row again if it stays empty.

**Keys.** In cell mode, `Enter` or `F2` starts editing, `Enter` or leaving the editor saves, `Escape` cancels and `Tab` moves to the next editable cell. In row mode, `Enter` or `F2` on any cell edits the row from that cell's editor; `Tab` and `Shift+Tab` move between the row's editors and its Save and Cancel buttons, `Enter` saves the row (after validation) and `Escape` cancels it. The add row works the same way. `Enter` and `Escape` are left to an input method while it composes text. After Save, Cancel or Remove, focus moves to the row's cell, or to the nearest cell when the row is gone.

**Events.** `save` is the one to persist from: its `rowData` holds the edited values and `originalRowData` the row as it was. `cellEdit` comes first in cell mode, with the field's old and new value; its `rowData` is the row as it was. Neither fires when nothing changed. To save on a server, prevent `save` to keep the editor open, then call `endEdit()` on the `GridEditableDirective` (from `viewChild(GridEditableDirective)`) when the request succeeds. `cancel` carries a `reason`: `"command"`, `"escape"`, `"switch"` (another edit or the add row started) or `"removed"` (the row left the data or the view, which can't be prevented). When `data` is replaced during an edit, the edit moves to the new item with the same `rowKey` and keeps what was typed. `remove` carries the row's `key` and its `index` in `data`.

**Validation.** An invalid field is linked to its editor with `aria-describedby`, and a commit that fails validation is announced through a polite live region. The command buttons are named after their row (`Edit row 3`); `commandAriaLabel` in the options names them after something else, such as an order number.

Custom edit templates receive a `GridEditTemplateContext` bound to the row's Signal Forms field:

```html
<mona-grid-column field="shipName" title="Ship Name">
    <ng-template monaGridEditTemplate let-context>
        <mona-text-box [formField]="$any(context.field)" (keydown.escape)="context.cancel()"></mona-text-box>
    </ng-template>
</mona-grid-column>
```

### Column Resizing

`monaGridResizable` renders a drag handle between header cells; `columnResize` emits the old and new width once a resize completes. A drag stops at the column's `minWidth` and `maxWidth`, and `Escape` during a drag puts the width back.

The handle is also a focusable `separator`: `F2` on a header moves to it, `ArrowLeft`/`ArrowRight` resize the column by 10px (mirrored in right-to-left layouts), `Home`/`End` set it to its narrowest/widest width, and `Enter` fits it to its content.

```html
<mona-grid [data]="orders()" monaGridResizable (columnResize)="onColumnResize($event)"></mona-grid>
```

### Column Reordering

`monaGridReorderable` lets the consumer drag column headers into a new order. Dropping on the start half of a header puts the column before it, the end half after it; `Escape` cancels the drag. From the keyboard, `Ctrl+Shift+ArrowLeft`/`Ctrl+Shift+ArrowRight` moves the focused header one place and announces its new position. `columnReorder` is cancelable — call `preventDefault()` to keep a column from moving.

```html
<mona-grid [data]="orders()" monaGridReorderable (columnReorder)="onColumnReorder($event)"></mona-grid>
```

```typescript
protected onColumnReorder(event: ColumnReorderEvent): void {
    if (event.column.field === "orderId") {
        event.preventDefault();
    }
}
```

### Column Locking

Set `locked` and `lockedPosition` on a `mona-grid-column` (or `mona-grid-command-column`) to keep it fixed while the grid scrolls horizontally.

```html
<mona-grid-column field="orderId" title="Order ID" [locked]="true" lockedPosition="left"></mona-grid-column>
```

### Row Reordering

`monaGridRowReorderable` adds a built-in reorder-handle column as the first grid column. Rows can be moved only by dragging that handle, or with `Alt + ArrowUp` / `Alt + ArrowDown` while the handle is focused. The consumer owns the row order: `rowReorder` carries the complete reordered application data, and the grid never mutates the `[data]` input.

```html
<mona-grid [data]="products()" [rowKey]="'id'" monaGridRowReorderable (rowReorder)="onRowReorder($event)">
    <mona-grid-column field="name" title="Name"></mona-grid-column>
    <mona-grid-column field="price" title="Price"></mona-grid-column>
</mona-grid>
```

```typescript
protected readonly products = signal<Product[]>([...PRODUCTS]);

protected onRowReorder(event: RowReorderEvent<Product>): void {
    this.products.set([...event.reorderedData]);
}
```

An options object can restrict which rows move and customize the handle's accessible label:

```html
<mona-grid
    [data]="products()"
    [rowKey]="'id'"
    [monaGridRowReorderable]="{ enabled: true, canReorder: canReorderProduct }"
    (rowReorder)="onRowReorder($event)">
</mona-grid>
```

Row reordering works with pagination (moving rows within the current page), master-detail rows, selection, locked columns, footers, and the add-row editor. It is intentionally disabled while sorting, filtering, grouping, server binding, virtual scrolling, or an edit session is active, because those features change the source-to-view mapping. Row order is application data and is not stored in `GridState`.

### Master-Detail Rows

`monaGridDetailTemplate` renders projected content for each row that the consumer can expand. The detail toggle is a button named by the `expandDetail`/`collapseDetail` messages, with `aria-expanded`. Detail rows aren't supported with `monaGridVirtualScroll`, whose rows share one height: the grid ignores the template there and warns in development mode.

```html
<mona-grid [data]="orders()">
    <ng-template monaGridDetailTemplate let-dataItem>
        <pre>{{ dataItem | json }}</pre>
    </ng-template>
</mona-grid>
```

### State Persistence

`monaGridStatePersistence` captures and restores column order/width/visibility, sort, filter, group state and the page size (unless `persistPageSize` is `false`) through the two-way bindable `state` model.

```typescript
protected readonly state = signal<GridState | null>(null);
```

```html
<mona-grid [data]="orders()" [monaGridStatePersistence]="{ persistPageSize: true }" [(state)]="state"></mona-grid>
```

Persist `state()` to storage (for example in an `effect`) to restore it on the next visit.

### CSV Export

`monaGridExport` exposes `exportCsv(filename?)` through a template reference variable. It exports the visible columns of every row in the current view (filtered and sorted, all pages); with server binding only the loaded page. Dates are written as the local calendar date (`YYYY-MM-DD`), and text starting with `=`, `+`, `-`, `@`, a tab or a carriage return is prefixed with `'` so spreadsheets don't run it as a formula.

```html
<button (click)="gridExport.exportCsv('orders.csv')">Export as CSV</button>
<mona-grid [data]="orders()" monaGridExport #gridExport="monaGridExport"></mona-grid>
```

### Aggregates and Footer

Set `aggregate` on a `mona-grid-column` (`"sum"`, `"avg"`, `"count"`, `"min"`, `"max"`, or `"custom"`) to show a computed value in the grid footer. Grouped rows show the same aggregate under each expanded group; `monaGridGroupable`'s `showFooter` option also keeps it under collapsed groups. `"custom"` requires a `monaGridFooterTemplate` (and, for grouped data, a `monaGridGroupFooterTemplate`) to render the value, since the grid does not compute a value for it.

Aggregates cover the whole view (every filtered row, not only the current page), in the footer and in each group footer; with server binding they cover the loaded page. `count` counts values that aren't empty; `sum` and `avg` use numbers and numeric text (`"12.5"`), and the sum of no numbers is `0`.

```html
<mona-grid-column field="freight" title="Freight" type="number" aggregate="avg"></mona-grid-column>
```

## Behavior

### `GridComponent` has no outputs of its own

Paging (`pageChange`, `skipChange`, `pageSizeChange`) and detail rows (`expandedKeysChange`) are reported by `mona-grid`. All other grid events (`columnSort`, `columnResize`, `columnReorder`, `groupChange`, `selectedKeysChange`, `cellEdit`, `rowEdit`, `save`, `remove`, `cancel`, `add`, `edit`, `scrollEnd`) are emitted by the companion directive that enables the corresponding feature.

### Cancelable events

`columnSort`, `columnReorder`, `cellEdit`, `rowEdit`, `save`, `remove`, `cancel`, `add`, and `edit` are all event objects exposing `preventDefault()`/`isDefaultPrevented()`. Calling `preventDefault()` stops the corresponding state change — for example, `columnReorder.preventDefault()` keeps the dragged column in its original position. `columnResize` is a plain object with no `preventDefault()`.

### `resizeMethod` controls initial column widths

`"fitView"` (default) distributes available width across columns with no explicit `width`. `"auto"` sizes each column to fit its rendered content. A literal number applies that width to every column without an explicit `width`.

### No CSS custom properties

Grid styling is implemented with Tailwind utility classes internally; there are no public CSS custom properties to override. The only public styling hooks are the `class` input (merged with `tailwind-merge`) and the `rounded` input.

### The Columns button

When the grid has a `monaGridToolbarTemplate`, the toolbar also shows a built-in Columns button (the `columns` message). It opens a popup that lists every column, with a box to filter the list by title. Apply shows the checked columns and hides the others; Cancel drops the changes. A column's `hidden` input sets where it starts, and `monaGridStatePersistence` saves what the user chose. The popup's component is internal, so there is nothing to import, and without a toolbar template there is no button.

## Forms Integration

Inline editing is built exclusively on Angular Signal Forms: the built-in editors and the `GridEditTemplateContext` passed to `monaGridEditTemplate` both operate on a `FieldTree` from `@angular/forms/signals`. No grid component implements `ControlValueAccessor`, `FormValueControl`, or `FormCheckboxControl` — there is no `[(ngModel)]`, `[formControl]`, or `formControlName` integration at the cell-editor level. Provide a `schema` function on `monaGridEditable`'s options to validate the row being edited; validation errors surface through `GridEditTemplateContext.errors`/`invalid`/`touched` in custom edit templates.

## Accessibility

### Keyboard

The grid is one Tab stop. `Tab` moves into the grid at the cell that last had focus. The first time, that is the first body cell, or the first header cell when there are no rows. The next `Tab` leaves the grid. Inside, the keys below move between cells; the header, the filter row, the add row and the body rows are one column of rows.

| Key                                  | Action                                                                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ArrowDown` / `ArrowUp`              | Move to the same column in the next/previous row, across the header, the filter row, the add row and the body.                                                              |
| `ArrowLeft` / `ArrowRight`           | Move to the previous/next cell in the row (mirrored in right-to-left layouts).                                                                                              |
| `Home` / `End`                       | Move to the first/last cell in the row.                                                                                                                                     |
| `Ctrl+Home` / `Ctrl+End` (`Cmd` too) | Move to the first/last cell in the grid. With virtual scrolling, the grid scrolls to the last row first.                                                                    |
| `PageUp` / `PageDown`                | Move up/down by the number of rows that fit in the body.                                                                                                                    |
| `Enter`                              | On a header, sorts the column. On a group row or the detail toggle, expands or collapses it. On an editable cell, starts editing. On any other cell, moves into its controls. |
| `F2`                                 | Starts editing an editable cell; on any other cell, including a header or a filter-row cell, moves into its controls (links, buttons, the filter button, the filter input).  |
| `Alt+ArrowDown`                      | On a filterable header, opens its filter menu (`aria-keyshortcuts`). On a group or detail row, expands or collapses it.                                                     |
| `Space` / `Shift+Space`              | With selection on, toggles the row's selection / selects the rows from the last selected row to this one.                                                                   |
| `Shift+ArrowDown` / `Shift+ArrowUp`  | Moves to the next/previous row and extends the selection to it.                                                                                                             |
| `Ctrl+A` / `Cmd+A`                   | With multiple selection, selects every row in the select-all scope.                                                                                                         |
| `Ctrl+C` / `Cmd+C`                   | Copies the focused cell's text (body rows, not while editing, and not when text is selected).                                                                               |
| `Ctrl+Shift+ArrowLeft` / `ArrowRight` | With `monaGridReorderable`, moves the focused header's column one place (mirrored in right-to-left layouts) and announces it. `Cmd` too.                                    |
| `Ctrl+Shift+G` / `Cmd+Shift+G`       | With `monaGridGroupable`, groups the rows by the focused header's column and announces it.                                                                                  |
| `Delete` / `Backspace`               | On a chip in the group panel, removes that grouping.                                                                                                                        |
| `ArrowRight` / `ArrowLeft`           | On a group row, expands/collapses it first (mirrored in right-to-left layouts); on an expanded/collapsed group, moves as usual.                                             |
| `Tab` / `Shift+Tab`                  | Leaves the grid. While editing a cell, commits it and edits the next/previous editable cell.                                                                                |

Headers list their shortcuts in `aria-keyshortcuts`. The column resize handle has its own keys, described under [Column Resizing](#column-resizing).

Inside a cell's controls, `Tab`, `Shift+Tab` and the arrows move between them (text fields keep their arrow keys), `Tab` past the last control moves on to the next cell, and `Escape` returns to the cell.

The toolbar is a `role="toolbar"` named by the `toolbar` message. `ArrowLeft`/`ArrowRight` (mirrored in right-to-left layouts), `Home` and `End` move between its controls, except in text fields and other controls that use those keys; only one control is in the Tab order, including controls the toolbar template adds later.

### Focus

Grid cells use a roving `tabindex`: the cell that last had focus has `tabindex="0"`, every other cell and every control inside a cell has `tabindex="-1"`. Keyboard focus shows a solid 2px ring inside the cell. Cells moved to with the keys scroll clear of pinned columns. Focus returns to a header after it's dragged, and to a cell of a virtual grid when its row scrolls back into view. Changing the page from the pager scrolls the body to the first row.

### ARIA

| Attribute          | When present                                               | Value                                                              |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `role`             | On the tabular content region                              | `"grid"`, or `"treegrid"` while rows are grouped                   |
| `aria-label`       | On the tabular content region                              | The `ariaLabel` input; `aria-labelledby` from `ariaLabelledBy`     |
| `aria-rowcount`    | On the tabular content region                              | Every row, or `-1` when paged groups or detail rows make it unknown |
| `aria-colcount`    | On the tabular content region                              | Every column, including group indent and selection columns         |
| `aria-multiselectable` | On the tabular content region                              | `"true"` with multiple selection                                   |
| `aria-readonly`    | On the tabular content region                              | `"true"` while editing is off                                      |
| `role`             | On the header/body/footer row groups                       | `"rowgroup"`                                                       |
| `role`             | On header cells                                            | `"columnheader"`                                                   |
| `role`             | On data/group/footer rows                                  | `"row"`                                                            |
| `role`             | On data cells                                              | `"gridcell"`                                                       |
| `role`             | On the column resize handle                                | `"separator"`                                                      |
| `aria-sort`        | On a header cell, only while `monaGridSortable` is enabled | `"ascending"`, `"descending"`, or `"none"`; only on the first sort |
| `aria-describedby` | On a header cell sorted after another                      | Its place in the sort order (`sortOrder` message)                  |
| `aria-keyshortcuts` | On a header cell with keyboard shortcuts                   | The keys that open its filter menu, move it or group by it         |
| `role`             | On an open filter menu                                     | `"dialog"`, with `aria-label` `"Filter by {column}"`               |
| `aria-haspopup`    | On a filter menu button / a filter row operator button     | `"dialog"` / `"menu"`; the operator button also has `aria-expanded` |
| `aria-selected`    | On a row, only while `monaGridSelectable` is enabled       | Reflects whether the row is selected                               |
| `aria-busy`        | On the tabular content region in server mode               | `"true"` while `loading` is true                                   |
| `aria-rowindex`    | On every row                                               | 1-based position, counting header, filter and add rows and earlier pages |
| `aria-colindex`    | On every cell                                              | 1-based column position, accounting for group indent columns       |
| `aria-expanded`    | On a group header row                                      | Reflects whether the group is expanded                             |
| `aria-level`       | On rows of a grouped grid                                  | The group's nesting depth; data rows sit one level below their group |
| `aria-readonly`    | On a data cell                                             | `"true"` when editing is disabled for that cell or column          |
| `aria-orientation` | On the column resize handle                                | `"vertical"`                                                       |
| `aria-label`       | On the column resize handle                                | `"Resize {column}"` (`resizeColumn` message)                       |
| `aria-valuenow`    | On the column resize handle                                | The column width in pixels, with `aria-valuemin`/`aria-valuemax`   |
| `aria-expanded`    | On the detail toggle button                                | Reflects whether the detail row is open                            |
| `aria-label`       | On the built-in command buttons                            | Names the row: `"Edit row 3"`, `"Remove row 3"`, `"Save row 3"`, `"Cancel editing row 3"`, or the `commandAriaLabel` option's text |

Moving a column or grouping by one from the keyboard is announced through a polite live region (`columnMoved` and `columnGrouped` messages). The grid element has no name of its own: set `ariaLabel` or `ariaLabelledBy`.

<!-- verification-checklist
- [x] GridComponent inputs verified against grid.component.ts source (data, pageSize, pageSizeValues, resizeMethod, responsivePager, rounded, class/userClass); confirmed the component defines no outputs (all "grid events" live on companion directives)
- [x] GridColumnComponent (12 inputs) and GridCommandColumnComponent (9 inputs) verified against grid-column.component.ts and grid-command-column.component.ts source; both have empty templates and provide GRID_COLUMN_DEFINITION
- [x] Behavior directives, including ServerBinding (Sortable, Filterable, Groupable, Selectable, Editable, Resizable, Reorderable, VirtualScroll, StatePersistence, Export) verified against their individual .directive.ts source files; missing @description JSDoc added to GridSelectableDirective, GridGroupableDirective, GridFilterableDirective, GridVirtualScrollDirective as part of this pass
- [x] Nine structural template directive selectors verified against grid/directives/grid-*template*.directive.ts; template contexts verified against grid.component.html, grid-cell.component.html, grid-list.component.html ngTemplateOutletContext bindings; GridFooterTemplateContext/GridGroupFooterTemplateContext confirmed unexported (declared privately in grid-footer-cell.component.ts); their shapes are documented in the Anatomy table
- [x] Keyboard map verified against grid-logical-cell.directive.ts (onHostKeydown/onEnterKey/onF2Key/#handleCommandInnerKeydown), grid-navigation.service.ts (navigate()), grid.component.ts (onToolbarKeydown), and tests/grid-keyboard-navigation.spec.ts
- [x] ARIA attributes verified against grid.component.html (grid/rowgroup/columnheader/row/aria-sort/aria-expanded/aria-level), grid-row.directive.ts (aria-selected/aria-rowindex), grid-logical-cell.directive.ts (aria-colindex), grid-cell.directive.ts (gridcell), grid-logical-cell.directive.ts (aria-readonly), grid-column-resize-handler.directive.ts (separator/aria-label/aria-orientation), grid-command-cell.component.html (static aria-labels)
- [x] Form integration verified: grid-editor.component.ts and GridEditTemplateContext use @angular/forms/signals FieldTree exclusively; no ControlValueAccessor/FormValueControl/FormCheckboxControl implementation found anywhere in projects/mona-ui/src/lib/grid
- [x] Exported types cross-checked against grid/public-api.ts; GridService, GridNavigationService, GridRowFlattenerService, GridExportService, Row, GridColumnChooserComponent, GridFilterMenuComponent, GridEditorComponent, and the cell/row structural directives (GridRowDirective, GridCellDirective, GridLockedCellDirective, GridLogicalCellDirective, etc.) confirmed NOT exported and omitted from API tables
- [x] component-metadata.json's GridComponent entry confirmed stale (missing an outputs key, missing several documented inputs) — not used as the source of truth for this page; npm run build:metadata should be re-run and the entry spot-checked against this page after the JSDoc changes in this pass
- [x] GridColumnChooserComponent (built-in "Columns" toolbar button) confirmed present in grid.component.html template but not in the public barrel; documented under Behavior as "The Columns button", shown only with a toolbar template
- [x] Server binding contract, external synchronization, loading, persistence, and compatibility verified against grid-server-binding.directive.ts, grid.service.ts, grid-server-binding.spec.ts, and the mock server demo.
- [x] Natural row sizing, fixed virtual geometry, drag placeholders, LTR/RTL locked cells, editing, and WCAG AA AXE checks verified in scripts/test-grid-browser.ts.
-->
