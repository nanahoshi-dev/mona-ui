## Overview

Tell the grid how to find each row's children in one of two ways:

| Your data | Use | Example |
| :--- | :--- | :--- |
| Root items that hold their children, at any depth | `children`: the field holding them, or a function returning them | `children="subtasks"` |
| One flat list, each item naming its parent's `rowKey` value | `parentKey`: the field holding it, or a function returning it, with the grid's `rowKey` | `rowKey="id" parentKey="managerId"` |

Rows start collapsed. The expanded rows are a list of row keys you bind with `[(treeExpandedKeys)]`, so they survive paging, sorting and reloading the data. It's apart from the grid's own `expandedKeys`, which opens [detail rows](/components/grid-rows).

**Use something else when:**

- The rows fall into groups by a column's value, such as orders by country. Use [Grouping & Aggregates](/components/grid-grouping): the groups come from the data's values, not from its structure.
- People only browse the hierarchy and pick an item, without columns to compare. Use a [Tree View](/components/tree-view).
- Each row has details of a different shape, such as an order's lines under the order. Use [detail rows](/components/grid-rows).

## Import & Quick Start

```typescript
import { GridColumnComponent, GridComponent, GridTreeDirective } from "@nanahoshi/mona-ui/grid";
```

```typescript
protected readonly expandedIds = signal<unknown[]>([]);
```

```html
<mona-grid
    aria-label="Project tasks"
    children="subtasks"
    rowKey="id"
    [data]="tasks()"
    monaGridTree
    [(treeExpandedKeys)]="expandedIds">
    <mona-grid-column expandable field="name" title="Task" />
    <mona-grid-column field="owner" title="Owner" />
</mona-grid>
```

## Examples

### Nested Children

```example
grid-tree/tasks
```

Each task holds its subtasks, and the Task column has the toggles because it's `expandable`; without that on any column, the first visible data column has them. Sort a column, and each task's subtasks sort among themselves, under it. The toolbar's buttons call `expandAll()` and `collapseAll()` through the directive's `exportAs`, `monaGridTree`, and both report the new keys through `treeExpandedKeysChange`.

### Flat Data with Parent Keys

```example
grid-tree/org-chart
```

Every employee names a manager's `id` in `managerId`, and the chief executive names none. Type a name in the filter row, such as "Priya": the grid keeps the rows above each match, so you see where she sits, and expands them.

## Behavior

### Building the tree

- **With `children`**, the grid's `data` holds the root items, and the grid walks their children at any depth. An item that turns up again inside itself isn't repeated.
- **With `parentKey`**, an item is a root when its parent key is empty, names no row in the data, or names the item itself. Rows whose parents form a loop become roots, so no row is lost.
- Changing `data`, `children` or `parentKey` rebuilds the tree, and the expanded rows that still exist stay expanded.

### Sorting, filtering and paging

- **Sorting** orders each row's children among themselves, so children always stay under their parent.
- **Filtering** keeps the rows that match and every row above them, and expands those, reporting the new keys through `treeExpandedKeysChange`. A row that only leads to matches shows even if it doesn't match itself.
- **Paging** counts the rows that show: the roots, and the children of expanded rows.
- **Grouping** and row reordering are off in a tree, because the tree already decides where each row goes.
- **Selection** and **editing** work on tree rows as on any other, and select-all takes the rows that show.

### Export

`exportCsv`, `exportExcel` and `exportPdf` write every row, collapsed or not, in tree order. The workbook groups each row's children into an outline that the spreadsheet can collapse, and indents the tree column's cells by level, as the PDF does. See [State & Export](/components/grid-state-export).

## Accessibility

With a tree, the grid's role is `treegrid`, and each row says where it sits: its level, its position among its siblings and whether it's expanded. The toggle is a pointer convenience, hidden from assistive technology, since the keyboard does the same on the tree column's cell.

### Keyboard

On the tree column's cell:

| Key | Action |
| --- | --- |
| `ArrowRight` | Expands a collapsed row. On an expanded row, or one without children, moves to the next cell. |
| `ArrowLeft` | Collapses an expanded row. Otherwise moves to the previous cell, or, when the tree column is the first, to the parent row's cell. |

`ArrowLeft` and `ArrowRight` swap in right-to-left layouts. The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `role` | On the tabular content region | `"treegrid"` |
| `aria-level` | On every body row | The row's depth, from 1 for a root |
| `aria-setsize` / `aria-posinset` | On every body row | How many siblings the row has, and its place among them |
| `aria-expanded` | On a row with children | Whether its children show |
