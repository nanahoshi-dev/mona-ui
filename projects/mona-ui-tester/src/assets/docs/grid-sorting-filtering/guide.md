## Overview

Without server binding, the grid sorts and filters `data` itself, across every row, and then pages the result. With `monaGridServerBinding` it asks your server to do it, see [Server Binding & Virtualization](/components/grid-server).

| Directive | State you bind | Events |
| :--- | :--- | :--- |
| `monaGridSortable` | `[(sort)]`: `SortDescriptor[]` | `columnSort` (cancelable), `sortChange` |
| `monaGridFilterable` | `[(filter)]`: `CompositeFilterDescriptor[]` | `filterChange` |

`SortDescriptor` and `CompositeFilterDescriptor` come from `@nanahoshi/mona-ui/query`, the same descriptors `Query` runs, so a server can apply them with the same code.

**Use something else when:**

- The subset is chosen by your own controls and shouldn't show in the columns. Bind a filtered `computed` to `data` instead, see [Grid Overview](/components/grid#changing-the-data).

## Import & Quick Start

```typescript
import { GridColumnComponent, GridComponent, GridFilterableDirective, GridSortableDirective } from "@nanahoshi/mona-ui/grid";
import type { CompositeFilterDescriptor, SortDescriptor } from "@nanahoshi/mona-ui/query";
```

```typescript
protected readonly sort = signal<SortDescriptor[]>([{ dir: "desc", field: "orderDate" }]);
protected readonly filter = signal<CompositeFilterDescriptor[]>([]);
```

```html
<mona-grid
    aria-label="Orders"
    [data]="orders()"
    monaGridSortable
    [monaGridFilterable]="{ enabled: true, type: 'menu' }"
    [(sort)]="sort"
    [(filter)]="filter">
    ...
</mona-grid>
```

## Examples

### Sorting and Filtering Together

```example
grid-sorting-filtering/sorting-filtering
```

Pass an object to `monaGridSortable` to configure the sort mode, unsorting, or index display, as the example does with `{ mode: 'multiple', allowUnsort: true }`. The filter type `'menu, row'` shows both the header menu and the filter row. `[sortable]="false"` turns header sorting off for the Order column.

### Sort Order

A `SortDescriptor` names a `field` and a `dir`, and can bring its own compare function:

```typescript
interface SortDescriptor<TValue = unknown> {
    dir: "asc" | "desc";
    field: string;
    /** Compares two values of `field`; `dir: "desc"` reverses the result. */
    sort?(left: TValue, right: TValue): number;
}
```

Descriptors are kept even when no column shows their field (a column added later shows the sort), and a repeated field keeps its last descriptor. A restored grid state updates `sort` too.

In `mode: "multiple"`, sorted headers show their one-based priority next to the direction icon: the first sorted column is `1`, the next is `2`. Changing direction keeps the priority; unsorting a column renumbers the rest. `showIndices: false` hides the numbers. Single mode shows only the direction icon. Clicking a sorted header turns it around; with `allowUnsort`, a third click clears it.

### Custom Comparison

Without a comparator, values sort by type, with empty values first and strings by the locale. Give a column a `sortComparator` to compare its values your way, such as by a status's rank instead of its name:

```typescript
const RANK: Record<string, number> = { Open: 0, Shipped: 1, Closed: 2 };

protected readonly byRank = (left: unknown, right: unknown): number => RANK[String(left)] - RANK[String(right)];
```

```html
<mona-grid-column field="status" title="Status" [sortComparator]="byRank"></mona-grid-column>
```

A column's `sortComparator`, or a descriptor's own `sort` function, is kept when the user clicks the header. `dir: "desc"` reverses what it returns.

### Filtering from Code

Set the `filter` model to apply conditions and show them in the column's filter UI:

```typescript
protected onShipChange(shipName: string | null): void {
    this.filter.set(
        shipName ? [{ logic: "and", filters: [{ field: "shipName", operator: "eq", value: shipName }] }] : []
    );
}
```

Conditions on one field become that column's filter, and an `and` across fields is split per column; filters on the same field are combined with `and`. Filters that span columns (an `or` of two fields) are still applied, reported and sent to the server, without marking a column. Conditions with an unknown operator are ignored. With `[monaGridFilterable]="{ enabled: false }"` the filter UI is hidden, but a `filter` set from code still applies.

## Behavior

### Paging

A user's sort or filter goes back to the first page and reports it through `pageChange` and `skipChange`, with or without server binding. A `sort` or `filter` set from code keeps the current page.

### Turning columns off

`[sortable]="false"` on a column turns off sorting through its header, and `[filterable]="false"` leaves it out of the filter menu and the filter row. Both default to `true`, and both only change the header: descriptors from code or a restored state still apply to that field.

### The header menu

The header menu is a dialog named after its column (`filterByColumn`). It opens at the column type's first operator, keeps focus inside until it closes, and returns focus to its funnel button. `Enter` in a value applies the filter, and text that is only spaces is no value; text is trimmed before it is applied. A date column's menu uses the column's string `format`, or the locale's date format without one. While a column is filtered, its funnel shows a dot as well as a colour, and its name says so (`filterByColumnFiltered`).

### The filter row

Typing filters after a 300 ms pause; choosing an operator, picking a date or a Boolean value, and `Clear` filter at once and drop typing that has not filtered yet. An operator chosen without a value stays chosen until there is one. A cell follows only its own column's filter, and its own filter coming back does not overwrite newer typing.

### Canceling a sort

`columnSort` is emitted before the sort changes; call `preventDefault()` on it to keep the current order. `sortChange` reports the new descriptors after the change.

## Accessibility

Sorted headers carry `aria-sort`, and the filter controls are named after their column, so give every column a `title`.

### Keyboard

| Key | Action |
| --- | --- |
| `Enter` | On a header, sorts the column (with `monaGridSortable`). |
| `Alt+ArrowDown` | On a filterable header, opens its filter menu. |
| `F2` | On a header or a filter-row cell, moves into its controls: the filter button or the filter input. |
| `Escape` | Closes the filter menu and returns focus to its funnel button; another `Escape` goes back to the header cell. |

The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-sort` | On a header cell, only while `monaGridSortable` is enabled | `"ascending"`, `"descending"`, or `"none"`; only on the first sort |
| `aria-describedby` | On a header cell sorted after another | Its place in the sort order (`sortOrder` message) |
| `aria-keyshortcuts` | On a filterable header | `Alt+ArrowDown`, the key that opens its filter menu |
| `role` | On an open filter menu | `"dialog"`, with `aria-label` `"Filter by {column}"` |
| `aria-haspopup` | On a filter menu button / a filter row operator button | `"dialog"` / `"menu"`; the operator button also has `aria-expanded` |
| `aria-label` | On the filter row's inputs, operator buttons and clear buttons | `"Filter by {column}"`, `"Filter operator for {column}: {operator}"` (`filterOperator`), `"Clear filter for {column}"` (`clearFilter`) |
