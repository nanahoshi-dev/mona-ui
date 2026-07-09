## Overview & Component Selection

The grid renders `data` as rows against a set of `mona-grid-column` (and optionally `mona-grid-command-column`) definitions projected as content into `<mona-grid>`. Paging is always active; every other behavior — sorting, filtering, grouping, row selection, inline editing, column resizing, column reordering, virtualization, state persistence, and CSV export — is opt-in through a companion attribute directive applied to the same `mona-grid` host element (for example `monaGridSortable`, `monaGridEditable`). `GridComponent` itself exposes no outputs; every event a consumer listens for (`columnSort`, `cellEdit`, `columnResize`, and so on) is emitted by the directive that enables the corresponding feature, not by `mona-grid` directly.

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
import { GridComponent, GridColumnComponent } from "@nanahoshi/mona-ui";
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

Without any behavior directive applied, the grid above only paginates; see [Feature Examples](#feature-examples) for sorting, filtering, grouping, selection, editing, and the other opt-in behaviors.

## Anatomy & Public Structural Templates

Each directive below is an `ng-template` (or, for `monaGridColumnTitleTemplate`, an inline template) placed as projected content inside `<mona-grid-column>`, `<mona-grid-command-column>`, or `<mona-grid>` itself.

| Directive                          | Selector                                   | Placed inside                                    | Template context                                                                                                                                                                                                                                                                                                                                                        | Replaces                                                                                   |
|------------------------------------|--------------------------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `GridCellTemplateDirective`        | `ng-template[monaGridCellTemplate]`        | `mona-grid-column` or `mona-grid-command-column` | `{ $implicit: dataItem, column: string }`                                                                                                                                                                                                                                                                                                                               | The column's default formatted cell text                                                   |
| `GridColumnTitleTemplateDirective` | `[monaGridColumnTitleTemplate]`            | `mona-grid-column`                               | None                                                                                                                                                                                                                                                                                                                                                                    | The column header's default title text (used when `monaGridHeaderTemplate` is not present) |
| `GridEditTemplateDirective`        | `ng-template[monaGridEditTemplate]`        | `mona-grid-column`                               | `GridEditTemplateContext` — see [API](#gridedittemplatecontext)                                                                                                                                                                                                                                                                                                         | The built-in editor for that column while the cell or row is being edited                  |
| `GridFooterTemplateDirective`      | `ng-template[monaGridFooterTemplate]`      | `mona-grid-column`                               | `TODO(owner-review): the context interface (aggregate value plus `column`/`columnIndex`/`rows`) is not exported — confirm before treating its shape as a stable contract.`                                                                                                                                                                                              | The column's default aggregate footer value                                                |
| `GridGroupFooterTemplateDirective` | `ng-template[monaGridGroupFooterTemplate]` | `mona-grid-column`                               | `TODO(owner-review): extends the footer template context with `count`/`depth`/`groupKey`/`groupValue`; neither context type is exported.`                                                                                                                                                                                                                               | The default per-group aggregate footer, shown when a group is collapsed                    |
| `GridHeaderTemplateDirective`      | `ng-template[monaGridHeaderTemplate]`      | `mona-grid-column`                               | `{ $implicit: column, column: Column }`                                                                                                                                                                                                                                                                                                                                 | The column header's default title text                                                     |
| `GridDetailTemplateDirective`      | `ng-template[monaGridDetailTemplate]`      | `mona-grid`                                      | `{ $implicit: dataItem }`                                                                                                                                                                                                                                                                                                                                               | No default — renders as an expandable row beneath the data row when present                |
| `GridNoDataTemplateDirective`      | `ng-template[monaGridNoDataTemplate]`      | `mona-grid`                                      | None                                                                                                                                                                                                                                                                                                                                                                    | The grid's default empty-state message                                                     |
| `GridToolbarTemplateDirective`     | `ng-template[monaGridToolbarTemplate]`     | `mona-grid`                                      | `{ $implicit: GridService, addRowData, addRowVisible, cancelAdd(): boolean, editSession, saveAdd(): boolean, startAdd(): boolean }` — `TODO(owner-review): $implicit exposes GridService, an internal service class not in the public barrel; confirm this is an intended part of the template context before relying on members beyond addRowVisible/editSession/etc.` | No default — renders above the column headers                                              |

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

## Feature Examples

### Paging

`pageSize` and `pageSizeValues` control the built-in pager. `responsivePager` collapses the pager into a dropdown when the grid narrows.

```html
<mona-grid [data]="orders()" [pageSize]="10" [pageSizeValues]="[10, 20, 30]" [responsivePager]="true"></mona-grid>
```

### Sorting

`monaGridSortable` enables column-header sorting; `sort` is a two-way bindable model of the current sort descriptors.

```typescript
protected readonly sort = signal<SortDescriptor[]>([]);
```

```html
<mona-grid [data]="orders()" monaGridSortable [(sort)]="sort">
    <mona-grid-column field="freight" title="Freight" type="number"></mona-grid-column>
</mona-grid>
```

Pass an object to `monaGridSortable` to configure sort mode, unsorting, or index display:

```html
<mona-grid [data]="orders()" [monaGridSortable]="{ mode: 'multiple', allowUnsort: true, showIndices: true }"></mona-grid>
```

### Filtering

`monaGridFilterable` renders filter UI either in the column header menu, a dedicated filter row, or both, per `type`. `filter` is a two-way bindable model of the applied `CompositeFilterDescriptor[]`.

```typescript
protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
```

```html
<mona-grid [data]="orders()" [monaGridFilterable]="{ enabled: true, type: 'menu, row' }" [(filter)]="filter">
</mona-grid>
```

### Grouping

`monaGridGroupable` lets the consumer drag a column header into the group panel rendered above the grid. `group` binds the current group descriptors; `groupChange` emits whenever they change.

```html
<mona-grid [data]="orders()" [monaGridGroupable]="{ enabled: true, showFooter: true }" [group]="group()" (groupChange)="group.set($event)">
</mona-grid>
```

### Row Selection

`monaGridSelectable` enables single or multiple row selection. `selectedKeys` binds the currently selected keys; `selectBy` chooses which field identifies a row.

```html
<mona-grid
    [data]="orders()"
    [monaGridSelectable]="{ mode: 'multiple' }"
    selectBy="orderId"
    [selectedKeys]="selectedKeys()"
    (selectedKeysChange)="selectedKeys.set($event)">
</mona-grid>
```

### Virtualization

`monaGridVirtualScroll` renders only the rows currently in view, for large data sets. `scrollEndThreshold` (rows from the bottom) controls when `scrollEnd` fires, useful for loading more data incrementally.

```html
<mona-grid
    [data]="orders()"
    [monaGridVirtualScroll]="{ height: 32 }"
    [scrollEndThreshold]="5"
    (scrollEnd)="loadMoreOrders()">
</mona-grid>
```

### Editing

`monaGridEditable` turns on inline editing, backed exclusively by Angular Signal Forms — see [Form Interaction](#form-interaction). `mode` chooses whether editing commits per cell or per row; `schema` validates the row being edited.

```html
<mona-grid
    [data]="orders()"
    [monaGridEditable]="{ mode: 'row', schema: createOrderEditSchema }"
    [newRowFactory]="createNewOrder"
    rowKey="orderId"
    (cellEdit)="onCellEdit($event)"
    (rowEdit)="onRowEdit($event)"
    (save)="onSave($event)"
    (remove)="onRemove($event)"
    (cancel)="onCancel($event)"
    (add)="onAdd($event)">
    <mona-grid-column field="freight" title="Freight" type="number" [editable]="true"></mona-grid-column>
</mona-grid>
```

Each column's `type` (`"string"`, `"number"`, `"date"`, or `"boolean"`) selects the built-in editor rendered for that cell — a text box, numeric text box, date picker, or checkbox, respectively — unless the column provides its own `monaGridEditTemplate`. Set `editable="false"` on a `mona-grid-column` to exclude it from editing.

Custom edit templates receive a `GridEditTemplateContext` bound to the row's Signal Forms field:

```html
<mona-grid-column field="shipName" title="Ship Name">
    <ng-template monaGridEditTemplate let-context>
        <mona-text-box [formField]="$any(context.field)" (keydown.escape)="context.cancel()"></mona-text-box>
    </ng-template>
</mona-grid-column>
```

### Column Resizing

`monaGridResizable` renders a drag handle between header cells; `columnResize` emits the old and new width once a resize completes.

```html
<mona-grid [data]="orders()" monaGridResizable (columnResize)="onColumnResize($event)"></mona-grid>
```

### Column Reordering

`monaGridReorderable` lets the consumer drag column headers into a new order. `columnReorder` is cancelable — call `preventDefault()` to keep a column from moving.

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

### Master-Detail Rows

`monaGridDetailTemplate` renders projected content for each row that the consumer can expand.

```html
<mona-grid [data]="orders()">
    <ng-template monaGridDetailTemplate let-dataItem>
        <pre>{{ dataItem | json }}</pre>
    </ng-template>
</mona-grid>
```

### State Persistence

`monaGridStatePersistence` captures and restores column order/width/visibility, sort, filter, and group state through the two-way bindable `state` model.

```typescript
protected readonly state = signal<GridState | null>(null);
```

```html
<mona-grid [data]="orders()" [monaGridStatePersistence]="{ persistPageSize: true }" [(state)]="state"></mona-grid>
```

Persist `state()` to storage (for example in an `effect`) to restore it on the next visit.

### CSV Export

`monaGridExport` exposes `exportCsv(filename?)` through a template reference variable.

```html
<button (click)="gridExport.exportCsv('orders.csv')">Export as CSV</button>
<mona-grid [data]="orders()" monaGridExport #gridExport="monaGridExport"></mona-grid>
```

### Aggregates and Footer

Set `aggregate` on a `mona-grid-column` (`"sum"`, `"avg"`, `"count"`, `"min"`, `"max"`, or `"custom"`) to show a computed value in the grid footer. Enable `monaGridGroupable`'s `showFooter` option to show the same aggregate per group. `"custom"` requires a `monaGridFooterTemplate` (and, for grouped data, a `monaGridGroupFooterTemplate`) to render the value, since the grid does not compute a value for it.

```html
<mona-grid-column field="freight" title="Freight" type="number" aggregate="avg"></mona-grid-column>
```

## Technical & Behavior Notes

### `GridComponent` has no outputs of its own

All grid events (`columnSort`, `columnResize`, `columnReorder`, `groupChange`, `selectedKeysChange`, `cellEdit`, `rowEdit`, `save`, `remove`, `cancel`, `add`, `edit`, `scrollEnd`) are emitted by the companion directive that enables the corresponding feature, not by `mona-grid` directly.

### Cancelable events

`columnSort`, `columnReorder`, `cellEdit`, `rowEdit`, `save`, `remove`, `cancel`, `add`, and `edit` are all event objects exposing `preventDefault()`/`isDefaultPrevented()`. Calling `preventDefault()` stops the corresponding state change — for example, `columnReorder.preventDefault()` keeps the dragged column in its original position. `columnResize` is a plain object with no `preventDefault()`.

### `resizeMethod` controls initial column widths

`"fitView"` (default) distributes available width across columns with no explicit `width`. `"auto"` sizes each column to fit its rendered content. A literal number applies that width to every column without an explicit `width`.

### No CSS custom properties

Grid styling is implemented with Tailwind utility classes internally; there are no public CSS custom properties to override. The only public styling hooks are the `class` input (merged with `tailwind-merge`) and the `rounded` input.

### `GridColumnChooserComponent` is not in the public barrel

The grid renders a built-in "Columns" toolbar button backed by an internal `GridColumnChooserComponent`, but that component is not exported from `@nanahoshi/mona-ui`. `TODO(owner-review): confirm whether column-visibility toggling through this button is an intended public feature before documenting it further, or whether the component should be added to the public barrel.`

## Accessibility & Forms Integration

### Keyboard

| Key                        | Action                                                                                                                                                                                      |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ArrowDown` / `ArrowUp`    | Move focus to the same column in the next/previous row.                                                                                                                                     |
| `Alt+ArrowDown`            | Toggle expand/collapse of a group row or master-detail row, instead of moving focus.                                                                                                        |
| `ArrowLeft` / `ArrowRight` | Move focus to the previous/next cell in the row.                                                                                                                                            |
| `Home` / `End`             | Move focus to the first/last cell in the current row.                                                                                                                                       |
| `Ctrl+Home` / `Ctrl+End`   | Move focus to the first/last cell in the grid.                                                                                                                                              |
| `Enter`                    | On a group header or header cell, toggles expand/collapse. On a command cell, focuses its first inner button. Otherwise starts cell editing (no-op while the grid is in row-edit mode).     |
| `F2`                       | Same as `Enter`, except it never toggles a group/header row.                                                                                                                                |
| `Tab` / `Shift+Tab`        | Outside a command cell, moves focus to the next/previous focusable element outside the grid (toolbar, pager, or beyond). Inside a command cell, cycles focus among that cell's own buttons. |
| `Escape`                   | While focus is inside a command cell's inner button, returns focus to the cell.                                                                                                             |
| `Ctrl+C` / `Cmd+C`         | Copies the focused cell's text to the clipboard (data rows only, and not while the grid is in edit mode).                                                                                   |

Toolbar controls (for example a custom `monaGridToolbarTemplate` button) support `ArrowLeft`/`ArrowRight` roving-tabindex navigation among the toolbar's own focusable elements.

### Focus

Grid cells use a roving `tabindex`: the currently focused cell has `tabindex="0"`, every other cell has `tabindex="-1"`. Editors inside an actively-edited cell are excluded from the natural tab order until the consumer moves focus with the keys above.

### ARIA

| Attribute          | When present                                               | Value                                                              |
|--------------------|------------------------------------------------------------|--------------------------------------------------------------------|
| `role`             | On the host element                                        | `"grid"`                                                           |
| `role`             | On the header/body/footer row groups                       | `"rowgroup"`                                                       |
| `role`             | On header cells                                            | `"columnheader"`                                                   |
| `role`             | On data/group/footer rows                                  | `"row"`                                                            |
| `role`             | On data cells                                              | `"gridcell"`                                                       |
| `role`             | On the column resize handle                                | `"separator"`                                                      |
| `aria-sort`        | On a header cell, only while `monaGridSortable` is enabled | `"ascending"`, `"descending"`, or `"none"`                         |
| `aria-selected`    | On a row, only while `monaGridSelectable` is enabled       | Reflects whether the row is selected                               |
| `aria-rowindex`    | On every row                                               | 1-based row position, accounting for the header row                |
| `aria-colindex`    | On every cell                                              | 1-based column position, accounting for group indent columns       |
| `aria-expanded`    | On a group header row                                      | Reflects whether the group is expanded                             |
| `aria-level`       | On a group header row                                      | The group's nesting depth                                          |
| `aria-readonly`    | On a data cell                                             | `"true"` when editing is disabled for that cell or column          |
| `aria-orientation` | On the column resize handle                                | `"vertical"`                                                       |
| `aria-label`       | On the column resize handle                                | `"Resize column"`                                                  |
| `aria-label`       | On the built-in command buttons                            | `"Save row"`, `"Cancel row edit"`, `"Edit row"`, or `"Remove row"` |

`TODO(owner-review): no aria-live region or aria-multiselectable attribute was found for grouped or multi-select grids — confirm whether announcing selection/grouping changes to assistive technology is expected before relying on it.`

### Form Interaction

Inline editing is built exclusively on Angular Signal Forms: the built-in editors and the `GridEditTemplateContext` passed to `monaGridEditTemplate` both operate on a `FieldTree` from `@angular/forms/signals`. No grid component implements `ControlValueAccessor`, `FormValueControl`, or `FormCheckboxControl` — there is no `[(ngModel)]`, `[formControl]`, or `formControlName` integration at the cell-editor level. Provide a `schema` function on `monaGridEditable`'s options to validate the row being edited; validation errors surface through `GridEditTemplateContext.errors`/`invalid`/`touched` in custom edit templates.

## API

### `GridComponent<T>`

**Selector:** `mona-grid`

#### Inputs

| Name              | Type                                       | Default     | Description                                                                                                                                       |
|-------------------|--------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `class`           | `string`                                   | `""`        | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                         |
| `data`            | `Iterable<T>`                              | `[]`        | The row data to be displayed in the grid.                                                                                                         |
| `pageSize`        | `number`                                   | `undefined` | The number of items to be displayed on a page.                                                                                                    |
| `pageSizeValues`  | `number[]`                                 | `[]`        | The page sizes that the user can select from, shown in the page size dropdown.                                                                    |
| `resizeMethod`    | `ResizeMethod`                             | `"fitView"` | The method used to set initial column widths — see [`resizeMethod` controls initial column widths](#resizemethod-controls-initial-column-widths). |
| `responsivePager` | `boolean`                                  | `true`      | Whether the pager collapses into a dropdown when the grid narrows.                                                                                |
| `rounded`         | `"none" \| "small" \| "medium" \| "large"` | `"medium"`  | The border radius of the grid.                                                                                                                    |

No outputs — see [`GridComponent` has no outputs of its own](#gridcomponent-has-no-outputs-of-its-own).

---

### `GridColumnComponent`

**Selector:** `mona-grid-column`

#### Inputs

| Name             | Type                        | Default     | Description                                                                                                                            |
|------------------|-----------------------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `aggregate`      | `AggregateFunction \| null` | `null`      | The aggregate shown in the grid footer for this column.                                                                                |
| `editable`       | `boolean`                   | `true`      | Whether this column is editable when the grid is in edit mode.                                                                         |
| `field`          | `string`                    | `""`        | The field name of the data property to display in this column.                                                                         |
| `format`         | `ColumnFormat \| null`      | `undefined` | Formats the displayed cell value. String formats apply to date, datetime, and time columns; formatter functions replace the cell text. |
| `hidden`         | `boolean`                   | `false`     | Whether this column is hidden from the rendered grid.                                                                                  |
| `locked`         | `boolean`                   | `false`     | Whether this column remains fixed while the grid scrolls horizontally.                                                                 |
| `lockedPosition` | `GridColumnLockedPosition`  | `"left"`    | The side of the grid where this locked column is fixed.                                                                                |
| `maxWidth`       | `number \| null`            | `null`      | The maximum width of this column in pixels.                                                                                            |
| `minWidth`       | `number`                    | `40`        | The minimum width of this column in pixels.                                                                                            |
| `stateKey`       | `string \| null`            | `null`      | A stable key used to persist state for columns whose field is empty or unstable.                                                       |
| `title`          | `string`                    | `""`        | The title displayed in the column header.                                                                                              |
| `type`           | `DataType`                  | `"string"`  | The data type of the column. Determines the default edit component and filter behavior.                                                |
| `width`          | `number \| null`            | `undefined` | The fixed width of this column in pixels. If not set, the width is calculated automatically.                                           |

No outputs.

---

### `GridCommandColumnComponent`

**Selector:** `mona-grid-command-column`

#### Inputs

| Name                 | Type                       | Default      | Description                                                                         |
|----------------------|----------------------------|--------------|-------------------------------------------------------------------------------------|
| `hidden`             | `boolean`                  | `false`      | Whether this command column is hidden from the rendered grid.                       |
| `locked`             | `boolean`                  | `false`      | Whether this command column remains fixed while the grid scrolls horizontally.      |
| `lockedPosition`     | `GridColumnLockedPosition` | `"left"`     | The side of the grid where this locked command column is fixed.                     |
| `maxWidth`           | `number \| null`           | `null`       | The maximum width of this command column in pixels.                                 |
| `minWidth`           | `number \| null`           | `null`       | The minimum width of this command column in pixels.                                 |
| `removeConfirmation` | `boolean`                  | `false`      | Whether the built-in remove command asks for confirmation before emitting `remove`. |
| `stateKey`           | `string \| null`           | `"commands"` | A stable key used to persist state for this command column.                         |
| `title`              | `string`                   | `"Commands"` | The title displayed in the command column header.                                   |
| `width`              | `number \| null`           | `160`        | The fixed width of this command column in pixels.                                   |

No outputs. Accepts a `monaGridCellTemplate` content child to customize the rendered command buttons.

---

### `GridSortableDirective`

**Selector:** `mona-grid[monaGridSortable]`

#### Inputs

| Name               | Type                    | Default | Description                                                                                                                                                   |
|--------------------|-------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaGridSortable` | `SortableOptions \| ""` | `""`    | Enables column sorting. An empty string enables sorting with default settings; pass an object to configure sort mode, unsort behavior, or sort-index display. |
| `sort`             | `SortDescriptor[]`      | `[]`    | Two-way bindable. Current sort descriptors applied to the grid.                                                                                               |

#### Outputs

| Name         | Type              | Description                                                                         |
|--------------|-------------------|-------------------------------------------------------------------------------------|
| `columnSort` | `ColumnSortEvent` | Emitted when a column header is activated to change its sort direction. Cancelable. |

---

### `GridFilterableDirective`

**Selector:** `mona-grid[monaGridFilterable]`

#### Inputs

| Name                 | Type                          | Default | Description                                                                                                                                                                      |
|----------------------|-------------------------------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `filter`             | `CompositeFilterDescriptor[]` | `[]`    | Two-way bindable. Current filter descriptors applied to the grid.                                                                                                                |
| `monaGridFilterable` | `FilterableOptions \| ""`     | `""`    | Enables column filtering. An empty string enables filtering with default settings; pass an object to configure whether filters render in the header menu, a filter row, or both. |

No outputs.

---

### `GridGroupableDirective`

**Selector:** `mona-grid[monaGridGroupable]`

#### Inputs

| Name                | Type                                  | Default     | Description                                                                                                                        |
|---------------------|---------------------------------------|-------------|------------------------------------------------------------------------------------------------------------------------------------|
| `group`             | `GroupDescriptor[]`                   | `[]`        | Current group descriptors applied to the grid.                                                                                     |
| `monaGridGroupable` | `GroupableOptions \| "" \| undefined` | `undefined` | Enables column grouping. An empty string enables grouping with default settings; pass an object to configure group footer display. |

#### Outputs

| Name          | Type                | Description                                                                                                                 |
|---------------|---------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `groupChange` | `GroupDescriptor[]` | Emitted when the applied group descriptors change, from dragging a column into the group panel or from a group sort change. |

---

### `GridSelectableDirective`

**Selector:** `mona-grid[monaGridSelectable]`

#### Inputs

| Name                 | Type                          | Default | Description                                                                                                                                    |
|----------------------|-------------------------------|---------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaGridSelectable` | `GridSelectableOptions \| ""` | `""`    | Enables row selection. An empty string enables selection with default settings; pass an object to configure single or multiple selection mode. |
| `selectBy`           | `string`                      | `""`    | Field name or selector used to derive a row's selection key.                                                                                   |
| `selectedKeys`       | `Iterable<unknown>`           | `[]`    | Currently selected row keys.                                                                                                                   |

#### Outputs

| Name                 | Type        | Description                                        |
|----------------------|-------------|----------------------------------------------------|
| `selectedKeysChange` | `unknown[]` | Emitted when the set of selected row keys changes. |

---

### `GridEditableDirective`

**Selector:** `mona-grid[monaGridEditable]`

#### Inputs

| Name               | Type                                 | Default      | Description                                                                                                                                                                     |
|--------------------|--------------------------------------|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaGridEditable` | `EditableOptions \| ""`              | `""`         | Enables inline editing. An empty string enables cell-mode editing with default settings; pass an object to choose `"cell"` or `"row"` mode and an optional validation `schema`. |
| `newRowFactory`    | `() => Record<PropertyKey, unknown>` | `() => ({})` | Creates the initial data object used by the add-row editor.                                                                                                                     |
| `rowKey`           | `GridKeySelector<unknown> \| null`   | `null`       | Field name or selector used to keep edited row identity stable when data is rebound.                                                                                            |

#### Outputs

| Name       | Type              | Description                                                       |
|------------|-------------------|-------------------------------------------------------------------|
| `add`      | `GridAddEvent`    | Emitted before the grid displays the new-row editor. Cancelable.  |
| `cancel`   | `GridCancelEvent` | Emitted before an edit operation is canceled. Cancelable.         |
| `cellEdit` | `CellEditEvent`   | Emitted when a cell is edited. Cancelable.                        |
| `edit`     | `GridEditEvent`   | Emitted before a row enters edit mode. Cancelable.                |
| `remove`   | `GridRemoveEvent` | Emitted when a row remove command is triggered. Cancelable.       |
| `rowEdit`  | `RowEditEvent`    | Emitted when a row edit is committed (row mode only). Cancelable. |
| `save`     | `GridSaveEvent`   | Emitted before an edited or new row is saved. Cancelable.         |

---

### `GridResizableDirective`

**Selector:** `mona-grid[monaGridResizable]`

#### Inputs

| Name                | Type                     | Default | Description                                                                                                                 |
|---------------------|--------------------------|---------|-----------------------------------------------------------------------------------------------------------------------------|
| `monaGridResizable` | `ResizableOptions \| ""` | `""`    | Enables column resizing. An empty string enables resizing with default settings; pass an object to configure it explicitly. |

#### Outputs

| Name           | Type                | Description                                                                                         |
|----------------|---------------------|-----------------------------------------------------------------------------------------------------|
| `columnResize` | `ColumnResizeEvent` | Emitted when a column resize completes, with the column and its old and new widths. Not cancelable. |

---

### `GridReorderableDirective`

**Selector:** `mona-grid[monaGridReorderable]`

#### Inputs

| Name                  | Type                       | Default | Description                                                                                                                                       |
|-----------------------|----------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaGridReorderable` | `ReorderableOptions \| ""` | `""`    | Enables column reordering via drag and drop. An empty string enables reordering with default settings; pass an object to configure it explicitly. |

#### Outputs

| Name            | Type                 | Description                                                       |
|-----------------|----------------------|-------------------------------------------------------------------|
| `columnReorder` | `ColumnReorderEvent` | Emitted when a column is dropped into a new position. Cancelable. |

---

### `GridVirtualScrollDirective`

**Selector:** `mona-grid[monaGridVirtualScroll]`

#### Inputs

| Name                    | Type                                               | Default     | Description                                                                                                                                 |
|-------------------------|----------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `monaGridVirtualScroll` | `Partial<VirtualScrollOptions> \| "" \| undefined` | `undefined` | Enables row virtualization. An empty string enables virtualization with default settings; pass an object to configure the fixed row height. |
| `scrollEndThreshold`    | `number`                                           | `5`         | Distance, in rows, from the bottom of the virtualized list at which `scrollEnd` is emitted.                                                 |

#### Outputs

| Name        | Type   | Description                                                                                                |
|-------------|--------|------------------------------------------------------------------------------------------------------------|
| `scrollEnd` | `void` | Emitted when the scroll position reaches the configured threshold from the bottom of the virtualized list. |

---

### `GridStatePersistenceDirective`

**Selector:** `mona-grid[monaGridStatePersistence]`

**exportAs:** `monaGridStatePersistence`

#### Inputs

| Name                       | Type                                | Default | Description                                                                                 |
|----------------------------|-------------------------------------|---------|---------------------------------------------------------------------------------------------|
| `monaGridStatePersistence` | `GridStatePersistenceOptions \| ""` | `""`    | State persistence options such as schema version and page size persistence.                 |
| `state`                    | `GridState \| null`                 | `null`  | Two-way bindable. The persisted grid state to apply and update when the grid state changes. |

No outputs.

#### Methods

| Name                         | Returns               | Description                                                                                                 |
|------------------------------|-----------------------|-------------------------------------------------------------------------------------------------------------|
| `captureState()`             | `GridState`           | Captures the grid's current state (columns, sort, filter, group) without waiting for the next change cycle. |
| `loadState(state, options?)` | `GridStateLoadResult` | Applies a previously captured state to the grid.                                                            |

---

### `GridExportDirective`

**Selector:** `mona-grid[monaGridExport]`

**exportAs:** `monaGridExport`

No inputs, no outputs.

#### Methods

| Name                   | Returns | Description                                    |
|------------------------|---------|------------------------------------------------|
| `exportCsv(filename?)` | `void`  | Exports the grid's current data as a CSV file. |

---

### Exported Types

#### `Column` / `ColumnConfig`

| Field                                        | Type                        | Description                                                                                         |
|----------------------------------------------|-----------------------------|-----------------------------------------------------------------------------------------------------|
| `aggregate`                                  | `AggregateFunction \| null` | The aggregate function applied to this column's footer value.                                       |
| `dataType`                                   | `DataType`                  | The column's declared data type.                                                                    |
| `editable`                                   | `boolean`                   | Whether the column can be edited.                                                                   |
| `field`                                      | `string`                    | The bound data field name.                                                                          |
| `format`                                     | `ColumnFormat \| null`      | The format string or formatter function applied to cell values.                                     |
| `hidden`                                     | `boolean`                   | Whether the column is hidden.                                                                       |
| `id`                                         | `string`                    | The column's stable internal identifier.                                                            |
| `kind`                                       | `"command" \| "data"`       | Whether the column renders data or built-in row commands.                                           |
| `locked`                                     | `boolean`                   | Whether the column is fixed while scrolling.                                                        |
| `lockedPosition`                             | `GridColumnLockedPosition`  | The side the column is fixed to, when locked.                                                       |
| `maxWidth` / `minWidth` / `width`            | `number \| null`            | Column width constraints, in pixels.                                                                |
| `removeConfirmation`                         | `boolean`                   | Whether removing a row through this command column asks for confirmation.                           |
| `stateKey`                                   | `string \| null`            | The key used to persist this column's state.                                                        |
| `title`                                      | `string`                    | The column header title.                                                                            |
| `calculatedWidth`                            | `number \| null`            | The column's currently rendered width.                                                              |
| `columnSortDirection` / `groupSortDirection` | `SortDirection \| null`     | The column's current sort direction, for regular sorting and group sorting respectively.            |
| `filtered`                                   | `boolean`                   | Whether a filter is currently applied to this column.                                               |
| `index` / `sortIndex`                        | `number \| number \| null`  | The column's display position, and its position among active sorts (when `showIndices` is enabled). |

#### `EditableOptions`

| Field     | Type                                 | Description                                                       |
|-----------|--------------------------------------|-------------------------------------------------------------------|
| `enabled` | `boolean \| undefined`               | Whether editing is active.                                        |
| `mode`    | `"cell" \| "row"`                    | Whether editing commits per cell or per row.                      |
| `schema`  | `GridEditSchemaFactory \| undefined` | Builds a Signal Forms validation schema for the row being edited. |

#### `SortableOptions`

| Field         | Type                                  | Description                                               |
|---------------|---------------------------------------|-----------------------------------------------------------|
| `allowUnsort` | `boolean \| undefined`                | Whether a third click on a sorted column clears its sort. |
| `enabled`     | `boolean \| undefined`                | Whether sorting is active.                                |
| `mode`        | `"single" \| "multiple" \| undefined` | Whether one or several columns can be sorted at once.     |
| `showIndices` | `boolean \| undefined`                | Whether sort order indices are displayed on header cells. |

#### `FilterableOptions` (exported as `GridFilterableOptions`)

| Field     | Type                             | Description                                                              |
|-----------|----------------------------------|--------------------------------------------------------------------------|
| `enabled` | `boolean`                        | Whether filtering is active.                                             |
| `type`    | `"menu" \| "row" \| "menu, row"` | Where filter UI renders — the column header menu, a filter row, or both. |

#### `GroupableOptions` (exported as `GridGroupableOptions`)

| Field        | Type      | Description                                          |
|--------------|-----------|------------------------------------------------------|
| `enabled`    | `boolean` | Whether grouping is active.                          |
| `showFooter` | `boolean` | Whether an aggregate footer is shown for each group. |

#### `GridSelectableOptions`

| Field     | Type                                  | Description                                          |
|-----------|---------------------------------------|------------------------------------------------------|
| `enabled` | `boolean \| undefined`                | Whether row selection is active.                     |
| `mode`    | `"single" \| "multiple" \| undefined` | Whether one or several rows can be selected at once. |

#### `ReorderableOptions`

| Field     | Type      | Description                          |
|-----------|-----------|--------------------------------------|
| `enabled` | `boolean` | Whether column reordering is active. |

#### `ResizableOptions`

| Field     | Type      | Description                        |
|-----------|-----------|------------------------------------|
| `enabled` | `boolean` | Whether column resizing is active. |

#### `GridState`

| Field           | Type                                            | Description                                                        |
|-----------------|-------------------------------------------------|--------------------------------------------------------------------|
| `columns`       | `readonly GridColumnState[]`                    | Persisted per-column hidden/order/width state.                     |
| `filter`        | `readonly GridStateCompositeFilterDescriptor[]` | Persisted filter descriptors.                                      |
| `group`         | `readonly GroupDescriptor[]`                    | Persisted group descriptors.                                       |
| `pageSize`      | `number \| undefined`                           | Persisted page size, when `persistPageSize` is enabled.            |
| `schemaVersion` | `number \| string \| undefined`                 | Consumer-defined version tag used to reject stale persisted state. |
| `sort`          | `readonly GridStateSortDescriptor[]`            | Persisted sort descriptors.                                        |
| `version`       | `1`                                             | The state schema version produced by this version of the library.  |

#### `GridEditSession`

| Field             | Type                                           | Description                                               |
|-------------------|------------------------------------------------|-----------------------------------------------------------|
| `column`          | `Column \| null`                               | The column currently being edited, in cell mode.          |
| `field`           | `string \| null`                               | The field name currently being edited, in cell mode.      |
| `form`            | `FieldTree<Record<PropertyKey, unknown>>`      | The Signal Forms field tree backing the row being edited. |
| `isNew`           | `boolean`                                      | Whether this session represents a new row being added.    |
| `mode`            | `"cell" \| "row"`                              | The active editing mode.                                  |
| `model`           | `WritableSignal<Record<PropertyKey, unknown>>` | The signal holding the row's current edited values.       |
| `operation`       | `GridEditOperation`                            | `"create"` or `"update"`.                                 |
| `originalRowData` | `Record<PropertyKey, unknown> \| null`         | The row's data before editing began.                      |
| `row`             | `Row \| null`                                  | The internal row wrapper being edited.                    |
| `rowUid`          | `string \| null`                               | The stable identifier of the row being edited.            |

#### `GridEditTemplateContext`

| Field       | Type                                       | Description                                    |
|-------------|--------------------------------------------|------------------------------------------------|
| `cancel`    | `() => void`                               | Cancels the current edit.                      |
| `column`    | `string`                                   | The field name of the column being edited.     |
| `commit`    | `() => void`                               | Commits the current edit.                      |
| `dataField` | `string`                                   | Same as `column`; the field name being edited. |
| `dataItem`  | `Record<PropertyKey, unknown>`             | The row's current edited values.               |
| `errors`    | `readonly ValidationError.WithFieldTree[]` | Validation errors for this field.              |
| `field`     | `FieldTree<unknown>`                       | The Signal Forms field for this column.        |
| `form`      | `GridEditSession["form"]`                  | The row's full Signal Forms field tree.        |
| `invalid`   | `boolean`                                  | Whether this field currently fails validation. |
| `isNew`     | `boolean`                                  | Whether this is a new row being added.         |
| `session`   | `GridEditSession`                          | The full edit session for this row.            |
| `setValue`  | `(value: unknown) => void`                 | Sets this field's value.                       |
| `touched`   | `boolean`                                  | Whether this field has been touched.           |
| `value`     | `unknown`                                  | This field's current value.                    |

#### Event classes

`ColumnSortEvent`, `ColumnReorderEvent`, `CellEditEvent`, `RowEditEvent`, `GridAddEvent`, `GridRemoveEvent`, `GridSaveEvent`, `GridCancelEvent`, and `GridEditEvent` all extend `PreventableEvent` (`preventDefault()`/`isDefaultPrevented()`) and expose a `.column`, `.rowData`, and/or `.session` getter matching the corresponding output above. `ColumnResizeEvent` is a plain `{ column, newWidth, oldWidth }` object, not a class.

#### `ResizeMethod`

`"auto" | "fitView" | number` — see [`resizeMethod` controls initial column widths](#resizemethod-controls-initial-column-widths).

#### `GridColumnLockedPosition`

`"left" | "right"`.

`TODO(owner-review): GridFooterTemplateContext and GridGroupFooterTemplateContext (the template context types for monaGridFooterTemplate and monaGridGroupFooterTemplate) are not exported from @nanahoshi/mona-ui — confirm whether they should be added to the public barrel.`

---

<!-- verification-checklist
- [x] GridComponent inputs verified against grid.component.ts source (data, pageSize, pageSizeValues, resizeMethod, responsivePager, rounded, class/userClass); confirmed the component defines no outputs (all "grid events" live on companion directives)
- [x] GridColumnComponent (12 inputs) and GridCommandColumnComponent (9 inputs) verified against grid-column.component.ts and grid-command-column.component.ts source; both have empty templates and provide GRID_COLUMN_DEFINITION
- [x] Ten behavior directives (Sortable, Filterable, Groupable, Selectable, Editable, Resizable, Reorderable, VirtualScroll, StatePersistence, Export) verified against their individual .directive.ts source files; missing @description JSDoc added to GridSelectableDirective, GridGroupableDirective, GridFilterableDirective, GridVirtualScrollDirective as part of this pass
- [x] Nine structural template directive selectors verified against grid/directives/grid-*template*.directive.ts; template contexts verified against grid.component.html, grid-cell.component.html, grid-list.component.html ngTemplateOutletContext bindings; GridFooterTemplateContext/GridGroupFooterTemplateContext confirmed unexported (declared privately in grid-footer-cell.component.ts) and flagged as TODO(owner-review)
- [x] Keyboard map verified against grid-logical-cell.directive.ts (onHostKeydown/onEnterKey/onF2Key/#handleCommandInnerKeydown), grid-navigation.service.ts (navigate()), grid.component.ts (onToolbarKeydown), and tests/grid-keyboard-navigation.spec.ts
- [x] ARIA attributes verified against grid.component.html (grid/rowgroup/columnheader/row/aria-sort/aria-expanded/aria-level), grid-row.directive.ts (aria-selected/aria-rowindex), grid-logical-cell.directive.ts (aria-colindex), grid-cell.component.html (gridcell/aria-readonly), grid-column-resize-handler.directive.ts (separator/aria-label/aria-orientation), grid-command-cell.component.html (static aria-labels)
- [x] Form integration verified: grid-editor.component.ts and GridEditTemplateContext use @angular/forms/signals FieldTree exclusively; no ControlValueAccessor/FormValueControl/FormCheckboxControl implementation found anywhere in projects/mona-ui/src/lib/grid
- [x] Exported types cross-checked against lib/index.ts's "/** Grid */" section (lines ~147-200); GridService, GridNavigationService, GridRowFlattenerService, GridExportService, Row, GridColumnChooserComponent, GridFilterMenuComponent, GridEditorComponent, and the cell/row structural directives (GridRowDirective, GridCellDirective, GridLockedCellDirective, GridLogicalCellDirective, etc.) confirmed NOT exported and omitted from API tables
- [x] component-metadata.json's GridComponent entry confirmed stale (missing an outputs key, missing several documented inputs) — not used as the source of truth for this page; npm run build:metadata should be re-run and the entry spot-checked against this page after the JSDoc changes in this pass
- [x] GridColumnChooserComponent (built-in "Columns" toolbar button) confirmed present in grid.component.html template but not in the public barrel — flagged as TODO(owner-review) instead of documented as a public feature
-->
