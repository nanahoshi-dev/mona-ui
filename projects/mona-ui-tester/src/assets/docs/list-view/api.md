## Overview & Component Selection

List View renders a collection of items as a `role="listbox"` list. On its own it only renders items and an optional height/width — every interactive behavior (selection, keyboard navigation, grouping, pagination, virtual scrolling) is opt-in through a companion attribute directive applied to the same `<mona-list-view>` host element:

- `monaListViewSelectable` — single or multiple selection, with optional checkboxes.
- `monaListViewNavigable` — arrow-key/Home/End/typeahead navigation.
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
import { ListViewComponent } from "@nanahoshi/mona-ui";
```

```html
<mona-list-view [items]="items" textField="name" [height]="'300px'"></mona-list-view>
```

`items` accepts any `Iterable<T>`, and `textField` accepts either a property name or a function `(item: T) => string` used to render each item's default text. Without any behavior directive, the list is a static, non-interactive listbox — add `monaListViewNavigable` and/or `monaListViewSelectable` for keyboard interaction and selection (see [Feature Examples](#feature-examples)).

## Anatomy & Public Structural Templates

Each structural directive below is an `ng-template` placed as projected content inside `<mona-list-view>...</mona-list-view>`.

| Directive                              | Selector                                       | Template context                           | Replaces                                             |
|----------------------------------------|------------------------------------------------|--------------------------------------------|------------------------------------------------------|
| `ListViewHeaderTemplateDirective`      | `ng-template[monaListViewHeaderTemplate]`      | None                                       | No default — renders above the list                  |
| `ListViewItemTemplateDirective`        | `ng-template[monaListViewItemTemplate]`        | `{ $implicit: T }` (the raw data item)     | The default text rendered from `textField`           |
| `ListViewGroupHeaderTemplateDirective` | `ng-template[monaListViewGroupHeaderTemplate]` | `{ $implicit: K }` (the group's key value) | The default bold group header text                   |
| `ListViewFooterTemplateDirective`      | `ng-template[monaListViewFooterTemplate]`      | None                                       | No default — renders below the list, above the pager |
| `ListViewNoDataTemplateDirective`      | `ng-template[monaListViewNoDataTemplate]`      | None                                       | The default "No data" placeholder                    |

```html
<mona-list-view [items]="items" textField="name">
    <ng-template monaListViewHeaderTemplate>
        <div class="font-bold px-3 py-1">Food List</div>
    </ng-template>
    <ng-template monaListViewItemTemplate let-item>
        <span class="flex-1">{{ item.name }}</span>
        <span class="text-green-600">${{ item.price }}</span>
    </ng-template>
    <ng-template monaListViewNoDataTemplate>
        <div class="flex items-center justify-center h-full">No items available.</div>
    </ng-template>
</mona-list-view>
```

## Feature Examples

### Single and multiple selection

```html
<mona-list-view
    [items]="items"
    textField="name"
    [monaListViewSelectable]="{ mode: 'single', toggleable: true }"
    selectBy="id"
    [selectedKeys]="selectedIds"
    (selectedKeysChange)="onSelectedIdsChange($event)">
</mona-list-view>
```

`selectBy` derives the key used for `selectedKeys`/`selectedKeysChange`; when omitted, the data item itself is used as the key. `mode: "multiple"` allows selecting more than one item; `toggleable` (single mode only) lets the user deselect the current item by clicking it again. Set `checkboxes: true` on the options object to render a checkbox per item instead of relying on background color alone.

### Keyboard navigation

```html
<mona-list-view [items]="items" textField="name" [monaListViewNavigable]="{ mode: 'select', wrap: true }" monaListViewSelectable>
</mona-list-view>
```

`monaListViewNavigable` is required for arrow-key/Home/End/typeahead navigation — see [Keyboard](#keyboard). `mode: "select"` moves the selection as the user navigates; `mode: "highlight"` (the default) only moves a visual highlight, leaving selection to click/Enter. `wrap` (default `false`) makes navigating past the last item cycle back to the first.

### Grouping

```html
<mona-list-view
    [items]="items"
    textField="name"
    [monaListViewGroupable]="{ enabled: true, headerOrder: 'asc', orderBy: 'name' }"
    groupBy="category">
