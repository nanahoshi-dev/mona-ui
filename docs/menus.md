# Mona UI Menus

Four components open menus: `ContextMenuComponent` (right-click), `MenubarComponent` (an application menu bar), `DropdownButtonComponent` and `SplitButtonComponent`. All four are built on one engine in `@nanahoshi/mona-ui/popup-menu`, so they share their item types, events, keyboard handling, focus rules and ARIA. This guide covers what they share; each component's page in the tester lists its full API.

| Component                    | Entry point                          | Opens from                                                        | Item prefix             |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------- | ----------------------- |
| `mona-contextmenu`           | `@nanahoshi/mona-ui/contextmenu`     | Right-click, the `ContextMenu` key or `Shift+F10` on its `target` | `mona-contextmenu-`     |
| `mona-menubar` / `mona-menu` | `@nanahoshi/mona-ui/menubar`         | Each top-level `mona-menu` in the bar                             | `mona-menu-`            |
| `mona-dropdown-button`       | `@nanahoshi/mona-ui/dropdown-button` | The button                                                        | `mona-dropdown-button-` |
| `mona-split-button`          | `@nanahoshi/mona-ui/split-button`    | The arrow button; the main button runs its own action             | `mona-split-button-`    |

---

## 1. Items

Each component projects the same kinds of items, named with its own prefix (shown here for the context menu):

| Element                                                        | Role               | Use                                                                               |
| -------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `mona-contextmenu-item`                                        | `menuitem`         | An action. Items projected inside it make a submenu.                              |
| `mona-contextmenu-checkbox-item`                               | `menuitemcheckbox` | An on/off setting, with a two-way `[(checked)]`.                                  |
| `mona-contextmenu-radio-group` + `mona-contextmenu-radio-item` | `menuitemradio`    | One choice among several, with the group's two-way `[(value)]`.                   |
| `mona-contextmenu-group`                                       | `group`            | Consecutive items under a `title` header. Without a title, no header is rendered. |
| `mona-contextmenu-separator`                                   | `separator`        | A divider.                                                                        |

```html
<mona-contextmenu [target]="file">
    <mona-contextmenu-item label="Open" (menuClick)="open()"></mona-contextmenu-item>
    <mona-contextmenu-item label="Share">
        <mona-contextmenu-item label="Copy link"></mona-contextmenu-item>
        <mona-contextmenu-item label="Email"></mona-contextmenu-item>
    </mona-contextmenu-item>
    <mona-contextmenu-separator></mona-contextmenu-separator>
    <mona-contextmenu-checkbox-item label="Pinned" [(checked)]="pinned"></mona-contextmenu-checkbox-item>
    <mona-contextmenu-radio-group title="Sort by" [(value)]="sort">
        <mona-contextmenu-radio-item label="Name" value="name"></mona-contextmenu-radio-item>
        <mona-contextmenu-radio-item label="Date" value="date"></mona-contextmenu-radio-item>
    </mona-contextmenu-radio-group>
</mona-contextmenu>
```

`ContextMenuComponent` and `MenuComponent` also take plain objects through `items` (`PopupMenuItem` and `MenuItem`, from `@nanahoshi/mona-ui/popup-menu`). Each component accepts only its own item elements; projecting another component's items throws.

Disabled items stay in the arrow-key order and are highlighted, so screen reader users learn they exist, but they can't be activated.

---

## 2. Activation and Events

Activating a leaf item, by click, `Enter` or `Space`, emits `menuClick` on the item, then on the menu (`menuClick` on `mona-contextmenu`, `menuItemClick` on the bar and the buttons). The event is a `PopupMenuItemClickEvent`:

| Property  | Meaning                                         |
| --------- | ----------------------------------------------- |
| `item`    | The item that was activated.                    |
| `value`   | The item's `value` input or `MenuItem.value`.   |
| `label`   | The item's label.                               |
| `checked` | For a checkbox item, its state after the click. |

Calling `event.preventDefault()` keeps the menu open and stops the change: a checkbox item stays as it was, a radio group keeps its value. Prevented on the item, the menu's own event isn't emitted.

An item with a submenu opens it instead, and emits nothing.

---

## 3. Keyboard

Inside an open menu, all four behave the same:

| Key                               | Action                                                                 |
| --------------------------------- | ---------------------------------------------------------------------- |
| `ArrowDown` / `ArrowUp`           | The next or previous item, wrapping around.                            |
| `Home` / `End`                    | The first or last item.                                                |
| `ArrowRight` (`ArrowLeft` in RTL) | Opens the highlighted item's submenu.                                  |
| `ArrowLeft` (`ArrowRight` in RTL) | Closes the submenu, back to its parent item.                           |
| `Enter` / `Space`                 | Activates the item, or opens its submenu.                              |
| `Escape`                          | Closes the open submenu, or the menu.                                  |
| `Tab`                             | Closes every open menu, and focus moves on from where the menu opened. |
| A letter, digit, `-` or `_`       | Jumps to the next item whose label starts with what was typed.         |

Opening differs by component:

| Component       | Keys                                                                                                                                                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Context menu    | The `ContextMenu` key or `Shift+F10` on the target, at the target's center.                                                                                                                                                                               |
| Menubar         | `ArrowLeft`/`ArrowRight`, `Home`/`End` and a letter move between top-level menus (one Tab stop); `Enter`, `Space` or `ArrowDown` opens with the first item highlighted, `ArrowUp` with the last. With a menu open, `ArrowLeft`/`ArrowRight` switch menus. |
| Dropdown button | `Enter`, `Space` or `ArrowDown` opens with the first item highlighted, `ArrowUp` with the last.                                                                                                                                                           |
| Split button    | The arrow button as the dropdown button does; `Alt+ArrowDown` / `Alt+ArrowUp` from the main button.                                                                                                                                                       |

---

## 4. Focus

The menu container takes focus and points at the highlighted item with `aria-activedescendant`. A menu opened from the keyboard highlights its first (or last) item; one opened by a click highlights nothing until a key is pressed. A submenu opened by the pointer leaves focus in its parent; hovering another item waits a moment before switching, so the pointer can travel to the submenu.

When a menu closes (Escape, an item, or a click outside that doesn't move focus elsewhere), focus returns to where it was when the menu opened, or to the target if it can take focus. Focus that leaves the menus for another element closes them.

---

## 5. Names and ARIA

- **The menu** is labelled by its trigger: the target's `id` (a context menu), the top-level item (a menubar menu), or the button. A submenu is labelled by its parent item. `ariaLabel` on `mona-contextmenu` names it explicitly.
- **Triggers** say they open a menu: `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` while open. A context menu sets these only on targets whose role allows them (a button, a link, or a `button`, `gridcell`, `link`, `menuitem`, `tab` or `treeitem` role); a plain `div` target gets none, and its menu is still reached through the `ContextMenu` key.
- **Buttons** are named by their content: the `text`, or what a text template renders. Set `aria-label` only when the content isn't a name, as with `iconOnly`. The split button's arrow is named from the main button's text ("More Save options", translated), and the pair is a `role="group"`.
- **Items** are named by their `label`. With a text template and no `label`, the template's text is the name.
- **Groups** with a title are a `role="group"` labelled by their header.

The menu messages are translated through the i18n catalogs; see the [i18n & RTL Guide](i18n.md).
