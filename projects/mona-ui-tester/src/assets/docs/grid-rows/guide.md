## Overview

| What | How | State and events |
| :--- | :--- | :--- |
| Detail rows | `monaGridDetailTemplate` inside `mona-grid` | `[(expandedKeys)]` on the grid |
| Row reordering | `monaGridRowReorderable` | `rowReorder` with the reordered data |
| Row classes | `rowClass` on the grid | — |
| Row height | Cell templates and editors | — |

Detail rows and row reordering both identify rows by the grid's `rowKey`, so set it.

**Use something else when:**

- The detail is a hierarchy of rows like its parent's. Group the rows instead, see [Grouping & Aggregates](/components/grid-grouping).
- The order is a value people choose, such as a priority. Make it a column and sort by it, see [Sorting & Filtering](/components/grid-sorting-filtering).

## Import & Quick Start

```typescript
import {
    GridColumnComponent,
    GridComponent,
    GridDetailTemplateDirective,
    GridRowReorderableDirective,
    type RowReorderEvent
} from "@nanahoshi/mona-ui/grid";
```

```html
<mona-grid aria-label="Products" rowKey="id" [data]="products()" monaGridRowReorderable (rowReorder)="onRowReorder($event)">
    <mona-grid-column field="name" title="Name"></mona-grid-column>
    <ng-template monaGridDetailTemplate let-product>
        <p class="p-3">{{ product.description }}</p>
    </ng-template>
</mona-grid>
```

```typescript
protected onRowReorder(event: RowReorderEvent<Product>): void {
    this.products.set([...event.reorderedData]);
}
```

## Examples

### Detail Rows and Row Reordering

```example
grid-rows/master-detail
```

Task 2 starts expanded, because its key is in `expandedKeys`. Drag a row's handle, or press `Alt+ArrowDown` on it, to move it; the example keeps the new order by setting its data to `reorderedData`.

### Restricting Which Rows Move

An options object can keep some rows in place and name the handles after their row:

```html
<mona-grid
    [data]="products()"
    rowKey="id"
    [monaGridRowReorderable]="{ enabled: true, canReorder: canReorderProduct, rowAriaLabel: productLabel }"
    (rowReorder)="onRowReorder($event)">
</mona-grid>
```

```typescript
protected readonly canReorderProduct = (row: Record<PropertyKey, unknown>): boolean => row["status"] !== "archived";
protected readonly productLabel = (row: Record<PropertyKey, unknown>): string => `Move ${String(row["name"])}`;
```

A row that can't move shows a disabled handle.

### Row Classes

`rowClass` returns classes for each data row from its item, such as a muted row for a cancelled order:

```html
<mona-grid [data]="orders()" [rowClass]="orderRowClass"></mona-grid>
```

```typescript
protected readonly orderRowClass = (order: Order): string | null => (order.cancelled ? "opacity-60" : null);
```

It can return a string, an array of strings, or `null` for none. Use it for emphasis, not to carry information: the row's text must say the same thing.

### Rows That Fit Their Content

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

Import `GridCellTemplateDirective` from `@nanahoshi/mona-ui/grid` and `AvatarComponent` from `@nanahoshi/mona-ui/avatar` alongside the Grid and column components. Virtual rows are different: they all have one height, see [Server Binding & Virtualization](/components/grid-server).

## Behavior

### Detail rows

The detail toggle sits in its own column at the start of the grid. `expandedKeys` holds the `rowKey` values of the expanded rows, or the data items when the grid has no `rowKey`; `expandedKeysChange` reports the rows people open and close. Detail rows aren't supported with `monaGridVirtualScroll`, whose rows share one height: the grid ignores the template there and warns in development mode. While detail rows exist, `aria-rowcount` is `-1`, since the grid can't know how many rows the details add.

### Row reordering

The handle sits in a column of its own, the first in the grid, and rows move only by that handle. The consumer owns the order: `rowReorder` carries the complete reordered data, and the grid never changes `data`. Row order is application data and isn't stored in `GridState`.

Row reordering works with paging (moving rows within the current page), detail rows, selection, locked columns, footers, and the add row. It's disabled while sorting, filtering, grouping, server binding, virtual scrolling, or an edit is active, because those change which row sits where; the handle then says why (the `rowReorderDisabled…` messages).

## Accessibility

A row's handle is a button named after the row (`reorderRow`, or `rowAriaLabel`), with the keyboard hint and, when it's disabled, the reason. A keyboard move is announced through a polite live region (`rowReorderMoved`). The detail toggle is a button named by the `expandDetail`/`collapseDetail` messages.

### Keyboard

| Key | Action |
| --- | --- |
| `Enter` / `Alt+ArrowDown` | On a row's detail toggle cell, expands or collapses its detail row. |
| `Alt+ArrowUp` / `Alt+ArrowDown` | On a reorder handle, moves the row up/down one place. Focus stays on the handle, so the row can keep moving. |

The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-expanded` | On the detail toggle button | Whether the detail row is open |
| `aria-label` | On the detail toggle button | `expandDetail` / `collapseDetail` for its row |
| `aria-label` | On a row reorder handle | The row's name, the keyboard hint and, when disabled, the reason |
| `aria-rowcount` | On the tabular content region | `-1` while detail rows make the count unknown |
