## Overview

Grouping and aggregates work on their own or together. An aggregate without grouping shows one footer row under the grid; with grouping, each expanded group shows its own footer too.

| Piece | Where | What it does |
| :--- | :--- | :--- |
| `monaGridGroupable` | `mona-grid` | The group panel, group headers, and the `[(group)]` model of `GroupDescriptor[]`. Emits `groupChange`. |
| `aggregate` | `mona-grid-column` | `"sum"`, `"avg"`, `"count"`, `"min"`, `"max"` or `"custom"`. |
| `monaGridFooterTemplate` | `mona-grid-column` | Replaces the column's value in the grid footer. |
| `monaGridGroupFooterTemplate` | `mona-grid-column` | Replaces the column's value in a group's footer. |

**Use something else when:**

- The data is a hierarchy of its own rather than rows sharing a value. Use [Tree View](/components/tree-view).
- You only need a total outside the grid. Compute it from your data with a `computed`.

## Import & Quick Start

```typescript
import { GridColumnComponent, GridComponent, GridGroupableDirective, type GroupDescriptor } from "@nanahoshi/mona-ui/grid";
```

```typescript
protected readonly group = signal<GroupDescriptor[]>([{ field: "country", dir: "asc" }]);
```

```html
<mona-grid aria-label="Orders" [data]="orders()" [monaGridGroupable]="{ enabled: true, showFooter: true }" [(group)]="group">
    <mona-grid-column field="country" title="Country"></mona-grid-column>
    <mona-grid-column field="freight" title="Freight" type="number" aggregate="sum"></mona-grid-column>
</mona-grid>
```

## Anatomy

| Directive | Selector | Placed inside | Template context | Replaces |
| --- | --- | --- | --- | --- |
| `GridFooterTemplateDirective` | `ng-template[monaGridFooterTemplate]` | `mona-grid-column` | `{ $implicit, aggregate, aggregates, column, columnIndex, rows }`: `$implicit` is the column's aggregate value, `aggregate` the column's bucket (`{ field, sum?, avg?, count?, min?, max? }`) or `null`, `aggregates` the buckets by field, `rows` the data items of the whole view. The context type isn't exported. | The column's aggregate value in the grid footer |
| `GridGroupFooterTemplateDirective` | `ng-template[monaGridGroupFooterTemplate]` | `mona-grid-column` | The footer context, plus `count`, `depth`, `groupKey` and `groupValue` for the group; `rows` and the aggregates cover that group's rows. The context type isn't exported. | The column's aggregate value in a group's footer |

## Examples

### Grouped Totals

```example
grid-grouping/aggregates
```

Each column with an `aggregate` shows its value in the footer: the count of reps, the average units and the sum of revenue, for the whole view and for each region. `showFooter: true` keeps a group's footer visible while the group is collapsed.

### Grouping from Code

Set the `group` model to group without a drag. Each descriptor names a `field` and, optionally, a `dir` for the order of the group headers:

```typescript
this.group.set([{ field: "country", dir: "asc" }, { field: "shipped", dir: "desc" }]);
```

A repeated field keeps its last descriptor. `groupChange` emits once for each user change (grouping, ungrouping, reordering or re-sorting groups) and after a state is restored, never for a value set from code.

### Custom Aggregates

`aggregate="custom"` reserves a footer cell that the grid doesn't fill: give the column a `monaGridFooterTemplate`, and for grouped rows a `monaGridGroupFooterTemplate`, and compute the value from `rows` in the context.

```html
<mona-grid-column field="freight" title="Freight" type="number" aggregate="custom">
    <ng-template monaGridFooterTemplate let-rows="rows">{{ heaviest(rows) }}</ng-template>
</mona-grid-column>
```

## Behavior

### What forms a group

`null`, `undefined` and empty text form one group; `1` and `"1"` are different groups; dates group by their time.

### What an aggregate covers

Aggregates cover the whole view: every filtered row, not only the current page, in the footer and in each group footer. With server binding they cover the loaded page. `count` counts values that aren't empty; `sum` and `avg` use numbers and numeric text (`"12.5"`), and the sum of no numbers is `0`.

### Footers and virtual scrolling

While virtual scrolling is on, the grid shows no aggregate footer under the grid. Group footers still show, at the virtual row height.

### Grouping with other features

Grouped rows can be sorted, filtered, selected, edited and paged. Row reordering turns itself off while rows are grouped. With server binding, grouping and aggregates work on the loaded page only, and `group` isn't part of the request.

## Accessibility

While rows are grouped, the grid's role is `treegrid`, and each row has an `aria-level`. Moving a column into the group panel from the keyboard is announced through a polite live region (the `columnGrouped` message).

### Keyboard

| Key | Action |
| --- | --- |
| `Ctrl+Shift+G` / `Cmd+Shift+G` | On a header, groups the rows by its column and announces it. |
| `Enter` / `Alt+ArrowDown` | On a group row, expands or collapses it. |
| `ArrowRight` / `ArrowLeft` | On a group row, expands/collapses it first (mirrored in right-to-left layouts); on an expanded/collapsed group, moves as usual. |
| `Delete` / `Backspace` | On a chip in the group panel, removes that grouping. |

The rest of the grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `role` | On the tabular content region | `"treegrid"` while rows are grouped |
| `aria-expanded` | On a group header row | Whether the group is expanded |
| `aria-level` | On rows of a grouped grid | The group's nesting depth; data rows sit one level below their group |
| `aria-rowcount` | On the tabular content region | `-1` when paged groups make the count unknown |
