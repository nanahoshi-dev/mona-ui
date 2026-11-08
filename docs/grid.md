# Mona UI Grid

`<mona-grid>` (from `@nanahoshi/mona-ui/grid`) shows rows of data in typed columns, with a pager below them. Every other feature is a directive you add to the same `<mona-grid>` element. This guide explains how the features work and how to combine them. The [grid reference](../projects/mona-ui-tester/src/assets/docs/grid/api.md) lists every input, output and type.

| Feature                 | Directive on `<mona-grid>`                 | State you bind             | Events                                                           |
| ----------------------- | ------------------------------------------ | -------------------------- | ---------------------------------------------------------------- |
| Paging                  | built in                                   | `[(skip)]`, `[(pageSize)]` | `pageChange`                                                     |
| Sorting                 | `monaGridSortable`                         | `[(sort)]`                 | `columnSort`                                                     |
| Filtering               | `monaGridFilterable`                       | `[(filter)]`               | —                                                                |
| Grouping                | `monaGridGroupable`                        | `[(group)]`                | `groupChange`                                                    |
| Selection               | `monaGridSelectable`                       | `selectedKeys`             | `selectedKeysChange`                                             |
| Editing                 | `monaGridEditable`                         | —                          | `edit`, `cellEdit`, `save`, `rowEdit`, `cancel`, `remove`, `add` |
| Detail rows             | `monaGridDetailTemplate`                   | `[(expandedKeys)]`         | —                                                                |
| Server data             | `monaGridServerBinding`                    | `total`, `skip`, `loading` | `dataStateChange`                                                |
| State persistence       | `monaGridStatePersistence`                 | `[(state)]`                | —                                                                |
| CSV export              | `monaGridExport`                           | —                          | —                                                                |
| Virtual scrolling       | `monaGridVirtualScroll`                    | `scrollEndThreshold`       | `scrollEnd`                                                      |
| Column resizing, moving | `monaGridResizable`, `monaGridReorderable` | —                          | `columnResize`, `columnReorder`                                  |
| Row moving              | `monaGridRowReorderable`                   | —                          | `rowReorder`                                                     |

---

## 1. Data and Row Identity

```typescript
import { Component, signal } from "@angular/core";
import { GridColumnComponent, GridComponent } from "@nanahoshi/mona-ui/grid";

type Order = {
    orderId: number;
    shipName: string;
    freight: number;
    orderDate: Date;
};

@Component({
    selector: "app-orders",
    imports: [GridColumnComponent, GridComponent],
    template: `
        <mona-grid aria-label="Orders" rowKey="orderId" [data]="orders()">
            <mona-grid-column field="orderId" title="Order ID" type="number" />
            <mona-grid-column field="shipName" title="Ship name" />
            <mona-grid-column field="freight" title="Freight" type="number" aggregate="sum" />
            <mona-grid-column field="orderDate" title="Order date" type="date" format="dd/MM/yyyy" />
        </mona-grid>
    `
})
export class OrdersComponent {
    protected readonly orders = signal<Order[]>([]);
}
```

- `data` takes any iterable of objects. The grid never changes it: sorting, filtering, editing and row moves are reported to you, and you replace `data`.
- Each `<mona-grid-column>` reads `field` from every row. `type` (`"string"`, `"number"`, `"date"` or `"boolean"`) picks the sorting, the filter operators and the built-in editor. It defaults to `"string"`.
- `format` changes the cell text: a format string for date columns, or a function `(value, row, column) => string` for any column.

**Set `rowKey`.** `rowKey` is a field name, or a function, that gives each row a unique, stable value, such as a database id. The grid builds each row's identity from it. Without `rowKey`, a row is known only by its object, so a refetch that returns new objects looks like all new rows. With it:

- the selection follows the key across refetches and pages;
- open detail rows (`expandedKeys`) stay open;
- an edit in progress moves to the new object with the same key and keeps what the user typed, instead of being cancelled with reason `"removed"`;
- `remove` reports the row's key, so you can delete it by id;
- the `rowKey` column isn't editable unless you set `[editable]` on it.

Keys must be unique. In development mode the grid warns when two rows have the same key.

---

## 2. Sorting

```html
<mona-grid [data]="orders()" [monaGridSortable]="{ mode: 'multiple' }" [(sort)]="sort">
    <mona-grid-column field="shipName" title="Ship name" />
    <mona-grid-column field="priority" title="Priority" [sortComparator]="byPriority" />
    <mona-grid-column field="orderId" title="Order ID" type="number" [sortable]="false" />
</mona-grid>
```

