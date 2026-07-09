## Overview

`ButtonGroupComponent` groups native `<button monaButton>` children into a cohesive control that propagates its `look`, `size`, `rounded`, and `disabled` values down to each child, overriding the child's own inputs for those properties.

When `selection` is `"single"` or `"multiple"`, the group coordinates toggle state across children. In `"single"` mode, activating one button deactivates all others. In `"multiple"` mode, each button toggles independently.

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
import { ButtonGroupComponent, ButtonDirective } from "@nanahoshi/mona-ui";
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

**Reacting to any button click in the group:**

```html
<mona-button-group selection="single" (buttonClick)="onGroupInteraction()">
    <button monaButton>Day</button>
    <button monaButton>Week</button>
    <button monaButton>Month</button>
</mona-button-group>
```

> **Group inputs override child inputs.** When a child button is inside a `ButtonGroupComponent`, the group's `look`, `size`, `rounded`, and `disabled` values replace the child's own inputs for those properties.

> **Selection state is not pre-settable via a group input.** To initialize a child as selected, bind `[(selected)]="true"` directly on that child button. There is no `value` input on the group.

> **`allowEmpty` only applies to `"single"` selection mode.** In `"multiple"` mode, any number of buttons (including zero) can be active simultaneously.

> **Switching from `"multiple"` to `"single"` reconciles existing state.** When `selection` changes from `"multiple"` to `"single"` at runtime, all but the first currently-selected button are automatically deselected.

## Appearance & Styling

### Look variants

`look` defaults to `"outline"`. Most values affect child button fill and border. The container applies additional styling for two values:

| `look`    | Container effect                               |
|-----------|------------------------------------------------|
| `outline` | Adds a visual divider between adjacent buttons |
| `ghost`   | Removes the outer container border             |
| others    | No additional container effect                 |

### Sizes

| `size`   | Applied to                  |
|----------|-----------------------------|
| `small`  | All child buttons           |
| `medium` | All child buttons (default) |
| `large`  | All child buttons           |

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

## Accessibility Notes

The group host receives `role="group"` and an `aria-label` that defaults to `"Button group"`.

| Attribute    | When present | Value                           |
|--------------|--------------|---------------------------------|
| `role`       | Always       | `"group"`                       |
| `aria-label` | Always       | Value of the `aria-label` input |

Each child button's `aria-pressed` attribute is managed by `ButtonDirective` and reflects the button's current `selected` state.

**Consumer responsibilities:**

- When multiple button groups appear on the same page, set a unique `aria-label` on each group so screen reader users can distinguish them.
- Individual icon-only child buttons still require their own `aria-label` on the `<button>` element.

## API

### `ButtonGroupComponent`

**Selector:** `mona-button-group`

**Content projection:** accepts elements carrying the `monaButton` attribute (`<ng-content select="[monaButton]">`).

#### Inputs

| Name         | Type                                                                                                           | Default          | Description                                                                                                                                                                            |
|--------------|----------------------------------------------------------------------------------------------------------------|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `allowEmpty` | `boolean`                                                                                                      | `true`           | When `false` and `selection` is `"single"`, at least one button must remain selected; the active button cannot be deselected. Has no effect in `"multiple"` mode.                      |
| `aria-label` | `string`                                                                                                       | `'Button group'` | Accessible name for the host element. Override when multiple button groups appear on the same page so screen reader users can distinguish them.                                        |
| `class`      | `string`                                                                                                       | `''`             | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                              |
| `disabled`   | `boolean`                                                                                                      | `false`          | Two-way bindable. Renders all child buttons with reduced visual emphasis and removes pointer interaction.                                                                              |
| `look`       | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'outline'`      | Visual style variant propagated to all child buttons. Also controls container-level divider and border behavior.                                                                       |
| `rounded`    | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                           | `'medium'`       | Border-radius preset applied to the container and the outer corners of the first and last child button.                                                                                |
| `selection`  | `'single' \| 'multiple'`                                                                                       | `'multiple'`     | Two-way bindable. Controls whether child buttons behave as a radio group (`"single"`) or toggle independently (`"multiple"`). `SelectionMode` is importable from `@nanahoshi/mona-ui`. |
| `size`       | `'small' \| 'medium' \| 'large'`                                                                               | `'medium'`       | Size preset propagated to all child buttons, overriding their individual `size` inputs.                                                                                                |

#### Outputs

| Name          | Type   | Description                                                                                                                          |
|---------------|--------|--------------------------------------------------------------------------------------------------------------------------------------|
| `buttonClick` | `void` | Emitted when any child button in the group is clicked. Use `[(selected)]` on child buttons to observe the resulting selection state. |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] look default confirmed "outline" (source: input<...>("outline"))
- [x] disabled and selection correctly marked as Two-way bindable (kind: "model" in metadata)
- [x] look type union excludes "link" and "clear" (ButtonGroup-specific CVA)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
- [x] SelectionMode exported from @nanahoshi/mona-ui — noted in selection row
- [x] buttonClick output documented; old "no event outputs" note removed
- [x] mode-switch reconciliation callout added (multiple→single now deselects all but first)
- [x] Accessibility claims verified against source: role="group" and aria-label host bindings confirmed in button-group.component.ts; aria-pressed on children managed by ButtonDirective
- [x] ARIA info moved from overview into dedicated Accessibility Notes section
- [x] Styling section documents only public inputs — no Tailwind class names exposed
-->

<!-- TODO(owner-review): Confirm whether an initial selection value API (e.g. a group-level value input) is planned -->
