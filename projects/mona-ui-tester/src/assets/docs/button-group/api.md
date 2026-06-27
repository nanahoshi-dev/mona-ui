## Overview

`ButtonGroupComponent` renders a `role="group"` landmark that wraps native `<button monaButton>` children. It propagates its `look`, `size`, `rounded`, and `disabled` values down to each child button, overriding the child's own inputs for those properties.

When `selection` is set to `"single"` or `"multiple"`, the group coordinates toggle state across children. In `"single"` mode, activating one button deactivates all others. In `"multiple"` mode, each button toggles independently. Each child button's `aria-pressed` attribute reflects its current state.

**Use `ButtonGroupComponent` when you need to:**

- Group related action buttons that must share a visual style (toolbar rows, formatting controls)
- Implement mutually exclusive choices where one option must remain active (view toggles, alignment pickers)
- Implement multi-select filters where any combination of options can be active simultaneously

**Do not use `ButtonGroupComponent` when:**

- The buttons navigate to URLs — use a `<nav>` element with anchor tags instead
- There is only a single stand-alone toggle — apply `[toggleable]="true"` directly on one `<button monaButton>`
- A dropdown or split action is needed — use `DropdownButton` or `SplitButton`

## Import & Basic Usage

```typescript
import { ButtonGroupComponent, ButtonDirective } from "@mirei/mona-ui";
```

Add both to your standalone component's `imports` array. `ButtonDirective` is required on each child button.

**Basic group — shared styling, no selection:**

```html
<mona-button-group>
    <button monaButton>Cut</button>
    <button monaButton>Copy</button>
    <button monaButton>Paste</button>
</mona-button-group>
```

**Single-select toggle group (radio-like):**

```html
<mona-button-group selection="single" [allowEmpty]="false" aria-label="Calendar view">
    <button monaButton>Day</button>
    <button monaButton>Week</button>
    <button monaButton>Month</button>
</mona-button-group>
```

**Multi-select filter group:**

```html
<mona-button-group selection="multiple" aria-label="Text formatting">
    <button monaButton>Bold</button>
    <button monaButton>Italic</button>
    <button monaButton>Underline</button>
</mona-button-group>
```

**Disabled group:**

```html
<mona-button-group [disabled]="isReadonly()">
    <button monaButton>Option A</button>
    <button monaButton>Option B</button>
</mona-button-group>
```

> **Group inputs override child inputs.** When a child button is inside a `ButtonGroupComponent`, the group's `look`, `size`, `rounded`, and `disabled` values replace the child's own inputs for those properties.

> **Selection state is not pre-settable via a group input.** To initialize a child as selected, bind `[(selected)]="true"` directly on that child button. There is no `value` input on the group.

> **`allowEmpty` only applies to `"single"` selection mode.** In `"multiple"` mode, any number of buttons (including zero) can be active simultaneously.

## Appearance & Styling

### Look variants

`look` defaults to `"outline"`. Most values affect child button fill and border. The container applies additional styling for two values:

| `look`    | Container effect                                    |
|-----------|-----------------------------------------------------|
| `outline` | Adds a visual divider between adjacent buttons      |
| `ghost`   | Removes the outer container border                  |
| others    | No additional container effect                      |

### Sizes

| `size`   | Applied to                    |
|----------|-------------------------------|
| `small`  | All child buttons             |
| `medium` | All child buttons (default)   |
| `large`  | All child buttons             |

### Rounded presets

`rounded` controls the outer container radius and the outer corners of the first and last child button.

| `rounded` | Shape                       |
|-----------|-----------------------------|
| `none`    | No rounding                 |
| `small`   | Slight rounding             |
| `medium`  | Moderate rounding (default) |
| `large`   | Strong rounding             |
| `full`    | Pill shape                  |

### Custom classes and naming

Override container styles with the `class` input. When multiple groups appear on the same page, provide a unique `aria-label` on each so screen reader users can distinguish them:

```html
<mona-button-group aria-label="Text formatting" class="shadow-md">
    <button monaButton>Bold</button>
    <button monaButton>Italic</button>
</mona-button-group>

<mona-button-group aria-label="Text alignment">
    <button monaButton>Left</button>
    <button monaButton>Center</button>
    <button monaButton>Right</button>
</mona-button-group>
```

## API

### `ButtonGroupComponent`

**Selector:** `mona-button-group`

**Content projection:** accepts elements carrying the `monaButton` attribute (`<ng-content select="[monaButton]">`).

#### Inputs

| Name         | Type                                                                                              | Default          | Description |
|--------------|---------------------------------------------------------------------------------------------------|------------------|-------------|
| `allowEmpty` | `boolean`                                                                                         | `true`           | When `false` and `selection` is `"single"`, at least one button must remain selected. Clicking the active button will not deselect it. Has no effect in `"multiple"` mode. |
| `aria-label` | `string`                                                                                          | `'Button group'` | Accessible label for the `role="group"` landmark. Override when multiple button groups appear on the same page. |
| `class`      | `string`                                                                                          | `''`             | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `disabled`   | `boolean`                                                                                         | `false`          | Two-way bindable. When `true`, all child buttons are disabled. |
| `look`       | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'outline'` | Visual variant propagated to all child buttons. Also controls container-level divider and border behavior. |
| `rounded`    | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                             | `'medium'`       | Border-radius preset applied to the container and the outer corners of the first and last child button. |
| `selection`  | `'single' \| 'multiple'`                                                                          | `'multiple'`     | Two-way bindable. Selection coordination mode. In `"single"` mode, activating one button deactivates all others. In `"multiple"` mode, each button toggles independently. |
| `size`       | `'small' \| 'medium' \| 'large'`                                                                  | `'medium'`       | Size propagated to all child buttons, overriding their individual `size` inputs. |

`ButtonGroupComponent` has no event outputs. Observe selection changes by binding `[(selected)]` on individual child buttons.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] look default corrected to "outline" (source: input<...>("outline")); old docs incorrectly stated "default"
- [x] disabled and selection correctly marked as model (kind: "model" in metadata)
- [x] look type union excludes "link" and "clear" (ButtonGroup-specific CVA, not Button)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
- [x] Accessibility claims verified against source: role="group" and aria-label host bindings confirmed in button-group.component.ts; aria-pressed on children is managed by ButtonDirective
- [x] Styling section documents only public inputs — Tailwind class names (rounded-sm/md/lg, border-r) removed, replaced with consumer-facing descriptions
-->

<!-- TODO(owner-review): Confirm whether an initial selection value API (e.g. a group-level value input) is planned -->
