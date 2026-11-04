# Mona UI List Box

`<mona-list-box>` (from `@nanahoshi/mona-ui/list-box`) is a `listbox` with a toolbar of actions: move the selection up or down, remove it, clear it, and transfer items to and from a connected list box. It is built on the [list view](list-view.md), so selection and keyboard navigation work the same way.

The list box doesn't change your data. Each action emits an event; you update `items`, and the list box then selects, focuses and announces the result.

| Use                                             | Component                                        |
| ----------------------------------------------- | ------------------------------------------------ |
| reorder a list, or move items between two lists | `<mona-list-box>`                                |
| select from a list, without moving items        | `<mona-list-view>` with `monaListViewSelectable` |
| show or open items                              | `<mona-list-view>` (a `list`)                    |
| a hierarchy                                     | `<mona-tree-view>` ([guide](tree-view.md))       |

---

## 1. A Pair of List Boxes

```typescript
import { Component, signal, type WritableSignal } from "@angular/core";
import { type ListBoxActionEvent, ListBoxComponent } from "@nanahoshi/mona-ui/list-box";

interface Food {
    id: number;
    name: string;
}

/** Moves the items at `indices` one step up (-1) or down (1). */
function moveItems<T>(items: readonly T[], indices: readonly number[], step: -1 | 1): T[] {
    const result = [...items];
    const order = step < 0 ? indices : [...indices].reverse();
    for (const index of order) {
        [result[index + step], result[index]] = [result[index], result[index + step]];
    }
    return result;
}

@Component({
    selector: "app-menu-editor",
    imports: [ListBoxComponent],
    template: `
        <mona-list-box
            aria-label="Menu"
            textField="name"
            selectBy="id"
            selectionMode="multiple"
            [items]="menu()"
            [connectedList]="availableBox"
            (actionClick)="onAction($event, menu)"></mona-list-box>
        <mona-list-box
            #availableBox
            aria-label="Available foods"
            textField="name"
            selectBy="id"
            selectionMode="multiple"
            [items]="available()"
            [toolbar]="false"
            (actionClick)="onAction($event, available)"></mona-list-box>
    `
})
export class MenuEditorComponent {
    protected readonly available = signal<Food[]>([{ id: 3, name: "Soup" }]);
    protected readonly menu = signal<Food[]>([
        { id: 1, name: "Pasta" },
        { id: 2, name: "Salad" }
    ]);

    /** The event fires on the list box the items come from. */
    protected onAction(event: ListBoxActionEvent<Food>, source: WritableSignal<Food[]>): void {
        const ids = new Set(event.selectedItems.map(food => food.id));
        switch (event.action) {
            case "moveUp":
            case "moveDown": {
                const step = event.action === "moveUp" ? -1 : 1;
                const indices = event.selectedIndices;
                source.update(items => moveItems(items, indices, step));
                break;
            }
            case "remove":
                source.update(items => items.filter(food => !ids.has(food.id)));
                break;
            case "clear":
                // The list box clears the selection itself.
                break;
            default: {
                const target = source === this.menu ? this.available : this.menu;
                source.update(items => items.filter(food => !ids.has(food.id)));
                target.update(items => [...items, ...event.selectedItems]);
            }
        }
    }
}
```

- `connectedList` takes the other list box (a template reference). Connect in one direction, and give the second box `[toolbar]="false"`: the first box's toolbar works on both.
- Handle `(actionClick)` on **both** boxes: a transfer's event fires on the box the items leave.
- Set `selectBy` to a stable key, so the selection follows items you recreate.

---

## 2. Labelling

Name each list box with `aria-label`, or point `aria-labelledby` at a visible heading. The name moves to the inner `listbox`; the host keeps no ARIA attributes.

- The toolbar is a `toolbar` named "{name} actions" ("Menu actions"). Set `toolbarAriaLabel` to name it yourself.
- Each button has a name, also shown as its tooltip. The transfer buttons name the connected box: "Transfer to Available foods", "Transfer all from Available foods". Without a name on the connected box they say "the other list".
- With `aria-labelledby` and no `aria-label`, the toolbar and transfer labels are built from the heading's text.
- An empty list box keeps its named listbox as a Tab stop, described by "No data".

---

## 3. Selection

- `selectionMode` is `"single"` (the default) or `"multiple"`. In single mode `singleSelectionToggleable` (on by default) lets a click on the selected item deselect it.
- `selectBy` gives an item's key (the item itself without it). `[(selectedKeys)]` holds the selected keys.
- `(selectionChange)` carries a `ListBoxSelectionEvent`: `selectedItems` are the items **added** since the last report and `deselectedItems` those removed. For the whole selection, use `selectedKeysChange` or the `selectedItems` signal.
- Both fire after every change the user causes: selecting an item, and the actions that change the selection (Clear, Remove, a transfer, a selection in the connected box clearing this one). Keys you set from code become the new baseline and aren't reported back.
- Only one box of a connected pair holds a selection: selecting in one clears the other (and the other reports it).
- `clearSelections()` clears the selection from code and reports it.

