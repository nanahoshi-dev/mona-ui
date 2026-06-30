## Overview

`ContextMenuComponent` (`mona-contextmenu`) binds a popup menu to a `target` element. The menu opens at the pointer position when the consumer right-clicks the target, or at the target's center when the consumer presses the `ContextMenu` key (or `Shift+F10`) while the target has focus.

Menu content is built from content-projected items — `mona-contextmenu-item`, `mona-contextmenu-checkbox-item`, `mona-contextmenu-radio-group`/`mona-contextmenu-radio-item`, `mona-contextmenu-group`, and `mona-contextmenu-separator` — nested inside `<mona-contextmenu>`. Nesting items inside another item creates a submenu.

**Use `ContextMenuComponent` when you need to:**

- Offer secondary, selection-dependent actions on right-click (e.g. a file row, a canvas element, a table cell)
- Provide the same action set via a keyboard shortcut without a dedicated trigger button

**Use a closely related Mona UI component instead when:**

- The menu must always be visible as a horizontal bar of top-level items — use `MenubarComponent`.
- The menu should open from a dedicated button click rather than a right-click or keyboard shortcut — use `DropdownButtonComponent`.
- You need a lower-level popup menu with a configurable trigger event, anchor element, or open/close outputs — use `PopupMenuComponent` directly. `ContextMenuComponent` wraps it with the trigger fixed to `"contextmenu"` and pointer-relative positioning, and does not expose `PopupMenuComponent`'s `open`/`close`/`navigate` outputs or its `anchor`/`offset`/`precise` inputs.

## Import & Quick Start

```typescript
import {
    ContextMenuComponent,
    ContextMenuItemComponent,
    ContextMenuSeparatorComponent
} from "@mirei/mona-ui";
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
import type { MenuItemClickEvent } from "@mirei/mona-ui";

protected onMenuClick(event: MenuItemClickEvent): void { /* ... */ }
```

`target` accepts a template reference (as above), an `ElementRef<HTMLElement>`, or a plain `HTMLElement`.

## Anatomy & Public Structural Templates

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

| Directive attribute | Scope | Template context |
|---|---|---|
| `monaContextMenuGroupTemplate` | Global / Group | `$implicit: string` — the group title |
| `monaContextMenuIconTemplate` | Global / Item | `$implicit` — the menu item (`label`, `disabled`, …); see API for the type caveat |
| `monaContextMenuShortcutTemplate` | Global / Item | `$implicit` — the menu item, as above |
| `monaContextMenuTextTemplate` | Global / Item | `$implicit` — the menu item, as above |

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

## Feature Examples

### Submenu (nested items)

```html
<mona-contextmenu [target]="target">
    <mona-contextmenu-item label="New">
        <mona-contextmenu-item label="Folder"></mona-contextmenu-item>
        <mona-contextmenu-item label="Text Document"></mona-contextmenu-item>
    </mona-contextmenu-item>
</mona-contextmenu>
```

Projecting items inside `mona-contextmenu-item` turns it into a submenu trigger; it renders a chevron instead of a shortcut area and no longer emits `menuClick` itself.

### Checkbox items

```html
<mona-contextmenu [target]="target">
    <mona-contextmenu-checkbox-item
        label="Preview Pane"
        [checked]="previewPaneVisible()"
        (checkedChange)="previewPaneVisible.set($event)">
    </mona-contextmenu-checkbox-item>
</mona-contextmenu>
```

### Radio group

```html
<mona-contextmenu [target]="target">
    <mona-contextmenu-radio-group title="Sort by" [(value)]="sortField">
        <mona-contextmenu-radio-item label="Name" value="name"></mona-contextmenu-radio-item>
        <mona-contextmenu-radio-item label="Date Modified" value="dateModified"></mona-contextmenu-radio-item>
        <mona-contextmenu-radio-item label="Size" value="size"></mona-contextmenu-radio-item>
    </mona-contextmenu-radio-group>
</mona-contextmenu>
```

```typescript
protected readonly sortField = signal("name");
```

### Groups and separators

```html
<mona-contextmenu [target]="target">
    <mona-contextmenu-group title="System Actions">
        <mona-contextmenu-item label="Share"></mona-contextmenu-item>
        <mona-contextmenu-item label="Properties"></mona-contextmenu-item>
    </mona-contextmenu-group>
    <mona-contextmenu-separator></mona-contextmenu-separator>
    <mona-contextmenu-item label="Exit"></mona-contextmenu-item>
</mona-contextmenu>
```

### Sizing and rounding

```html
<mona-contextmenu [target]="target" size="small" rounded="large" [minWidth]="180">
    <mona-contextmenu-item label="Copy"></mona-contextmenu-item>
    <mona-contextmenu-item label="Paste"></mona-contextmenu-item>
</mona-contextmenu>
```

`size`, `rounded`, `minWidth`, and `width` apply to the root menu and every submenu.

## Technical & Behavior Notes

**Positioning is fixed.** The menu opens at the pointer position for a real right-click, or at the target's center when opened via keyboard. `ContextMenuComponent` does not expose a way to anchor the menu elsewhere or to use a different trigger event; use `PopupMenuComponent` directly for that.

