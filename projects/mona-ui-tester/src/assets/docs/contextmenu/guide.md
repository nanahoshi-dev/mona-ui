## Overview

`ContextMenuComponent` (`mona-contextmenu`) binds a popup menu to a `target` element. The menu opens at the pointer position when the consumer right-clicks the target, or at the target's center when the consumer presses the `ContextMenu` key (or `Shift+F10`) while the target has focus.

Menu content is built from content-projected items — `mona-contextmenu-item`, `mona-contextmenu-checkbox-item`, `mona-contextmenu-radio-group`/`mona-contextmenu-radio-item`, `mona-contextmenu-group`, and `mona-contextmenu-separator` — nested inside `<mona-contextmenu>`. Nesting items inside another item creates a submenu.

**Use `ContextMenuComponent` when you need to:**

- Offer secondary, selection-dependent actions on right-click (e.g. a file row, a canvas element, a table cell)
- Provide the same action set via a keyboard shortcut without a dedicated trigger button

**Use a closely related Mona UI component instead when:**

- The menu must always be visible as a horizontal bar of top-level items — use `MenubarComponent`.
- The menu should open from a dedicated button click rather than a right-click or keyboard shortcut — use `DropdownButtonComponent`.
- You need a lower-level popup menu with a configurable trigger event, anchor element, or open/close outputs — use `PopupMenuComponent` directly. `ContextMenuComponent` wraps it with the trigger fixed to `"contextmenu"` and pointer-relative positioning, and does not expose `PopupMenuComponent`'s `open`/`close`/`navigate` outputs or its `anchor`/`offset`/`openAtPointer` inputs.

## Import & Quick Start

```typescript
import { ContextMenuComponent, ContextMenuItemComponent, ContextMenuSeparatorComponent } from "@nanahoshi/mona-ui/contextmenu";
```

Add the components you need to your standalone component's `imports` array.

**Minimal example:**

```html
<button #target type="button">Right-click me</button>
<mona-contextmenu [target]="target" (menuClick)="onMenuClick($event)">
    <mona-contextmenu-item label="Copy"></mona-contextmenu-item>
    <mona-contextmenu-item label="Paste" [disabled]="true"></mona-contextmenu-item>
    <mona-contextmenu-separator></mona-contextmenu-separator>
    <mona-contextmenu-item label="Delete"></mona-contextmenu-item>
</mona-contextmenu>
```

```typescript
import type { MenuItemClickEvent } from "@nanahoshi/mona-ui/menubar";

protected onMenuClick(event: MenuItemClickEvent): void { /* ... */ }
```

`target` accepts a template reference (as above), an `ElementRef<HTMLElement>`, or a plain `HTMLElement`.

## Anatomy

### Content projection

```
mona-contextmenu
├── mona-contextmenu-item              — a clickable item; project more items inside it for a submenu
├── mona-contextmenu-checkbox-item     — a toggle item
├── mona-contextmenu-radio-group       — mutually exclusive choices
│   └── mona-contextmenu-radio-item
├── mona-contextmenu-group             — a titled section of items
│   └── mona-contextmenu-item
└── mona-contextmenu-separator         — a horizontal divider
```

Alternatively, pass an `items` collection directly (see the API section) instead of projecting components. When `items` is non-empty, it takes precedence over projected content.

### Template directives

Each directive can be placed directly inside `<mona-contextmenu>` to apply to every matching item, or nested inside a specific `mona-contextmenu-item`/`mona-contextmenu-group` to override it for that item or group only.

| Directive attribute               | Scope          | Template context                                                                  |
|-----------------------------------|----------------|-----------------------------------------------------------------------------------|
| `monaContextMenuGroupTemplate`    | Global / Group | `$implicit: string` — the group title                                             |
| `monaContextMenuIconTemplate`     | Global / Item  | `$implicit` — the menu item (`label`, `disabled`, …); see API for the type caveat |
| `monaContextMenuShortcutTemplate` | Global / Item  | `$implicit` — the menu item, as above                                             |
| `monaContextMenuTextTemplate`     | Global / Item  | `$implicit` — the menu item, as above                                             |

**Custom group header:**

```html
<mona-contextmenu [target]="target">
    <mona-contextmenu-group title="System Actions">
        <mona-contextmenu-item label="Properties"></mona-contextmenu-item>
        <ng-template monaContextMenuGroupTemplate let-title>
            <span class="font-semibold text-primary">{{ title }}</span>
        </ng-template>
    </mona-contextmenu-group>
</mona-contextmenu>
```

**Custom text for one item:**

```html
<mona-contextmenu [target]="target">
    <mona-contextmenu-item label="Delete">
        <ng-template monaContextMenuTextTemplate let-item>
            <span class="text-destructive">{{ item.label }}</span>
        </ng-template>
    </mona-contextmenu-item>
</mona-contextmenu>
```

