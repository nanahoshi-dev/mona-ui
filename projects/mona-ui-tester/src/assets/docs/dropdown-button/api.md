## Overview

`DropdownButtonComponent` is a single button control that reveals a popup menu of secondary actions or options when clicked. The button itself serves as both the visible label and the popup trigger — there is no separate toggle like in `SplitButtonComponent`.

**Use `DropdownButtonComponent` when you need to:**

- Present a set of related actions where no single action is dominant (e.g., a "More actions" button, an "Options" menu, a multi-step form action picker)
- Combine a compact icon-only trigger with a full dropdown list of labeled options
- Provide a dropdown in a toolbar where space is constrained

**Use `SplitButtonComponent` instead when:**

- One action is clearly the primary choice and should remain one click away
- You need to distinguish between "execute default action" and "choose a different action" at the event level — `SplitButtonComponent` emits `buttonClick` for the primary action and `menuItemClick` for menu selections separately

## Import & Quick Start

```typescript
import {
    DropdownButtonComponent,
    DropdownButtonItemComponent,
    DropdownButtonGroupComponent,
    DropdownButtonSeparatorComponent,
    DropdownButtonCheckboxItemComponent,
    DropdownButtonRadioGroupComponent,
    DropdownButtonRadioItemComponent
} from "@mirei/mona-ui";
```

Add the components you need to your standalone component's `imports` array.

**Minimal example:**

```html
<mona-dropdown-button text="Options" (menuItemClick)="onAction($event)">
    <mona-dropdown-button-item label="Edit"></mona-dropdown-button-item>
    <mona-dropdown-button-item label="Duplicate"></mona-dropdown-button-item>
    <mona-dropdown-button-separator></mona-dropdown-button-separator>
    <mona-dropdown-button-item label="Delete"></mona-dropdown-button-item>
</mona-dropdown-button>
```

```typescript
import { MenuItemClickEvent } from "@mirei/mona-ui";

protected onAction(event: MenuItemClickEvent): void { /* ... */ }
```

## Anatomy & Structural Templates

### Content projection

Menu items are projected directly inside `<mona-dropdown-button>`. Only the dropdown-button family of components and their associated `ng-template` directives are valid children.

```
mona-dropdown-button
├── mona-dropdown-button-item          — a clickable menu item
├── mona-dropdown-button-group         — a titled section of items
│   └── mona-dropdown-button-item
├── mona-dropdown-button-separator     — a horizontal divider
├── mona-dropdown-button-checkbox-item — a toggle menu item
└── mona-dropdown-button-radio-group   — mutually exclusive choices
    └── mona-dropdown-button-radio-item
```

### Template directives

Templates placed directly inside `<mona-dropdown-button>` apply globally to all matching items. Templates nested inside a specific item override only that item.

| Directive attribute | Scope | Template context |
|---|---|---|
| `monaDropdownButtonTextTemplate` | Button label | `$implicit: string` — the current `text` input value |
| `monaDropdownButtonMenuGroupTemplate` | Global / Group | `$implicit: string` — the group title |
| `monaDropdownButtonMenuItemIconTemplate` | Global / Item | `$implicit` — menu item object (`label`, `disabled`) |
| `monaDropdownButtonMenuItemShortcutTemplate` | Global / Item | `$implicit` — menu item object (`label`, `disabled`) |
| `monaDropdownButtonMenuItemTextTemplate` | Global / Item | `$implicit` — menu item object (`label`, `disabled`) |

**Customize the button label** (`monaDropdownButtonTextTemplate` receives the `text` value as context):

```html
<mona-dropdown-button text="Actions">
    <ng-template monaDropdownButtonTextTemplate let-text>
        <span class="font-semibold text-primary">{{ text }}</span>
    </ng-template>
</mona-dropdown-button>
```

**Icon-only trigger with custom icon:**

```html
<mona-dropdown-button [iconOnly]="true" ariaLabel="More options">
    <ng-template monaDropdownButtonTextTemplate>
        <svg lucideEllipsis [size]="16"></svg>
    </ng-template>
    <mona-dropdown-button-item label="Edit"></mona-dropdown-button-item>
    <mona-dropdown-button-item label="Delete"></mona-dropdown-button-item>
</mona-dropdown-button>
```

