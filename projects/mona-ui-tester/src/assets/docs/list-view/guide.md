## Overview & Component Selection

List View renders a collection of items: a `role="list"` of `listitem`s, or, once you can select from it, a `role="listbox"` of `option`s. Keyboard navigation is on by default; the other behaviors are opt-in through a companion attribute directive applied to the same `<mona-list-view>` host element:

- `monaListViewSelectable` — single or multiple selection, with optional checkboxes. Makes the list a listbox.
- `monaListViewNavigable` — changes how arrow keys, Home/End and typeahead navigate, or turns navigation off.
- `monaListViewGroupable` — groups items under a header row.
- `monaListViewPageable` — adds a pager below the list.
- `monaListViewVirtualScroll` — renders only the items currently in view.

**Use List View when:**

- You need a plain, single-column list of items with optional selection, grouping, or pagination.
- You want full control over item markup through a custom item template.

**Use `DropDownList`/`ComboBox` instead when:**

- The list must be presented inside a popup triggered by an input-like control.

**Use `Grid` instead when:**

- Items need multiple columns, per-column sorting/filtering, or cell-level editing.

## Import & Quick Start

```typescript
import { ListViewComponent } from "@nanahoshi/mona-ui/list-view";
```

```html
<mona-list-view aria-label="Foods" [items]="items" textField="name" [height]="'300px'"></mona-list-view>
```

`items` accepts any `Iterable<T>`, and `textField` accepts either a property name or a function `(item: T) => string` used to render each item's default text. Without any behavior directive, the list is a `list` you can move through with the arrow keys; add `monaListViewSelectable` for selection (see [Feature Examples](#feature-examples)). Name every list view with `aria-label` or `aria-labelledby`.

## Anatomy & Public Structural Templates

Each structural directive below is an `ng-template` placed as projected content inside `<mona-list-view>...</mona-list-view>`.