**`items` takes precedence over projected content.** When the `items` input is a non-empty iterable, it is rendered instead of any projected `mona-contextmenu-item` (and related) components.

**Keep the menu open after a click.** Calling `event.preventDefault()` in a `(menuClick)` handler — on `<mona-contextmenu>` itself or on an individual item — prevents the menu from closing after that selection.

**Suppressing checkbox/radio state changes.** Calling `event.preventDefault()` on a `mona-contextmenu-checkbox-item`'s or `mona-contextmenu-radio-item`'s `menuClick` event suppresses the resulting `checkedChange` emission (checkbox item) or selection update (radio group). Use this to confirm or validate a change before it applies.

**No open/close output.** `ContextMenuComponent` only exposes `menuClick`. It does not re-emit `PopupMenuComponent`'s `open`/`close`/`navigate` events. If your use case needs to react to the menu opening or closing, use `PopupMenuComponent` directly.

**`ariaLabel` input.** TODO(owner-review): the `ariaLabel` input is declared but is not currently applied to the target element, the menu container, or anywhere else in the rendered output. Do not rely on it for the target's accessible name — see Accessibility below.

## Accessibility

### Keyboard navigation

| Key | Action |
|---|---|
| Right-click | Opens the menu at the pointer position |
| `ContextMenu` key, or `Shift+F10` | Opens the menu at the target's center, while the target has focus |
| `ArrowDown` | Highlights the next item, wrapping to the first |
| `ArrowUp` | Highlights the previous item, wrapping to the last |
| `ArrowRight` | Opens the highlighted item's submenu, if it has nested items |
| `ArrowLeft` | Closes the current submenu and returns to the parent level |
| `Home` | Highlights the first item |
| `End` | Highlights the last item |
| `Enter` / `Space` | Activates the highlighted item, or opens its submenu if it has nested items |
| `Escape` | Closes the open submenu |
| Letter, digit, space, `-`, or `_` | Jumps to (cycles through) items whose label starts with the typed text |

### ARIA

**Target element** (the element bound to `target`):

| Attribute | When present | Value |
|---|---|---|
| `aria-haspopup` | Always | `"menu"` |
| `aria-controls` | Always | The menu container's auto-generated ID |
| `aria-expanded` | Always | `"true"` while the menu is open, otherwise `"false"` |

**Menu container** (`role="menu"`):

| Attribute | When present | Value |
|---|---|---|
| `role` | Always | `"menu"` |
| `aria-orientation` | Always | `"vertical"` |
| `aria-activedescendant` | While an item is highlighted via keyboard or pointer | The highlighted item's ID |

**Item** (`role="menuitem"`):

| Attribute | When present | Value |
|---|---|---|
| `role` | Always | `"menuitem"` |
| `aria-disabled` | Always | Reflects the item's `disabled` input |
| `aria-haspopup` | When the item has nested items | `"menu"` |
| `aria-expanded` | When the item has nested items | `"true"` while its submenu is open |
| `aria-label` | When the item's `label` is non-empty | The item's `label` text |

**Group** (`role="group"`): carries `aria-labelledby` pointing at the group header. **Separator:** `role="separator"`.

**Focus behavior:** focus stays on the `role="menu"` container rather than moving to individual items; the highlighted item is communicated through `aria-activedescendant`. When the menu is opened via keyboard, focus returns to the target element after the menu closes.

**Consumer responsibilities:**

- Provide an accessible name for the `target` element itself (visible text, or its own `aria-label`) — `ContextMenuComponent` does not add one, and the component's `ariaLabel` input has no effect (see Technical Notes).
- When an item uses a `monaContextMenuTextTemplate` and the item's `label` is left empty, no `aria-label` fallback is applied; ensure the projected template content alone communicates the item (it is read as the item's accessible name via its text content).

## API

### `ContextMenuComponent`

**Selector:** `mona-contextmenu`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `''` | Reserved for an ARIA label on the context menu. TODO(owner-review): not currently applied to the target element or the rendered menu. |
| `items` | `Iterable<PopupMenuItem>` | `[]` | Menu items to render directly, instead of content-projected item components. Takes precedence over projected content when non-empty. TODO(owner-review): `PopupMenuItem` is not exported from `@mirei/mona-ui`; prefer content projection until this type is exported. |
| `minWidth` | `string \| number` | `undefined` | Minimum width applied to the root menu and all submenus. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'` | Border-radius preset applied to the root menu and all submenus. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size preset applied to the root menu and all submenus. |
| `target` | `ElementRef<HTMLElement> \| HTMLElement` | — | Required. The element that opens the menu on right-click or keyboard activation. |
| `width` | `string \| number` | `undefined` | Width applied to the root menu and all submenus. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `menuClick` | `MenuItemClickEvent` | Emitted when a menu item is activated by pointer or keyboard. Call `event.preventDefault()` to keep the menu open. |

---

### `ContextMenuItemComponent`

**Selector:** `mona-contextmenu-item`

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

### `ContextMenuCheckboxItemComponent`