```typescript
const PRIORITIES = ["low", "normal", "high"];

protected readonly sort = signal<SortDescriptor[]>([{ field: "shipName", dir: "asc" }]);
protected readonly byPriority: ColumnSortComparator = (left, right) =>
    PRIORITIES.indexOf(String(left)) - PRIORITIES.indexOf(String(right));
```

`SortDescriptor` comes from `@nanahoshi/mona-ui/query`, `ColumnSortComparator` from `@nanahoshi/mona-ui/grid`.

- Clicking a header (or <kbd>Enter</kbd> on it) sorts ascending, then descending, then clears the sort. Set `allowUnsort: false` to switch between ascending and descending only.
- `mode` is `"single"` by default: sorting a column replaces the other sorts. In `"multiple"` mode each column you sort is added after the others, and its header shows its place in the order (`showIndices`, on by default).
- `sort` is a two-way model. Descriptors you set from code are kept even when no column shows their field. `columnSort` fires before a header click changes the sort; call `preventDefault()` to stop it.
- `[sortable]="false"` on a column only stops header clicks. Descriptors you set for that field still apply.

**The default comparator** (`compareValues` in `@nanahoshi/mona-ui/query`) puts every type in one order:

- Empty values come first when ascending (last when descending): `null`, `undefined`, `NaN`, invalid dates, and objects or arrays.
- Then booleans, numbers, dates (by time) and strings.
- Strings are compared with the collation of the active Mona locale (see the i18n guide), with digits compared by value: "Item 2" comes before "Item 10".

The first descriptor decides the order. Each later descriptor only orders the rows that tie on the ones before it. While rows are grouped, the group fields sort first.

A column's `sortComparator`, or a descriptor's own `sort` function, replaces the default for that field. It receives the two cell values, empty ones included; `dir: "desc"` reverses its result. The comparator is kept when the user clicks the header.

---

## 3. Filtering

```html
<mona-grid [data]="orders()" [monaGridFilterable]="{ enabled: true, type: 'menu, row' }" [(filter)]="filter">
    <mona-grid-column field="shipName" title="Ship name" />
    <mona-grid-column field="orderDate" title="Order date" type="date" format="dd/MM/yyyy" />
    <mona-grid-column field="notes" title="Notes" [filterable]="false" />
</mona-grid>
```

```typescript
protected readonly filter = signal<CompositeFilterDescriptor[]>([
    { logic: "and", filters: [{ field: "shipName", operator: "contains", value: "sea" }] }
]);
```

**Choose where the filters go** with `type`:

- `"menu"` (the default) adds a funnel button to each header. It opens a dialog with up to two conditions, joined by AND or OR. Use it when filtering is occasional, or when users need two conditions on one column.
- `"row"` adds a filter row under the headers, with one value box, an operator button and a Clear button per column. Use it when users filter often and want to see the filters at a glance.
- `"menu, row"` shows both. They edit the same filter.

Set `[filterable]="false"` on a column to leave it out.

**Operators per column type:**

| `type`    | Operators                                                                                                                                                | Filter row starts at |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `string`  | `contains`, `doesnotcontain`, `endswith`, `startswith`, `eq`, `neq`, `isempty`, `isnotempty`, `isnull`, `isnotnull`, `isnullorempty`, `isnotnullorempty` | `contains`           |
| `number`  | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `isnull`, `isnotnull`                                                                                             | `eq`                 |
| `date`    | the number operators, labelled "Is after", "Is before" and so on                                                                                         | `eq`                 |
| `boolean` | `istrue`, `isfalse`, `isnull`, `isnotnull` (a dropdown in the filter row)                                                                                | —                    |

**How values are compared:**

- Text comparisons ignore case. `eq`, `neq`, `in` and `notin` ignore case but not accents; `contains`, `startswith` and `endswith` lowercase both sides with the active locale's rules.
- Text is trimmed before it is applied, and text that is only spaces counts as no value.
- Numbers match numeric text by value (`12.5` equals `"12.5"`).
- Dates (`Date`, luxon `DateTime`, ISO text or timestamps) are compared by day, so "Is equal to 3 May" matches any time on 3 May.
- Ordering operators (`gt`, `lt`, ...) never match an empty value.
- With server binding the grid only reports the filter; your server decides how to compare.

