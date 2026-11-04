## Overview & Component Selection

List Box renders a `role="listbox"` list of items, built on top of List View, with two additional capabilities: in-place selection toggling and an optional action toolbar for moving, clearing, removing, and transferring items to and from a second, connected list box.

Used on its own, a list box is a selectable list whose toolbar moves, clears and removes items: a rearrangeable list. Connect two list boxes through `connectedList` and the toolbar adds the transfer actions, giving consumers a working "available items ⇄ selected items" picker without hand-rolling the transfer logic.

**Use List Box when:**

- You need a picker where items live in one or two always-visible lists rather than behind a popup.
- You want the built-in move/transfer/clear/remove toolbar between two related lists of items, or a list the user can reorder.

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

`items` accepts any `Iterable<T>`. `selectBy` derives the key used by `selectedKeys`/`selectedKeysChange`; when omitted, the data item itself is used as the key. The toolbar is shown by default with Move Up, Move Down, Clear Selection and Remove; the transfer actions join it once a `connectedList` is set — see [Connected list boxes with a transfer toolbar](#connected-list-boxes-with-a-transfer-toolbar). Pass `[toolbar]="false"` for a list without one.

## Anatomy & Public Structural Templates

Each structural directive below is an `ng-template` placed as projected content inside `<mona-list-box>...</mona-list-box>`.

| Directive                        | Selector                                 | Template context                                                          | Replaces                                   |
|----------------------------------|------------------------------------------|---------------------------------------------------------------------------|--------------------------------------------|
| `ListBoxHeaderTemplateDirective` | `ng-template[monaListBoxHeaderTemplate]` | None                                                                      | No default — renders above the list        |
| `ListBoxItemTemplateDirective`   | `ng-template[monaListBoxItemTemplate]`   | `ListBoxItemTemplateContext<T>`: `{ $implicit: T }` (the raw data item)   | The default text rendered from `textField` |
| `ListBoxFooterTemplateDirective` | `ng-template[monaListBoxFooterTemplate]` | None                                                                      | No default — renders below the list        |
| `ListBoxNoDataTemplateDirective` | `ng-template[monaListBoxNoDataTemplate]` | None                                                                      | The default "No data" placeholder          |

```html
<mona-list-box [items]="items" textField="name" selectBy="id">
    <ng-template monaListBoxHeaderTemplate>
        <div class="font-medium px-3 py-2 border-b border-input-border">Food Items</div>
    </ng-template>
    <ng-template monaListBoxItemTemplate [monaListBoxItemTemplateOf]="items" let-item>
        <span class="flex-1">{{ item.name }}</span>
        <span class="text-green-600">${{ item.price }}</span>
    </ng-template>
    <ng-template monaListBoxNoDataTemplate>
        <div class="flex items-center justify-center h-full">No items available.</div>
    </ng-template>
</mona-list-box>
```

Binding the list box's items to `monaListBoxItemTemplateOf` types `let-item` as the item type, so a typo such as `item.nmae` fails the template type check. Without it, the item is `any`, as before.

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

### A rearrangeable list

```html
<mona-list-box aria-label="Steps" [items]="steps()" textField="name" selectBy="id" (actionClick)="onStepAction($event)">
</mona-list-box>
```

Without a `connectedList`, the toolbar offers Move Up, Move Down, Clear Selection and Remove, and the handler reorders or removes items as for a connected pair.

### Connected list boxes with a transfer toolbar

```html
<mona-list-box
    aria-label="Available foods"
    [items]="availableItems()"
    textField="name"
    selectBy="id"
    [connectedList]="selected"
    (actionClick)="onActionClick($event)">
</mona-list-box>
<mona-list-box
    #selected
    aria-label="Chosen foods"
    [items]="selectedItems()"
    textField="name"
    selectBy="id"
    [toolbar]="false"
    (actionClick)="onSelectedActionClick($event)">
</mona-list-box>
```

```typescript
protected onActionClick(event: ListBoxActionEvent<Food>): void {
    // "To" actions fire on `available` and carry the items to move to `selected`
    // (its selection, or every item for "transferAllTo").
    if (event.action === "transferTo" || event.action === "transferAllTo") {
        this.selectedItems.update(items => [...items, ...event.selectedItems]);
        this.availableItems.update(items => items.filter(i => !event.selectedItems.includes(i)));
    }
}

protected onSelectedActionClick(event: ListBoxActionEvent<Food>): void {
    // "From" actions fire on `selected` (the connected list box) and carry the items to move back.
    if (event.action === "transferFrom" || event.action === "transferAllFrom") {
        this.availableItems.update(items => [...items, ...event.selectedItems]);
        this.selectedItems.update(items => items.filter(i => !event.selectedItems.includes(i)));
    }
}
```

Setting `connectedList` on the first list box (pointing at `selected`) is enough — `selected` does not need `connectedList` set back. The toolbar renders on the first list box and controls both lists; set `[toolbar]="false"` on `selected`, or it shows a second toolbar of its own for moving, clearing and removing. Name both list boxes: the toolbar's name and the transfer buttons' labels are built from them ("Available foods actions", "Transfer to Chosen foods"). See [The component does not mutate `items` itself](#the-component-does-not-mutate-items-itself) for what each action requires from the consumer.

Once the consumer has moved the items, they are selected in the list box they moved to, and focus follows them there when the transfer button is now disabled.

### Disabled items

```html
<mona-list-box [items]="items" textField="name" selectBy="id" disabledBy="locked"></mona-list-box>
```

`disabledBy` takes a property name or a predicate. Disabled items can't be selected (by click, keys or typeahead), and no action carries them: Transfer All moves only the enabled items. Drag and drop between list boxes isn't supported; the [keyboard shortcuts](#keyboard) and the toolbar are the ways to move items.

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

`toolbar` accepts `true` (all actions, right-positioned) or the bare `toolbar` attribute, `false` (no toolbar), or an options object. Omitting `actions` on the object falls back to all actions; passing `actions: []` renders no toolbar. The buttons always appear in the same order (Move Up, Move Down, the transfers, Clear Selection, Remove), whatever order `actions` lists them in; the transfer actions need a `connectedList`.

`position` is logical: `"right"` puts the toolbar after the list in the writing direction, so it appears on the left in RTL, and `"left"` before it. `"top"` and `"bottom"` place it above or below the list and lay its buttons out in a row. The transfer icons point along the reading direction (towards the connected list at the inline end, mirrored in RTL) in every position: up and down icons would read as Move Up and Move Down.

## Technical & Behavior Notes

### The component does not mutate `items` itself

List Box never adds, removes, or reorders the collection passed to `items`. Every toolbar action — move, transfer, clear, remove — only emits `actionClick` with a cancelable event describing what was requested; updating the consumer's own data source (as in the [transfer example](#connected-list-boxes-with-a-transfer-toolbar) above) is required for the list to visibly change. Calling `event.preventDefault()` only skips the component's internal selection-clearing/scroll bookkeeping — it never affects whether data was already mutated by the consumer's own handler, since that mutation always happens in the same handler.

### Which list box's `actionClick` fires

| Action                            | Fires on                                                                                          |
|-----------------------------------|---------------------------------------------------------------------------------------------------|
| `clear`, `remove`                 | Whichever list box (`this` or `connectedList`) currently holds the selection.                     |
| `moveUp`, `moveDown`              | Whichever list box currently holds the selection. The buttons are disabled when there is none, or when the selection already touches the start (Move Up) or end (Move Down). |
| `transferTo`, `transferAllTo`     | The list box the toolbar is attached to (the source). `selectedItems` is its selection, or all of its enabled items for `transferAllTo`. |
| `transferFrom`, `transferAllFrom` | The `connectedList` (the source). `selectedItems` is its selection, or all of its enabled items for `transferAllFrom`. |

Every event lists items in list order, not the order they were selected in, and leaves out disabled items. After a transfer, clear or remove that isn't prevented, the selections involved are cleared and reported through `selectionChange` and `selectedKeysChange`; after a transfer, the moved items that arrived in the target are then selected there and reported the same way.

### Selection events

`selectionChange` and `selectedKeysChange` fire for every change the user makes: clicking or keying a selection, Clear Selection, a transfer or Remove that clears it, the moved items a transfer selects in its target, and a selection in the other list box of a connected pair (which clears this one, in either direction). Keys set through `[selectedKeys]` are not echoed back.

### Arrow-key navigation moves the selection

Unlike List View (which defaults to highlight-only navigation), List Box always navigates in `"select"` mode: in single selection, arrow keys and typeahead immediately change the selection rather than only moving focus. In multiple selection they move focus only, and Space, Ctrl+A (Cmd+A) and clicks change the selection.

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
| `Space`, `Ctrl+A`/`Cmd+A` (multiple selection)  | Toggle the focused item; select every enabled item.                                                         |
| Any letter, digit, hyphen, or underscore        | Typeahead: jumps to the next item whose text starts with the typed characters (resets after a short pause). In multiple selection it moves focus without changing the selection. |
| `Alt+ArrowUp` / `Alt+ArrowDown`                 | Move the selection up or down (Move Up / Move Down).                                                        |
| `Delete`                                        | Remove the selection (Remove).                                                                              |
| `Alt+ArrowRight` (`Alt+ArrowLeft` in RTL)       | In a list box with a `connectedList`: transfer the selection to it (Transfer To).                           |
| `Alt+ArrowLeft` (`Alt+ArrowRight` in RTL)       | In the connected list box: transfer the selection back (Transfer From).                                     |

The shortcuts work on a focused option and run the same action as the toolbar button, so they fire the same `actionClick` event; each runs only when the toolbar offers that action, it is enabled, and the selection is in the focused list box. The transfer shortcuts assume the connected list box follows the first one in reading order, as the transfer icons do.

In the toolbar:

| Key                                                     | Action                                                     |
|---------------------------------------------------------|------------------------------------------------------------|
| `ArrowDown` / `ArrowUp` (toolbar beside the list)       | Move to the next or previous enabled button, wrapping.     |
| `ArrowRight` / `ArrowLeft` (toolbar above or below; mirrored in RTL) | Move to the next or previous enabled button, wrapping. |
| `Home` / `End`                                          | Move to the first or last enabled button.                  |
| `Enter` / `Space`                                       | Run the focused button's action.                           |

### Focus

The list is a single Tab stop, as in List View — Tab/Shift+Tab moves focus into and out of the list as a whole, not between items; use the keyboard map above to move within the list. An empty list keeps the Tab stop on its `listbox` element. The toolbar is one more Tab stop: the button that last had focus, or the first enabled one.

After an action, focus stays on the button that ran it while that button is still enabled. When the button is now disabled, or a shortcut ran the action, focus moves to what the action acted on: the transferred items in the list box they moved to, the moved item, the item now in the removed one's place, or the first item that was selected before Clear Selection.

### ARIA

| Attribute                        | When present                                   | Value                                                          |
|----------------------------------|------------------------------------------------|----------------------------------------------------------------|
| `role`                           | Always, on the inner list element (even empty) | `"listbox"`                                                    |
| `aria-label`                     | When `ariaLabel`/`aria-label` is set           | The provided string (on the listbox, not on the host)          |
| `aria-multiselectable`           | In multiple selection                          | `"true"`                                                       |
| `aria-describedby`               | On an empty listbox                            | The "No data" text (or the `monaListBoxNoDataTemplate`)         |
| `role`                           | Always, on each item                           | `"option"`                                                     |
| `aria-selected`                  | Always, on each item                           | Reflects whether the item is selected                          |
| `aria-disabled`                  | Always, on each item                           | Reflects whether the item is disabled by `disabledBy`          |
| `aria-posinset` / `aria-setsize` | Always, on each item                           | The item's 1-based position and the total count                |
| `role`                           | On the toolbar                                 | `"toolbar"`                                                    |
| `aria-label`                     | On the toolbar, when it has a name             | `toolbarAriaLabel`, else "{list box name} actions"             |
| `aria-orientation`               | On the toolbar                                 | `"vertical"` beside the list, `"horizontal"` above or below it |

Each toolbar button carries its own `aria-label` matching its tooltip. The transfer buttons name the connected list box ("Transfer to Chosen foods", "Transfer all from Chosen foods") when it has an `aria-label`, and fall back to "Transfer to the other list" and similar when it doesn't.

After each action, a polite announcement reports what happened once the consumer's change has rendered: "2 items moved to Chosen foods", "Moved to position 1 of 4", "1 item removed" or "Selection cleared". Nothing is announced when the consumer didn't carry out the action (for example, the items didn't arrive in the target). The announcements and labels are translated messages (`listBox` namespace).

When connecting two list boxes, set a distinct `aria-label` on each so assistive technology can tell them apart — the component does not label them for you, and the toolbar's name and the transfer labels are built from them.

Form integration is not applicable — List Box is a display/selection widget, not a form control.

## API

### `ListBoxComponent<T = unknown, K = unknown>`

**Selector:** `mona-list-box`

#### Inputs

| Name                        | Type                                       | Default    | Description                                                                                                                                                                                                                                 |
|-----------------------------|--------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`                | `string`                                   | `""`       | Accessible name for the list box's `listbox` element. Describe what the list represents, which matters in particular when connecting two list boxes. Bound as `[aria-label]`/plain `aria-label` (the input's property name is `ariaLabel`). |
| `connectedList`             | `ListBoxComponent<T, K> \| null`           | `null`     | The other list box to transfer items to and from using the toolbar actions.                                                                                                                                                                 |
| `disabledBy`                | `string \| ((item: T) => boolean) \| null` | `""`       | Property name or predicate that marks items as disabled. Disabled items can't be selected, and no action (including the "All" transfers) carries them.                                                                                      |
| `height`                    | `string \| number`                         | `"100%"`   | Sets the height of the component.                                                                                                                                                                                                           |
| `items`                     | `Iterable<T>`                              | `[]`       | Collection of items to render.                                                                                                                                                                                                              |
| `rounded`                   | `"none" \| "small" \| "medium" \| "large"` | `"medium"` | Border-radius preset applied to the component.                                                                                                                                                                                              |
| `selectBy`                  | `string \| ((item: T) => K) \| null`       | `""`       | Property name or accessor used to derive the key from a data item, used to identify selected items.                                                                                                                                         |
| `selectedKeys`              | `Iterable<K>`                              | `[]`       | Keys of the currently selected items. Pair with `(selectedKeysChange)` to keep in sync.                                                                                                                                                     |
| `selectionMode`             | `SelectionMode` (`"single" \| "multiple"`) | `"single"` | Allows multiple items to be selected simultaneously when set to `"multiple"`.                                                                                                                                                               |
| `singleSelectionToggleable` | `boolean`                                  | `true`     | Allows an already-selected item to be deselected by clicking it again while `selectionMode` is `"single"`. Has no effect when `selectionMode` is `"multiple"`. Accepts the attribute form (`singleSelectionToggleable="false"`).            |
| `size`                      | `"small" \| "medium" \| "large"`           | `"medium"` | Size preset controlling the component's dimensions.                                                                                                                                                                                         |
| `textField`                 | `string \| ((item: T) => string) \| null`  | `""`       | Property name or accessor used to derive the display text from a data item.                                                                                                                                                                 |
| `toolbar`                   | `boolean \| Partial<ToolbarOptions>`       | `true`     | Shows the action toolbar. Pass `false` to hide it entirely, or an options object to customize which actions are shown and where the toolbar is positioned. The transfer actions appear only with a `connectedList`. Accepts the bare attribute. |
| `toolbarAriaLabel`          | `string`                                   | `""`       | Accessible name for the toolbar. By default it is built from the list box's `aria-label` ("Available foods actions").                                                                                                                       |
| `width`                     | `string \| number`                         | `"100%"`   | Sets the width of the component.                                                                                                                                                                                                            |

#### Outputs

| Name                 | Type                       | Description                                                                                                                                                                                                                                                     |
|----------------------|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `actionClick`        | `ListBoxActionEvent<T>`    | Emitted when a toolbar action button is clicked, carrying the action's details. See [Which list box's `actionClick` fires](#which-list-boxs-actionclick-fires) and [The component does not mutate `items` itself](#the-component-does-not-mutate-items-itself). |
| `selectedKeysChange` | `K[]`                      | Emitted with the updated keys whenever the user changes the selection, including through actions. See [Selection events](#selection-events).                                                                                                                 |
| `selectionChange`    | `ListBoxSelectionEvent<T>` | Emitted with the selected and deselected items whenever the user changes the selection, including through actions.                                                                                                                                             |

#### Public methods

| Name                            | Description                                                                                                                                          |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `clearSelections(): void`       | Clears the selection and reports it through `selectionChange` and `selectedKeysChange`.                                                              |
| `notifySelectionChange(): void` | Deprecated: `clearSelections()` and the actions report selection changes themselves.                                                                 |

`listBoxItems` and `selectedItems` are read-only signals of the rendered items and the selected items; `selectedItems$` is deprecated.

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
| `newIndex`        | `number`                 | For Move Up, the index above the first selected item; for Move Down, the index below the last one. |
| `oldIndex`        | `number`                 | The index of the first selected item (in list order) before the move. |
| `selectedIndices` | `number[]`               | Indices of all selected items before the move, ascending. |
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
| `selectedItems` | `T[]`                                                                    | The items to transfer, in list order: the source's selection, or all of the source's items for the "All" variants. See [Which list box's `actionClick` fires](#which-list-boxs-actionclick-fires). |

---

### Exported Types

#### `ListBoxActionEvent<T = unknown>`

`ListBoxClearEvent<T> | ListBoxMoveEvent<T> | ListBoxRemoveEvent<T> | ListBoxTransferEvent<T>` — narrow on the `action` field to determine which one was emitted.

#### `ListBoxItemTemplateContext<T = unknown>`

| Field       | Type | Description                       |
|-------------|------|-----------------------------------|
| `$implicit` | `T`  | The raw data item being rendered. |

`ListBoxItemTemplateDirective` checks templates against this context. `T` comes from `monaListBoxItemTemplateOf` when it is bound, and is `any` otherwise.

#### `ListBoxSelectionEvent<T = unknown>`

| Field             | Type  | Description                  |
|-------------------|-------|------------------------------|
| `deselectedItems` | `T[]` | Items that were deselected.  |
| `selectedItems`   | `T[]` | Items that are now selected. |

#### `ToolbarOptions`

| Field      | Type                                     | Description                                    |
|------------|------------------------------------------|------------------------------------------------|
| `actions`  | `ToolbarAction[]`                        | Which toolbar buttons to show. They appear in a fixed order. |
| `position` | `"top" \| "right" \| "bottom" \| "left"` | Which side of the list the toolbar renders on; `"right"` and `"left"` are the inline end and start, so they swap in RTL. |

#### `ToolbarAction`

`"clear" | "moveDown" | "moveUp" | "remove" | "transferAllFrom" | "transferAllTo" | "transferFrom" | "transferTo"`

---

<!-- verification-checklist
- [x] ListBoxComponent inputs/defaults verified against list-box.component.ts source and cross-checked against component-metadata.json's ListBoxComponent entry
- [x] `ariaLabel` input's `{ alias: "aria-label" }` binding verified against list-box.component.ts; documented as bound via the alias per current source
- [x] Toolbar visibility verified against list-box.component.ts's `toolbarButtons` computed: the toolbar renders whenever it has buttons, and the transfer actions need a connectedList
- [x] "Component does not mutate items" and per-action actionClick-firing table verified against onClearClick/onMoveClick/onRemoveClick/onTransferClick in list-box.component.ts (no items()/listBoxItems.set() call in any of the four handlers) and cross-checked against list-box-demo.component.ts's ListBoxWrapperComponent.onActionClick, which performs all data mutation itself
- [x] Toolbar customization (`toolbar: { actions: [] }` renders no toolbar) verified against the `toolbarButtons` computed and confirmed by a passing unit test in list-box.component.spec.ts
- [x] singleSelectionToggleable verified against the selectableOptions computed (`toggleable: this.singleSelectionToggleable()` for `"single"` mode only)
- [x] Arrow-key "select" mode verified against list-box.component.html's hardcoded `[monaListViewNavigable]="{ enabled: true, mode: 'select' }"`, contrasted with List View's own default (`mode: "highlight"`) documented in list-view/api.md
- [x] Four structural template directives and selectors verified against list-box/directives/*-template.directive.ts; none currently have a public API surface beyond their selector (no inputs/outputs), so no separate API subsection was created for them
- [x] ListBoxItemTemplateContext wired into ListBoxItemTemplateDirective through a generic ngTemplateContextGuard; T is inferred from monaListBoxItemTemplateOf and is any when it isn't bound, so untyped consumer templates (the tester demo's `let-item`) still compile
- [x] Four action event classes (ListBoxClearEvent, ListBoxMoveEvent, ListBoxRemoveEvent, ListBoxTransferEvent), ListBoxActionEvent union, ListBoxSelectionEvent, ToolbarOptions/ToolbarAction confirmed exported via lib/index.ts; PreventableEvent base (preventDefault/isDefaultPrevented) confirmed exported via utils/PreventableEvent
- [x] ListKeySelector and Position confirmed NOT exported from lib/index.ts; selectBy/textField/position documented using their resolved structural types instead of the internal type names, matching list-view/api.md's precedent
- [x] Keyboard map, single-Tab-stop focus behavior, and ARIA attributes (role=listbox/option, aria-selected, aria-disabled, aria-posinset/aria-setsize) verified against the same common/list implementation documented in list-view/api.md, which ListBoxComponent uses via ListViewComponent
- [x] Toolbar button aria-label values verified against the `toolbarButtons` computed and list-box.default-messages.ts (Move Up/Move Down/Transfer to {list}/Transfer from {list}/Transfer all to {list}/Transfer all from {list}, with "the other list" fallbacks/Clear Selection/Remove)
- [x] No internal-only symbols (ListService, ListViewComponent's internals, activeListBox/getSelectedListBox, ListBoxWrapperComponent) documented as public API
-->
