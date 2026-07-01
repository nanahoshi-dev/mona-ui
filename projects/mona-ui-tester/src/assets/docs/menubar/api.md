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
import { MenubarComponent, MenuComponent, MenuItemComponent } from "@mirei/mona-ui";
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
import type { MenuItemClickEvent } from "@mirei/mona-ui";

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

| Directive attribute | Scope | Template context |
|---|---|---|
| `monaMenuGroupTemplate` | Global / Group | `$implicit: string` — the group title |
| `monaMenuIconTemplate` | Global / Menu | `$implicit: string` — the menu's `text`, `items` — the menu's resolved items |
| `monaMenuItemIconTemplate` | Global / Item | `$implicit` — the menu item (`label`, `disabled`, …); see API for the type caveat |
| `monaMenuItemShortcutTemplate` | Global / Item | `$implicit` — the menu item, as above |
| `monaMenuItemTextTemplate` | Global / Item | `$implicit` — the menu item, as above |
| `monaMenuTextTemplate` | Global / Menu | `$implicit: string` — the menu's `text`, `items` — the menu's resolved items |

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

## Feature Examples

### Submenu (nested items)

```html
<mona-menu text="File">
    <mona-menu-item label="New">
        <mona-menu-item label="Folder"></mona-menu-item>
        <mona-menu-item label="Text Document"></mona-menu-item>
    </mona-menu-item>
</mona-menu>
```

Projecting items inside `mona-menu-item` turns it into a submenu trigger; it renders a chevron instead of a shortcut area and no longer emits `menuClick` itself.

### Checkbox items

```html
<mona-menu text="View">
    <mona-menu-checkbox-item
        label="Show Grid"
        [checked]="showGrid()"
        (checkedChange)="showGrid.set($event)">
    </mona-menu-checkbox-item>
</mona-menu>
```

### Radio group

```html
<mona-menu text="Appearance">
    <mona-menu-item label="Theme">
        <mona-menu-radio-group [(value)]="theme">
            <mona-menu-radio-item label="Light" value="light"></mona-menu-radio-item>
            <mona-menu-radio-item label="Dark" value="dark"></mona-menu-radio-item>
            <mona-menu-radio-item label="System" value="system"></mona-menu-radio-item>
        </mona-menu-radio-group>
    </mona-menu-item>
</mona-menu>
```

```typescript
protected readonly theme = signal("system");
```

### Groups and separators

```html
<mona-menu text="File">
    <mona-menu-group title="Export Options">
        <mona-menu-item label="Export as PDF"></mona-menu-item>
        <mona-menu-item label="Export as Image"></mona-menu-item>
    </mona-menu-group>
    <mona-menu-separator></mona-menu-separator>
    <mona-menu-item label="Close"></mona-menu-item>
</mona-menu>
```

### Disabling a menu

```html
<mona-menubar>
    <mona-menu text="File">
        <mona-menu-item label="New"></mona-menu-item>
    </mona-menu>
    <mona-menu text="Edit" [disabled]="!hasSelection()">
        <mona-menu-item label="Cut"></mona-menu-item>
        <mona-menu-item label="Copy"></mona-menu-item>
    </mona-menu>
</mona-menubar>
```

Set `[disabled]` on the whole `<mona-menubar>` to disable every menu at once, or on an individual `mona-menu` to disable only that menu. A disabled menu does not open on click, hover, or keyboard activation.

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

**Suppressing checkbox/radio state changes.** Calling `event.preventDefault()` on a `mona-menu-checkbox-item`'s or `mona-menu-radio-item`'s `menuClick` event suppresses the resulting `checkedChange` emission (checkbox item) or selection update (radio group). Use this to confirm or validate a change before it applies.

**Switching menus by pointer.** While one menu's popup is open, moving the pointer over a different (enabled) top-level menu closes the current popup and opens the new one. Hovering a disabled menu, or hovering while the menubar itself is disabled, has no effect.

## Accessibility

### Keyboard navigation

**On the menubar itself** (before a menu is open, or moving between top-level menus):

