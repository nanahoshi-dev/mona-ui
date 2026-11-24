## Overview

Tile View renders items as tiles: a `role="listbox"` of `option`s you select from, or a `role="list"` of `listitem`s with `selectionMode="none"`. Tiles are all `tileWidth` by `tileHeight` pixels, and a row holds as many as fit the width, or the number `columns` gives. Rows are virtualized, so a folder of 50,000 pictures scrolls as smoothly as one of fifty.

**Use Tile View when:**

- Items are best recognized by a picture: photos, files, products, avatars.
- The collection can be large, and the keyboard should move up, down, left and right through it.

**Use `ListView` instead when:**

- Items are rows of text, grouped or paged.

**Use `Grid` instead when:**

- Items need columns of details, sorting by column, or editing.

## Import & Quick Start

```typescript
import { TileViewComponent } from "@nanahoshi/mona-ui/tile-view";
```

```html
<mona-tile-view aria-label="Fruits" class="h-64" [items]="fruits" [(selectedKeys)]="selected" />
```

`items` accepts any `Iterable<T>`. Without an item template, each tile shows the item's text: `textField` names a property or gives a function `(item: T) => string`, and without it the item itself is converted to text. Give the tile view a height, through `class` or its container: it fills its container and scrolls inside it.

## Anatomy

Each template below is an `ng-template` placed inside `<mona-tile-view>...</mona-tile-view>`.

| Directive                         | Selector                                  | Template context                                                                             | Replaces                         |
|-----------------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------|----------------------------------|
| `TileViewItemTemplateDirective`   | `ng-template[monaTileViewItemTemplate]`   | `TileViewItemTemplateContext<T>`: `{ $implicit: T, selected, active, index, slot }`          | The item's text, centered        |
| `TileViewNoDataTemplateDirective` | `ng-template[monaTileViewNoDataTemplate]` | None                                                                                         | The default "No data" placeholder |

```html
<mona-tile-view aria-label="Pictures" itemKey="id" textField="name" [items]="pictures">
    <ng-template monaTileViewItemTemplate [monaTileViewItemTemplateOf]="pictures" let-picture let-slot="slot">
        <img alt="" class="mx-auto mt-2 size-16 object-contain" [src]="picture.thumbnail" />
        <span class="line-clamp-2 px-1 text-center text-sm">{{ picture.name }}</span>
    </ng-template>
</mona-tile-view>
```

Bind the tile view's items to `[monaTileViewItemTemplateOf]` to type `let-picture`; without it, the item is `any`. A tile is a column of flex content: the template's elements stack from the top. Keep item templates free of buttons and links, since tiles are options of a listbox.

## Examples

### Selection

```example
tile-view/basic
```

`selectedKeys` holds the keys of the selected items, and `[(selectedKeys)]` follows the user's selection. `itemKey` names the property, or gives the function, that is each item's key; without it, the item itself is its key. Keys must be unique. Keys set through `selectedKeys` aren't emitted back.

### Pictures and many items

```example
tile-view/pictures
```

Ten thousand tiles, each a picture and a name. Double-click a tile, or press Enter, to activate it: `itemActivate` emits the item and the event, so Ctrl+Enter can do something else than Enter.

## Appearance & Styling

The tile view fills its container's width and height, and has no size of its own, since only the rows in view are rendered: give the container a height, or the tile view a class such as `h-96`. `tileWidth`, `tileHeight` and `gap` size the tiles and the space between and around them, in pixels. Every tile must render at `tileHeight`, or scrolling drifts. `rounded` and `size` set the frame's radius and the text size, and `class` is merged onto the host with `tailwind-merge`.

A selected tile has the selection background, and the tile the keyboard is on has a 2px ring. In forced colors, where backgrounds and rings don't paint, a selected tile has a `Highlight` frame, and the keyboard's tile a dashed outline inside it.

## Behavior

### Selection follows a file explorer

| Mode         | Click              | Ctrl+click             | Shift+click                    | Click in empty space |
|--------------|--------------------|------------------------|--------------------------------|----------------------|
| `"multiple"` | Selects that tile  | Adds or removes it     | Selects from the anchor to it  | Clears the selection |
| `"single"`   | Selects that tile  | Selects it, or clears it if it is selected | Selects that tile | Clears the selection |
| `"none"`     | Moves the focus    | Moves the focus        | Moves the focus                | Nothing              |

The anchor is the tile last clicked, or moved to, without Shift. Ctrl+Shift+click adds the range to the selection.