**Dates.** The date picker in the menu and in the filter row uses the column's `format` string. Without one, it uses the locale's date format.

**Timing.** In the filter row, typing filters after a 300 ms pause. Choosing an operator, picking a date or a Boolean value, and Clear filter at once. In the menu, <kbd>Enter</kbd> in a value or the Apply button applies the filter.

**The `filter` model.** `filter` is a two-way model of `CompositeFilterDescriptor[]`, applied before the first render.

- Conditions on one field become that column's filter, and an `and` across fields is split per column. Repeated conditions on one field are combined with `and`.
- Filters that span columns, such as an `or` of two fields, are still applied and reported, but no column shows them as filtered.
- Conditions with an unknown operator are ignored.
- A filtered column's funnel shows a dot, and its name says "filtered".

---

## 4. Grouping and Aggregates

```html
<mona-grid [data]="orders()" [monaGridGroupable]="{ showFooter: true }" [(group)]="group">
    <mona-grid-column field="shipCountry" title="Country" />
    <mona-grid-column field="freight" title="Freight" type="number" aggregate="sum" />
</mona-grid>
```

```typescript
protected readonly group = signal<GroupDescriptor[]>([{ field: "shipCountry", dir: "asc" }]);
```

- `monaGridGroupable` shows a group panel above the headers. Drag a header into it, or press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd> on a header, to group by that column. Each chip in the panel sorts its groups, moves, or is removed (<kbd>Delete</kbd> or <kbd>Backspace</kbd>).
- `group` is a two-way model. `groupChange` fires for user changes and after a state is restored, never for values set from code. A descriptor whose field has no column yet is applied once the column appears.
- `null`, `undefined` and empty text form one group. `1` and `"1"` are different groups. Dates group by their exact time, so group by a day field if you want one group per day.
- Pages count data rows, so a group can continue on the next page.

**Aggregates.** Set `aggregate` on a column (`"sum"`, `"avg"`, `"count"`, `"min"`, `"max"` or `"custom"`) to add a footer row.

- Aggregates are computed over every row of the current view: all filtered rows, on every page, not only the page shown. Each group's footer uses that group's rows in the view. With server binding, they cover the loaded page only.
- `count` counts values that aren't empty. `sum` and `avg` use numbers and numeric text; the sum of no numbers is `0`. `min` and `max` use the sort order from section 2.
- `"custom"` computes nothing: render your value with a `monaGridFooterTemplate` (and a `monaGridGroupFooterTemplate` for groups).
- Expanded groups always end with a group footer when a column has an aggregate. `showFooter: true` keeps that footer visible when a group is collapsed.

---

## 5. Paging

```html
<mona-grid [data]="orders()" [(skip)]="skip" [(pageSize)]="pageSize" [pageSizeValues]="[10, 25, 50]"></mona-grid>
```

```typescript
protected readonly skip = signal(0);
protected readonly pageSize = signal(25);
```

- Paging is always on. A page holds 10 rows unless you set `pageSize`; sizes that aren't positive whole numbers are ignored.
- `skip` (rows before the page) and `pageSize` are two-way models. `pageChange` fires when the user changes the page or page size, never for values you set.
- The pager has no page-size dropdown until you set `pageSizeValues`.
- A new page size keeps the first row of the current page in view.
- When the rows shrink below the current page (new data, a removed row, a filter), the grid moves to the last page and reports it through `pageChange`.
- Changing the page scrolls the body back to its first row.
- The pager is hidden while the grid has no rows (except with server binding) and with virtual scrolling.
- `responsivePager` (on by default) replaces the page buttons with a page dropdown when the pager is narrower than 480 pixels. See the [pager guide](pager.md).

**To page on the server**, add `monaGridServerBinding` and bind the page you loaded. See section 8.

---

## 6. Selection

```html
<mona-grid
    rowKey="orderId"
    [data]="orders()"
    [monaGridSelectable]="{ mode: 'multiple', showCheckboxes: true, selectAllScope: 'view' }"
    [selectedKeys]="selectedKeys()"
    (selectedKeysChange)="selectedKeys.set($event)">
</mona-grid>
```

```typescript
protected readonly selectedKeys = signal<unknown[]>([]);
```

