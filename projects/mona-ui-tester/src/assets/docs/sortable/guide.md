## Overview

Put `monaSortable` on a list element and `monaSortableItem` on each item, and give them your data: the array on the list, and each item's element of it. When the user moves an item, the list emits its new array; it doesn't reorder its elements itself. Bind the array two-way and the new order renders.

**Use Sortable when:**

- Users choose an order that matters to them: priorities, the columns a table shows, the widgets on a dashboard.
- Items move between a few lists, such as shown and hidden fields.

For a list with selection and a toolbar of move buttons, use [List Box](/components/list-box). For a board of columns with counts and limits, use [Kanban](/components/kanban).

## Import & Quick Start

```typescript
import { SortableDirective, SortableItemDirective } from "@nanahoshi/mona-ui/sortable";
```

```html
<ol aria-label="Priorities" [(monaSortable)]="priorities">
    @for (priority of priorities(); track priority) {
        <li tabindex="0" [monaSortableItem]="priority">{{ priority }}</li>
    }
</ol>
```

```typescript
protected readonly priorities = signal(["Fix the sign-in bug", "Write the release notes", "Plan the offsite"]);
```

Render every element of the array as an item, in the array's order: the list maps the positions the user sees to the array's indexes. Track items by something stable, such as the item itself or its id, so a moved item keeps its element.

## Anatomy

| Directive | Selector | Goes on |
| --- | --- | --- |
| `SortableDirective` | `[monaSortable]` | The element that holds the items |
| `SortableItemDirective` | `[monaSortableItem]` | Each item, given its element of the array |
| `SortableGroupDirective` | `[monaSortableGroup]` | An element around lists that exchange items |
| `SortableHandleDirective` | `[monaSortableHandle]` | The part of an item that starts a drag, when only part of it should |

## Examples

### A sortable list

`[(monaSortable)]` gives the list its array and takes each new order. `sortableLockAxis` keeps a dragged item on the list's axis, up and down here. The row numbers are hidden from screen readers, so the announcement names the item by its text alone.

```example
sortable/list
```

### Moving items between lists

Lists inside a `monaSortableGroup` exchange items. Each list emits its own new array, so bind each one two-way. `sortableCanEnter` decides whether an item from another list may come in, here only while fewer than five columns are shown; the list's own items can always be reordered.

```example
sortable/connected
```

### Rows that wrap, with handles

`sortableOrientation="mixed"` is for items laid out in rows that wrap, such as tiles. A `monaSortableHandle` makes only the grip start a drag, so the rest of the tile can hold text to select or controls to use. The keyboard moves the tile from anywhere in it. `sortableLabel` names each tile in announcements, where its text would also read the figure.

```example
sortable/tiles
```

## Behavior

### The list doesn't change your data

A move first emits `sortableMove` on the list the item lands in. It carries the item, its previous and new index, and both lists' arrays after the move: `previousItems` and `currentItems`, the same array for a move within one list. Call `preventDefault()` to refuse the move. Otherwise each list involved emits its new array through `monaSortableChange`, which `[(monaSortable)]` writes back.

```html
<ul [monaSortable]="tasks()" (sortableMove)="save($event)">…</ul>
```

```typescript
protected save(event: SortableMoveEvent<Task>): void {
    // Keep the new order only once the server has it.
    event.preventDefault();
    this.api.reorder(event.currentItems).subscribe(() => this.tasks.set([...event.currentItems]));
}
```

`moveItem(items, from, to)` returns a copy of an array with one item moved, for moves reported by index, such as [reordered tabs](/components/tabs#reordering-tabs).

### Orientation

`sortableOrientation` says how the items are laid out, which sets the keys that move them:

| Value | Layout | Keys that move an item within the list | Keys that move it to another list of the group |
| --- | --- | --- | --- |
| `"vertical"` (default) | A column | `ArrowUp`, `ArrowDown` | `ArrowLeft`, `ArrowRight` |
| `"horizontal"` | A row | `ArrowLeft`, `ArrowRight` | `ArrowUp`, `ArrowDown` |
| `"mixed"` | Rows that wrap | All four: up and down to the item above or below | None |

In rows that wrap, the items must be the list element's own children.

### Disabling

`sortableDisabled` on the list stops its items from moving, and stops items from other lists coming in. On an item, it stops that item from moving; other items still move past it.

### Touch screens

On a touch screen, press and hold an item for a moment to pick it up. A quick swipe scrolls the page, or the list, as usual.

## Accessibility

Each item must take focus, or hold a control that does, for the keyboard to move it: give it `tabindex="0"`, or put the list's own focus management on it. The directive adds no roles, so keep the semantics of your markup: a `ul` or `ol` of `li` elements, or the roles of the pattern you build.

After every move, the list announces the item's name and its new position, "Write the release notes moved to position 1 of 3", and for a move into another list, that list's name too, "Email moved to Shown columns, position 4 of 4". The item's name is its `sortableLabel`, else its `aria-label` or `aria-labelledby` text, else its text without what's `aria-hidden`. The list's name is its `sortableLabel`, else its `aria-label` or `aria-labelledby` text.

### Keyboard

With focus on an item, or on an element in it that isn't a text field:

| Key | Action |
| --- | --- |
| `Control+Shift` with an arrow key (`Command+Shift` on macOS) | Moves the item one place, or to the next list of the group, as the [orientation](#orientation) sets |
| `Control+Shift+Home` / `Control+Shift+End` | Moves the item to the start or the end of its list |

`ArrowLeft` and `ArrowRight` swap in right-to-left layouts. A move into another list keeps the item's position, or puts it last when the list is shorter, and passes over a list that refuses it. Focus stays on the moved item, also when it lands in another list.

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `aria-keyshortcuts` | On each item that can move | The shortcuts that move it, such as `"Control+Shift+ArrowUp Control+Shift+ArrowDown Control+Shift+Home Control+Shift+End"` |

An item with `role="presentation"` or `role="none"` doesn't get `aria-keyshortcuts`, which would conflict with its role. Bind the item's `keyShortcuts()` on the element in it that takes focus instead: `#item="monaSortableItem"`, then `[attr.aria-keyshortcuts]="item.keyShortcuts()"`.