| Key | Action |
|---|---|
| `Tab` | Moves focus to or from the menubar. Only one top-level menu is a Tab stop at a time. |
| `ArrowRight` | Moves focus to the next enabled top-level menu, wrapping to the first |
| `ArrowLeft` | Moves focus to the previous enabled top-level menu, wrapping to the last |
| `Home` | Moves focus to the first enabled top-level menu |
| `End` | Moves focus to the last enabled top-level menu |
| `Enter` / `Space` | Opens the focused menu |
| `ArrowDown` | Opens the focused menu, if none is currently open |
| `Escape` | Closes the currently open menu |

**Within an open menu's popup** (same list navigation as `ContextMenuComponent`):

| Key | Action |
|---|---|
| `ArrowDown` | Highlights the next item, wrapping to the first |
| `ArrowUp` | Highlights the previous item, wrapping to the last |
| `ArrowRight` | Opens the highlighted item's submenu if it has nested items; at the popup's root level, moves to the next top-level menu instead |
| `ArrowLeft` | Closes the current submenu and returns to the parent level; at the popup's root level, moves to the previous top-level menu instead |
| `Home` | Highlights the first item |
| `End` | Highlights the last item |
| `Enter` / `Space` | Activates the highlighted item, or opens its submenu if it has nested items |
| `Escape` | Closes the open submenu, or the menu itself at the root level |
| Letter, digit, space, `-`, or `_` | Jumps to (cycles through) items whose label starts with the typed text |

### ARIA

**Menubar** (`role="menubar"`):

| Attribute | When present | Value |
|---|---|---|
| `role` | Always | `"menubar"` |
| `aria-disabled` | Always | Reflects the `disabled` input |
| `aria-label` | When `ariaLabel` is non-empty | Value of `ariaLabel` |
| `aria-labelledby` | When `ariaLabelledby` is non-empty | Value of `ariaLabelledby` |

**Top-level menu** (`role="menuitem"`, one per `mona-menu`):

| Attribute | When present | Value |
|---|---|---|
| `role` | Always | `"menuitem"` |
| `tabindex` | Always | `-1` when disabled; otherwise `0` for exactly one menu (roving tab stop) and `-1` for the rest |
| `aria-disabled` | Always | Reflects the menu's `disabled` input |
| `aria-haspopup` | Always | `"menu"` |
| `aria-expanded` | Always | `"true"` while that menu's popup is open, otherwise `"false"` |
| `aria-controls` | While that menu's popup is open | The popup menu container's auto-generated ID |

**Popup menu container** (`role="menu"`), **item** (`role="menuitem"`), and **group** (`role="group"`): same attributes as `ContextMenuComponent`'s popup — see its documentation for the full table. In summary: the container carries `aria-orientation="vertical"` and `aria-activedescendant` while an item is highlighted; each item carries `aria-disabled`, `aria-haspopup`/`aria-expanded` when it has nested items, and `aria-label` when its `label` is non-empty; groups carry `aria-labelledby`.

**Focus behavior:** on the menubar itself, exactly one top-level menu is a Tab stop at a time (roving tabindex) and Arrow keys move it. Once a popup opens, focus moves into its `role="menu"` container the same way as `ContextMenuComponent`; the highlighted item is communicated through `aria-activedescendant` rather than DOM focus. When a popup opened via keyboard closes, focus returns to its triggering top-level menu.

**Consumer responsibilities:**

- Provide `[ariaLabel]` or `[ariaLabelledby]` on `<mona-menubar>` when the surrounding page does not already identify the menubar's purpose.
- When an item uses a `monaMenuItemTextTemplate` and the item's `label` is left empty, no `aria-label` fallback is applied; ensure the projected template content alone communicates the item.

## API

### `MenubarComponent`

**Selector:** `mona-menubar`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `''` | ARIA label for the menubar. |
| `ariaLabelledby` | `string` | `''` | ARIA labelledby for the menubar. |
| `class` | `string` | `''` | Additional CSS classes to apply to the menubar, merged with the computed theme classes. |
| `disabled` | `boolean` | `false` | Disables every menu in the menubar. Blocks click, hover, and keyboard activation. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Border-radius preset applied to the menubar and every menu's popup. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size preset applied to the menubar and every menu's popup. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `menuItemClick` | `MenuItemClickEvent` | Emitted when a menu item in any menu is activated by pointer or keyboard. Call `event.preventDefault()` to keep the menu open. |

