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
} from "@nanahoshi/mona-ui";
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
import type { MenuItemClickEvent } from "@nanahoshi/mona-ui";

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

| Directive attribute                          | Scope          | Template context                                     |
| -------------------------------------------- | -------------- | ---------------------------------------------------- |
| `monaDropdownButtonTextTemplate`             | Button label   | `$implicit: string` — the current `text` input value |
| `monaDropdownButtonMenuGroupTemplate`        | Global / Group | `$implicit: string` — the group title                |
| `monaDropdownButtonMenuItemIconTemplate`     | Global / Item  | `$implicit` — menu item object (`label`, `disabled`) |
| `monaDropdownButtonMenuItemShortcutTemplate` | Global / Item  | `$implicit` — menu item object (`label`, `disabled`) |
| `monaDropdownButtonMenuItemTextTemplate`     | Global / Item  | `$implicit` — menu item object (`label`, `disabled`) |

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
    <mona-dropdown-button-checkbox-item label="Dark Mode" [checked]="darkMode()" (checkedChange)="darkMode.set($event)">
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
    <mona-dropdown-button-radio-group title="Set priority" [(value)]="priority">
        <mona-dropdown-button-radio-item label="Low" value="low"></mona-dropdown-button-radio-item>
        <mona-dropdown-button-radio-item label="Medium" value="medium"></mona-dropdown-button-radio-item>
        <mona-dropdown-button-radio-item label="High" value="high"></mona-dropdown-button-radio-item>
    </mona-dropdown-button-radio-group>
</mona-dropdown-button>
```

### Loading state

When `loading` is `true`, the button displays a spinner and ignores click interactions. Use this while an async operation triggered by a previous menu selection is in progress.

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

When `ariaLabel` is empty, the button's `aria-label` is computed as `"{text} dropdown button"`. When `iconOnly` is `true` and no visible `text` is set, always provide an explicit `[ariaLabel]` so the button has a meaningful accessible name.

### Handling menu item events

`menuItemClick` on `DropdownButtonComponent` fires for any item in the popup. `menuClick` on individual `mona-dropdown-button-item`, `mona-dropdown-button-checkbox-item`, or `mona-dropdown-button-radio-item` fires only for that specific item. Use item-level `menuClick` for per-action handlers.

### Preventing default behavior in checkbox items

Calling `event.preventDefault()` on the `menuClick` event of a `mona-dropdown-button-checkbox-item` suppresses both the state flip and the `checkedChange` emission. Use this when you need to validate or confirm the change before applying it.

## Accessibility

### Keyboard navigation

| Key                                         | Action                                         |
| ------------------------------------------- | ---------------------------------------------- |
| `Tab`                                       | Move focus to / from the button                |
| `ArrowDown` / `ArrowUp` / `Enter` / `Space` | Open the popup menu                            |
| `Escape` (while menu open)                  | Close the popup and return focus to the button |

> TODO(owner-review): Verify the full keyboard navigation map inside the popup (arrow key item traversal, Enter to select, Escape for nested submenus). Document once confirmed against runtime behavior.

### ARIA

The button element carries the following attributes:

| Attribute         | When present                       | Value                                                                         |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `aria-haspopup`   | Always                             | `"menu"`                                                                      |
| `aria-expanded`   | Always                             | `"true"` when the menu is open, `"false"` when closed                         |
| `aria-controls`   | Always                             | The popup element's auto-generated ID                                         |
| `aria-label`      | When `ariaLabelledby` is not set   | Value of `ariaLabel`, or `"{text} dropdown button"` as fallback               |
| `aria-labelledby` | When `ariaLabelledby` is non-empty | Forwarded from the `ariaLabelledby` input; takes precedence over `aria-label` |

**Consumer responsibilities:**

- When using `iconOnly` mode with no visible `text`, always provide `[ariaLabel]` with a description of the button's purpose.
- When `ariaLabelledby` is set, `aria-label` is suppressed automatically.

## API

### `DropdownButtonComponent`

**Selector:** `mona-dropdown-button`

#### Inputs

| Name             | Type                                                                                                                                | Default     | Description                                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-label`     | `string`                                                                                                                            | `""`        | Accessible name for the dropdown button. Falls back to `"{text} dropdown button"` when empty; provide an explicit value when no visible text is present.            |
| `ariaLabelledby` | `string`                                                                                                                            | `""`        | ID of an external element that provides the accessible name for the dropdown button. Takes precedence over `aria-label` when both are set.                          |
| `class`          | `string`                                                                                                                            | `""`        | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                           |
| `disabled`       | `boolean`                                                                                                                           | `false`     | Renders the button with reduced visual emphasis and removes pointer interaction.                                                                                    |
| `iconOnly`       | `boolean`                                                                                                                           | `false`     | Renders the button as a square for icon-only usage, removing horizontal text padding. Set `ariaLabel` when no visible text is present to ensure an accessible name. |
| `loading`        | `boolean`                                                                                                                           | `false`     | Displays a loading indicator and prevents interaction while an operation is in progress.                                                                            |
| `look`           | `'clear' \| 'default' \| 'error' \| 'ghost' \| 'info' \| 'link' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'default'` | Visual style preset applied to the button.                                                                                                                          |
| `rounded`        | `'full' \| 'large' \| 'medium' \| 'none' \| 'small'`                                                                                | `'medium'`  | Border-radius preset applied to the button.                                                                                                                         |
| `size`           | `'large' \| 'medium' \| 'small'`                                                                                                    | `'medium'`  | Size preset controlling the button's dimensions.                                                                                                                    |
| `text`           | `string`                                                                                                                            | `""`        | Primary text content displayed inside the dropdown button. Passed as `$implicit` to a `monaDropdownButtonTextTemplate` when one is provided.                        |