</mona-list-view>
```

`groupBy` selects the field (or a function) used to bucket items; each distinct value renders as a group header row. `orderBy`/`orderByDirection` sort items within each group; `headerOrder` sorts the groups themselves by their key. Dates group by their time, so two `Date` objects for the same moment share a group and date groups sort chronologically. Headers show dates in the locale's medium date format and numbers in the locale's digits; set `headerText` to format them yourself. The group header template receives the group's value (a `Date` stays a `Date`). If `groupBy` is omitted while grouping is enabled, every item falls into a single, unlabeled group — always provide `groupBy` together with `monaListViewGroupable`.

### Pagination

```html
<mona-list-view [items]="items" textField="name" [monaListViewPageable]="{ pageSizeValues: [10, 25, 50] }"> </mona-list-view>
```

Adds a pager below the list. Pagination and virtualization are mutually exclusive: if `monaListViewVirtualScroll` is also enabled, the pager is hidden regardless of `monaListViewPageable`'s state — see [Pagination and virtualization don't combine](#pagination-and-virtualization-dont-combine).

### Virtual scrolling

```html
<mona-list-view [items]="items" textField="name" [monaListViewVirtualScroll]="{ enabled: true, height: 32 }" [height]="'400px'">
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
<mona-list-view [items]="items | slice: 0 : visibleCount()" textField="name" [height]="'300px'" (scrollBottom)="onScrollBottom()">
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
| Any letter, digit, space, hyphen, or underscore | Typeahead: jumps to the next item whose text starts with the typed characters (resets after a short pause). In multiple selection it moves focus only. |

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

## API

### `ListViewComponent`

**Selector:** `mona-list-view`

#### Inputs