---

## 4. The Toolbar

```html
<mona-list-box
    aria-label="Steps"
    textField="title"
    selectBy="id"
    [items]="steps()"
    [toolbar]="{ actions: ['moveUp', 'moveDown', 'remove'], position: 'left' }"
    (actionClick)="onStepAction($event)"></mona-list-box>
```

- `toolbar` is `true` (all actions, on the right), `false` (no toolbar), or `{ actions, position }`. The bare attribute and `"true"`/`"false"` work too.
- Actions: `moveUp`, `moveDown`, `transferFrom`, `transferTo`, `transferAllFrom`, `transferAllTo`, `clear`, `remove`. They always appear in that order, whatever order `actions` lists them in.
- The transfer actions need a `connectedList`; without one they aren't shown. The move, clear and remove actions work on a list box of its own.
- `position` is `"right"` (the default), `"left"`, `"top"` or `"bottom"`. Left and right follow the reading direction: `"right"` puts the toolbar after the list, which in a right-to-left layout is on the left. The transfer arrows are mirrored there too.
- Beside the list (left or right) the buttons stack vertically; above or below they form a row. The toolbar's `aria-orientation` says which.
- A button is disabled when its action can't run: Move Up with the first item selected, Move Down with the last, Clear and Remove with nothing selected, a transfer with nothing to move.
- The move, clear and remove buttons act on whichever box of the pair holds the selection.

---

## 5. Actions and Their Events

`(actionClick)` emits one of four event classes (`ListBoxActionEvent` is their union). Each has `action`, `selectedItems` and `preventDefault()`:

| Action                            | Event                  | Fires on                                  | `selectedItems`                     | You                                          |
| --------------------------------- | ---------------------- | ----------------------------------------- | ----------------------------------- | -------------------------------------------- |
| `moveUp`, `moveDown`              | `ListBoxMoveEvent`     | the box with the selection                | the selection, in list order        | move the selected items one step             |
| `transferTo`, `transferAllTo`     | `ListBoxTransferEvent` | the box with `connectedList` (the source) | its selection, or all enabled items | move them from that box to the connected one |
| `transferFrom`, `transferAllFrom` | `ListBoxTransferEvent` | the connected box (the source)            | its selection, or all enabled items | move them from the connected box back        |
| `remove`                          | `ListBoxRemoveEvent`   | the box with the selection                | the selection, in list order        | remove them                                  |
| `clear`                           | `ListBoxClearEvent`    | the box with the selection                | the selection, in list order        | nothing: the box clears the selection        |

- `selectedItems` are always in list order, not the order they were selected in, and never include disabled items.
- `ListBoxMoveEvent` also has `selectedIndices` (in list order), `oldIndex` (the first selected index) and `newIndex` (one before the first selected item for Move Up, one after the last for Move Down).
- Call `preventDefault()` to cancel: the selection stays, and nothing is announced or focused.
- When a transfer isn't prevented, the selection is cleared in both boxes. Once your new `items` render, the transferred items are selected in the target (all of them in multiple mode, the first in single mode) and reported there.
- The event types default `T` to `any`, so untyped handlers compile. Pass the item type (`ListBoxActionEvent<Food>`) to type them.

---

## 6. Focus and Announcements

After an action, once your data change has rendered:

- **Focus** stays on the toolbar button when it is still enabled. When the button is now disabled, focus was lost, or a keyboard shortcut ran the action, focus moves to what the action acted on: the first transferred item in the target, the moved item, the item now at the first removed item's position (or the last item), or the first previously selected item after Clear. The item is scrolled into view.
- **Announcements** are polite, and only made when your data change went through:

| Action    | Announcement                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| transfers | "2 items moved to Available foods" (or "to the other list" without a name), counting the items that arrived |
| moves     | "Moved to position 3 of 8", when the position changed                                                       |
| Remove    | "2 items removed", counting the items that are gone                                                         |
| Clear     | "Selection cleared"                                                                                         |

---

## 7. Disabled Items

`disabledBy` (a property name or a predicate) disables items. They can't be selected, no action carries them, and the "All" transfers leave them in place.

---

## 8. Templates