---

### `MenuComponent`

**Selector:** `mona-menu`

A top-level menu. Its `text` is displayed on the menubar; its projected items (or `items` input) become the popup content.

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Renders the menu with reduced visual emphasis and prevents it from opening. |
| `items` | `Iterable<MenuItem>` | `[]` | Menu items to render directly, instead of content-projected item components. Takes precedence over projected content when non-empty. TODO(owner-review): `MenuItem` is not exported from `@mirei/mona-ui`; it is a plain object with `label` (required), and optional `checkable`, `checked`, `disabled`, `group`, `items`, and `separator` fields. |
| `text` | `string` | `''` | Display text of the menu on the menubar. |

`MenuComponent` has no outputs.

---

### `MenuItemComponent`

**Selector:** `mona-menu-item`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Renders the item with reduced visual emphasis and prevents selection. |
| `label` | `string` | `''` | Display text of the item. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `menuClick` | `MenuItemClickEvent` | Emitted when this item is selected by pointer or keyboard. Not emitted when the item has nested items (it opens a submenu instead). |

---

### `MenuCheckboxItemComponent`

**Selector:** `mona-menu-checkbox-item`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `checked` | `boolean` | `false` | Whether the item is checked. Bind `(checkedChange)` to track state changes. |
| `disabled` | `boolean` | `false` | Renders the item with reduced visual emphasis and prevents selection. |
| `label` | `string` | `''` | Display text of the item. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `checkedChange` | `boolean` | Emitted with the new checked state after activation. Not emitted when `event.preventDefault()` is called on `menuClick`. |
| `menuClick` | `MenuItemClickEvent` | Emitted when the item is activated. Call `event.preventDefault()` to suppress the checked-state change. |

---

### `MenuRadioGroupComponent`

**Selector:** `mona-menu-radio-group`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `''` | Section header text displayed above the radio items. When empty, the items are still grouped logically but no header is rendered. |
| `value` | `string` | `''` | Two-way bindable selected value. Use `[(value)]` to synchronize with a signal or property. The `mona-menu-radio-item` with the matching `value` renders as selected. |

`MenuRadioGroupComponent` has no outputs; observe `[(value)]` to react to selection changes.

---

### `MenuRadioItemComponent`

**Selector:** `mona-menu-radio-item`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Renders the item with reduced visual emphasis and prevents selection. |
| `label` | `string` | `''` | Display text of the item. |
| `value` | `string` | — | Required. The value reported to the parent `mona-menu-radio-group` when this item is selected. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `menuClick` | `MenuItemClickEvent` | Emitted when the item is selected. Call `event.preventDefault()` to suppress the resulting selection update on the parent radio group. |

Must be projected inside a `mona-menu-radio-group` to participate in selection.

---

### `MenuGroupComponent`

**Selector:** `mona-menu-group`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | — | Required. Header text displayed above the group's projected items. |

`MenuGroupComponent` has no outputs.

---

### `MenuSeparatorComponent`

**Selector:** `mona-menu-separator`

Renders a horizontal visual divider between items. Has no inputs or outputs.

---

### `MenuGroupTemplateDirective`

**Selector:** `ng-template[monaMenuGroupTemplate]`

Customizes a group header's content.

| Variable | Type | Description |
|---|---|---|
| `$implicit` (as `let-title`) | `string` | The group's title. |

---

### `MenuIconTemplateDirective` / `MenuTextTemplateDirective`

**Selectors:** `ng-template[monaMenuIconTemplate]` · `ng-template[monaMenuTextTemplate]`

Customize a top-level menu's icon area and its displayed text, respectively.

| Variable | Type | Description |
|---|---|---|
| `$implicit` (as `let-text`) | `string` | The menu's `text` input value. |
| `items` (as `let-items="items"`) | `unknown[]` | TODO(owner-review): the menu's resolved items, typed as `PopupMenuItem[]` internally; `PopupMenuItem` is not exported from `@mirei/mona-ui`. |

---