**Custom text per menu item:**

```html
<mona-dropdown-button text="Actions">
    <mona-dropdown-button-item label="Delete">
        <ng-template monaDropdownButtonMenuItemTextTemplate let-item>
            <span class="text-destructive">{{ item.label }}</span>
        </ng-template>
    </mona-dropdown-button-item>
</mona-dropdown-button>
```

## Feature Examples

### Groups and separators

```html
<mona-dropdown-button text="File">
    <mona-dropdown-button-group title="Document">
        <mona-dropdown-button-item label="New"></mona-dropdown-button-item>
        <mona-dropdown-button-item label="Open"></mona-dropdown-button-item>
        <mona-dropdown-button-item label="Save"></mona-dropdown-button-item>
    </mona-dropdown-button-group>
    <mona-dropdown-button-separator></mona-dropdown-button-separator>
    <mona-dropdown-button-item label="Exit"></mona-dropdown-button-item>
</mona-dropdown-button>
```

### Checkbox items

```html
<mona-dropdown-button text="Settings">
    <mona-dropdown-button-checkbox-item
        label="Dark Mode"
        [checked]="darkMode()"
        (checkedChange)="darkMode.set($event)">
    </mona-dropdown-button-checkbox-item>
    <mona-dropdown-button-checkbox-item
        label="Notifications"
        [checked]="notifications()"
        (checkedChange)="notifications.set($event)">
    </mona-dropdown-button-checkbox-item>
</mona-dropdown-button>
```

### Radio groups

```html
<mona-dropdown-button text="Priority">
    <mona-dropdown-button-radio-group
        title="Set priority"
        [(value)]="priority">
        <mona-dropdown-button-radio-item label="Low" value="low"></mona-dropdown-button-radio-item>
        <mona-dropdown-button-radio-item label="Medium" value="medium"></mona-dropdown-button-radio-item>
        <mona-dropdown-button-radio-item label="High" value="high"></mona-dropdown-button-radio-item>
    </mona-dropdown-button-radio-group>
</mona-dropdown-button>
```

### Loading state

When `loading` is `true`, the button shows a spinner and ignores click interactions. Use this while an async operation (triggered by a previous menu selection) is in progress.

```html
<mona-dropdown-button text="Export" [loading]="isExporting()">
    <mona-dropdown-button-item label="Export as CSV" (menuClick)="onExportCsv($event)"></mona-dropdown-button-item>
    <mona-dropdown-button-item label="Export as PDF" (menuClick)="onExportPdf($event)"></mona-dropdown-button-item>
</mona-dropdown-button>
```

### Disabled items

```html
<mona-dropdown-button text="Actions" [disabled]="!hasSelection()">
    <mona-dropdown-button-item label="Edit"></mona-dropdown-button-item>
    <mona-dropdown-button-item label="Archive" [disabled]="isArchived()"></mona-dropdown-button-item>
</mona-dropdown-button>
```

## Technical & Behavior Notes

### Popup positioning

The popup anchors to the center of the button (`bottomcenter` / `topcenter`) with a 2px vertical offset. The popup repositions above the button if there is insufficient space below.

### `ariaLabel` fallback and `iconOnly` mode

When `ariaLabel` is empty, the button's `aria-label` is computed as `"{text} dropdown button"`. When `iconOnly` is `true` and `text` is also empty, the fallback becomes `" dropdown button"` (leading space). Always provide an explicit `[ariaLabel]` when using `iconOnly` mode with no visible text.

### Handling menu item events

`menuItemClick` on `DropdownButtonComponent` fires for any item in the popup. `menuClick` on individual `mona-dropdown-button-item` / `mona-dropdown-button-checkbox-item` / `mona-dropdown-button-radio-item` fires only for that item. Use item-level `menuClick` for per-action handlers.

## Accessibility

### Keyboard navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to / from the button |
| `ArrowDown` / `ArrowUp` / `Enter` / `Space` | Open the popup menu |
| `Escape` (while menu open) | Close the popup and return focus to the button |

> TODO(owner-review): Verify the full keyboard navigation map inside the popup (arrow key item traversal, Enter to select, Escape for nested submenus). Document once confirmed against runtime behavior.

### ARIA

