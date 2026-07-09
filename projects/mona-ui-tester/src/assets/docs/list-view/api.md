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

`groupBy` selects the field (or a function) used to bucket items; each distinct value renders as a group header row. `orderBy`/`orderByDirection` sort items within each group; `headerOrder` sorts the groups themselves by their key. If `groupBy` is omitted while grouping is enabled, every item falls into a single, unlabeled group — always provide `groupBy` together with `monaListViewGroupable`.

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

Renders only the items currently scrolled into view, for large collections. `height` on the options object is the fixed row height, in pixels, used to measure the virtual scroll viewport — every item must render at that height for scrolling to stay accurate.

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

`scrollBottom` emits once each time the list is scrolled within roughly 3px of its bottom edge, whichever of the plain list or the virtual scroll viewport is active. Combine it with slicing a larger source collection to implement infinite loading — see [`scrollBottom` and `monaListViewPageable`](#scrollbottom-and-monalistviewpageable).

## Technical & Behavior Notes

### Pagination and virtualization don't combine

When `monaListViewVirtualScroll` reports `enabled: true`, the pager rendered by `monaListViewPageable` is not shown, even if the pageable options are also `enabled: true`. Only one of the two should be applied to a given list.

### `scrollBottom` and `monaListViewPageable`

`scrollBottom` only fires while pagination is disabled. If `monaListViewPageable` is enabled, scrolling to the bottom of the current page does not emit `scrollBottom` — pagination and infinite scroll are alternative strategies for large collections, not composable ones.

### `SelectableOptions` is not exported

`monaListViewSelectable`'s options object is typed as `SelectableOptions` internally, but that type is not re-exported from `@nanahoshi/mona-ui`. Inline object literals (as in the examples above) still type-check structurally; only a standalone typed variable would require an import.
`TODO(owner-review): confirm whether SelectableOptions should be added to the public barrel export.`

### Grouping key type defaults to the item type

`monaListViewGroupable`'s generic key parameter defaults to the item type itself rather than `unknown`. In practice, always pass an explicit `groupBy` selector (a property name or a function returning the group key) — grouping without one produces a single, unlabeled group.

## Accessibility & Forms Integration

### Keyboard

Keyboard navigation requires `monaListViewNavigable`.

| Key                                             | Action                                                                                                      |
|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `ArrowDown`                                     | Move to the next enabled item.                                                                              |
| `ArrowUp`                                       | Move to the previous enabled item.                                                                          |
| `Home`                                          | Move to the first enabled item.                                                                             |
| `End`                                           | Move to the last enabled item.                                                                              |
| `PageDown`                                      | Scroll the list forward by roughly one viewport.                                                            |
| `PageUp`                                        | Scroll the list back by roughly one viewport.                                                               |
| `Enter`                                         | Select the highlighted or currently selected item.                                                          |
| Any letter, digit, space, hyphen, or underscore | Typeahead: jumps to the next item whose text starts with the typed characters (resets after a short pause). |

Disabled items (set through the underlying list's `disabledBy`, not currently exposed as a `ListViewComponent` input — `TODO(owner-review): confirm whether list-view should expose a disabledBy input`) are skipped during navigation.

### Focus

The list is a single Tab stop. Tabbing into `<mona-list-view>` focuses its first selectable item (or the currently selected item, if any); Tab/Shift+Tab then moves focus to the next element outside the list, not between items — use the keyboard map above to move within the list.

### ARIA

| Attribute                        | When present                      | Value                                                                  |
|----------------------------------|-----------------------------------|------------------------------------------------------------------------|
| `role`                           | Always, on the inner list element | `"listbox"`                                                            |
| `role`                           | Always, on each item              | `"option"`                                                             |
| `aria-selected`                  | Always, on each item              | Reflects whether the item is selected                                  |
| `aria-disabled`                  | Always, on each item              | Reflects whether the item is disabled                                  |
| `aria-current`                   | Always, on each item              | Reflects whether the item is the currently highlighted item            |
| `aria-posinset` / `aria-setsize` | Always, on each item              | The item's 1-based position and the total count among non-header items |

`ListViewComponent` does not accept an `aria-label`/`aria-labelledby` input; provide an accessible name for the list via a `monaListViewHeaderTemplate` heading or a wrapping landmark, as needed.

Form integration is not applicable — List View is a display/selection widget, not a form control.

## API

### `ListViewComponent`

**Selector:** `mona-list-view`

#### Inputs

| Name            | Type                                       | Default    | Description                                                                 |
|-----------------|--------------------------------------------|------------|-----------------------------------------------------------------------------|
| `class`         | `string`                                   | `""`       | Additional CSS classes merged onto the host element via `tailwind-merge`.   |
| `height`        | `string \| number`                         | `"100%"`   | Sets the height of the list view.                                           |
| `items`         | `Iterable<T>`                              | `[]`       | Collection of items to render.                                              |
| `listClass`     | `string`                                   | `""`       | Sets the classes of the inner `<ul>` element.                               |
| `listItemClass` | `string`                                   | `""`       | Sets the classes of the list items.                                         |
| `listItemStyle` | `Partial<CSSStyleDeclaration>`             | `{}`       | Sets the style of the list items.                                           |
| `listStyle`     | `Partial<CSSStyleDeclaration>`             | `{}`       | Sets the style of the list.                                                 |
| `maxHeight`     | `string \| number`                         | `""`       | Sets the maximum height of the list.                                        |
| `maxWidth`      | `string \| number`                         | `""`       | Sets the maximum width of the list.                                         |
| `rounded`       | `"none" \| "small" \| "medium" \| "large"` | `"medium"` | Border-radius preset applied to the component.                              |
| `size`          | `"small" \| "medium" \| "large"`           | `"medium"` | Size preset controlling the component's dimensions.                         |
| `textField`     | `string \| ((item: T) => string) \| null`  | `""`       | Property name or accessor used to derive the display text from a data item. |
| `width`         | `string \| number`                         | `"100%"`   | Sets the width of the list view.                                            |

#### Outputs

| Name           | Type    | Description                                                                                                                                                                                       |
|----------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `scrollBottom` | `Event` | Emitted when the list is scrolled to the bottom. Does not fire while `monaListViewPageable` is enabled — see [`scrollBottom` and `monaListViewPageable`](#scrollbottom-and-monalistviewpageable). |

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
| `monaListViewGroupable` | `GroupableOptions<T, K> \| ""`       | `""`    | Enables grouping. An empty string enables grouping with default settings; pass an object to configure `headerOrder`, `orderBy`, and `orderByDirection`. |

---

### `ListViewPageableDirective`

**Selector:** `mona-list-view[monaListViewPageable]`

#### Inputs

| Name                   | Type                           | Default | Description                                                                                                                                                                                                                                                                                                                                                                                       |
|------------------------|--------------------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `monaListViewPageable` | `Partial<PagerSettings> \| ""` | `""`    | Enables pagination. An empty string enables pagination with default settings (`type: "numeric"`, `previousNext: true`, `pageSizeValues: [5, 10, 20, 25, 50, 100]`, `visiblePages: 5`); pass an object to override any field. Has no visible effect while `monaListViewVirtualScroll` is enabled — see [Pagination and virtualization don't combine](#pagination-and-virtualization-dont-combine). |

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