When a `monaContextMenuTextTemplate` is provided without setting `label`, the projected template content is what consumers see and is also what assistive technology reads as the item's accessible name (see Accessibility below).

## Examples

### Submenus, groups and separators

Projecting items inside `mona-contextmenu-item` turns it into a submenu trigger; it renders a chevron instead of a shortcut area and no longer emits `menuClick` itself.

```example
contextmenu/basic
```

### Checkbox and radio items

`checked` on a checkbox item and `value` on a radio group are two-way bindable.

```example
contextmenu/checkable
```

### Icons and shortcuts

```example
contextmenu/icons
```

### Sizing and rounding

```html
<mona-contextmenu [target]="target" size="small" rounded="large" [minWidth]="180">
    <mona-contextmenu-item label="Copy"></mona-contextmenu-item>
    <mona-contextmenu-item label="Paste"></mona-contextmenu-item>
</mona-contextmenu>
```

`size`, `rounded`, `minWidth`, and `width` apply to the root menu and every submenu.

## Behavior

**Positioning is fixed.** The menu opens at the pointer position for a real right-click, or at the target's center when opened via keyboard. `ContextMenuComponent` does not expose a way to anchor the menu elsewhere or to use a different trigger event; use `PopupMenuComponent` directly for that.

**`items` takes precedence over projected content.** When the `items` input is a non-empty iterable, it is rendered instead of any projected `mona-contextmenu-item` (and related) components.

**Keep the menu open after a click.** Calling `event.preventDefault()` in a `(menuClick)` handler — on `<mona-contextmenu>` itself or on an individual item — prevents the menu from closing after that selection.

**Identifying the item.** The click event's `value` is the item's `value` input, so handlers don't need to compare label text (which changes with translation). `label` is the item's label, and for checkbox and radio items `checked` is the state the item has once the click is applied.

**Suppressing checkbox/radio state changes.** Calling `event.preventDefault()` on a `mona-contextmenu-checkbox-item`'s or `mona-contextmenu-radio-item`'s `menuClick` event suppresses the resulting `checkedChange` emission (checkbox item) or selection update (radio group). Use this to confirm or validate a change before it applies.

**No open/close output.** `ContextMenuComponent` only exposes `menuClick`. It does not re-emit `PopupMenuComponent`'s `open`/`close`/`navigate` events. If your use case needs to react to the menu opening or closing, use `PopupMenuComponent` directly.

**`aria-label` names the menu.** The context menu passes it to the menu it opens. When it's empty, the menu is labelled by the target, if the target has an `id`.

**The target can change.** Binding a different element to `target` moves the right-click, the keyboard shortcuts and the ARIA attributes to it. The old target gets its own attributes back, and so does the target when the context menu is destroyed.

**Closing.** Besides Escape, choosing an item and clicking outside, the menu closes when the page scrolls and when the window loses focus, as a native context menu does.

## Accessibility

### Keyboard navigation

| Key                               | Action                                                                                                      |
|-----------------------------------|-------------------------------------------------------------------------------------------------------------|
| Right-click                       | Opens the menu at the pointer position                                                                      |
| `ContextMenu` key, or `Shift+F10` | Opens the menu at the target's center, while the target has focus                                           |
| `ArrowDown`                       | Highlights the next item, wrapping to the first. Disabled items are highlighted too, but can't be activated |
| `ArrowUp`                         | Highlights the previous item, wrapping to the last                                                          |
| `ArrowRight`                      | Opens the highlighted item's submenu, if it has nested items                                                |
| `ArrowLeft`                       | Closes the current submenu and returns to the parent level                                                  |
| `Home`                            | Highlights the first item                                                                                   |
| `End`                             | Highlights the last item                                                                                    |
| `Enter` / `Space`                 | Activates the highlighted item, or opens its submenu if it has nested items                                 |
| `Escape`                          | Closes the open submenu                                                                                     |
| `Tab`                             | Closes the menu and its submenus; focus moves on from the target                                            |
| Letter, digit, `-`, or `_`        | Jumps to (cycles through) items whose label starts with the typed text                                      |

### ARIA

**Target element** (the element bound to `target`), only when its role allows these attributes: a button, a link, or an element with `role` `button`, `gridcell`, `link`, `menuitem`, `tab` or `treeitem`. On any other target (a `div`, a section, a table row) they would be invalid, so they're left off; the menu is still found through the `ContextMenu` key and `Shift+F10`.

