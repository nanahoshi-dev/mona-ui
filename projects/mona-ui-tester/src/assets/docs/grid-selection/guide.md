## Overview

Selection state always lives in `selectedKeys`. Checkboxes, row clicks, keys and your own code all change the same list, and `selectedKeysChange` reports the changes people make.

`selectBy` chooses what identifies a row: a field name or a function. Without it, rows are selected by the grid's `rowKey`, so the selection survives a refetch; without either, by the data item itself.

**Use something else when:**

- People pick one value to fill a field. Use a [Dropdown List](/components/dropdown-list) or [List Box](/components/list-box).
- The selection drives actions on the rows, such as deleting them: keep the selection, and put the actions in a [toolbar](/components/grid#toolbar-and-the-columns-button) that reads `selectedKeys`.

## Import & Quick Start

```typescript
import { GridColumnComponent, GridComponent, GridSelectableDirective } from "@nanahoshi/mona-ui/grid";
```

```typescript
protected readonly selectedIds = signal<number[]>([]);
```

```html
<mona-grid
    aria-label="Orders"
    rowKey="orderId"
    [data]="orders()"
    [monaGridSelectable]="{ mode: 'multiple', showCheckboxes: true }"
    [(selectedKeys)]="selectedIds">
    ...
</mona-grid>
```

## Examples

### Checkbox Selection

```example
grid-selection/selection
```

`rowAriaLabel` names each checkbox after its row, so a screen reader says "Select Lukas Weber" instead of "Select row 2".

### Options

| Option | Default | What it does |
| :--- | :--- | :--- |
| `enabled` | `true` | Turns selection on or off without removing the directive. |
| `mode` | `"single"` | `"single"` or `"multiple"`. |
| `showCheckboxes` | `false` | Shows the built-in checkbox column. |
| `showSelectAll` | `true` | Shows the select-all checkbox in that column's header, in multiple mode. |
| `selectAllScope` | `"page"` | Which rows the select-all checkbox affects: `"page"`, the rows on the current page, or `"view"`, every row in the filtered and sorted view. Virtual scrolling has no pages, so `"page"` means the whole view there. |
| `selectOnRowClick` | `false` | Whether a click on the row itself changes the selection. |
| `rowAriaLabel` | `"Select row 3"` | A function from the row to its checkbox's name. |

### Selecting from Code

Set `selectedKeys` to select rows yourself, such as after a search or to restore a saved selection. `selectedKeysChange` isn't emitted for a value set from code.

```typescript
protected selectOverdue(): void {
    this.selectedIds.set(this.orders().filter(order => order.overdue).map(order => order.orderId));
}
```

## Behavior

### Row clicks

Off by default, so clicking a row's content (a link, a button, an editable cell) never silently discards the selection. With `selectOnRowClick`: in single mode, clicking a row replaces the selection; in multiple mode, a plain click selects just that row, Ctrl/Cmd-click toggles one row without disturbing the rest, and Shift-click selects the range from the last clicked row. Checkbox clicks always toggle their row, whatever `selectOnRowClick` says.

### The checkbox column

It's fixed at the start of the grid, stays put while the grid scrolls sideways, and never takes part in sorting, filtering, grouping, resizing, reordering or the Columns popup. The header checkbox is checked when every row in scope is selected, and mixed when only some are. Selecting or clearing everything in scope keeps the keys of rows outside it.

### Stable keys

Provide a stable `rowKey` or `selectBy` when the selection must survive data reloads, paging or server requests. With server binding, select-all selects the loaded rows only.

## Accessibility

Selected rows carry `aria-selected`, and the grid says it allows several with `aria-multiselectable`. Name the checkboxes with `rowAriaLabel` when the position alone wouldn't tell people which row they're on.

### Keyboard

| Key | Action |
| --- | --- |
| `Space` | Toggles the focused row's selection. |
| `Shift+Space` | Selects the rows from the last selected row to this one. |
| `Shift+ArrowDown` / `Shift+ArrowUp` | Moves to the next/previous row and extends the selection to it. |
| `Ctrl+A` / `Cmd+A` | In multiple mode, selects every row in the select-all scope. |

The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-multiselectable` | On the tabular content region | `"true"` with multiple selection |
| `aria-selected` | On a row, while `monaGridSelectable` is enabled | Whether the row is selected |
| `aria-label` | On a row's checkbox / the select-all checkbox | `rowAriaLabel`'s text or `"Select row 3"` (`selectRow`) / `selectAllRows` |
