## Overview

| | Server binding | Virtual scrolling |
| :--- | :--- | :--- |
| Rows in memory | One page | All loaded rows |
| Who sorts, filters and pages | Your server | The grid |
| Navigation | The pager | Scrolling, with no pager |
| Loading more | `dataStateChange` asks for a page | `scrollEnd` near the bottom, if you want it |
| Row height | Fits the content | One fixed height |

The two can't be combined: enabling both throws an error. Server binding loads pages, not a remote virtual list.

**Use something else when:**

- The data set is a few thousand rows or fewer and fits in memory. The grid pages it fine without either directive.

## Import & Quick Start

```typescript
import { GridComponent, GridServerBindingDirective, type GridDataState } from "@nanahoshi/mona-ui/grid";
```

```html
<mona-grid
    aria-label="Customers"
    monaGridServerBinding
    [data]="page().data"
    [total]="page().total"
    [skip]="state().skip"
    [pageSize]="state().take"
    [loading]="loading()"
    (dataStateChange)="load($event)">
    ...
</mona-grid>
```

## Examples

### Server Paging, Sorting, and Filtering

Apply `monaGridServerBinding` when `data` contains only the page returned by your server. Bind the server's matching record count to `total`, the page's zero-based offset to `skip`, and its size to the grid's `pageSize`.

```example
grid-server/server
```

`dataStateChange` supplies `{ skip, take, sort, filter }` once for a user page, page-size, sort, or filter action. All its properties are readonly, and each emission holds its own copies of the descriptors, including nested filter values. Use the grid's `pageSize` for the request's `take`; in server mode it must be a positive safe integer. Sort and filter actions start at `skip: 0`; a page-size change keeps the first row of the page in view. Sort order follows multi-column sort priority. Bindings from the parent synchronize silently, and creating the directive doesn't emit an initial request: load the first page yourself.

The application owns HTTP requests, errors, and stale-response handling. The example ignores a response that arrives after a newer request started. `SortDescriptor` and `CompositeFilterDescriptor` come from `@nanahoshi/mona-ui/query`; the grid has no endpoint or transport dependency.

### Virtual Scrolling

`monaGridVirtualScroll` renders only the rows in view. `scrollEndThreshold` (rows from the bottom) controls when `scrollEnd` fires, so you can load more rows as people scroll.

```example
grid-server/virtual
```

## Behavior

### What the server must do

Apply the descriptors to the whole matching data set before paging. The grid keeps the returned row order and shows every supplied row, even when `skip` is nonzero: ten rows at `skip: 40`, `pageSize: 10` and `total: 137` show page five with all ten rows.

### Loading

While `loading` is true, the body shows a localized loading indicator, keeps the existing rows, and doesn't show the empty state. The grid exposes `aria-busy`; the header and pager stay available for another request. Set `loading` back to false on both success and error.

### Features with server binding

- Grouping and aggregates work on the loaded page. Each group direction orders the loaded page's group headers while keeping server row order within each group. `group` isn't part of `GridDataState`, and there is no remote aggregate protocol.
- CSV export contains loaded data only. Fetch a full export through your application when needed.
- Select-all selects loaded rows only. Use `selectBy` and controlled `selectedKeys` to keep stable keys across pages; this doesn't select unloaded records.
- Editing events describe loaded rows; the application saves changes to its server.
- Row reordering is disabled, with an accessible, localized reason.
- State persistence restores sort, filter, and page size (unless `persistPageSize` is `false`), then emits one refresh at `skip: 0`. The offset isn't persisted. When you provide a saved initial state, use that refresh to load the restored query instead of starting a competing initial request.

### Row height in virtual scrolling

`height` in the options defaults to **36px** and must be finite and greater than zero. It sets the rendered height and the virtual item size of every row, group header and group footer, and templates taller than it are clipped. Variable-height virtualization isn't provided. Ordinary rows, by contrast, fit their content, see [Rows](/components/grid-rows#rows-that-fit-their-content).

### Features with virtual scrolling

While virtual scrolling is on, the grid shows no pager and no aggregate footer, and ignores detail rows. Selection's `selectAllScope: "page"` covers the whole view, since there are no pages. `Ctrl+End` scrolls to the last row before moving focus there.

## Accessibility

Rows outside the view aren't in the page, so `aria-rowcount` and each row's `aria-rowindex` tell assistive technology where a row sits in the whole set. Focus returns to a cell of a virtual grid when its row scrolls back into view.

### Keyboard

Virtual scrolling and server binding add no keys. `PageUp`, `PageDown`, `Ctrl+Home` and `Ctrl+End` move through every row of a virtual grid; with server binding, the pager changes pages. The grid's keys are on [Grid Overview](/components/grid#keyboard).

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-busy` | On the tabular content region in server mode | `"true"` while `loading` is true |
| `aria-rowcount` | On the tabular content region | Every row, including rows not rendered |
| `aria-rowindex` | On every row | 1-based position in the whole set, counting earlier pages |