| Attribute       | When present            | Value                                                |
|-----------------|-------------------------|------------------------------------------------------|
| `aria-haspopup` | Always (on those roles) | `"menu"`                                             |
| `aria-controls` | While the menu is open  | The menu's ID                                        |
| `aria-expanded` | Always (on those roles) | `"true"` while the menu is open, otherwise `"false"` |

**Menu container** (`role="menu"`):

| Attribute               | When present                                          | Value                                                |
|-------------------------|-------------------------------------------------------|------------------------------------------------------|
| `role`                  | Always                                                | `"menu"`                                             |
| `aria-orientation`      | Always                                                | `"vertical"`                                         |
| `aria-activedescendant` | While an item is highlighted via keyboard or pointer  | The highlighted item's ID                            |
| `aria-labelledby`       | Root menu, when the target has an `id`; every submenu | The target's ID; for a submenu, its parent item's ID |

**Item** (`role="menuitem"`, `"menuitemcheckbox"` or `"menuitemradio"`):

| Attribute       | When present                         | Value                                                                                    |
|-----------------|--------------------------------------|------------------------------------------------------------------------------------------|
| `role`          | Always                               | `"menuitem"`; `"menuitemcheckbox"` for checkbox items, `"menuitemradio"` for radio items |
| `aria-checked`  | Checkbox and radio items             | `"true"` while checked or selected, otherwise `"false"`                                  |
| `aria-disabled` | Always                               | Reflects the item's `disabled` input                                                     |
| `aria-haspopup` | When the item has nested items       | `"menu"`                                                                                 |
| `aria-expanded` | When the item has nested items       | `"true"` while its submenu is open, otherwise `"false"`                                  |
| `aria-controls` | While the item's submenu is open     | The submenu's ID                                                                         |
| `aria-label`    | When the item's `label` is non-empty | The item's `label` text                                                                  |

**Group** (`role="group"`): wraps a titled group's header and its items, with `aria-labelledby` pointing at the header. **Separator:** `role="separator"`.

**Focus behavior:** focus stays on the `role="menu"` container rather than moving to individual items; the highlighted item is communicated through `aria-activedescendant`. When the menu closes (Escape, choosing an item, or a click outside that doesn't move focus elsewhere), focus returns to the element that had it when the menu opened, or to the target if it can take focus. `Tab` closes every open menu and moves focus on from there, and focus that leaves the menus for another element closes them too. A submenu opened by the pointer leaves focus in its parent menu; one opened from the keyboard takes focus and highlights its first item.

**Consumer responsibilities:**

- Provide an accessible name for the `target` element itself (visible text, or its own `aria-label`) — `ContextMenuComponent` does not add one. Its `aria-label` input names the menu, not the target.
- When an item uses a `monaContextMenuTextTemplate` and the item's `label` is left empty, no `aria-label` fallback is applied; ensure the projected template content alone communicates the item (it is read as the item's accessible name via its text content).

<!-- verification-checklist
- [x] API definitions and defaults verified against source (context-menu.component.ts and the inherited PopupMenu* base classes in popup-menu/)
- [x] menuClick output type documented as PopupMenuItemClickEvent, exported from @nanahoshi/mona-ui/popup-menu
- [x] ContextMenuGroupComponent.title is optional (input<string>()); ContextMenuRadioItemComponent.value is input.required<string>()
- [x] ContextMenuRadioGroupComponent.value confirmed as model<string>("") — documented as two-way bindable
- [x] ContextMenuCheckboxItemComponent.checked confirmed as model(false): two-way bindable, and the item toggles itself
- [x] ariaLabel is passed to the root menu as its aria-label
- [x] items input precedence over projected content verified against ContextMenuComponent.menuItems computed
- [x] preventDefault-keeps-menu-open verified against PopupMenuComponent.setMenuItemClickSubscription
- [x] preventDefault-suppresses-checked/selection verified against PopupMenuCheckboxItemComponent and PopupMenuRadioGroupComponent setSubscription(s)
- [x] ARIA table verified against popup-menu-list.component.html (post-fix: item id binding, aria-label fallback, aria-current removed) and context-menu.component.ts target attribute handling
- [x] Keyboard map verified against PopupMenuListComponent's handle*Key methods and isNavigationKey/isTypeaheadKey
- [x] Focus-restoration-on-close behavior verified against PopupMenuComponent's open-menu state (`restoreFocus`, `returnFocusTo`)
- [x] No open/close output on ContextMenuComponent confirmed — only menuClick is defined in context-menu.component.ts
- [x] PopupMenuItem and MenuItem confirmed exported from popup-menu/public-api.ts; typeahead no longer lists space, which activates the item
- [x] No internal or unexported APIs exposed beyond the documented TODOs
- [x] Inputs sorted A→Z within each table
- [x] Basic examples compile against the public API surface
-->
