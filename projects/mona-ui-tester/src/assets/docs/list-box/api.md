## Overview & Component Selection

List Box renders a `role="listbox"` list of items, built on top of List View, with two additional capabilities: in-place selection toggling and an optional action toolbar for moving, clearing, removing, and transferring items to and from a second, connected list box.

Used on its own, a list box behaves like a selectable list with arrow-key navigation. Connect two list boxes through `connectedList` and the toolbar renders automatically, giving consumers a working "available items ⇄ selected items" picker without hand-rolling the transfer logic.

**Use List Box when:**

- You need a picker where items live in one or two always-visible lists rather than behind a popup.
- You want the built-in move/transfer/clear/remove toolbar between two related lists of items.

**Use `List View` instead when:**

- You need grouping, pagination, or virtual scrolling — List Box does not expose these.

**Use `MultiSelect`/`DropDownList`/`ComboBox` instead when:**

- Selected items should collapse into a compact, popup-triggered control rather than stay visible as a full list.

## Import & Quick Start

```typescript
import { ListBoxComponent } from "@nanahoshi/mona-ui";
```

```html
<mona-list-box [items]="items" textField="name" selectBy="id" [height]="'320px'"></mona-list-box>
```

`items` accepts any `Iterable<T>`. `selectBy` derives the key used by `selectedKeys`/`selectedKeysChange`; when omitted, the data item itself is used as the key. The action toolbar is not shown until a `connectedList` is provided — see [Connected list boxes with a transfer toolbar](#connected-list-boxes-with-a-transfer-toolbar).

## Anatomy & Public Structural Templates

Each structural directive below is an `ng-template` placed as projected content inside `<mona-list-box>...</mona-list-box>`.

| Directive                        | Selector                                 | Template context                                                          | Replaces                                   |
|----------------------------------|------------------------------------------|---------------------------------------------------------------------------|--------------------------------------------|
| `ListBoxHeaderTemplateDirective` | `ng-template[monaListBoxHeaderTemplate]` | None                                                                      | No default — renders above the list        |
| `ListBoxItemTemplateDirective`   | `ng-template[monaListBoxItemTemplate]`   | `{ $implicit: T }` (the raw data item) — see `ListBoxItemTemplateContext` | The default text rendered from `textField` |
| `ListBoxFooterTemplateDirective` | `ng-template[monaListBoxFooterTemplate]` | None                                                                      | No default — renders below the list        |
| `ListBoxNoDataTemplateDirective` | `ng-template[monaListBoxNoDataTemplate]` | None                                                                      | The default "No data" placeholder          |

```html
<mona-list-box [items]="items" textField="name" selectBy="id">
    <ng-template monaListBoxHeaderTemplate>
        <div class="font-medium px-3 py-2 border-b border-input-border">Food Items</div>
    </ng-template>
    <ng-template monaListBoxItemTemplate let-item>
        <span class="flex-1">{{ item.name }}</span>
        <span class="text-green-600">${{ item.price }}</span>
    </ng-template>
    <ng-template monaListBoxNoDataTemplate>
        <div class="flex items-center justify-center h-full">No items available.</div>
    </ng-template>
</mona-list-box>
```

## Feature Examples

### Single selection with toggle

```html
<mona-list-box
    [items]="items"
    textField="name"
    selectBy="id"
    [selectedKeys]="selectedIds"
    (selectedKeysChange)="onSelectedIdsChange($event)">
</mona-list-box>
```

With the default `selectionMode` (`"single"`) and `singleSelectionToggleable` (`true`), clicking the selected item again deselects it. Set `[singleSelectionToggleable]="false"` to require selecting a different item instead.

### Multiple selection

```html
<mona-list-box [items]="items" textField="name" selectBy="id" selectionMode="multiple" [selectedKeys]="selectedIds">
</mona-list-box>
```

### Connected list boxes with a transfer toolbar

```html
<mona-list-box
    #available
    [items]="availableItems()"
    textField="name"
    selectBy="id"
    [connectedList]="selected()"
    (actionClick)="onActionClick($event)">
</mona-list-box>
<mona-list-box #selected [items]="selectedItems()" textField="name" selectBy="id"></mona-list-box>
```

```typescript
protected onActionClick(event: ListBoxActionEvent<Food>): void {
    if (event.action === "transferTo") {
        this.selectedItems.update(items => [...items, ...event.selectedItems]);
        this.availableItems.update(items => items.filter(i => !event.selectedItems.includes(i)));
    } else if (event.action === "transferFrom") {
        this.availableItems.update(items => [...items, ...event.selectedItems]);
        this.selectedItems.update(items => items.filter(i => !event.selectedItems.includes(i)));
    }
    // "transferAllTo"/"transferAllFrom"/"moveUp"/"moveDown"/"clear"/"remove" follow the same pattern —
    // see "The component does not mutate `items` itself" below.
}
```

Setting `connectedList` on `available` (pointing at `selected`) is enough — `selected` does not need `connectedList` set back. The toolbar renders on `available` and controls both lists; see [The component does not mutate `items` itself](#the-component-does-not-mutate-items-itself) for what each action requires from the consumer.

### Customizing the toolbar

```html
<mona-list-box
    [items]="items"
    textField="name"
    selectBy="id"
    [connectedList]="selected()"
    [toolbar]="{ actions: ['transferTo', 'transferFrom'], position: 'right' }">
</mona-list-box>
```

`toolbar` accepts `true` (all actions, right-positioned), `false` (no toolbar, regardless of `connectedList`), or an options object. Omitting `actions` on the object falls back to all actions; passing `actions: []` renders the toolbar's container with no buttons in it, rather than hiding it.

## Technical & Behavior Notes

### The component does not mutate `items` itself

List Box never adds, removes, or reorders the collection passed to `items`. Every toolbar action — move, transfer, clear, remove — only emits `actionClick` with a cancelable event describing what was requested; updating the consumer's own data source (as in the [transfer example](#connected-list-boxes-with-a-transfer-toolbar) above) is required for the list to visibly change. Calling `event.preventDefault()` only skips the component's internal selection-clearing/scroll bookkeeping — it never affects whether data was already mutated by the consumer's own handler, since that mutation always happens in the same handler.

### Which list box's `actionClick` fires

| Action                            | Fires on                                                                                          |
|-----------------------------------|---------------------------------------------------------------------------------------------------|
| `clear`, `remove`                 | Whichever list box (`this` or `connectedList`) currently holds the selection.                     |
| `moveUp`, `moveDown`              | Whichever list box currently holds the selection. Not emitted at all if neither list box has one. |
| `transferTo`, `transferAllTo`     | The list box the toolbar is attached to.                                                          |
| `transferFrom`, `transferAllFrom` | The `connectedList`.                                                                              |

### Arrow-key navigation moves the selection

Unlike List View (which defaults to highlight-only navigation), List Box always navigates in `"select"` mode: arrow keys immediately change the selection rather than only moving a visual highlight.

### `selectBy`/`textField` accept a property name or a function

Both accept a string property name or a function `(item: T) => K`/`(item: T) => string`. When `selectBy` is omitted, the data item itself is used as the selection key.

## Accessibility & Forms Integration

### Keyboard

| Key                                             | Action                                                                                                      |
|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `ArrowDown`                                     | Select the next enabled item.                                                                               |
| `ArrowUp`                                       | Select the previous enabled item.                                                                           |
| `Home`                                          | Select the first enabled item.                                                                              |
| `End`                                           | Select the last enabled item.                                                                               |
| `PageDown`                                      | Scroll the list forward by roughly one viewport.                                                            |
| `PageUp`                                        | Scroll the list back by roughly one viewport.                                                               |
| `Enter`                                         | Select the highlighted or currently selected item.                                                          |
| Any letter, digit, space, hyphen, or underscore | Typeahead: jumps to the next item whose text starts with the typed characters (resets after a short pause). |

### Focus

The list is a single Tab stop, as in List View — Tab/Shift+Tab moves focus into and out of the list as a whole, not between items; use the keyboard map above to move within the list.

### ARIA

| Attribute                        | When present                         | Value                                           |
|----------------------------------|--------------------------------------|-------------------------------------------------|
| `role`                           | Always, on the inner list element    | `"listbox"`                                     |
| `aria-label`                     | When `ariaLabel`/`aria-label` is set | The provided string                             |
| `role`                           | Always, on each item                 | `"option"`                                      |
| `aria-selected`                  | Always, on each item                 | Reflects whether the item is selected           |
| `aria-disabled`                  | Always, on each item                 | Reflects whether the item is disabled           |
| `aria-posinset` / `aria-setsize` | Always, on each item                 | The item's 1-based position and the total count |

Each toolbar button (Move Up, Move Down, Transfer From/To, Transfer All From/To, Clear Selection, Remove) carries its own `aria-label` matching its visible tooltip, so no consumer action is needed there. The toolbar itself renders as a plain `<div>` of buttons with no `role="toolbar"` grouping.

When connecting two list boxes, set a distinct `aria-label` on each so assistive technology can tell them apart — the component does not label them for you.

Form integration is not applicable — List Box is a display/selection widget, not a form control.

## API

### `ListBoxComponent<T = unknown, K = unknown>`

**Selector:** `mona-list-box`

#### Inputs

| Name                        | Type                                       | Default    | Description                                                                                                                                                                                                                                 |
|-----------------------------|--------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`                | `string`                                   | `""`       | Accessible name for the list box's `listbox` element. Describe what the list represents, which matters in particular when connecting two list boxes. Bound as `[aria-label]`/plain `aria-label` (the input's property name is `ariaLabel`). |
| `connectedList`             | `ListBoxComponent<T, K> \| null`           | `null`     | The other list box to transfer items to and from using the toolbar actions.                                                                                                                                                                 |
| `height`                    | `string \| number`                         | `"100%"`   | Sets the height of the component.                                                                                                                                                                                                           |
| `items`                     | `Iterable<T>`                              | `[]`       | Collection of items to render.                                                                                                                                                                                                              |
| `rounded`                   | `"none" \| "small" \| "medium" \| "large"` | `"medium"` | Border-radius preset applied to the component.                                                                                                                                                                                              |
| `selectBy`                  | `string \| ((item: T) => K) \| null`       | `""`       | Property name or accessor used to derive the key from a data item, used to identify selected items.                                                                                                                                         |
| `selectedKeys`              | `Iterable<K>`                              | `[]`       | Keys of the currently selected items. Pair with `(selectedKeysChange)` to keep in sync.                                                                                                                                                     |
| `selectionMode`             | `SelectionMode` (`"single" \| "multiple"`) | `"single"` | Allows multiple items to be selected simultaneously when set to `"multiple"`.                                                                                                                                                               |
| `singleSelectionToggleable` | `boolean`                                  | `true`     | Allows an already-selected item to be deselected by clicking it again while `selectionMode` is `"single"`. Has no effect when `selectionMode` is `"multiple"`.                                                                              |
| `size`                      | `"small" \| "medium" \| "large"`           | `"medium"` | Size preset controlling the component's dimensions.                                                                                                                                                                                         |
| `textField`                 | `string \| ((item: T) => string) \| null`  | `""`       | Property name or accessor used to derive the display text from a data item.                                                                                                                                                                 |
| `toolbar`                   | `boolean \| Partial<ToolbarOptions>`       | `true`     | Shows the action toolbar. Pass `false` to hide it entirely, or an options object to customize which actions are shown and where the toolbar is positioned. The toolbar is only rendered while `connectedList` is also set.                  |
| `width`                     | `string \| number`                         | `"100%"`   | Sets the width of the component.                                                                                                                                                                                                            |

#### Outputs

| Name                 | Type                       | Description                                                                                                                                                                                                                                                     |
|----------------------|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `actionClick`        | `ListBoxActionEvent<T>`    | Emitted when a toolbar action button is clicked, carrying the action's details. See [Which list box's `actionClick` fires](#which-list-boxs-actionclick-fires) and [The component does not mutate `items` itself](#the-component-does-not-mutate-items-itself). |
| `selectedKeysChange` | `K[]`                      | Emitted with the updated keys whenever the selection changes.                                                                                                                                                                                                   |
| `selectionChange`    | `ListBoxSelectionEvent<T>` | Emitted with the selected and deselected items whenever the selection changes.                                                                                                                                                                                  |

#### Public methods

| Name                            | Description                                                                                                                                          |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clearSelections(): void`       | Clears the current selection without emitting `selectionChange`. Call `notifySelectionChange()` afterward if the resulting change should be emitted. |
| `notifySelectionChange(): void` | Emits `selectionChange` for any selection changes made since the last notification (e.g. after calling `clearSelections()` directly).                |

---

### Cancelable action events

`ListBoxClearEvent`, `ListBoxMoveEvent`, `ListBoxRemoveEvent`, and `ListBoxTransferEvent` all extend `PreventableEvent`. Call `event.preventDefault()` in an `actionClick` handler to skip the component's internal selection-clearing/scroll bookkeeping for that action (this does not undo any data mutation the same handler already performed).

#### `ListBoxClearEvent<T = unknown>`

| Property        | Type      | Description                                                    |
|-----------------|-----------|----------------------------------------------------------------|
| `action`        | `"clear"` | Discriminant matching the `ListBoxActionEvent` union.          |
| `selectedItems` | `T[]`     | The items that were selected when Clear Selection was clicked. |

#### `ListBoxMoveEvent<T = unknown>`

| Property          | Type                     | Description                                               |
|-------------------|--------------------------|-----------------------------------------------------------|
| `action`          | `"moveDown" \| "moveUp"` | Discriminant matching the `ListBoxActionEvent` union.     |
| `newIndex`        | `number`                 | The index the selection would move to.                    |
| `oldIndex`        | `number`                 | The index of the first selected item before the move.     |
| `selectedIndices` | `number[]`               | Indices of all selected items before the move.            |
| `selectedItems`   | `T[]`                    | The items that were selected when the move was requested. |

#### `ListBoxRemoveEvent<T = unknown>`

| Property        | Type       | Description                                           |
|-----------------|------------|-------------------------------------------------------|
| `action`        | `"remove"` | Discriminant matching the `ListBoxActionEvent` union. |
| `selectedItems` | `T[]`      | The items that were selected when Remove was clicked. |

#### `ListBoxTransferEvent<T = unknown>`

| Property        | Type                                                                     | Description                                                                                                                                                                          |
|-----------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `action`        | `"transferAllFrom" \| "transferAllTo" \| "transferFrom" \| "transferTo"` | Discriminant matching the `ListBoxActionEvent` union.                                                                                                                                |
| `selectedItems` | `T[]`                                                                    | The items that were selected when the transfer was requested. Not populated for the "all" variants — see [Which list box's `actionClick` fires](#which-list-boxs-actionclick-fires). |

---

### Exported Types

#### `ListBoxActionEvent<T = unknown>`

`ListBoxClearEvent<T> | ListBoxMoveEvent<T> | ListBoxRemoveEvent<T> | ListBoxTransferEvent<T>` — narrow on the `action` field to determine which one was emitted.

#### `ListBoxItemTemplateContext<T = unknown>`

| Field       | Type | Description                       |
|-------------|------|-----------------------------------|
| `$implicit` | `T`  | The raw data item being rendered. |

#### `ListBoxSelectionEvent<T = unknown>`

| Field             | Type  | Description                  |
|-------------------|-------|------------------------------|
| `deselectedItems` | `T[]` | Items that were deselected.  |
| `selectedItems`   | `T[]` | Items that are now selected. |

#### `ToolbarOptions`

| Field      | Type                                     | Description                                    |
|------------|------------------------------------------|------------------------------------------------|
| `actions`  | `ToolbarAction[]`                        | Which toolbar buttons to show, in order.       |
| `position` | `"top" \| "right" \| "bottom" \| "left"` | Which side of the list the toolbar renders on. |

#### `ToolbarAction`

`"clear" | "moveDown" | "moveUp" | "remove" | "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo"`

---

<!-- verification-checklist
- [x] ListBoxComponent inputs/defaults verified against list-box.component.ts source and cross-checked against component-metadata.json's ListBoxComponent entry
- [x] `ariaLabel` input's `{ alias: "aria-label" }` binding verified against list-box.component.ts; documented as bound via the alias per current source
- [x] connectedList/toolbar toolbar-visibility behavior verified against list-box.component.html's `@if (options !== null && connectedListBox !== null)` guard
- [x] "Component does not mutate items" and per-action actionClick-firing table verified against onClearClick/onMoveClick/onRemoveClick/onTransferClick in list-box.component.ts (no items()/listBoxItems.set() call in any of the four handlers) and cross-checked against list-box-demo.component.ts's ListBoxWrapperComponent.onActionClick, which performs all data mutation itself
- [x] Toolbar customization (`toolbar: { actions: [] }` renders an empty toolbar rather than hiding it) verified against updateToolbarOptions() and confirmed by a passing unit test in list-box.component.spec.ts
- [x] singleSelectionToggleable verified against the selectableOptions computed (`toggleable: this.singleSelectionToggleable()` for `"single"` mode only)
- [x] Arrow-key "select" mode verified against list-box.component.html's hardcoded `[monaListViewNavigable]="{ enabled: true, mode: 'select' }"`, contrasted with List View's own default (`mode: "highlight"`) documented in list-view/api.md
- [x] Four structural template directives and selectors verified against list-box/directives/*-template.directive.ts; none currently have a public API surface beyond their selector (no inputs/outputs), so no separate API subsection was created for them
- [x] ListBoxItemTemplateContext confirmed exported via lib/index.ts but not wired into ListBoxItemTemplateDirective via a template-context guard (reverted during the S-3 fix because it broke untyped consumer templates) — documented only as the context shape, not as compiler-enforced
- [x] Four action event classes (ListBoxClearEvent, ListBoxMoveEvent, ListBoxRemoveEvent, ListBoxTransferEvent), ListBoxActionEvent union, ListBoxSelectionEvent, ToolbarOptions/ToolbarAction confirmed exported via lib/index.ts; PreventableEvent base (preventDefault/isDefaultPrevented) confirmed exported via utils/PreventableEvent
- [x] ListKeySelector and Position confirmed NOT exported from lib/index.ts; selectBy/textField/position documented using their resolved structural types instead of the internal type names, matching list-view/api.md's precedent
- [x] Keyboard map, single-Tab-stop focus behavior, and ARIA attributes (role=listbox/option, aria-selected, aria-disabled, aria-posinset/aria-setsize) verified against the same common/list implementation documented in list-view/api.md, which ListBoxComponent uses via ListViewComponent
- [x] Toolbar button aria-label values verified against list-box.component.html (Move Up/Move Down/Transfer From/Transfer To/Transfer All From/Transfer All To/Clear Selection/Remove)
- [x] No internal-only symbols (ListService, ListViewComponent's internals, activeListBox/getSelectedListBox, ListBoxWrapperComponent) documented as public API
-->