- The selection is a list of keys. A row's key is its `selectBy` value (a field name or a function); without `selectBy`, its `rowKey` value; without either, the data item itself. Use `rowKey` (or `selectBy`) so the selection survives refetches and works across pages.
- `selectedKeysChange` reports user changes only.
- `mode` is `"single"` (the default) or `"multiple"`. `showCheckboxes` adds a checkbox column pinned to the start of the grid.
- `selectOnRowClick` is off by default, so clicking a link or an editable cell doesn't change the selection. Turn it on to select with a click: <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+click toggles a row, <kbd>Shift</kbd>+click selects a range.
- `selectAllScope` decides what the header checkbox and <kbd>Ctrl</kbd>+<kbd>A</kbd> select: `"page"` (the default) selects the rows on the current page, `"view"` every row that passes the filters, on all pages. With virtual scrolling there are no pages, so `"page"` acts as `"view"`. Keys outside the scope stay selected.
- With server binding, select-all only reaches the loaded rows.
- `rowAriaLabel` names each row's checkbox from its data, such as "Select order 10248". Without it, the checkbox is named by position ("Select row 3").

---

## 7. Editing

Editing is built on Angular signal forms. Each column's `type` picks its built-in editor: a text box, numeric text box, date picker or checkbox. A `monaGridEditTemplate` replaces the editor for one column.

```typescript
import { Component, inject, signal, viewChild } from "@angular/core";
import { required, type SchemaPathTree, validate } from "@angular/forms/signals";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import {
    type EditableOptions,
    GridAddCommandDirective,
    GridColumnComponent,
    GridCommandColumnComponent,
    GridComponent,
    GridEditableDirective,
    type GridEditSchemaFactory,
    type GridRemoveEvent,
    type GridSaveEvent,
    GridToolbarTemplateDirective
} from "@nanahoshi/mona-ui/grid";

type Order = { orderId: number; shipName: string; freight: number };

const orderSchema = (row: SchemaPathTree<Order>): void => {
    required(row.shipName);
    validate(row.freight, ({ value }) =>
        value() >= 0 ? undefined : { kind: "min", message: "Freight can't be negative." }
    );
};

@Component({
    selector: "app-order-editor",
    imports: [
        ButtonDirective,
        GridAddCommandDirective,
        GridColumnComponent,
        GridCommandColumnComponent,
        GridComponent,
        GridEditableDirective,
        GridToolbarTemplateDirective
    ],
    template: `
        <mona-grid
            aria-label="Orders"
            rowKey="orderId"
            [data]="orders()"
            [monaGridEditable]="editOptions"
            [newRowFactory]="newOrder"
            (save)="onSave($event)"
            (remove)="onRemove($event)">
            <ng-template monaGridToolbarTemplate>
                <button monaButton monaGridAddCommand>Add order</button>
            </ng-template>
            <mona-grid-column field="orderId" title="Order ID" type="number" />
            <mona-grid-column field="shipName" title="Ship name" />
            <mona-grid-column field="freight" title="Freight" type="number" />
            <mona-grid-command-column title="Actions" />
        </mona-grid>
    `
})
export class OrderEditorComponent {
    // OrderApi is an application service: save(row) returns the stored Order.
    readonly #api = inject(OrderApi);
    protected readonly editable = viewChild.required(GridEditableDirective);
    protected readonly editOptions: EditableOptions = {
        mode: "row",
        schema: (() => orderSchema) as GridEditSchemaFactory
    };
    protected readonly newOrder = (): Record<PropertyKey, unknown> => ({ shipName: "", freight: 0 });
    protected readonly orders = signal<Order[]>([]);

    protected onRemove(event: GridRemoveEvent): void {
        this.orders.update(rows => rows.filter(row => row.orderId !== event.key));
    }

    protected onSave(event: GridSaveEvent): void {
        // Keep the editor open while the server saves.
        event.preventDefault();
        void this.#persist(event);
    }

    async #persist(event: GridSaveEvent): Promise<void> {
        try {
            const saved = await this.#api.save(event.rowData);
            this.orders.update(rows =>
                event.operation === "create"
                    ? [saved, ...rows]
                    : rows.map(row => (row.orderId === saved.orderId ? saved : row))
            );
            this.editable().endEdit();
        } catch {
            // The editor stays open with the user's values; show the error next to the grid.
        }
    }
}
```

**Cell mode or row mode.** `mode` is `"cell"` (the default) or `"row"`.