| Name            | Type                                       | Default    | Description                                                                 |
|-----------------|--------------------------------------------|------------|-----------------------------------------------------------------------------|
| `aria-label`    | `string`                                   | `""`       | Accessible name for the list's `listbox` element.                           |
| `class`         | `string`                                   | `""`       | Additional CSS classes merged onto the host element via `tailwind-merge`.   |
| `aria-labelledby` | `string`                                 | `""`       | Id of the element that names the list, instead of `aria-label`.             |
| `disabledBy`    | `string \| ((item: T) => boolean) \| null` | `""`       | Property name or predicate that marks an item as disabled.                  |
| `height`        | `string \| number`                         | `"100%"`   | Sets the height of the list view. See [Virtual scrolling](#virtual-scrolling). |
| `items`         | `Iterable<T>`                              | `[]`       | Collection of items to render.                                              |
| `listClass`     | `string`                                   | `""`       | Sets the classes of the inner `<ul>` element.                               |
| `listItemClass` | `string`                                   | `""`       | Sets the classes of the list items.                                         |
| `listItemStyle` | `Partial<CSSStyleDeclaration>`             | `{}`       | Sets the style of the list items.                                           |
| `loading`       | `boolean`                                  | `false`    | Marks the list as loading: `aria-busy` and a polite "Loading" status.       |
| `listStyle`     | `Partial<CSSStyleDeclaration>`             | `{}`       | Sets the style of the list.                                                 |
| `maxHeight`     | `string \| number`                         | `""`       | Sets the maximum height of the list.                                        |
| `maxWidth`      | `string \| number`                         | `""`       | Sets the maximum width of the list.                                         |
| `pagerAriaLabel` | `string`                                  | `""`       | Name of the pager. Defaults to "{name} pagination" from `aria-label`.       |
| `rounded`       | `"none" \| "small" \| "medium" \| "large"` | `"medium"` | Border-radius preset applied to the component.                              |
| `size`          | `"small" \| "medium" \| "large"`           | `"medium"` | Size preset controlling the component's dimensions.                         |
| `textField`     | `string \| ((item: T) => string) \| null`  | `""`       | Property name or accessor used to derive the display text from a data item. |
| `width`         | `string \| number`                         | `"100%"`   | Sets the width of the list view.                                            |

#### Outputs

| Name           | Type    | Description                                                                                                                                                                                       |
|----------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `itemActivate` | `T`     | Emitted with the data item when the user clicks an enabled item or presses Enter on it, whether or not the list view is selectable. |
| `scrollBottom` | `Event` | Emitted once each time the list is scrolled to its bottom. Does not fire while `monaListViewPageable` is enabled — see [`scrollBottom` and `monaListViewPageable`](#scrollbottom-and-monalistviewpageable). |

---

### `ListViewSelectableDirective<T, K = unknown>`

**Selector:** `mona-list-view[monaListViewSelectable]`

#### Inputs

| Name                     | Type                                 | Default | Description                                                                                                                                                                         |
|--------------------------|--------------------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaListViewSelectable` | `Partial<SelectableOptions> \| ""`   | `""`    | Enables selection. An empty string enables single selection with default settings; pass an object to configure `mode` (`"single"` or `"multiple"`), `toggleable`, and `checkboxes`. |
| `selectBy`               | `string \| ((item: T) => K) \| null` | `""`    | Property name or accessor used to derive the selection key from a data item. When omitted, the data item itself is used as the key.                                                 |
| `selectedKeys`           | `Iterable<K>`                        | `[]`    | Two-way-equivalent initial/programmatic selection, expressed as keys rather than items. Pair with `(selectedKeysChange)` to keep it in sync.                                        |

#### Outputs

| Name                 | Type       | Description                                    |
|----------------------|------------|------------------------------------------------|
| `selectedKeysChange` | `Array<K>` | Emitted when the set of selected keys changes. |

---

### `ListViewNavigableDirective<T>`

**Selector:** `mona-list-view[monaListViewNavigable]`

#### Inputs

| Name                    | Type                              | Default | Description                                                                                                                                                          |
|-------------------------|-----------------------------------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaListViewNavigable` | `Partial<NavigableOptions> \| ""` | `""`    | Enables keyboard navigation. An empty string enables navigation with default settings (`mode: "highlight"`, `wrap: false`); pass an object to override either field. |

---

### `ListViewGroupableDirective<T, K = T>`

**Selector:** `mona-list-view[monaListViewGroupable]`

#### Inputs

| Name                    | Type                                 | Default | Description                                                                                                                                             |
|-------------------------|--------------------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `groupBy`               | `string \| ((item: T) => K) \| null` | `""`    | Property name or accessor used to derive the group key from a data item.                                                                                |
| `monaListViewGroupable` | `GroupableOptions<T, K> \| ""`       | `""`    | Enables grouping. An empty string enables grouping with default settings; pass an object to configure `headerOrder`, `headerText`, `orderBy`, and `orderByDirection`. |

---

### `ListViewPageableDirective`

**Selector:** `mona-list-view[monaListViewPageable]`

#### Inputs

| Name                   | Type                           | Default | Description                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------|--------------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaListViewPageable` | `Partial<PagerSettings> \| ""` | `""`    | Enables pagination. An empty string enables pagination with default settings (`type: "numeric"`, `previousNext: true`, `pageSize: 10`, `pageSizeValues: [5, 10, 20, 25, 50, 100]`, `visiblePages: 5`); pass an object to override any field. Has no visible effect while `monaListViewVirtualScroll` is enabled — see [Pagination and virtualization don't combine](#pagination-and-virtualization-dont-combine). |
| `page`                 | `number`                       | `1`     | The current page. A `model()` input — supports two-way binding via `[(page)]`; also settable one-way via `[page]` and readable via `(pageChange)` to react to pager navigation.                                                                                                                                                                                                                 |
| `pageSize`             | `number \| undefined`          | `undefined` | Items per page. A `model()` input — supports `[(pageSize)]` and updates when the user picks a size. While unset, the options' `pageSize` applies. A new size keeps the first item of the current page in view. |

#### Outputs

| Name         | Type               | Description                                                                                        |
|--------------|--------------------|-----------------------------------------------------------------------------------------------------|
| `pageChange`     | `number`              | Emitted when the user moves to another page (not when `[page]` is set from code).                     |
| `pageSizeChange` | `number`              | Emitted when the user picks another page size.                                                         |
| `pageSizeSelect` | `PageSizeChangeEvent` | Emitted when the user picks a page size, before it applies. Call `preventDefault()` to keep the size. |

---

### `ListViewVirtualScrollDirective<T>`

**Selector:** `mona-list-view[monaListViewVirtualScroll]`

#### Inputs

| Name                        | Type                   | Default      | Description                                                                                                                                         |
|-----------------------------|------------------------|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaListViewVirtualScroll` | `VirtualScrollOptions` | — (required) | Enables virtual scrolling. `height` is the fixed row height, in pixels, used to measure the viewport; when omitted, a `28`px row height is assumed. |

---

### Exported Types

#### `GroupableOptions<T = unknown, R = unknown>`

| Field              | Type                                      | Description                                                             |
|--------------------|-------------------------------------------|-------------------------------------------------------------------------|
| `enabled`          | `boolean \| undefined`                    | Whether grouping is active.                                             |
| `headerOrder`      | `"asc" \| "desc" \| undefined`            | Sort direction applied to group headers by their key.                   |
| `headerText`       | `((value: unknown) => string) \| undefined` | Text of a group's header, from its value. Defaults to locale-formatted dates and numbers, `String(value)` otherwise. |
| `orderBy`          | `string \| ((item: T) => R) \| undefined` | Property name or accessor used to sort items within each group.         |
| `orderByDirection` | `"asc" \| "desc" \| undefined`            | Sort direction applied by `orderBy`. Ignored when `orderBy` is not set. |

#### `NavigableOptions`

| Field     | Type                      | Description                                                                                              |
|-----------|---------------------------|----------------------------------------------------------------------------------------------------------|
| `enabled` | `boolean`                 | Whether keyboard navigation is active.                                                                   |
| `mode`    | `"highlight" \| "select"` | Whether navigation only moves a visual highlight (`"highlight"`) or also changes selection (`"select"`). |
| `wrap`    | `boolean`                 | Whether navigating past the last (or before the first) item cycles to the other end.                     |

#### `PagerSettings`

| Field            | Type                   | Description                                                                         |
|------------------|------------------------|-------------------------------------------------------------------------------------|
| `enabled`        | `boolean`              | Whether the pager is active.                                                        |
| `firstLast`      | `boolean`              | Whether first/last page buttons are shown.                                          |
| `pageSize`       | `number`               | Number of items shown per page.                                                    |
| `pageSizeValues` | `number[] \| boolean`  | Page size options shown in the pager, or `false`/`true` to hide/show a default set. |
| `previousNext`   | `boolean`              | Whether previous/next page buttons are shown.                                       |
| `showInfo`       | `boolean`              | Whether a page summary (e.g. "1-10 of 50") is shown.                                |
| `type`           | `"numeric" \| "input"` | Whether pages are selected via numbered buttons or a page-number input.             |
| `visiblePages`   | `number`               | Number of numeric page buttons shown at once, when `type` is `"numeric"`.           |

#### `VirtualScrollOptions`

| Field     | Type                  | Description                                                               |
|-----------|-----------------------|---------------------------------------------------------------------------|
| `enabled` | `boolean`             | Whether virtual scrolling is active.                                      |
| `height`  | `number \| undefined` | Fixed row height, in pixels, used to measure the virtual scroll viewport. |

---

<!-- verification-checklist
- [x] ListViewComponent inputs/defaults verified against list-view.component.ts source and cross-checked against component-metadata.json's ListViewComponent entry
- [x] scrollBottom output behavior (fires on plain-list or cdk-virtual-scroll-viewport scroll, suppressed while pageable is enabled via #scrollBottomEnabled) verified against list-view.component.ts setScrollBottomEvent()/#scrollBottomEnabled
- [x] Five behavior directives (Selectable, Navigable, Groupable, Pageable, VirtualScroll) inputs/outputs and default option objects verified against their respective directive source files in list-view/directives
- [x] Five structural template directives and their selectors verified against list-view/directives/*-template.directive.ts; template contexts verified against list-view.component.html's ngTemplateOutletContext bindings and list-item.component.html's dataItem() context
- [x] Pagination/virtualization mutual exclusion verified against list-view.component.html's pager @if guard (pageableOptions.enabled && !virtualScrollOptions().enabled)
- [x] Keyboard map (ArrowDown/ArrowUp/Home/End/PageUp/PageDown/Enter/typeahead) verified against common/list/utils/getListNavigationDirection.ts, common/list/components/list/list.component.ts (setNavigationEvents/setKeyboardEvents/handlePageScroll), and common/utils/typeahead.util.ts
- [x] Single Tab-stop focus behavior verified against the roving-tabindex implementation: ListService.focusableItem (highlighted → selected → first enabled) drives ListItemDirective's rovingTabIndex (0 on the active item, -1 on all others) and ListComponent's hostTabIndex (0 only as a fallback when no item is focusable, -1 otherwise); the host's native "focus" listener's relatedTarget guard (list.component.ts) prevents it from stealing focus back from an item when programmatically re-focused
- [x] ARIA attributes (role=listbox/option, aria-selected, aria-disabled, aria-current, aria-posinset, aria-setsize) verified against common/list/directives/list-item.directive.ts host bindings
- [x] GroupableOptions, NavigableOptions, PagerSettings, VirtualScrollOptions confirmed exported via lib/index.ts; SelectableOptions (common/list one), ListKeySelector, ListItem, and ListItemTemplateContext confirmed NOT exported, and the list-view-demo's deep import of SelectableOptions from "mona-ui/src/lib/..." cited as evidence
- [x] VirtualScrollOptions.height documented as optional per the N-2 fix (common/models/VirtualScrollOptions.ts), with the 28px fallback verified against list.component.ts's viewportHeight/scrollToItem computations
- [x] disabledBy confirmed to exist only on ListService, with no corresponding ListViewComponent input — marked as owner-review TODO rather than documented as public API
- [x] No internal-only symbols (ListService, ListComponent, ListItemComponent, ListItemDirective, ListItem, cycleThroughMatchedItems, typeahead.util) documented as public API
-->