### `MenuItemIconTemplateDirective` / `MenuItemShortcutTemplateDirective` / `MenuItemTextTemplateDirective`

**Selectors:** `ng-template[monaMenuItemIconTemplate]` · `ng-template[monaMenuItemShortcutTemplate]` · `ng-template[monaMenuItemTextTemplate]`

Customize, respectively, an item's leading icon area, its trailing shortcut area (shown only on leaf items), and its label text.

| Variable | Type | Description |
|---|---|---|
| `$implicit` (as `let-item`) | `PopupMenuItem` | The menu item. TODO(owner-review): `PopupMenuItem` is not exported from `@mirei/mona-ui`; consumers can read properties such as `item.label` and `item.disabled` but cannot import the type for an explicit annotation. |

---

TODO(owner-review): `PopupMenuItem` and `MenuItem` (used by `MenuComponent.items` and by the template contexts above) are not exported from `@mirei/mona-ui`. `MenuItemClickEvent` (used by every `menuClick`/`menuItemClick` output above) **is** exported, as a type alias for `PopupMenuItemClickEvent`.

<!-- verification-checklist
- [x] API definitions and defaults verified against source (menubar/*.component.ts and inherited PopupMenu* base classes under common/popup-menu)
- [x] menuItemClick/menuClick output types documented as MenuItemClickEvent (exported alias for PopupMenuItemClickEvent, lib/index.ts) — not the unexported PopupMenuItemClickEvent name
- [x] MenuGroupComponent.title and MenuRadioItemComponent.value confirmed as input.required<string>() — marked Required, default "—"
- [x] MenuRadioGroupComponent.value confirmed as model<string>("") — documented as two-way bindable
- [x] MenuCheckboxItemComponent.checked/checkedChange confirmed as plain input()/output() pair (not model())
- [x] disabled-not-enforced-for-pointer/click bug (menubar and per-item) confirmed fixed in menubar.component.ts (onMenuPointerEnter/onMenuClick/onMenuKeyDown guards) before documenting "blocks click, hover, and keyboard activation" as fact
- [x] Roving tabindex (single Tab stop) confirmed implemented via activeIndex signal in menubar.component.ts before documenting it as fact
- [x] aria-controls / aria-expanded null-vs-null false-positive bug confirmed fixed in menubar.component.html before documenting aria-expanded/aria-controls as reliable
- [x] rounded/size variant unions verified against menu.mona.styles.ts (menubarBaseVariants: rounded none/small/medium/large, size small/medium/large)
- [x] items input precedence over projected content verified against MenuComponent.menuItems computed
- [x] preventDefault-keeps-menu-open verified against PopupMenuComponent.setMenuItemClickSubscription
- [x] preventDefault-suppresses-checked/selection verified against PopupMenuCheckboxItemComponent and PopupMenuRadioGroupComponent setSubscription(s)
- [x] Keyboard map (menubar level) verified against MenubarComponent.onMenuKeyDown, moveToNext/PreviousMenu, findNextNonDisabledMenuIndex/findPreviousNonDisabledMenuIndex
- [x] Keyboard map (popup level) verified against PopupMenuListComponent's handle*Key methods, shared with ContextMenuComponent
- [x] Cross-popup ArrowLeft/ArrowRight-moves-between-top-level-menus behavior verified against MenubarComponent.setNavigationSubscription and PopupMenuListComponent.handleNavigationKey's level===0 branches
- [x] Pointer hover-switch-between-open-menus behavior, including disabled guard, verified against onMenuPointerEnter
- [x] Focus-restoration-on-close behavior verified against PopupMenuComponent's #shouldRestoreFocus handling
- [x] MenuComponent.items type documented as Iterable<MenuItem>; MenuItem shape (label required, optional checkable/checked/disabled/group/items/separator) taken from common/popup-menu/models/PopupMenuItem.ts
- [x] PopupMenuItem and MenuItem confirmed not exported from lib/index.ts
- [x] No internal or unexported APIs exposed beyond the documented TODOs
- [x] Inputs sorted A→Z within each table
- [x] Basic examples compile against the public API surface
- [x] component-metadata.json regenerated after userClasses JSDoc addition and cross-checked against this page
-->
