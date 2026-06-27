## Overview

`ButtonDirective` is a styling directive applied to a native `<button>` element via the `monaButton` attribute selector. It manages look, size, and border-radius variants, and handles interactive states including loading, disabled, and toggle selection.

The directive is restricted to `<button>` host elements. This preserves native keyboard activation (Enter, Space), form submission semantics, and assistive technology support without requiring additional ARIA roles.

When used inside a `ButtonGroup`, the group's look, size, and rounded values take precedence over the individual button's inputs.

**Use `monaButton` when you need to:**

- Trigger actions inside forms, toolbars, dialogs, or inline content
- Build a toggle control (on/off, active/inactive) that does not navigate to a URL
- Show a spinner while an async operation is in progress
- Place an icon-only button in a compact area such as a toolbar or list row action

**Do not use `monaButton` when:**

- The target navigates to a URL — use `<a>` instead; the directive does not support `<a>` hosts
- Multiple related buttons need shared look, size, or coordinated selection — use `ButtonGroup`
- A button opens a dropdown menu — use `DropdownButton` or `SplitButton`

## Import & Basic Usage

```typescript
import { ButtonDirective } from "@mirei/mona-ui";
```

Add `ButtonDirective` to your standalone component's `imports` array.

```html
<!-- Default -->
<button monaButton>Default</button>

<!-- With look variant -->
<button monaButton look="primary">Primary</button>

<!-- Async operation with loading state -->
<button monaButton look="primary" [(loading)]="isSaving" (click)="save()">
    Save changes
</button>

<!-- Toggle -->
<button monaButton [toggleable]="true" [(selected)]="isBold">Bold</button>

<!-- Icon-only -->
<button monaButton [iconOnly]="true" look="ghost" aria-label="Search">
    <svg lucideSearch [size]="16"></svg>
</button>
```

> **Boolean inputs** have no `booleanAttribute` transform. Always use `[iconOnly]="true"` bracket binding syntax, not the bare attribute form.

## Appearance & Styling

### Look variants

| `look`                                   | Appearance                                                |
|------------------------------------------|-----------------------------------------------------------|
| `default`                                | Background with border; adapts to the active theme        |
| `primary`                                | Filled primary color                                      |
| `secondary`                              | Filled secondary color                                    |
| `success` / `error` / `warning` / `info` | Semantic fill colors                                      |
| `outline`                                | Transparent background with border                        |
| `ghost`                                  | No border or shadow; hover reveals a subtle background    |
| `link`                                   | No border; hover adds underline                           |
| `clear`                                  | Fully transparent; no border, shadow, or hover background |

### Sizes

| `size`   | Description                              |
|----------|------------------------------------------|
| `small`  | Compact height and padding               |
| `medium` | Standard height and padding (default)    |
| `large`  | Taller height and wider padding          |

When `iconOnly` is `true`, horizontal padding is removed and the button width is fixed to match its height.

### Rounded presets

| `rounded` | Shape                        |
|-----------|------------------------------|
| `none`    | No border radius             |
| `small`   | Slight rounding              |
| `medium`  | Moderate rounding (default)  |
| `large`   | Strong rounding              |
| `full`    | Pill / fully rounded         |

### Theme tokens

Button colors are derived from Mona UI theme design tokens. Override them at `:root` or a scoped ancestor to customize button colors globally.

<!-- TODO(owner-review): Confirm exact CSS custom property names (--color-primary vs --primary etc.) for the theme tokens table -->

## Accessibility Notes

The directive sets `type="button"` on the host, preventing accidental form submission when placed inside a `<form>`.

When `disabled` or `loading` is `true`, the native `disabled` attribute is set and `aria-disabled="true"` is added. The `tabindex` is also forced to `-1` so the button is removed from the tab order.

When `loading` is `true`, `aria-busy="true"` is set on the host.

When `toggleable` is `true` (or the button is inside a `ButtonGroup`), `aria-pressed` is set to `"true"` or `"false"` based on the `selected` state.

For icon-only buttons, set `aria-label` on the `<button>` element to provide an accessible name.

## API

### `ButtonDirective`

**Selector:** `button[monaButton]`

#### Inputs

| Name            | Type                                                                                                                                 | Default     | Description |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------|-------------|-------------|
| `aria-haspopup` | `string`                                                                                                                             | `'false'`   | Value for the `aria-haspopup` ARIA attribute. Set when this button opens a popup, menu, listbox, tree, grid, or dialog. |
| `class`         | `string`                                                                                                                             | `''`        | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `disabled`      | `boolean`                                                                                                                            | `false`     | Two-way bindable. Disables the button. Sets the native `disabled` attribute and `aria-disabled="true"`. When inside a `ButtonGroup`, the group's disabled state takes precedence. |
| `iconOnly`      | `boolean`                                                                                                                            | `false`     | Removes horizontal padding and fixes a square aspect ratio sized to match `size`. Provide `aria-label` on the host when using icon-only buttons. |
| `loading`       | `boolean`                                                                                                                            | `false`     | Two-way bindable. Inserts a spinner before the button's first child and blocks interaction. Sets `aria-busy="true"`. Spinner size scales with `size`. |
| `look`          | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info' \| 'outline' \| 'ghost' \| 'link' \| 'clear'` | `'default'` | Two-way bindable. Visual variant. When inside a `ButtonGroup`, the group's look takes precedence. |
| `rounded`       | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                                                | `'medium'`  | Border-radius preset. When inside a `ButtonGroup`, the group's value takes precedence. |
| `selected`      | `boolean`                                                                                                                            | `false`     | Two-way bindable. Active/selected state. Drives `aria-pressed` when the button is toggleable. Managed by `toggleable` click handling or by `ButtonGroup` selection policy. |
| `size`          | `'small' \| 'medium' \| 'large'`                                                                                                     | `'medium'`  | Controls button height and horizontal padding. When inside a `ButtonGroup`, the group's value takes precedence. |
| `tabindex`      | `number`                                                                                                                             | `0`         | Tab index. Automatically overridden to `-1` when the button is disabled or loading. Accepts a string value and converts it to a number. |
| `toggleable`    | `boolean`                                                                                                                            | `false`     | When `true`, each click flips the `selected` model and `aria-pressed` is managed. Requires `[toggleable]="true"` binding syntax. |

`ButtonDirective` has no event outputs. Read `[(selected)]`, `[(loading)]`, or `[(disabled)]` model bindings to observe state changes.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Basic example compiles successfully against the public API surface
- [x] No internal or unexported APIs exposed
- [x] Accessibility claims verified against source: aria-busy/aria-disabled/aria-pressed/disabled/tabindex host bindings confirmed in button.directive.ts; type="button" confirmed in host
- [x] Styling section documents only public inputs — Tailwind class names removed from Sizes and Rounded tables, replaced with consumer-facing descriptions
-->
