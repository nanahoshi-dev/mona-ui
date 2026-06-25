## Overview

`SplitButtonComponent` is a compound control made of two adjacent buttons — a primary action button on the left and a menu toggle on the right — that share the same visual style. Clicking the left button triggers `buttonClick` directly. Clicking the right button opens a popup containing secondary actions structured as items, groups, separators, checkboxes, or radio groups.

**Use `SplitButtonComponent` when you need to:**

- Provide one default action alongside a set of related secondary actions (e.g., "Save" + "Save as…", "Publish" + "Schedule", "Download" + "Export formats")
- Keep the primary action one click away while making less-common actions discoverable without cluttering the toolbar

**Use `DropDownButtonComponent` instead when:**

- There is no single dominant action — all choices are peer options
- You do not need to distinguish between a primary click and a menu selection at the event level

## Import & Quick Start

```typescript
import {
    SplitButtonComponent,
    SplitButtonItemComponent,
    SplitButtonGroupComponent,
    SplitButtonSeparatorComponent,
    SplitButtonCheckboxItemComponent,
    SplitButtonRadioGroupComponent,
    SplitButtonRadioItemComponent
} from "@mirei/mona-ui";
```

Add the components you need to your standalone component's `imports` array.

**Minimal example — a button with two menu items:**

```html
<mona-split-button text="Save" (buttonClick)="onSave()">
    <mona-split-button-item label="Save as…" (menuClick)="onSaveAs($event)"></mona-split-button-item>
    <mona-split-button-item label="Export PDF" (menuClick)="onExport($event)"></mona-split-button-item>
</mona-split-button>
```

```typescript
import { MenuItemClickEvent } from "@mirei/mona-ui";

protected onSave(): void { /* ... */ }
protected onSaveAs(event: MenuItemClickEvent): void { /* ... */ }
protected onExport(event: MenuItemClickEvent): void { /* ... */ }
```

## Anatomy & Structural Templates

### Content projection slots

Menu items are projected directly inside `<mona-split-button>` as child components. Only the split-button family of components (`mona-split-button-item`, `mona-split-button-group`, etc.) and their associated `ng-template` directives are valid children.

```
mona-split-button
├── mona-split-button-item         — a regular clickable menu item
├── mona-split-button-group        — a titled group of items
│   └── mona-split-button-item
├── mona-split-button-separator    — a horizontal rule between groups
├── mona-split-button-checkbox-item — a toggle menu item
└── mona-split-button-radio-group  — a set of mutually exclusive choices
    └── mona-split-button-radio-item
```

### Template directives

All template directives target `ng-template` elements. Templates placed directly inside `mona-split-button` apply to all matching items globally; templates nested inside a specific item override only that item.

| Directive attribute                  | Scope         | Template context                          |
|--------------------------------------|---------------|-------------------------------------------|
| `monaSplitButtonTextTemplate`        | Host button   | None                                      |
| `monaSplitButtonMenuButtonTemplate`  | Toggle button | None                                      |
| `monaSplitButtonMenuGroupTemplate`   | Global/Group  | `$implicit: string` (group title)         |
| `monaSplitButtonMenuItemIconTemplate`    | Global/Item   | `$implicit` — menu item object (`label`, `disabled`) |
| `monaSplitButtonMenuItemShortcutTemplate`| Global/Item   | `$implicit` — menu item object (`label`, `disabled`) |
| `monaSplitButtonMenuItemTextTemplate`    | Global/Item   | `$implicit` — menu item object (`label`, `disabled`) |

**Customize the main button label:**

```html
<mona-split-button>
    <ng-template monaSplitButtonTextTemplate>
        <span class="text-primary font-semibold">Publish</span>
    </ng-template>
</mona-split-button>
```

**Customize the menu toggle icon:**

```html
<mona-split-button>
    <ng-template monaSplitButtonMenuButtonTemplate>
        <svg lucideEllipsis [size]="14"></svg>
    </ng-template>
</mona-split-button>
```

**Custom text per menu item:**

```html
<mona-split-button>
    <mona-split-button-item label="Sign Out">
        <ng-template monaSplitButtonMenuItemTextTemplate let-item>
            <span class="text-destructive">{{ item.label }}</span>
        </ng-template>
    </mona-split-button-item>
</mona-split-button>
```

**Global icon template (applies to all items):**