```html
<mona-list-box aria-label="Foods" textField="name" [items]="foods()">
    <ng-template monaListBoxItemTemplate [monaListBoxItemTemplateOf]="foods()" let-food>
        <span class="flex-1">{{ food.name }}</span>
        <span class="text-muted-foreground">{{ food.price }}</span>
    </ng-template>
</mona-list-box>
```

- `monaListBoxItemTemplate` gets the data item as `let-item`. Bind `monaListBoxItemTemplateOf` to the items to type it; without it, it is `any`.
- `monaListBoxHeaderTemplate`, `monaListBoxFooterTemplate` and `monaListBoxNoDataTemplate` take no context.
- The option's content is its accessible name; don't put buttons or links in it.

---

## 9. Keyboard

The list and the toolbar are one Tab stop each.

**In the list** (see the [list view guide](list-view.md#10-keyboard)):

| Key                                                           | Action                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| <kbd>↓</kbd> / <kbd>↑</kbd>, <kbd>Home</kbd> / <kbd>End</kbd> | move; in single mode the selection follows                                           |
| <kbd>Space</kbd>                                              | multiple mode: toggle the item                                                       |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>A</kbd>                   | multiple mode: select every enabled item                                             |
| <kbd>Enter</kbd>                                              | select (toggle in multiple mode, or in single mode with `singleSelectionToggleable`) |
| letters                                                       | type ahead; in single mode it selects, in multiple mode it only moves                |

**Shortcuts**, on an item of the list:

| Key                         | Action                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| <kbd>Alt</kbd>+<kbd>↑</kbd> | Move Up                                                                      |
| <kbd>Alt</kbd>+<kbd>↓</kbd> | Move Down                                                                    |
| <kbd>Delete</kbd>           | Remove                                                                       |
| <kbd>Alt</kbd>+<kbd>→</kbd> | in the box with `connectedList`: transfer the selection to the connected box |
| <kbd>Alt</kbd>+<kbd>←</kbd> | in the connected box: transfer the selection back                            |

- In right-to-left layouts <kbd>Alt</kbd>+<kbd>←</kbd> and <kbd>Alt</kbd>+<kbd>→</kbd> swap, so the arrow points the way the items go.
- A shortcut runs the toolbar's own action, so it only works when the toolbar shows that button enabled and the selection is in the box the key was pressed in. The connected box without a toolbar uses the first box's toolbar.
- Shortcuts are ignored with <kbd>Ctrl</kbd>, <kbd>Cmd</kbd> or <kbd>Shift</kbd> held, and in controls inside a template. When a shortcut runs, its default is prevented (so <kbd>Alt</kbd>+<kbd>←</kbd> doesn't go back in the browser's history); otherwise the key is left alone.

**In the toolbar:**

| Key                                 | Action                                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------------------------- |
| <kbd>↓</kbd> / <kbd>↑</kbd>         | vertical toolbar: next / previous enabled button (wraps)                                     |
| <kbd>→</kbd> / <kbd>←</kbd>         | horizontal toolbar: next / previous enabled button (wraps; swapped in right-to-left layouts) |
| <kbd>Home</kbd> / <kbd>End</kbd>    | first / last enabled button                                                                  |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | run the action                                                                               |

The toolbar's Tab stop is the button that last had focus, or the first enabled one.

---

## 10. Localization

The labels and announcements come from the `listBox` message namespace (see the [i18n guide](i18n.md)):

| Key                                                                                                      | Used for                                                |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `moveUp`, `moveDown`, `remove`, `clearSelection`                                                         | the buttons                                             |
| `transferToList(list)`, `transferFromList(list)`, `transferAllToList(list)`, `transferAllFromList(list)` | the transfer buttons, naming the connected box          |
| `transferTo`, `transferFrom`, `transferAllTo`, `transferAllFrom`                                         | the transfer buttons when the connected box has no name |
| `toolbarLabel(list)`                                                                                     | the toolbar's name                                      |
| `itemsTransferred(count, list)`, `itemsTransferredToOtherList(count)`                                    | the transfer announcement                               |
| `itemsMoved(position, total)`, `itemsRemoved(count)`, `selectionCleared`                                 | the other announcements                                 |

The list's own texts ("No data") come from the `list` namespace. The full list is in `LIST_BOX_DEFAULT_MESSAGES`, exported from `@nanahoshi/mona-ui/list-box`.

---

## 11. Not Supported

- **Drag and drop.** Items move with the toolbar and the shortcuts only.
- **Range selection.** <kbd>Shift</kbd>+arrow and <kbd>Shift</kbd>+click don't extend the selection.
- **Paging, grouping, filtering and virtual scrolling.** Use a `<mona-list-view>` for those.
- **`aria-labelledby`.** Name the list box with `aria-label`.