- In cell mode the user edits one cell at a time. <kbd>Enter</kbd> or <kbd>F2</kbd> starts editing, <kbd>Enter</kbd> or leaving the editor saves the cell, <kbd>Esc</kbd> cancels, and <kbd>Tab</kbd> saves and edits the next editable cell.
- In row mode the user edits a whole row, then saves it once. <kbd>Enter</kbd> or <kbd>F2</kbd> on any cell edits the row; <kbd>Tab</kbd> moves between its editors and its Save and Cancel buttons; <kbd>Enter</kbd> saves the row after validation; <kbd>Esc</kbd> cancels. Add a `<mona-grid-command-column>` to show Edit, Remove, Save and Cancel buttons.

**Which columns are editable.** Every column except the `rowKey` column. Set `[editable]="false"` to make a column read-only, or `[editable]="true"` on the key column so the user can type a new row's key.

**The events.** All of them are cancelable with `preventDefault()`, except as noted.

| Event      | When                                                | What it carries                                                                                                                                                          |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `edit`     | before a cell or row enters edit mode               | `rowData`, `session`                                                                                                                                                     |
| `cellEdit` | cell mode, before a changed cell is saved           | `field`, `oldValue`, `newValue`; `rowData` is the row as it was                                                                                                          |
| `save`     | before a changed or new row is saved, in both modes | `rowData` (the edited values), `originalRowData`, `operation` (`"create"` or `"update"`). Prevented, the editor stays open                                               |
| `rowEdit`  | row mode, after a save went through                 | `rowData`, `originalRowData`                                                                                                                                             |
| `cancel`   | before an edit or the add row is cancelled          | `reason`: `"command"` (Cancel button), `"escape"`, `"switch"` (another edit or the add row started), `"removed"` (the row left the data or the view; can't be prevented) |
| `remove`   | when a Remove button is used                        | `key` (the `rowKey` value, or the item), `index` in `data`, `rowData`                                                                                                    |
| `add`      | before the add row opens                            | `rowData` from `newRowFactory`                                                                                                                                           |

- Neither `cellEdit` nor `save` fires when nothing changed: the editor just closes.
- **Persist from `save`.** In cell mode `cellEdit` comes first; use it to reject a single value.
- **To save on a server**, prevent `save`, send `rowData`, update `data`, then call `endEdit()` on the `GridEditableDirective` (from `viewChild`). `endEdit()` closes the editor without reporting anything. If the request fails, don't call it: the editor keeps the user's values.
- **`remove` doesn't delete anything.** Remove the row from `data` yourself. Set `removeConfirmation` on the command column to ask first: the built-in Remove button and a `monaGridRemoveCommand` button in its template both ask.
- When `data` is replaced during an edit, the edit moves to the new item with the same `rowKey` and keeps what was typed. When the row is gone, the edit ends with a `cancel` of reason `"removed"`.

**Validation.** `schema` is a function that receives a `GridEditFormContext` (`mode`, `operation`, `isNew`, `column`, ...) and returns a signal-forms schema for the row. Return a different schema for new rows, or `null` for none. The cast is needed because the schema is typed for your row while the grid's rows are `Record<PropertyKey, unknown>`.

- A row that fails validation isn't saved. The invalid editor is linked to its message with `aria-describedby`, and the failure is announced (`fieldValidationError`, `rowValidationError` messages when the schema gives no message).
- A custom `monaGridEditTemplate` gets the field's `errors`, `invalid` and `touched` in its `GridEditTemplateContext`.

**Adding rows.** `button[monaGridAddCommand]` in a `monaGridToolbarTemplate` opens the add row, filled from `newRowFactory`. The toolbar context also has `startAdd()`, `saveAdd()` and `cancelAdd()` for your own controls. The add row saves through `save` with `operation: "create"`, and the grid adds nothing: put the saved row into `data`.

**Values.** Number text is read in the locale (`1.234,5` in de-DE). A date picked in the calendar keeps the value's time of day. A row without a value for an editable column starts that editor at `null`, and the field is left out of the saved row if it stays empty.

---

## 8. Server Binding, State and Export

### Server binding

Add `monaGridServerBinding` when `data` holds only the page your server returned.

```html
<mona-grid
    aria-label="Users"
    rowKey="id"
    class="h-96"
    [data]="result().data"
    monaGridServerBinding
    [total]="result().total"
    [skip]="state().skip"
    [pageSize]="state().take"
    [loading]="loading()"
    monaGridSortable
    [(sort)]="sort"
    [monaGridFilterable]="{ enabled: true, type: 'row' }"
    [(filter)]="filter"
    (dataStateChange)="load($event)">
    <mona-grid-column field="id" title="ID" type="number" />
    <mona-grid-column field="name" title="User" />
</mona-grid>
```

```typescript
readonly #destroyRef = inject(DestroyRef);
#requestId = 0;
protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
protected readonly loading = signal(false);
protected readonly result = signal<{ data: User[]; total: number }>({ data: [], total: 0 });
protected readonly sort = signal<SortDescriptor[]>([]);
protected readonly state = signal<GridDataState>({ skip: 0, take: 10, sort: [], filter: [] });

public ngOnInit(): void {
    void this.load(this.state());
}

protected async load(state: GridDataState): Promise<void> {
    const requestId = ++this.#requestId;
    this.state.set(state);
    this.loading.set(true);
    try {
        const result = await this.#users.list(state); // your HTTP call
        if (!this.#destroyRef.destroyed && requestId === this.#requestId) {
            this.result.set(result);
        }
    } finally {
        if (!this.#destroyRef.destroyed && requestId === this.#requestId) {
            this.loading.set(false);
        }
    }
}
```

- `total` (required) is the number of matching records, `skip` the offset of the page you loaded, and the grid's `pageSize` the page size. `total` and `skip` must be non-negative whole numbers and `pageSize` a positive one; other values throw.
- `dataStateChange` emits one `GridDataState` (`skip`, `take`, `sort`, `filter`) after each user page, page-size, sort or filter change. Sort and filter changes start again at `skip: 0`. A page-size change keeps the first row of the page in view (at `skip` 40, choosing 20 per page requests `skip` 40).
- Values you bind from code don't emit, and nothing is emitted when the grid is created: load the first page yourself.
- The grid doesn't sort, filter or slice the rows you give it. The server must apply `sort` and `filter` to the whole data set, then page it.
- While `loading` is true, the body keeps its rows, shows a loading indicator and sets `aria-busy`.
- You own the requests: errors, retries and ignoring late responses (the `requestId` above).
- Grouping, aggregates, CSV export and select-all work on the loaded page only. Row moving is turned off. `monaGridServerBinding` and `monaGridVirtualScroll` can't be combined; enabling both throws.

### State persistence

`monaGridStatePersistence` keeps the column order, widths and visibility, the sort, the filter, the grouping and the page size in one `GridState` object.

```html
<mona-grid
    [data]="orders()"
    monaGridSortable
    monaGridFilterable
    [monaGridStatePersistence]="{ schemaVersion: 2 }"
    [(state)]="state">
</mona-grid>
```

```typescript
protected readonly state = signal<GridState | null>(readSavedState());

public constructor() {
    effect(() => {
        const state = this.state();
        if (state != null) {
            saveState(state); // for example, JSON in localStorage
        }
    });
}
```

- The grid applies `state` after its first render, then writes back every change. A column resize is written once, when the drag ends.
- The page size is saved unless you set `persistPageSize: false`. The page itself (`skip`) is never saved.
- Columns are matched by `stateKey`, or by `field` when there is no `stateKey`. Set `stateKey` on columns without a stable field.
- `schemaVersion` rejects states saved with another version, so a column change in your app doesn't restore a stale layout. `loadState(state)` (through `#ref="monaGridStatePersistence"`) returns a status such as `"applied"` or `"rejected-invalid"`; an invalid state changes nothing.
- With server binding, restoring a state emits one `dataStateChange` at `skip: 0`. Use it to load the restored query instead of starting your own first request.

### CSV export

```html
<button monaButton (click)="ordersExport.exportCsv('orders.csv')">Export</button>
<mona-grid [data]="orders()" monaGridExport #ordersExport="monaGridExport"></mona-grid>
```

`exportCsv(filename?)` downloads the visible columns of every row in the current view: filtered and sorted, all pages. With server binding it exports the loaded page; fetch a full export through your own API. Dates are written as `YYYY-MM-DD` in local time. Text starting with `=`, `+`, `-`, `@`, a tab or a carriage return gets a leading `'`, so spreadsheets don't run it as a formula.

---

## 9. Keyboard

The grid is one Tab stop. <kbd>Tab</kbd> moves into the grid at the cell that last had focus, and the next <kbd>Tab</kbd> leaves it. Inside, the header row, the filter row, the add row and the body rows form one set of rows.

| Key                                                              | Action                                                                                                                                                       |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <kbd>↓</kbd> / <kbd>↑</kbd>                                      | Same column in the next / previous row, across the header, the filter row, the add row and the body.                                                         |
| <kbd>←</kbd> / <kbd>→</kbd>                                      | Previous / next cell (mirrored right to left). On a group row, collapses / expands it first.                                                                 |
| <kbd>Home</kbd> / <kbd>End</kbd>                                 | First / last cell in the row.                                                                                                                                |
| <kbd>Ctrl</kbd>+<kbd>Home</kbd> / <kbd>Ctrl</kbd>+<kbd>End</kbd> | First / last cell in the grid (<kbd>Cmd</kbd> too). With virtual scrolling, scrolls to the last row first.                                                   |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd>                        | Up / down by the number of rows that fit in the body.                                                                                                        |
| <kbd>Enter</kbd>                                                 | On a header, sorts. On a group row or a detail toggle, expands or collapses. On an editable cell, starts editing. Otherwise, moves into the cell's controls. |
| <kbd>F2</kbd>                                                    | Starts editing an editable cell. On any other cell, a header or a filter-row cell included, moves into its controls.                                         |
| <kbd>Alt</kbd>+<kbd>↓</kbd>                                      | On a filterable header, opens its filter menu. On a group or detail row, expands or collapses it.                                                            |
| <kbd>Space</kbd> / <kbd>Shift</kbd>+<kbd>Space</kbd>             | With selection, toggles the row / selects from the last selected row to this one.                                                                            |
| <kbd>Shift</kbd>+<kbd>↓</kbd> / <kbd>Shift</kbd>+<kbd>↑</kbd>    | Moves to the next / previous row and extends the selection to it.                                                                                            |
| <kbd>Ctrl</kbd>+<kbd>A</kbd>                                     | With multiple selection, selects every row in the select-all scope (<kbd>Cmd</kbd> too).                                                                     |
| <kbd>Ctrl</kbd>+<kbd>C</kbd>                                     | Copies the focused body cell's text, unless text is selected or a row is being edited (<kbd>Cmd</kbd> too).                                                  |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>←</kbd> / <kbd>→</kbd>     | With `monaGridReorderable`, moves the focused header's column one place and announces its position (<kbd>Cmd</kbd> too).                                     |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd>                    | With `monaGridGroupable`, groups by the focused header's column and announces it (<kbd>Cmd</kbd> too).                                                       |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd>                         | On a chip in the group panel, removes that grouping.                                                                                                         |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>                 | Leaves the grid. While editing a cell, saves it and edits the next / previous editable cell.                                                                 |

- Inside a cell's controls, <kbd>Tab</kbd>, <kbd>Shift</kbd>+<kbd>Tab</kbd> and the arrows move between them (text fields keep their arrows). <kbd>Tab</kbd> past the last control moves to the next cell, and <kbd>Esc</kbd> returns to the cell.
- Headers list their shortcuts in `aria-keyshortcuts`.
- **Column resize handle** (`monaGridResizable`): <kbd>F2</kbd> on a header moves to it. <kbd>←</kbd> / <kbd>→</kbd> resize by 10 pixels (mirrored right to left), <kbd>Home</kbd> / <kbd>End</kbd> set the narrowest / widest width, <kbd>Enter</kbd> fits the content. <kbd>Esc</kbd> during a drag restores the width.
- **Row move handle** (`monaGridRowReorderable`): <kbd>Alt</kbd>+<kbd>↑</kbd> / <kbd>Alt</kbd>+<kbd>↓</kbd> move the row.
- **Toolbar**: one Tab stop; <kbd>←</kbd> / <kbd>→</kbd> (mirrored right to left), <kbd>Home</kbd> and <kbd>End</kbd> move between its controls, except in text fields.
- Editing keys are listed in section 7. Keys pressed while an IME is composing text are left to the IME.

---

## 10. Labelling

**Name the grid.** The grid element has no name of its own. Set `aria-label`, or `aria-labelledby` with the id of a visible heading. Both are inputs: the grid moves the name to its inner `role="grid"` element and leaves none on `<mona-grid>`.

```html
<h2 id="orders-heading">Open orders</h2>
<mona-grid aria-labelledby="orders-heading" [data]="orders()"></mona-grid>
```

**Give every column a `title`**, even when a header template draws the header. The title names:

- the column header;
- the built-in editor (the field name is used when there's no title);
- the filter menu button and dialog ("Filter by Freight"), the filter-row value box ("Filter by Freight"), its operator button ("Filter operator for Freight: Is equal to") and its Clear button ("Clear filter for Freight");
- the resize handle ("Resize Freight") and the move and group announcements.

**Name row controls after the data** when the row number isn't meaningful:

- `commandAriaLabel` in the editing options names the Edit, Remove, Save and Cancel buttons. By default they are "Edit row 3", "Save row 3" and so on.
- `rowAriaLabel` in the selection options names each row's checkbox.

```typescript
const COMMAND_NAMES: Record<GridRowCommand, string> = { cancel: "Cancel", edit: "Edit", remove: "Remove", save: "Save" };

protected readonly editOptions: EditableOptions = {
    mode: "row",
    commandAriaLabel: (command, rowData) => `${COMMAND_NAMES[command]} order ${String(rowData["orderId"])}`
};
protected readonly selectOptions: SelectableOptions = {
    mode: "multiple",
    showCheckboxes: true,
    rowAriaLabel: rowData => `Select order ${String(rowData["orderId"])}`
};
```

**Messages.** Every built-in label and announcement comes from the `grid` message namespace; the filter operators and the menu's labels come from `filter`, and the pager's from `pager`. Override them through i18n (see the i18n guide):

```typescript
provideMonaI18n({
    messages: {
        grid: { noData: "No orders yet", toolbar: "Order actions" },
        filter: { contains: "Includes" }
    }
});
```

| Key                                                  | Used for                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `noData`, `loading`                                  | the empty body; the loading indicator                          |
| `toolbar`, `columns`                                 | the toolbar's name; its column chooser button                  |
| `commandColumnTitle`                                 | the command column's header when it has no `title`             |
| `filterByColumn`, `filterByColumnFiltered`           | filter menu buttons, the filter dialog and filter-row boxes    |
| `filterOperator`, `clearFilter`, `filterPlaceholder` | the filter row's operator button, Clear button and placeholder |
| `groupOptions`, `moveAsNext`, `moveAsPrevious` | a group chip's options button and its menu |
| `editRow`, `saveRow`, `cancelRowEdit`, `removeRow`   | row command buttons                                            |
| `saveNewRow`, `cancelNewRow`                         | the add row's buttons                                          |
| `deleteRowTitle`, `deleteRowConfirmation`            | the remove confirmation (`removeConfirmation`)                 |
| `selectRow`, `selectAllRows`                         | selection checkboxes                                           |
| `expandDetail`, `collapseDetail`                     | the detail toggle                                              |
| `fieldValidationError`, `rowValidationError`         | validation messages when the schema gives none                 |
| `resizeColumn`, `sortOrder`                          | the resize handle; a header's place in a multi-column sort     |
| `columnMoved`, `columnGrouped`, `rowReorderMoved`    | announcements after keyboard moves and grouping                |
| `dragColumnHeaderToGroup`                            | the empty group panel                                          |

The full list is in `GRID_DEFAULT_MESSAGES`, exported from `@nanahoshi/mona-ui/grid`.

---

## 11. Virtual Scrolling

```html
<mona-grid
    class="h-128"
    aria-label="Log entries"
    rowKey="id"
    [data]="entries()"
    [monaGridVirtualScroll]="{ height: 40 }"
    [scrollEndThreshold]="10"
    (scrollEnd)="loadMore()">
</mona-grid>
```

`monaGridVirtualScroll` draws only the rows in view. Use it for thousands of rows on one scrolling surface. Give the grid a height, such as `class="h-128"`.

- **Every row has one fixed height**: `height` in pixels, 36 by default. It applies to data rows, group headers and group footers. Set it to the height your cell templates need; taller content is clipped. Variable row heights aren't supported.
- **No detail rows.** A `monaGridDetailTemplate` is ignored, and the grid warns in development mode.
- **No pager and no grid footer**: all rows scroll, and the column aggregates aren't shown. Group footers still are.
- **No server binding.** Combining it with `monaGridServerBinding` throws. To load more rows as the user scrolls, handle `scrollEnd` (fired `scrollEndThreshold` rows from the bottom) and append to `data`.
- Row moving is turned off, and the select-all scope `"page"` acts as `"view"`.
- Sorting, filtering, grouping, selection and editing work as usual. <kbd>Ctrl</kbd>+<kbd>End</kbd> scrolls to the last row, and focus comes back to a cell when its row scrolls back into view.

Without virtual scrolling, rows grow to fit their content (36 pixels at least), so avatars, two-line cells and custom editors need no settings.