```html
<mona-split-button>
    <ng-template monaSplitButtonMenuItemIconTemplate let-item>
        <svg lucideChevronRight [size]="12"></svg>
    </ng-template>
    <mona-split-button-item label="Profile"></mona-split-button-item>
    <mona-split-button-item label="Settings"></mona-split-button-item>
</mona-split-button>
```

## Feature Examples

### Groups and separators

Use `mona-split-button-group` to add a labeled section header. Use `mona-split-button-separator` between sections.

```html
<mona-split-button text="Actions">
    <mona-split-button-group title="Account">
        <mona-split-button-item label="Profile"></mona-split-button-item>
        <mona-split-button-item label="Billing"></mona-split-button-item>
    </mona-split-button-group>
    <mona-split-button-separator></mona-split-button-separator>
    <mona-split-button-item label="Sign Out"></mona-split-button-item>
</mona-split-button>
```

### Checkbox items

`mona-split-button-checkbox-item` renders a toggleable item. Bind `[checked]` for the initial state and listen to `(checkedChange)` for updates.

```html
<mona-split-button text="Settings">
    <mona-split-button-checkbox-item
        label="Enable Notifications"
        [checked]="notificationsEnabled()"
        (checkedChange)="notificationsEnabled.set($event)">
    </mona-split-button-checkbox-item>
    <mona-split-button-checkbox-item
        label="Dark Mode"
        [checked]="darkMode()"
        (checkedChange)="darkMode.set($event)">
    </mona-split-button-checkbox-item>
</mona-split-button>
```

### Radio groups

`mona-split-button-radio-group` renders a set of mutually exclusive options. Use `[(value)]` for two-way binding, or `[value]` + `(valueChange)` for one-way binding.

```html
<mona-split-button text="View">
    <mona-split-button-radio-group
        title="Layout"
        [(value)]="selectedLayout">
        <mona-split-button-radio-item label="List" value="list"></mona-split-button-radio-item>
        <mona-split-button-radio-item label="Grid" value="grid"></mona-split-button-radio-item>
        <mona-split-button-radio-item label="Compact" value="compact"></mona-split-button-radio-item>
    </mona-split-button-radio-group>
</mona-split-button>
```

### Nested items

`mona-split-button-item` can contain child items, which render as a submenu:

```html
<mona-split-button text="Manage">
    <mona-split-button-item label="Team">
        <mona-split-button-item label="Add Member"></mona-split-button-item>
        <mona-split-button-item label="Remove Member"></mona-split-button-item>
    </mona-split-button-item>
</mona-split-button>
```

### Disabled items

Both the whole component and individual items can be disabled independently:

```html
<!-- Disable the entire control -->
<mona-split-button text="Save" [disabled]="isSaving()"></mona-split-button>

<!-- Disable a single menu item -->
<mona-split-button text="Actions">
    <mona-split-button-item label="Delete" [disabled]="!canDelete()"></mona-split-button-item>
</mona-split-button>
```

## Technical & Behavior Notes

### Popup positioning

The popup menu anchors to the left edge of the main button (`bottomleft` / `topleft`) with a 2px vertical offset. The `popupWidth` input sets the minimum width of the popup in pixels; `0` means no minimum width.

### `ariaLabel` fallback

When `ariaLabel` is empty, the main button's `aria-label` is computed as `"{text} splitbutton"`. Explicitly set `[ariaLabel]` when the button's text alone is not descriptive enough, or when the text is provided via `monaSplitButtonTextTemplate` rather than the `text` input.

### Handling menu item events

`menuItemClick` on `SplitButtonComponent` fires for every item click in the popup (top-level aggregator). `menuClick` on individual `mona-split-button-item` / `mona-split-button-checkbox-item` / `mona-split-button-radio-item` fires only for that specific item. Use item-level `menuClick` when you need per-action handlers; use the top-level `menuItemClick` when you need a single entry point.

## Accessibility

### Keyboard navigation

| Key | Target | Action |
|-----|--------|--------|
| `Tab` | Any button | Move focus between the main button and the menu toggle |
| `Enter` / `Space` | Main button | Trigger the primary action (`buttonClick`) |
| `ArrowDown` / `ArrowUp` / `Enter` / `Space` | Menu toggle | Open the popup menu |
| `Escape` | Menu toggle (while open) | Close the popup and return focus to the menu toggle |

> TODO(owner-review): Document the keyboard map inside the popup menu (arrow key navigation, Enter to select, Escape to close inner submenus). Verify against runtime.

### ARIA

