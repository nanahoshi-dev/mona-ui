## Overview

`MenubarComponent` (`mona-menubar`) renders a horizontal `role="menubar"` bar. Each top-level `mona-menu` opens its own popup menu on click, built from content-projected menu item components nested inside it.

Menu content is built the same way as `ContextMenuComponent`: `mona-menu-item`, `mona-menu-checkbox-item`, `mona-menu-radio-group`/`mona-menu-radio-item`, `mona-menu-group`, and `mona-menu-separator`, nested inside a `mona-menu`. Nesting items inside another item creates a submenu.

**Use `MenubarComponent` when you need to:**

- Provide a persistent, always-visible bar of top-level menus (File, Edit, View, …) at the top of an application or a document-style view
- Let users switch between open menus by moving the pointer across the bar, the way a desktop application menubar behaves

**Use a closely related Mona UI component instead when:**

- The menu should only appear on right-click or a keyboard shortcut on a specific target element — use `ContextMenuComponent`.
- The menu should open from a single dedicated button rather than a row of persistent top-level menus — use `DropdownButtonComponent`.
- You need a lower-level popup menu with a configurable trigger event, anchor element, or open/close outputs for a single menu — use `PopupMenuComponent` directly. `MenubarComponent` creates one `PopupMenuComponent` per top-level `mona-menu` internally and does not expose its `anchor`/`offset`/`precise` inputs.

## Import & Quick Start

```typescript
import { MenubarComponent, MenuComponent, MenuItemComponent } from "@nanahoshi/mona-ui/menubar";
```

Add the components you need to your standalone component's `imports` array.

**Minimal example:**

```html
<mona-menubar (menuItemClick)="onMenuClick($event)">
    <mona-menu text="File">
        <mona-menu-item label="New"></mona-menu-item>
        <mona-menu-item label="Open"></mona-menu-item>
        <mona-menu-separator></mona-menu-separator>
        <mona-menu-item label="Exit"></mona-menu-item>
    </mona-menu>
    <mona-menu text="Edit">
        <mona-menu-item label="Undo"></mona-menu-item>
        <mona-menu-item label="Redo"></mona-menu-item>
    </mona-menu>
</mona-menubar>
```

```typescript
import type { MenuItemClickEvent } from "@nanahoshi/mona-ui/menubar";

protected onMenuClick(event: MenuItemClickEvent): void { /* ... */ }
```

## Anatomy & Public Structural Templates

### Content projection

```
mona-menubar
└── mona-menu                          — a top-level menu; text is set via the `text` input
    ├── mona-menu-item                 — a clickable item; project more items inside it for a submenu
    ├── mona-menu-checkbox-item        — a toggle item
    ├── mona-menu-radio-group          — mutually exclusive choices
    │   └── mona-menu-radio-item
    ├── mona-menu-group                — a titled section of items
    │   └── mona-menu-item
    └── mona-menu-separator            — a horizontal divider
```

Alternatively, a `mona-menu` can be given an `items` collection directly (see the API section) instead of projecting item components. When `items` is non-empty, it takes precedence over projected content.

### Template directives

Two directives customize a top-level menu itself (`monaMenuIconTemplate`, `monaMenuTextTemplate`); the rest customize the items inside a menu's popup, the same way `ContextMenuComponent`'s template directives do.

| Directive attribute            | Scope          | Template context                                                                  |
|--------------------------------|----------------|-----------------------------------------------------------------------------------|
| `monaMenuGroupTemplate`        | Global / Group | `$implicit: string` — the group title                                             |
| `monaMenuIconTemplate`         | Global / Menu  | `$implicit: string` — the menu's `text`, `items` — the menu's resolved items      |
| `monaMenuItemIconTemplate`     | Global / Item  | `$implicit` — the menu item (`label`, `disabled`, …); see API for the type caveat |
| `monaMenuItemShortcutTemplate` | Global / Item  | `$implicit` — the menu item, as above                                             |
| `monaMenuItemTextTemplate`     | Global / Item  | `$implicit` — the menu item, as above                                             |
| `monaMenuTextTemplate`         | Global / Menu  | `$implicit: string` — the menu's `text`, `items` — the menu's resolved items      |