A right-click selects too, so a context menu acts on what was right-clicked: a tile that isn't selected becomes the selection, a selected tile keeps it, and a right-click in empty space clears it. The right-clicked tile becomes active. Put a [context menu](/components/contextmenu) on the tile view, or on an element around it: opened from the keyboard, it opens at the active tile.

### The active tile follows the app's selection

When the app sets `selectedKeys` to keys that don't include the active tile, such as the key of an item it just added, the first selected tile in item order becomes active and is scrolled into view. `scrollToItem(key)` scrolls a tile into view without changing anything else.

### When items change

The active tile stays on its item while the item is there. When it goes, the item that takes its place becomes active. Selected keys aren't pruned: the app owns them.

### Tiles are reused

Only the tiles in view and a row or two around them are rendered. A row that scrolls away is reused for one that scrolls in, and its tiles show other items: the item template's context changes, and its elements and components stay. Keep what a tile shows in the item or derive it from the item, not in state a component of the template keeps on its own.

### Slots

 `slot` in the item template's context is a number no other rendered tile has: a tile that scrolls into view takes it over from one that scrolled away. Key work by it that a newer tile should replace, such as a request for a picture, so that scrolling fast to the end leaves only the last screen waiting. Slots change when the view's size does.

## Accessibility

### Keyboard

| Key                         | Action                                                                                           |
|-----------------------------|--------------------------------------------------------------------------------------------------|
| `ArrowLeft` / `ArrowRight`  | Move to the previous or next tile in the row (swapped right to left). Stops at the row's ends.   |
| `ArrowUp` / `ArrowDown`     | Move to the tile above or below. Down from a column the last row lacks goes to the last tile.    |
| `PageUp` / `PageDown`       | Move by as many rows as fit in view.                                                             |
| `Home` / `End`              | Move to the first or last tile.                                                                  |
| `Shift` + a move            | Select from the anchor to the tile moved to.                                                     |
| `Ctrl` + a move             | Move without selecting.                                                                          |
| `Space`                     | Select the active tile, adding it in multiple selection. `Ctrl+Space` adds or removes it.         |
| `Ctrl+A`                    | Select all, in multiple selection.                                                               |
| `Enter`                     | Emit `itemActivate` for the active tile.                                                         |
| Letters, digits             | Typeahead: move to the next tile whose text starts with what was typed. A space typed quickly after a letter is part of the text. |

A move without Ctrl selects the tile moved to, in single and multiple selection. Arrow keys with Alt are left to the page.

### Focus

The tile view is one Tab stop: the listbox takes the focus, and `aria-activedescendant` points at the active tile. Tabbing in makes the first selected tile active, or the first tile, without selecting it. A click focuses the tile view without scrolling it. The active tile shows its ring only while the keyboard is in use, as `:focus-visible` would. An empty tile view keeps its listbox as the Tab stop, with a ring of its own, described by the "No data" text.

### ARIA

| Attribute                        | Where                                     | Value                                                           |
|----------------------------------|-------------------------------------------|-----------------------------------------------------------------|
| `role`                           | The scrolling element                     | `"listbox"`, or `"list"` with `selectionMode="none"`            |
| `aria-label` / `aria-labelledby` | The listbox                               | From the inputs of the same names (not left on the host)        |
| `aria-multiselectable`           | The listbox, in multiple selection        | `true`                                                          |
| `aria-activedescendant`          | The listbox, while focused                | The active tile's id                                            |
| `aria-busy`                      | The listbox, while `loading`              | `true`                                                          |
| `aria-describedby`               | The listbox, when empty                   | The "No data" text, or the no-data template                     |
| `role`                           | Each row                                  | `"none"`                                                        |
| `role`                           | Each tile                                 | `"option"`, or `"listitem"` with `selectionMode="none"`          |
| `aria-selected`                  | Each option                               | Whether the item is selected                                    |
| `aria-posinset` / `aria-setsize` | Each tile                                 | The item's 1-based position and the number of items, since only some tiles are rendered |
| `role="status"`                  | A visually hidden element after the tiles | "Loading" while `loading`, and "No data" when there are no items, unless a no-data template says it |

Give pictures in item templates an empty `alt` when the tile's text names the item, so it isn't read twice.

<!-- verification-checklist
- [x] Inputs, outputs, defaults and `scrollToItem` checked against tile-view/components/tile-view/tile-view.component.ts
- [x] Roles and ARIA attributes checked against tile-view.component.html
- [x] Keyboard map checked against onKeydown and utils/tile-navigation.ts, and the specs in tile-view.component.spec.ts
- [x] Template context checked against models/TileViewItemTemplateContext.ts; TileViewItemTemplateDirective has a context guard
- [x] Exports checked against tile-view/public-api.ts
-->