#### Outputs

| Name            | Type                 | Description                                            |
| --------------- | -------------------- | ------------------------------------------------------ |
| `menuItemClick` | `MenuItemClickEvent` | Emitted when any item in the dropdown menu is clicked. |

---

### `DropdownButtonItemComponent`

**Selector:** `mona-dropdown-button-item`

#### Inputs

| Name       | Type      | Default | Description                                                                |
| ---------- | --------- | ------- | -------------------------------------------------------------------------- |
| `disabled` | `boolean` | `false` | Renders the menu item with reduced visual emphasis and prevents selection. |
| `label`    | `string`  | `""`    | Display text of the menu item.                                             |

#### Outputs

| Name        | Type                 | Description                                             |
| ----------- | -------------------- | ------------------------------------------------------- |
| `menuClick` | `MenuItemClickEvent` | Emitted when the item is selected by mouse or keyboard. |

---

### `DropdownButtonGroupComponent`

**Selector:** `mona-dropdown-button-group`

#### Inputs

| Name    | Type     | Default | Description                                                      |
| ------- | -------- | ------- | ---------------------------------------------------------------- |
| `title` | `string` | —       | Required. Section header text displayed above the group's items. |

---

### `DropdownButtonCheckboxItemComponent`

**Selector:** `mona-dropdown-button-checkbox-item`

#### Inputs

| Name       | Type      | Default | Description                                                                 |
| ---------- | --------- | ------- | --------------------------------------------------------------------------- |
| `checked`  | `boolean` | `false` | Whether the item is checked. Bind `(checkedChange)` to track state changes. |
| `disabled` | `boolean` | `false` | Renders the menu item with reduced visual emphasis and prevents selection.  |
| `label`    | `string`  | `""`    | Display text of the menu item.                                              |

#### Outputs

| Name            | Type                 | Description                                                                                                               |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `checkedChange` | `boolean`            | Emitted when the checked state changes after a click. Not emitted when `event.preventDefault()` is called on `menuClick`. |
| `menuClick`     | `MenuItemClickEvent` | Emitted when the item is clicked. Call `event.preventDefault()` to suppress the state change.                             |

---

### `DropdownButtonRadioGroupComponent`

**Selector:** `mona-dropdown-button-radio-group`

#### Inputs

| Name    | Type     | Default | Description                                                                                                                                                                          |
| ------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `title` | `string` | `""`    | Section header text displayed above the radio items. When empty, the items are still grouped logically but no header is rendered.                                                    |
| `value` | `string` | `""`    | Two-way bindable selected value. Use `[(value)]` to synchronize with a signal or property. The matching `mona-dropdown-button-radio-item` with the same `value` renders as selected. |

---

### `DropdownButtonRadioItemComponent`

**Selector:** `mona-dropdown-button-radio-item`

#### Inputs

| Name       | Type      | Default | Description                                                                                              |
| ---------- | --------- | ------- | -------------------------------------------------------------------------------------------------------- |
| `disabled` | `boolean` | `false` | Renders the radio item with reduced visual emphasis and prevents selection.                              |
| `label`    | `string`  | `""`    | Display text of the radio item.                                                                          |
| `value`    | `string`  | —       | Required. The value emitted to the parent `mona-dropdown-button-radio-group` when this item is selected. |

#### Outputs

| Name        | Type                 | Description                        |
| ----------- | -------------------- | ---------------------------------- |
| `menuClick` | `MenuItemClickEvent` | Emitted when the item is selected. |

---

### `DropdownButtonSeparatorComponent`

**Selector:** `mona-dropdown-button-separator`

Renders a horizontal visual divider between sections. Has no inputs or outputs.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (component TS files and inherited PopupMenu base classes)
- [x] DropdownButtonGroupComponent.title confirmed as input.required<string>() — marked Required in description, default "—"
- [x] DropdownButtonRadioItemComponent.value confirmed as input.required<string>() — marked Required in description, default "—"
- [x] DropdownButtonRadioGroupComponent.value confirmed as model<string>("") — documented as two-way bindable
- [x] MenuItemClickEvent confirmed as exported type alias for PopupMenuItemClickEvent (index.ts line 295)
- [x] No "Kind" or "Required" columns — matches chip docs format
- [x] Inputs sorted A→Z within each table
- [x] aria-label leading space issue fixed with .trim() — Technical Notes updated accordingly
- [x] ChangeDetectionStrategy.Eager TODO removed — already fixed to OnPush
- [x] preventDefault behavior on checkbox item documented
- [x] ariaLabel suppressed when ariaLabelledby is set — documented in ARIA table
- [x] No internal or unexported APIs exposed
- [x] Basic examples compile against the public API surface
- [x] clear and link look variants included (present in button.styles.ts)
-->

<!-- TODO(owner-review): Verify the full keyboard navigation map inside the popup (arrow key item traversal, Enter to select, Escape for nested submenus). -->