The button carries:
- `aria-haspopup="menu"` — informs AT that the button controls a menu
- `aria-expanded` — reflects the current open/closed state
- `aria-controls` — references the popup element by ID
- `aria-label` — computed from the `ariaLabel` input or falls back to `"{text} dropdown button"`
- `aria-labelledby` — forwarded from `ariaLabelledby`; takes precedence over `aria-label`

## API

### `DropdownButtonComponent`

**Selector:** `mona-dropdown-button`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `aria-label` | input | `string` | `''` | Optional | Accessible label for the button. Falls back to `"{text} dropdown button"` when empty. Required when `iconOnly` is `true` and no text is set. |
| `ariaLabelledby` | input | `string` | `''` | Optional | ID of an element that labels the button. Takes precedence over `aria-label`. |
| `class` | input | `string` | `''` | Optional | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state of the button. |
| `iconOnly` | input | `boolean` | `false` | Optional | Renders the button as a square with no horizontal text padding. |
| `loading` | input | `boolean` | `false` | Optional | Shows a spinner and makes the button non-interactive. |
| `look` | input | `'default' \| 'error' \| 'ghost' \| 'info' \| 'link' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'default'` | Optional | Sets the visual look of the button. |
| `rounded` | input | `'full' \| 'large' \| 'medium' \| 'none' \| 'small'` | `'medium'` | Optional | Sets the border radius of the button. |
| `size` | input | `'large' \| 'medium' \| 'small'` | `'medium'` | Optional | Sets the size of the button. |
| `text` | input | `string` | `''` | Optional | Text displayed inside the button. Passed as `$implicit` context to `monaDropdownButtonTextTemplate`. |
| `menuItemClick` | output | `MenuItemClickEvent` | — | — | Emits when any item inside the popup is clicked. |

---

### `DropdownButtonItemComponent`

**Selector:** `mona-dropdown-button-item`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state of the menu item. |
| `label` | input | `string` | `''` | Optional | The text of the menu item. |
| `menuClick` | output | `MenuItemClickEvent` | — | — | Emits when the item is selected by mouse or keyboard. |

---

### `DropdownButtonGroupComponent`

**Selector:** `mona-dropdown-button-group`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `title` | input | `string` | `''` | Optional | Section header text for the group. |

---

### `DropdownButtonCheckboxItemComponent`

**Selector:** `mona-dropdown-button-checkbox-item`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `checked` | input | `boolean` | `false` | Optional | Sets the checked state. |
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state. |
| `label` | input | `string` | `''` | Optional | The text of the item. |
| `checkedChange` | output | `boolean` | — | — | Emits when the checked state changes. |
| `menuClick` | output | `MenuItemClickEvent` | — | — | Emits when the item is selected. |

---

### `DropdownButtonRadioGroupComponent`

**Selector:** `mona-dropdown-button-radio-group`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `title` | input | `string` | `''` | Optional | Section header text for the radio group. |
| `value` | model | `string` | — | Optional | The value of the selected radio item. Supports two-way binding via `[(value)]`. |

---

### `DropdownButtonRadioItemComponent`

**Selector:** `mona-dropdown-button-radio-item`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state. |
| `label` | input | `string` | `''` | Optional | The display text of the radio item. |
| `value` | input | `string` | `''` | Optional | The value emitted when selected; matched against the parent group's `value`. |
| `menuClick` | output | `MenuItemClickEvent` | — | — | Emits when the item is selected. |

---

### `DropdownButtonSeparatorComponent`

**Selector:** `mona-dropdown-button-separator`

No inputs or outputs. Renders a horizontal visual divider between sections.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] @description and @default added to all public inputs/outputs including userClass
- [x] iconOnly ariaLabel caveat documented in source JSDoc and in Technical Notes
- [x] monaDropdownButtonTextTemplate $implicit context (string) documented and verified in template
- [x] menuItemClick output type is MenuItemClickEvent (public alias for PopupMenuItemClickEvent)
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): Verify popup keyboard navigation map (arrow traversal, Enter to select, Escape for submenus). -->
<!-- TODO(owner-review): ChangeDetectionStrategy.Eager is used on DropdownButtonComponent. CLAUDE.md requires OnPush. Evaluate whether Eager is intentional for the overlay interaction model. -->
