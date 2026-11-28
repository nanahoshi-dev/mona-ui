## Overview

Selection state always lives in `selectedKeys`. Checkboxes, row clicks, keys and your own code all change the same list, and `selectedKeysChange` reports the changes people make.

`selectBy` chooses what identifies a row: a field name or a function. Without it, rows are selected by the grid's `rowKey`, so the selection survives a refetch; without either, by the data item itself.

**Use something else when:**

- People pick one value to fill a field. Use a [Dropdown List](/components/dropdown-list) or [List Box](/components/list-box).
- The selection drives actions on the rows, such as deleting them: keep the selection, and put the actions in a [toolbar](/components/grid#toolbar-and-the-columns-button) that reads `selectedKeys`.

**Use `monaGridRangeSelectable` when** people work with values rather than records: copying a block of numbers into a spreadsheet, or pasting one from it to fill many cells at once.

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

### A File List

```example
grid-selection/file-list
```

With `navigation="row"` and `selectOnRowClick`, the grid behaves as a file list: the arrows move by rows and select, typing a name's first letters moves to it and selects it (`textField="name"`, see [Typeahead](/components/grid#typeahead)), and a right-click selects what it lands on, or clears the selection in empty space. The context menu builds its items from the selection, so with nothing selected it offers the folder's commands. Opened with the `ContextMenu` key or `Shift+F10`, it appears at the focused row.

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

### Cell Ranges, Copy and Paste

```example
grid-selection/range
```

Drag across cells, Shift+click the far corner, or hold Shift and use the arrow keys, then press Ctrl+C and paste into a spreadsheet. Copy a block of cells from a spreadsheet, focus a quarter's cell and press Ctrl+V to paste it there, or select a range and paste one value to fill it. The Region column isn't editable, so pasting over it keeps its values.

`rangeChange` reports the selected range as the data items of its rows and the fields of its columns, in the order the grid shows them, or `null` once it's cleared. `clearRange()` and `selectAll()` do the same from code. `[monaGridRangeSelectable]="false"` turns the directive off.

## Behavior

### Copying and pasting cells

Ctrl+C copies the range as tab-separated text, with each cell's text as the grid shows it, so a spreadsheet pastes it as cells; a cell holding a tab, a line break or a quote is quoted, as spreadsheets do. The grid says how many cells it copied.

Pasting needs editing on (`monaGridEditable`) and no editor open, and never changes the grid's data. The grid reads the pasted text, works out the new values and emits `rangePaste` with each changed row's data as it was (`originalRowData`) and with the new values in (`rowData`), for you to save, and with `skippedCells`, the cells that kept their value. Then it says how many cells it pasted.

- **One value** fills every cell of the range. **A block** of rows and columns pastes from the focused cell, or the range's first cell, and stops at the last row and column the view has: it never adds rows.
- **Values** take each column's type: numbers as written in the grid's locale, `true`/`false`, `yes`/`no` or `1`/`0` for booleans, and dates as `2024-03-15` or in the locale's own order. Empty text clears the cell.
- **A cell keeps its value** when its column can't be edited, or when the text doesn't fit the column's type, such as a word in a number column.

### Ranges with row selection

The two directives work together. Space, the checkboxes and row clicks select rows, while Shift with the arrows, dragging and Ctrl+A select cells. Without `monaGridRangeSelectable`, Shift+ArrowUp and Shift+ArrowDown extend the row selection instead.

### Row clicks

Off by default, so clicking a row's content (a link, a button, an editable cell) never silently discards the selection. With `selectOnRowClick`: in single mode, clicking a row replaces the selection; in multiple mode, a plain click selects just that row, Ctrl/Cmd-click toggles one row without disturbing the rest, and Shift-click selects the range from the last clicked row. Checkbox clicks always toggle their row, whatever `selectOnRowClick` says.

With `selectOnRowClick`, the grid also selects as a file list does on a right-click and in empty space, so a context menu acts on what was right-clicked: a right-click on a row that isn't selected makes it the selection, one on a selected row keeps the selection, and a click or right-click on the empty space below the rows clears it, unless Ctrl or Shift is held.

### Moving by rows

With [`navigation="row"`](/api/grid/GridComponent#navigation) and `selectOnRowClick`, the selection follows the keyboard, as in a file list: moving to a row selects it, Shift extends the selection from the anchor, Ctrl and Shift add that range, and Ctrl moves without selecting. Space then adds the focused row instead of toggling it. A row that [typeahead](/components/grid#typeahead) moves to becomes the selection, as one an arrow key moves to does, in multiple mode too.

### The checkbox column

It's fixed at the start of the grid, stays put while the grid scrolls sideways, and never takes part in sorting, filtering, grouping, resizing, reordering or the Columns popup. The header checkbox is checked when every row in scope is selected, and mixed when only some are. Selecting or clearing everything in scope keeps the keys of rows outside it.

### Stable keys

Provide a stable `rowKey` or `selectBy` when the selection must survive data reloads, paging or server requests. With server binding, select-all selects the loaded rows only.

## Accessibility

Selected rows carry `aria-selected`, and the grid says it allows several with `aria-multiselectable`. With range selection, the cells in the range carry `aria-selected` instead, and the grid announces what Ctrl+C copied and Ctrl+V pasted. Name the checkboxes with `rowAriaLabel` when the position alone wouldn't tell people which row they're on.

### Keyboard

| Key | Action |
| --- | --- |
| `Space` | Toggles the focused row's selection. |
| `Shift+Space` | Selects the rows from the last selected row to this one. |
| `Shift+ArrowDown` / `Shift+ArrowUp` | Moves to the next/previous row and extends the selection to it. |
| `Ctrl+A` / `Cmd+A` | In multiple mode, selects every row in the select-all scope. With range selection, selects every cell of the page, or of the whole view with virtual scrolling. |
| `Shift+Arrow keys` | With range selection, extends the range of cells from where it started. Moving without Shift leaves it. |
| Moving keys, with `navigation="row"` and `selectOnRowClick` | Select the row moved to. With Shift, from the anchor; with Ctrl and Shift, added; with Ctrl alone, nothing changes. `Space` adds the focused row, and `Ctrl+Space` toggles it. |
| Typed characters, with `textField`, `navigation="row"` and `selectOnRowClick` | Select the row [typeahead](/components/grid#typeahead) moves to, in place of the selection. While a search is under way, `Space` types a space instead of selecting. |
| `Escape` | With range selection, clears the range. |
| `Ctrl+C` / `Cmd+C` | Copies the range, or the focused cell. |
| `Ctrl+V` / `Cmd+V` | With range selection and editing on, pastes into the cells. |

The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-multiselectable` | On the tabular content region | `"true"` with multiple selection or range selection |
| `aria-selected` | On a row, while `monaGridSelectable` is enabled | Whether the row is selected |
| `aria-selected` | On a cell, while `monaGridRangeSelectable` is enabled | Whether the cell is in the range |
| `aria-label` | On a row's checkbox / the select-all checkbox | `rowAriaLabel`'s text or `"Select row 3"` (`selectRow`) / `selectAllRows` |