Placed directly inside `<mona-menubar>`, a directive applies to every menu (or every item, for the item-level ones). Placed inside a specific `mona-menu`, `mona-menu-item`, or `mona-menu-group`, it overrides the global template for that node only.

**Custom icon for one top-level menu:**

```html
<mona-menubar>
    <mona-menu text="File">
        <ng-template monaMenuIconTemplate>
            <svg lucideFile [size]="14"></svg>
        </ng-template>
        <mona-menu-item label="New"></mona-menu-item>
    </mona-menu>
</mona-menubar>
```

**Custom text for every top-level menu:**

```html
<mona-menubar>
    <ng-template monaMenuTextTemplate let-text let-items="items">
        <span>{{ text }} ({{ items.length }})</span>
    </ng-template>
    <mona-menu text="File">
        <mona-menu-item label="New"></mona-menu-item>
    </mona-menu>
</mona-menubar>
```

**Custom text for one item:**

```html
<mona-menubar>
    <mona-menu text="File">
        <mona-menu-item label="Delete">
            <ng-template monaMenuItemTextTemplate let-item>
                <span class="text-destructive">{{ item.label }}</span>
            </ng-template>
        </mona-menu-item>
    </mona-menu>
</mona-menubar>
```

When a `monaMenuItemTextTemplate` is provided without setting `label`, the projected template content is what consumers see and is also what assistive technology reads as the item's accessible name (see Accessibility below).

## Examples

### Submenus, groups and separators

Projecting items inside `mona-menu-item` turns it into a submenu trigger; it renders a chevron instead of a shortcut area and no longer emits `menuClick` itself.

```example
menubar/basic
```

### Checkbox and radio items

`checked` on a checkbox item and `value` on a radio group are two-way bindable.

```example
menubar/checkable
```

### Disabling a menu

```example
menubar/disabled
```

Set `[disabled]` on the whole `<mona-menubar>` to disable every menu at once, or on an individual `mona-menu` to disable only that menu. A disabled menu does not open on click, hover, or keyboard activation, but the arrow keys still reach it, so it can be read and found. A `mona-menu` without items is a plain menubar item: it doesn't advertise or open a popup.

### Sizing and rounding

```html
<mona-menubar size="small" rounded="large">
    <mona-menu text="File">
        <mona-menu-item label="New"></mona-menu-item>
    </mona-menu>
</mona-menubar>
```

`size` and `rounded` apply to the menubar itself and to every menu's popup.

## Technical & Behavior Notes

**`items` takes precedence over projected content.** When a `mona-menu`'s `items` input is a non-empty iterable, it is rendered instead of any projected `mona-menu-item` (and related) components.

**Keep the menu open after a click.** Calling `event.preventDefault()` in a `(menuItemClick)` handler — on `<mona-menubar>` itself or on an individual item's own `(menuClick)` — prevents the menu from closing after that selection.

**Identifying the item.** The click event's `value` is the item's `value` input, so handlers don't need to compare label text (which changes with translation). `label` is the item's label, and for checkbox and radio items `checked` is the state the item has once the click is applied.

**Suppressing checkbox/radio state changes.** Calling `event.preventDefault()` on a `mona-menu-checkbox-item`'s or `mona-menu-radio-item`'s `menuClick` event suppresses the resulting `checkedChange` emission (checkbox item) or selection update (radio group). Use this to confirm or validate a change before it applies.

**Switching menus.** While one menu's popup is open, moving the pointer over a different top-level menu closes the current popup and opens the new one; `ArrowLeft`/`ArrowRight` in the popup do the same. When the new menu is disabled or has no items, the popup just closes (from the keyboard, focus lands on that menubar item). The Tab stop follows the menu you're in. Hovering while the menubar itself is disabled has no effect.

**Items from another menu family** (a `mona-contextmenu-item` inside a `mona-menu`, say) throw an error naming the component to use.

## Accessibility

### Keyboard navigation

