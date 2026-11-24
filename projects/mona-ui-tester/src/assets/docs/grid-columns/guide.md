## Overview

| What | How | Event |
| :--- | :--- | :--- |
| Width | `width`, `minWidth`, `maxWidth` on a column; `resizeMethod` on the grid | — |
| Resizing | `monaGridResizable` | `columnResize` |
| Reordering | `monaGridReorderable` | `columnReorder` (cancelable) |
| Locking | `locked` and `lockedPosition` on a column or the command column | — |
| Hiding | `hidden` on a column; the Columns button in the toolbar | — |
| Grouping | `mona-grid-column-group` around columns, nested for more header rows | — |

People's changes to widths, order and visibility live in the grid, not in your column definitions. To keep them across visits, add `monaGridStatePersistence`, see [State & Export](/components/grid-state-export).

**Use something else when:**

- Columns should change with the screen size. Bind `hidden` to your own breakpoint signal instead of relying on people to hide them.

## Import & Quick Start

```typescript
import {
    GridColumnComponent,
    GridColumnGroupComponent,
    GridComponent,
    GridReorderableDirective,
    GridResizableDirective
} from "@nanahoshi/mona-ui/grid";
```

```html
<mona-grid aria-label="Orders" [data]="orders()" monaGridResizable monaGridReorderable>
    <mona-grid-column field="orderId" title="Order ID" [locked]="true" [width]="110"></mona-grid-column>
    <mona-grid-column field="customer" title="Customer" [minWidth]="160"></mona-grid-column>
    <mona-grid-column-group title="Shipping">
        <mona-grid-column field="shipCity" title="City"></mona-grid-column>
        <mona-grid-column field="shipCountry" title="Country"></mona-grid-column>
    </mona-grid-column-group>
</mona-grid>
```

## Examples

### Locked, Resizable and Movable Columns

```example
grid-columns/locked-columns
```

The Shipment column is locked to the start and the Status column to the end, so both stay in view while the others scroll sideways. Containers starts hidden; the toolbar's Columns button shows it. `columnReorder` is prevented for the Shipment column, so it can't move.

### Column Groups

```example
grid-columns/column-groups
```

Route holds two nested groups, so the header has two rows of group titles above the column titles. Move a column with its header or `Ctrl+Shift+ArrowRight`: a Time column only swaps with its Airport, and Departure and Arrival move past each other as wholes. The Columns button lists each column with its groups, such as `Route / Departure / Airport`.

### Column Widths

`width` fixes a column's width in pixels. Columns without one get theirs from the grid's `resizeMethod`:

| `resizeMethod` | Columns without a `width` |
| :--- | :--- |
| `"fitView"` (default) | Share the width the fixed columns leave, and follow the grid's width as it changes. |
| `"auto"` | Fit their rendered content. |
| A number | Get that many pixels each. |

`minWidth` (40 by default) and `maxWidth` bound a resize.

With `"fitView"`, the columns are fitted again whenever the grid's width changes, such as when the window is resized or a pane opens beside the grid. A column the user resized keeps its width, and the others share what it leaves. Widths restored with `monaGridStatePersistence` are kept the same way.

### Canceling a Move

```typescript
protected onColumnReorder(event: ColumnReorderEvent): void {
    if (event.column.field === "orderId") {
        event.preventDefault();
    }
}
```

`columnReorder` carries the `column`, its `oldIndex` and its `newIndex`. `columnResize` is a plain object with the `column`, `oldWidth` and `newWidth`, emitted once when a resize ends; it can't be prevented.

## Behavior

### Resizing

A drag stops at the column's `minWidth` and `maxWidth`, and `Escape` during a drag puts the width back. The handle is also a focusable `separator`, see [Keyboard](#keyboard).

### Reordering

Dropping on the start half of a header puts the column before it, the end half after it; `Escape` cancels the drag.

### Column groups

Each `mona-grid-column-group` adds a header over the columns inside it, and nested groups add a header row per level. A column outside a group at some level shows its title in the bottom row, with the space above it left empty.

- **Order.** A group's columns always sit together, where its first column is. A column moves only among its group's columns and nested groups, and a nested group moves past it as a whole; a column outside the group can't be dropped into it. A saved state that splits a group is put back together.
- **Width.** A group's header is as wide as its visible columns. Resizing a column widens or narrows its groups too; a group's header has no resize handle of its own.
- **Hiding.** Hiding a column narrows its groups, and a group with no visible column leaves the header. When the deepest group has no visible column left, its header row goes.
- **Locking.** A locked column moves to its side of the grid, so its group's header splits there, with the title over each part. Lock every column of a group to keep it whole. While the grid scrolls sideways, a group's title stays in view beside the locked columns as long as part of the group does.
- **Export.** `exportCsv` writes the column titles only, and `exportExcel` writes the groups as merged header cells, see [State & Export](/components/grid-state-export).

### Locking

A locked column stays on its `lockedPosition` side, `"left"` (default) or `"right"`, which are the start and end of the grid, so they swap in right-to-left layouts. The command column takes `locked` and `lockedPosition` too. The selection checkbox column is always locked at the start.

### The Columns button

With a `monaGridToolbarTemplate`, the toolbar shows a Columns button (the `columns` message). Its popup lists every column, with a box to filter the list by title. Apply shows the checked columns and hides the others; Cancel drops the changes. A column's `hidden` input sets where it starts, and `monaGridStatePersistence` saves what the user chose. The popup's component is internal, so there is nothing to import.

## Accessibility

Every column needs a `title`: it names the header, the resize handle and the Columns popup's checkbox. Give every `mona-grid-column-group` a `title` too: it names the group's header. Moving a column from the keyboard is announced through a polite live region (the `columnMoved` message).

Group headers are column headers that span their columns, so a screen reader can read a cell's group with its column. `ArrowUp` and `ArrowDown` reach a group's header from any column under it and come back to the same column.

### Keyboard

| Key | Action |
| --- | --- |
| `F2` | On a header, moves to its resize handle. |
| `ArrowLeft` / `ArrowRight` | On a resize handle, narrows/widens the column by 10px (mirrored in right-to-left layouts). |
| `Home` / `End` | On a resize handle, sets the column to its narrowest/widest width. |
| `Enter` | On a resize handle, fits the column to its content. |
| `Ctrl+Shift+ArrowLeft` / `Ctrl+Shift+ArrowRight` | With `monaGridReorderable`, moves the focused header's column one place within its column group, past a nested group as a whole (mirrored in right-to-left layouts), and announces it. `Cmd` too. |
| `ArrowUp` / `ArrowDown` | Between a column's header and the headers of the groups over it. |

The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `role` | On the column resize handle | `"separator"` |
| `aria-orientation` | On the column resize handle | `"vertical"` |
| `aria-label` | On the column resize handle | `"Resize {column}"` (`resizeColumn` message) |
| `aria-valuenow` | On the column resize handle | The column width in pixels, with `aria-valuemin`/`aria-valuemax` |
| `aria-keyshortcuts` | On a header of a reorderable grid | The keys that move it |
| `role` | On a column group's header | `"columnheader"`, with `scope="colgroup"` |
| `aria-colspan` | On a column group's header | The number of columns it spans |
| `aria-colindex` | On a column group's header | Its first column's position |
| `aria-hidden` | On the space over a column outside a group | `"true"` |
