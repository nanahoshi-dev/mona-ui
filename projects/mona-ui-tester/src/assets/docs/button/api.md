## Overview

`ButtonDirective` is a styling directive applied to the native `<button>` element via the `monaButton` attribute selector. It computes Tailwind-based variant classes using class-variance-authority, manages ARIA attributes reactively, and handles interactive states such as loading, disabled, and toggle selection.

The directive is restricted to `<button>` host elements. This preserves native keyboard activation (`Enter`, `Space`), form submission semantics, and assistive technology support without requiring additional ARIA roles.

Look, size, and border-radius variants are independently configurable per button. When used inside a `ButtonGroup`, those group-level values take precedence over the individual button's inputs.

**Use `monaButton` when you need to:**

- Trigger actions inside forms, toolbars, dialogs, or inline content
- Build a toggle control (on/off, active/inactive) that does not navigate to a URL
- Show a spinner while an async operation is in progress
- Place an icon-only button in a compact area such as a toolbar or list row action

**Do not use `monaButton` when:**

- The target navigates to a URL — use `<a>` instead; `monaButton` does not support `<a>` hosts
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
| `ghost`                                  | No border or shadow; hover reveals a secondary background |
| `link`                                   | No border; hover adds underline                           |
| `clear`                                  | Fully transparent; no border, shadow, or hover background |

### Sizes

| `size`   | Height           | Padding |
|----------|------------------|---------|
| `small`  | `h-8` (2 rem)    | `px-3`  |
| `medium` | `h-9` (2.25 rem) | `px-4`  |
| `large`  | `h-10` (2.5 rem) | `px-6`  |

When `iconOnly` is `true`, padding is removed and width matches height (`w-8` / `w-9` / `w-10`).

### Rounded presets

| `rounded` | CSS class      |
|-----------|----------------|
| `none`    | `rounded-none` |
| `small`   | `rounded-sm`   |
| `medium`  | `rounded-md`   |
| `large`   | `rounded-lg`   |
| `full`    | `rounded-full` |

### Theme tokens

Button colors are derived from Mona UI theme design tokens. Override them at `:root` or a scoped ancestor to customize button colors globally.

<!-- TODO(owner-review): Confirm exact CSS custom property names (--color-primary vs --primary etc.) for the theme tokens table -->

## API

### `ButtonDirective`

**Selector:** `button[monaButton]`

| Name            | Kind  | Type                                                                                                                                | Default     | Required | Description                                                                                                                                                     |
|-----------------|-------|-------------------------------------------------------------------------------------------------------------------------------------|-------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`      | model | `boolean`                                                                                                                           | `false`     | Optional | Disables the button. Sets the native `disabled` attribute and `aria-disabled="true"`. When inside a `ButtonGroup`, the group's disabled state takes precedence. |
| `loading`       | model | `boolean`                                                                                                                           | `false`     | Optional | Inserts a spinner before the button's first child and blocks interaction. Sets `aria-busy="true"`. Spinner size scales with `size`.                             |
| `look`          | model | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info' \| 'outline' \| 'ghost' \| 'link' \| 'clear'` | `'default'` | Optional | Visual variant. When inside a `ButtonGroup`, the group's look takes precedence.                                                                                 |
| `selected`      | model | `boolean`                                                                                                                           | `false`     | Optional | Active/selected state. Drives `aria-pressed` when the button is toggleable. Managed by `toggleable` click handling or by `ButtonGroup` selection policy.        |
| `aria-haspopup` | input | `string`                                                                                                                            | `'false'`   | Optional | Value for the `aria-haspopup` ARIA attribute. Set when this button opens a popup, menu, listbox, tree, grid, or dialog.                                         |
| `class`         | input | `string`                                                                                                                            | `''`        | Optional | Additional CSS classes merged into the computed class list via `tailwind-merge`.                                                                                |
| `iconOnly`      | input | `boolean`                                                                                                                           | `false`     | Optional | Removes padding and fixes a square aspect-ratio sized to match `size`. Provide `aria-label` on the host when using icon-only buttons.                           |
| `rounded`       | input | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                                                | `'medium'`  | Optional | Border-radius preset. When inside a `ButtonGroup`, the group's value takes precedence.                                                                          |
| `size`          | input | `'small' \| 'medium' \| 'large'`                                                                                                    | `'medium'`  | Optional | Controls button height and horizontal padding. When inside a `ButtonGroup`, the group's value takes precedence.                                                 |
| `tabindex`      | input | `number`                                                                                                                            | `0`         | Optional | Tab index. Automatically overridden to `-1` when the button is disabled or loading. Accepts a string value and transforms it to a number.                       |
| `toggleable`    | input | `boolean`                                                                                                                           | `false`     | Optional | When `true`, each click flips the `selected` model. Requires `[toggleable]="true"` binding syntax.                                                              |

`ButtonDirective` has no event outputs. Read `[(selected)]`, `[(loading)]`, or `[(disabled)]` model bindings to observe state changes.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Basic example compiles successfully against the public API surface
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): Confirm public package name is @mirei/mona-ui vs mona-ui -->