**On the menubar itself** (before a menu is open, or moving between top-level menus):

| Key               | Action                                                                                        |
|-------------------|-----------------------------------------------------------------------------------------------|
| `Tab`             | Moves focus to or from the menubar. Only one top-level menu is a Tab stop at a time.          |
| `ArrowRight`      | Moves focus to the next top-level menu, wrapping to the first. Disabled menus are reached too |
| `ArrowLeft`       | Moves focus to the previous top-level menu, wrapping to the last                              |
| `Home`            | Moves focus to the first top-level menu                                                       |
| `End`             | Moves focus to the last top-level menu                                                        |
| `Enter` / `Space` | Opens the focused menu, with its first item highlighted                                       |
| `ArrowDown`       | Opens the focused menu with its first item highlighted, if none is currently open             |
| `ArrowUp`         | Opens the focused menu with its last item highlighted, if none is currently open              |
| `Escape`          | Closes the currently open menu                                                                |
| A letter or digit | Moves focus to the next top-level menu whose text starts with it                              |

**Within an open menu's popup** (same list navigation as `ContextMenuComponent`):

| Key                        | Action                                                                                                                                                  |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ArrowDown`                | Highlights the next item, wrapping to the first. Disabled items are highlighted too, but can't be activated                                             |
| `ArrowUp`                  | Highlights the previous item, wrapping to the last                                                                                                      |
| `ArrowRight`               | Opens the highlighted item's submenu if it has nested items; at the popup's root level, moves to the next top-level menu instead                        |
| `ArrowLeft`                | Closes the current submenu and returns to the parent level; at the popup's root level, moves to the previous top-level menu instead, on the first press |
| `Home`                     | Highlights the first item                                                                                                                               |
| `End`                      | Highlights the last item                                                                                                                                |
| `Enter` / `Space`          | Activates the highlighted item, or opens its submenu if it has nested items                                                                             |
| `Escape`                   | Closes the open submenu, or the menu itself at the root level                                                                                           |
| `Tab`                      | Closes the open menus; focus moves on from the menubar                                                                                                  |
| Letter, digit, `-`, or `_` | Jumps to (cycles through) items whose label starts with the typed text                                                                                  |

### ARIA

**Menubar** (`role="menubar"`):

| Attribute         | When present                       | Value                         |
|-------------------|------------------------------------|-------------------------------|
| `role`            | Always                             | `"menubar"`                   |
| `aria-disabled`   | Always                             | Reflects the `disabled` input |
| `aria-label`      | When `ariaLabel` is non-empty      | Value of `ariaLabel`          |
| `aria-labelledby` | When `ariaLabelledby` is non-empty | Value of `ariaLabelledby`     |

**Top-level menu** (`role="menuitem"`, one per `mona-menu`):

| Attribute       | When present                    | Value                                                                                                                                 |
|-----------------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `role`          | Always                          | `"menuitem"`                                                                                                                          |
| `tabindex`      | Always                          | `0` for exactly one menu (roving tab stop) and `-1` for the rest; disabled menus take part. `-1` for all when the menubar is disabled |
| `aria-disabled` | Always                          | Reflects the menu's `disabled` input                                                                                                  |
| `id`            | Always                          | An auto-generated ID that names the menu's popup                                                                                      |
| `aria-haspopup` | When the menu has items         | `"menu"`                                                                                                                              |
| `aria-expanded` | When the menu has items         | `"true"` while that menu's popup is open, otherwise `"false"`                                                                         |
| `aria-controls` | While that menu's popup is open | The popup menu container's auto-generated ID                                                                                          |

**Popup menu container** (`role="menu"`), **item** (`role="menuitem"`), and **group** (`role="group"`): the popup is labelled by its top-level menu (`aria-labelledby`); otherwise the same attributes as `ContextMenuComponent`'s popup — see its documentation for the full table. In summary: the container carries `aria-orientation="vertical"` and `aria-activedescendant` while an item is highlighted; checkbox and radio items are `menuitemcheckbox` and `menuitemradio` with `aria-checked`; each item carries `aria-disabled`, `aria-haspopup`/`aria-expanded` when it has nested items, and `aria-label` when its `label` is non-empty; groups wrap their header and items and carry `aria-labelledby`.

**Focus behavior:** on the menubar itself, exactly one top-level menu is a Tab stop at a time (roving tabindex) and Arrow keys move it. Once a popup opens, focus moves into its `role="menu"` container the same way as `ContextMenuComponent`; the highlighted item is communicated through `aria-activedescendant` rather than DOM focus. When a popup closes (Escape, choosing an item, or a click outside that doesn't move focus elsewhere), focus returns to its top-level menu. `Tab` closes the popup and moves focus out of the menubar. A submenu opened by the pointer leaves focus in its parent menu.

**Consumer responsibilities:**

- Provide `[ariaLabel]` or `[ariaLabelledby]` on `<mona-menubar>` when the surrounding page does not already identify the menubar's purpose.
- When an item uses a `monaMenuItemTextTemplate` and the item's `label` is left empty, no `aria-label` fallback is applied; ensure the projected template content alone communicates the item.

<!-- verification-checklist
- [x] API definitions and defaults verified against source (menubar/*.component.ts and the inherited PopupMenu* base classes in popup-menu/)
- [x] menuItemClick/menuClick output types documented as MenuItemClickEvent, the menubar's alias of PopupMenuItemClickEvent
- [x] MenuGroupComponent.title is optional (input<string>()); MenuRadioItemComponent.value is input.required<string>()
- [x] MenuRadioGroupComponent.value confirmed as model<string>("") — documented as two-way bindable
- [x] MenuCheckboxItemComponent.checked confirmed as model(false): two-way bindable, and the item toggles itself
- [x] Disabled menus are reached by the arrow keys but don't open on click (trigger off), hover or keyboard (onMenuPointerEnter/onMenuKeyDown guards)
- [x] Roving tabindex (single Tab stop) confirmed implemented via activeIndex signal in menubar.component.ts before documenting it as fact
- [x] aria-controls / aria-expanded null-vs-null false-positive bug confirmed fixed in menubar.component.html before documenting aria-expanded/aria-controls as reliable
- [x] rounded/size variant unions verified against menu.styles.ts (menubarBaseThemeVariants: rounded none/small/medium/large, size small/medium/large)
- [x] items input precedence over projected content verified against MenuComponent.menuItems computed
- [x] preventDefault-keeps-menu-open verified against PopupMenuComponent.setMenuItemClickSubscription
- [x] preventDefault-suppresses-checked/selection verified against PopupMenuCheckboxItemComponent and PopupMenuRadioGroupComponent setSubscription(s)
- [x] Keyboard map (menubar level) verified against MenubarComponent.onMenuKeyDown, moveToNext/PreviousMenu, findNextNonDisabledMenuIndex/findPreviousNonDisabledMenuIndex
- [x] Keyboard map (popup level) verified against PopupMenuListComponent's handle*Key methods, shared with ContextMenuComponent
- [x] Cross-popup ArrowLeft/ArrowRight-moves-between-top-level-menus behavior verified against MenubarComponent.setNavigationSubscription and PopupMenuListComponent.handleNavigationKey's level===0 branches
- [x] Pointer and keyboard switching between open menus, including disabled and empty menus, verified against onMenuPointerEnter and updateCurrentMenuData
- [x] Focus-restoration-on-close behavior verified against PopupMenuComponent's open-menu state (`restoreFocus`, `returnFocusTo`)
- [x] MenuComponent.items type documented as Iterable<MenuItem>; MenuItem shape taken from popup-menu/models/PopupMenuItem.ts
- [x] PopupMenuItem and MenuItem confirmed exported from popup-menu/public-api.ts; typeahead no longer lists space, which activates the item
- [x] No internal or unexported APIs exposed beyond the documented TODOs
- [x] Inputs sorted A→Z within each table
- [x] Basic examples compile against the public API surface
- [x] component-metadata.json regenerated after userClasses JSDoc addition and cross-checked against this page
-->