**Selector:** `mona-contextmenu-checkbox-item`

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

### `ContextMenuRadioGroupComponent`

**Selector:** `mona-contextmenu-radio-group`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `''` | Section header text displayed above the radio items. When empty, the items are still grouped logically but no header is rendered. |
| `value` | `string` | `''` | Two-way bindable selected value. Use `[(value)]` to synchronize with a signal or property. The `mona-contextmenu-radio-item` with the matching `value` renders as selected. |

`ContextMenuRadioGroupComponent` has no outputs; observe `[(value)]` to react to selection changes.

---

### `ContextMenuRadioItemComponent`

**Selector:** `mona-contextmenu-radio-item`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Renders the item with reduced visual emphasis and prevents selection. |
| `label` | `string` | `''` | Display text of the item. |
| `value` | `string` | — | Required. The value reported to the parent `mona-contextmenu-radio-group` when this item is selected. |

#### Outputs

| Name | Type | Description |
|---|---|---|
| `menuClick` | `MenuItemClickEvent` | Emitted when the item is selected. Call `event.preventDefault()` to suppress the resulting selection update on the parent radio group. |

Must be projected inside a `mona-contextmenu-radio-group` to participate in selection.

---

### `ContextMenuGroupComponent`

**Selector:** `mona-contextmenu-group`

#### Inputs

| Name | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | — | Required. Header text displayed above the group's projected items. |

`ContextMenuGroupComponent` has no outputs.

---

### `ContextMenuSeparatorComponent`

**Selector:** `mona-contextmenu-separator`

Renders a horizontal visual divider between items. Has no inputs or outputs.

---

### `ContextMenuGroupTemplateDirective`

**Selector:** `ng-template[monaContextMenuGroupTemplate]`

Customizes a group header's content.

| Variable | Type | Description |
|---|---|---|
| `$implicit` (as `let-title`) | `string` | The group's title. |

---

### `ContextMenuIconTemplateDirective` / `ContextMenuShortcutTemplateDirective` / `ContextMenuTextTemplateDirective`

**Selectors:** `ng-template[monaContextMenuIconTemplate]` · `ng-template[monaContextMenuShortcutTemplate]` · `ng-template[monaContextMenuTextTemplate]`

Customize, respectively, an item's leading icon area, its trailing shortcut area (shown only on leaf items), and its label text.

| Variable | Type | Description |
|---|---|---|
| `$implicit` (as `let-item`) | `PopupMenuItem` | The menu item. TODO(owner-review): `PopupMenuItem` is not exported from `@mirei/mona-ui`; consumers can read properties such as `item.label` and `item.disabled` but cannot import the type for an explicit annotation. |

---

TODO(owner-review): `PopupMenuItem` (used by `ContextMenuComponent.items` and by the icon/shortcut/text template contexts) is not exported from `@mirei/mona-ui`. `MenuItemClickEvent` (used by every `menuClick` output above) **is** exported, as a type alias for `PopupMenuItemClickEvent`.

<!-- verification-checklist
- [x] API definitions and defaults verified against source (context-menu.component.ts and inherited PopupMenu* base classes under common/popup-menu)
- [x] menuClick output type documented as MenuItemClickEvent (exported alias for PopupMenuItemClickEvent, lib/index.ts) — not the unexported PopupMenuItemClickEvent name
- [x] ContextMenuGroupComponent.title and ContextMenuRadioItemComponent.value confirmed as input.required<string>() — marked Required, default "—"
- [x] ContextMenuRadioGroupComponent.value confirmed as model<string>("") — documented as two-way bindable
- [x] ContextMenuCheckboxItemComponent.checked/checkedChange confirmed as plain input()/output() pair (not model()) — phrased to match DropdownButtonCheckboxItemComponent's documented convention
- [x] ariaLabel input confirmed unused anywhere in context-menu.component.ts — documented as TODO(owner-review), not as working behavior
- [x] items input precedence over projected content verified against ContextMenuComponent.menuItems computed
- [x] preventDefault-keeps-menu-open verified against PopupMenuComponent.setMenuItemClickSubscription
- [x] preventDefault-suppresses-checked/selection verified against PopupMenuCheckboxItemComponent and PopupMenuRadioGroupComponent setSubscription(s)
- [x] ARIA table verified against popup-menu-list.component.html (post-fix: item id binding, aria-label fallback, aria-current removed) and context-menu.component.ts target attribute handling
- [x] Keyboard map verified against PopupMenuListComponent's handle*Key methods and isNavigationKey/isTypeaheadKey
- [x] Focus-restoration-on-close behavior verified against PopupMenuComponent's #shouldRestoreFocus handling
- [x] No open/close output on ContextMenuComponent confirmed — only menuClick is defined in context-menu.component.ts
- [x] PopupMenuItem confirmed not exported from lib/index.ts; MenuItem (common/popup-menu/models/PopupMenuItem.ts) also confirmed not exported
- [x] No internal or unexported APIs exposed beyond the documented TODOs
- [x] Inputs sorted A→Z within each table
- [x] Basic examples compile against the public API surface
-->