The menu toggle button carries:
- `aria-haspopup="menu"` — tells AT that it controls a menu popup
- `aria-expanded` — reflects the open/closed state of the popup
- `aria-controls` — references the popup element by ID
- `aria-label` — defaults to `"Show menu options"`; override with `[menuButtonAriaLabel]` to localize

The main button carries:
- `aria-label` — computed from the `ariaLabel` input or falls back to `"{text} splitbutton"`
- `aria-labelledby` — forwarded from the `ariaLabelledby` input; takes precedence over `aria-label` when set

## API

### `SplitButtonComponent`

**Selector:** `mona-split-button`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `aria-label` | input | `string` | `''` | Optional | Accessible label for the main action button. Falls back to `"{text} splitbutton"` when empty. |
| `ariaLabelledby` | input | `string` | `''` | Optional | ID of an element that labels the main action button. Takes precedence over `aria-label` when set. |
| `class` | input | `string` | `''` | Optional | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state of both the main button and the menu toggle button. |
| `look` | input | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'default'` | Optional | Sets the visual look of the button. |
| `menuButtonAriaLabel` | input | `string` | `'Show menu options'` | Optional | Accessible label for the menu toggle button. Override to localize for non-English applications. |
| `popupWidth` | input | `number` | `0` | Optional | Minimum width of the popup menu in pixels. `0` means no minimum width. |
| `rounded` | input | `'full' \| 'large' \| 'medium' \| 'none' \| 'small'` | `'medium'` | Optional | Sets the border radius of the button. |
| `size` | input | `'large' \| 'medium' \| 'small'` | `'medium'` | Optional | Sets the size of the button. |
| `text` | input | `string` | `''` | Optional | Text displayed in the main action button. Ignored when `monaSplitButtonTextTemplate` is provided. |
| `buttonClick` | output | `MouseEvent` | — | — | Emits when the main action button is clicked. |
| `menuItemClick` | output | `MenuItemClickEvent` | — | — | Emits when any item inside the popup is clicked. |

---

### `SplitButtonItemComponent`

**Selector:** `mona-split-button-item`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state of the menu item. |
| `label` | input | `string` | `''` | Optional | The text of the menu item. |
| `menuClick` | output | `MenuItemClickEvent` | — | — | Emits when the item is selected by mouse or keyboard. |

---

### `SplitButtonGroupComponent`

**Selector:** `mona-split-button-group`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `title` | input | `string` | `''` | Optional | Sets the title of the group, shown as a section header. |

---

### `SplitButtonCheckboxItemComponent`

**Selector:** `mona-split-button-checkbox-item`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `checked` | input | `boolean` | `false` | Optional | Sets the checked state of the menu item. |
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state of the menu item. |
| `label` | input | `string` | `''` | Optional | The text of the menu item. |
| `checkedChange` | output | `boolean` | — | — | Emits when the checked state changes. |
| `menuClick` | output | `MenuItemClickEvent` | — | — | Emits when the item is selected by mouse or keyboard. |

---

### `SplitButtonRadioGroupComponent`

**Selector:** `mona-split-button-radio-group`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `title` | input | `string` | `''` | Optional | The title of the radio group, shown as a section header. |
| `value` | model | `string` | — | Optional | The value of the currently selected radio item. Supports two-way binding via `[(value)]`. |

---

### `SplitButtonRadioItemComponent`

**Selector:** `mona-split-button-radio-item`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state of the menu item. |
| `label` | input | `string` | `''` | Optional | The text of the radio item. |
| `value` | input | `string` | `''` | Optional | The value emitted when this item is selected. Matched against the parent `SplitButtonRadioGroupComponent`'s `value`. |
| `menuClick` | output | `MenuItemClickEvent` | — | — | Emits when the item is selected by mouse or keyboard. |

---

### `SplitButtonSeparatorComponent`

**Selector:** `mona-split-button-separator`

No inputs or outputs. Renders a horizontal visual divider between menu sections.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] @description and @default added to all public inputs/outputs
- [x] menuButtonAriaLabel input added and bound in template (replaces hardcoded English string)
- [x] PopupMenuItem not exported — documented key context fields inline instead
- [x] menuItemClick output type is MenuItemClickEvent (public alias for PopupMenuItemClickEvent)
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): Verify the complete keyboard navigation map inside the popup menu (arrow key traversal, Enter to select, Escape to close submenus). Document once confirmed against runtime behavior. -->
<!-- TODO(owner-review): ChangeDetectionStrategy.Eager is used on SplitButtonComponent. CLAUDE.md requires OnPush. Evaluate whether Eager is intentional for the overlay interaction model and update accordingly. -->