| Directive                              | Selector                                       | Template context                           | Replaces                                             |
|----------------------------------------|------------------------------------------------|--------------------------------------------|------------------------------------------------------|
| `ListViewHeaderTemplateDirective`      | `ng-template[monaListViewHeaderTemplate]`      | None                                       | No default — renders above the list                  |
| `ListViewItemTemplateDirective`        | `ng-template[monaListViewItemTemplate]`        | `ListViewItemTemplateContext<T>`: `{ $implicit: T }` (the raw data item) | The default text rendered from `textField` |
| `ListViewGroupHeaderTemplateDirective` | `ng-template[monaListViewGroupHeaderTemplate]` | `ListViewGroupHeaderTemplateContext<K>`: `{ $implicit: K }` (the group's value) | The default bold group header text |
| `ListViewFooterTemplateDirective`      | `ng-template[monaListViewFooterTemplate]`      | None                                       | No default — renders below the list, above the pager |
| `ListViewNoDataTemplateDirective`      | `ng-template[monaListViewNoDataTemplate]`      | None                                       | The default "No data" placeholder                    |

```html
<mona-list-view aria-label="Foods" [items]="items" textField="name">
    <ng-template monaListViewHeaderTemplate>
        <div class="font-bold px-3 py-1">Food List</div>
    </ng-template>
    <ng-template monaListViewItemTemplate [monaListViewItemTemplateOf]="items" let-item>
        <span class="flex-1">{{ item.name }}</span>
        <span class="text-green-600">${{ item.price }}</span>
    </ng-template>
    <ng-template monaListViewNoDataTemplate>
        <div class="flex items-center justify-center h-full">No items available.</div>
    </ng-template>
</mona-list-view>
```

Bind the list view's items to `[monaListViewItemTemplateOf]` to type `let-item` in the template; without it, the item is `any`. The group header template's value isn't type-checked. Both context types are exported.

## Feature Examples

### Single and multiple selection

```html
<mona-list-view
    aria-label="Foods"
    [items]="items"
    textField="name"
    [monaListViewSelectable]="{ mode: 'single', toggleable: true }"
    selectBy="id"
    [selectedKeys]="selectedIds"
    (selectedKeysChange)="onSelectedIdsChange($event)">
</mona-list-view>
```

`selectBy` derives the key used for `selectedKeys`/`selectedKeysChange`; when omitted, the data item itself is used as the key. `selectedKeysChange` fires for the user's selections, not for keys set through `selectedKeys`, so `[(selectedKeys)]` works. `mode: "multiple"` allows selecting more than one item; `toggleable` (single mode only) lets the user deselect the current item by clicking it again. Set `checkboxes: true` on the options object to render a checkbox per item instead of relying on background color alone.

### Keyboard navigation

```html
<mona-list-view aria-label="Foods" [items]="items" textField="name" [monaListViewNavigable]="{ mode: 'highlight', wrap: true }" monaListViewSelectable>
</mona-list-view>
```

Arrow-key/Home/End/typeahead navigation is on without the directive — see [Keyboard](#keyboard); `monaListViewNavigable` configures it. `mode: "select"` (the default) moves the selection as the user navigates a single-selection list; `mode: "highlight"` only moves a visual highlight, leaving selection to click/Enter. `wrap` (default `false`) makes navigating past the last item cycle back to the first. `{ enabled: false }` turns navigation off.

### Grouping

```html
<mona-list-view
    aria-label="Foods"
    [items]="items"
    textField="name"
    [monaListViewGroupable]="{ enabled: true, headerOrder: 'asc', orderBy: 'name' }"
    groupBy="category">
</mona-list-view>
```

`groupBy` selects the field (or a function) used to bucket items; each distinct value renders as a group header row. `orderBy`/`orderByDirection` sort items within each group; `headerOrder` sorts the groups themselves by their key. Dates group by their time, so two `Date` objects for the same moment share a group and date groups sort chronologically. Headers show dates in the locale's medium date format and numbers in the locale's digits; set `headerText` to format them yourself. The group header template receives the group's value (a `Date` stays a `Date`). If `groupBy` is omitted while grouping is enabled, every item falls into a single, unlabeled group — always provide `groupBy` together with `monaListViewGroupable`.

### Pagination

```html
<mona-list-view aria-label="Foods" [items]="items" textField="name" [monaListViewPageable]="{ pageSizeValues: [10, 25, 50] }"> </mona-list-view>
```

Adds a pager below the list. Pagination and virtualization are mutually exclusive: if `monaListViewVirtualScroll` is also enabled, the pager is hidden regardless of `monaListViewPageable`'s state — see [Pagination and virtualization don't combine](#pagination-and-virtualization-dont-combine).

### Virtual scrolling

```html
<mona-list-view aria-label="Foods" [items]="items" textField="name" [monaListViewVirtualScroll]="{ enabled: true, height: 32 }" [height]="'400px'">
</mona-list-view>
```

Renders only the items currently scrolled into view, for large collections. `height` on the options object is the fixed row height, in pixels, used to measure the virtual scroll viewport — every item must render at that height for scrolling to stay accurate. The viewport takes the list view's `height`: the default `"100%"` needs a parent with a height, so in an unsized container pass a fixed `height`, or `""` to size the viewport to its items.

### Infinite scroll

```typescript
protected onScrollBottom(): void {
    this.visibleCount.update(count => count + 20);
}
```

```html
<mona-list-view aria-label="Foods" [items]="items | slice: 0 : visibleCount()" textField="name" [height]="'300px'" (scrollBottom)="onScrollBottom()">
</mona-list-view>
```

`scrollBottom` emits once each time the list arrives within roughly 3px of its bottom edge (scrolling away and back emits again, as does reaching the new end after more items load), whichever of the plain list or the virtual scroll viewport is active. Combine it with slicing a larger source collection to implement infinite loading — see [`scrollBottom` and `monaListViewPageable`](#scrollbottom-and-monalistviewpageable).

## Technical & Behavior Notes

### Pagination and virtualization don't combine

When `monaListViewVirtualScroll` reports `enabled: true`, the pager rendered by `monaListViewPageable` is not shown, even if the pageable options are also `enabled: true`. Only one of the two should be applied to a given list.

### `scrollBottom` and `monaListViewPageable`

`scrollBottom` only fires while pagination is disabled. If `monaListViewPageable` is enabled, scrolling to the bottom of the current page does not emit `scrollBottom` — pagination and infinite scroll are alternative strategies for large collections, not composable ones.

### Option types

`GroupableOptions`, `NavigableOptions`, `PagerSettings`, `SelectableOptions` and `VirtualScrollOptions` are exported from `@nanahoshi/mona-ui/list-view` as types.

### Each list view has its own state

A list view keeps its items, selection and paging to itself, so a list view inside another one's templates, or inside a dropdown or list box, never shares or overwrites their state. Equal items (two `"a"` strings, or the same object twice) are each shown.

### Grouping key type defaults to the item type

`monaListViewGroupable`'s generic key parameter defaults to the item type itself rather than `unknown`. In practice, always pass an explicit `groupBy` selector (a property name or a function returning the group key) — grouping without one produces a single, unlabeled group.

## Accessibility & Forms Integration

### Keyboard

Keyboard navigation is on by default; `monaListViewNavigable` changes its mode and wrapping, or turns it off with `{ enabled: false }`.

| Key                                             | Action                                                                                                      |
|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `ArrowDown`                                     | Move to the next enabled item.                                                                              |
| `ArrowUp`                                       | Move to the previous enabled item.                                                                          |
| `Home`                                          | Move to the first enabled item.                                                                             |
| `End`                                           | Move to the last enabled item.                                                                              |
| `PageDown`                                      | Scroll the list forward by roughly one viewport.                                                            |
| `PageUp`                                        | Scroll the list back by roughly one viewport.                                                               |
| `Enter`                                         | Select the highlighted or currently selected item, and emit `itemActivate`.                                 |
| Any letter, digit, space, hyphen, or underscore | Typeahead: jumps to the next item whose text starts with the typed characters, staying on the active item while it still matches (resets after a short pause). In multiple selection it moves focus only. |

Disabled items (`disabledBy`) are skipped, and can't be selected by click, Enter or typeahead. Arrow keys with Alt are left to the page (the list box uses them to move items). Keys pressed in controls inside header, footer or item templates are left to those controls: an input in a header template takes typing and arrows, and Enter presses a button in an item.

### Focus

The list is a single Tab stop. Tabbing in focuses the item last moved to, else the last selected item shown, else the first enabled item; a selection on another page or scrolled out of a virtual list doesn't take the Tab stop away. Tab/Shift+Tab then leave the list. When the focused item is removed from `items`, focus moves to the item now at its position (or the last one). An empty list keeps its named list element as the Tab stop, described by the "No data" text, so it stays in the accessibility tree. The focused item has a solid 2px ring.

### ARIA

A list view you can select from (`monaListViewSelectable`) is a `listbox` of `option`s. Without selection it is a `list` of `listitem`s, so item templates may hold buttons and links.

| Attribute                        | Where                                     | Value                                                                  |
|----------------------------------|-------------------------------------------|------------------------------------------------------------------------|
| `role`                           | The inner list element (also when empty)  | `"listbox"` when selectable, else `"list"`                             |
| `aria-describedby`               | The inner list element, when empty        | The "No data" text, or the no-data template                            |
| `role`                           | Each item                                 | `"option"` when selectable, else `"listitem"`                          |
| `aria-label` / `aria-labelledby` | The inner list element                    | From the `aria-label` / `aria-labelledby` inputs (not left on the host) |
| `aria-multiselectable`           | The listbox, in multiple selection        | `true`                                                                 |
| `aria-busy`                      | The inner list element, while `loading`   | `true`                                                                 |
| `aria-selected` / `aria-disabled`| Each option                               | Whether the item is selected / disabled                                |
| `aria-posinset` / `aria-setsize` | Each item                                 | The item's 1-based position and the total count among non-header items |
| `role="group"`                   | Each group of options, when grouped       | Named by its header (`aria-labelledby`); a plain list nests a `list` instead. With virtual scrolling the list stays flat and each option points at its header with `aria-describedby`. |
| `role="status"`                  | A visually hidden element after the list  | "Loading" while `loading`, "No data" when there are no items           |

Give every list view a name with `aria-label` or `aria-labelledby`. A paged list view names its pager "{name} pagination" (the `list.pagerLabel` message), or `pagerAriaLabel`, so several paged lists on a page have different landmarks.

Form integration is not applicable — List View is a display/selection widget, not a form control.

<!-- verification-checklist
- [x] Inputs, outputs and defaults checked against list-view/components/list-view/list-view.component.ts, the directives in list-view/directives, and component-metadata.json
- [x] Roles checked against internal/list (ListService.role, list-item.directive.ts): `list`/`listitem` without selection, `listbox`/`option` with it; no aria-current
- [x] Navigation default (`enabled: true`, `mode: "select"`) checked against list-view-navigable.directive.ts and the list view's own defaults
- [x] Keyboard map checked against internal/list/utils/getListNavigationDirection.ts and internal/list/components/list/list.component.ts
- [x] Template contexts checked against list-view.component.html and internal/list/components/list-item/list-item.component.html; ListViewItemTemplateDirective has a context guard
- [x] Exports checked against list-view/public-api.ts (option types and template contexts as types)
- [x] Paging (pageChange only for the user, page and pageSize models) checked against list-view-pageable.directive.ts
-->
