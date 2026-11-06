## Overview

`ButtonGroupComponent` groups native `<button monaButton>` children into a cohesive control that propagates its `look`, `size`, `rounded`, and `disabled` values down to each child, overriding the child's own inputs for those properties.

When `selection` is `"single"` or `"multiple"`, the group coordinates toggle state across children. In `"single"` mode, activating one button deactivates all others. In `"multiple"` mode, each button toggles independently.

**Use `ButtonGroupComponent` when you need to:**

- Group related action buttons that must share a visual style (toolbar rows, formatting controls)
- Implement mutually exclusive toggles, where one or none can be active (a text alignment that can be off)
- Implement multi-select filters where any combination of options can be active simultaneously

**Do not use `ButtonGroupComponent` when:**

- The buttons navigate to URLs — use a `<nav>` element with anchor tags instead
- There is only a single stand-alone toggle — apply `[toggleable]="true"` directly on one `<button monaButton>`
- A dropdown or split action is needed on its own — use `DropdownButton` or `SplitButton`
- One option must always be chosen, such as a view mode — use `mona-segmented`, which is a radio group with arrow keys

## Import & Basic Usage

```typescript
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { ButtonGroupComponent } from "@nanahoshi/mona-ui/button-group";
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

**Single-select toggle group:**

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

**Holding the selection in one value:**

```html
<mona-button-group selection="single" aria-label="Alignment" [(value)]="alignment">
    <button monaButton value="left">Left</button>
    <button monaButton value="center">Center</button>
    <button monaButton value="right">Right</button>
</mona-button-group>

<mona-button-group selection="multiple" aria-label="Filters" [formField]="form.filters">
    <button monaButton value="open">Open</button>
    <button monaButton value="closed">Closed</button>
</mona-button-group>
```

`value` is the selected button's value or `null` in `"single"` mode, and an array of them in `"multiple"` mode. Values compare with `===`. Only toggleable buttons with a `value` take part, and action buttons in the same group keep working. `value` also works with `[formField]`.

**Reacting to a button click in the group:**

```html
<mona-button-group selection="single" (buttonClick)="onClick($event)">
    <button monaButton>Day</button>
    <button monaButton>Week</button>
    <button monaButton>Month</button>
</mona-button-group>
```

`$event` holds the `button` element, whether it's now `selected`, and its `value`. It fires for every button placed directly in the group, after the selection has changed, and not for a dropdown or split button's own buttons.

> **Group inputs override child inputs.** When a child button is inside a `ButtonGroupComponent`, the group's `look`, `size`, `rounded`, and `disabled` values replace the child's own inputs for those properties.

> **Use `value` or `[(selected)]`, not both.** Without a `value`, each button's `[(selected)]` holds its state.

> **The selection policy holds for bindings too.** In `"single"` mode a second `selected` button deselects the other, keeping the newest, or the first when several arrive together. A disabled selected button is deselected as well, so the group never holds two.

> **A value with no button yet is kept,** so one that loads first isn't lost. A selected button's value stays in `value` if the button goes away, until the application removes it.

> **`allowEmpty` only applies to `"single"` selection mode.** In `"multiple"` mode, any number of buttons (including zero) can be active simultaneously. It keeps a selected button selected, against clicks and against `selected` bindings, but it doesn't choose a first one, and a `value` of `null` still clears the group so a form can reset it.

> **Other content is dropped.** Only `monaButton` buttons, `mona-dropdown-button` and `mona-split-button` placed directly in the group render. A `<span>`, a link or a button inside a `<div>` doesn't appear.

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

The group host receives `role="group"` and an `aria-label` that defaults to `"Button group"`. A `mona-label` or `aria-labelledby` names it instead.

The buttons are toggle buttons in both selection modes: `aria-pressed`, each in the tab order. `"single"` isn't a radio group, so nothing tells a screen reader that the choices are exclusive. For one that must always hold a value, use `mona-segmented`.

A read-only group's toggle buttons stay focusable and report `aria-disabled`. `required` isn't offered, because `aria-required` isn't allowed on `role="group"`; say so in the label and let the form's validator enforce it.

| Attribute    | When present | Value                           |
|--------------|--------------|---------------------------------|
| `role`       | Always       | `"group"`                       |
| `aria-label` | Unless a label or `aria-labelledby` names it | Value of the `aria-label` input, or the default |
| `aria-invalid` | While `touched` and `invalid` | `"true"` |

Each child button's `aria-pressed` attribute is managed by `ButtonDirective` and reflects the button's current `selected` state.

**Consumer responsibilities:**

- When multiple button groups appear on the same page, set a unique `aria-label` on each group so screen reader users can distinguish them.
- Individual icon-only child buttons still require their own `aria-label` on the `<button>` element.

## API

### `ButtonGroupComponent`

**Selector:** `mona-button-group`

**Content projection:** accepts `monaButton` buttons, `mona-dropdown-button` and `mona-split-button` (`<ng-content select="[monaButton], mona-dropdown-button, mona-split-button">`). The buttons inside dropdown and split buttons take the group's look, size, rounding and disabled state, but they aren't toggles and take no part in its selection.

#### Inputs

| Name         | Type                                                                                                           | Default          | Description                                                                                                                                                                            |
|--------------|----------------------------------------------------------------------------------------------------------------|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `allowEmpty` | `boolean`                                                                                                      | `true`           | When `false` and `selection` is `"single"`, a selected button stays selected until another takes over. It doesn't choose a first button, and a `value` of `null` still clears the group. Has no effect in `"multiple"` mode. |
| `aria-label` | `string`                                                                                                       | `'Button group'` | Accessible name for the host element. Override when multiple button groups appear on the same page so screen reader users can distinguish them.                                        |
| `aria-labelledby` | `string`                                                                                                  | `''`             | Id of the element that names the group.                                                                                                                                                |
| `class`      | `string`                                                                                                       | `''`             | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                              |
| `disabled`   | `boolean`                                                                                                      | `false`          | Renders all child buttons with reduced visual emphasis and removes pointer interaction. A disabled `fieldset` also disables it. A signal form field writes it.                         |
| `invalid`    | `boolean`                                                                                                      | `false`          | Marks the group as invalid. Error styling requires both `invalid` and `touched`. A signal form field writes it.                                                                        |
| `look`       | `'default' \| 'error' \| 'ghost' \| 'info' \| 'outline' \| 'primary' \| 'secondary' \| 'success' \| 'warning'` | `'outline'`      | Visual style variant propagated to all child buttons. Also controls container-level divider and border behavior.                                                                       |
| `readonly`   | `boolean`                                                                                                      | `false`          | Prevents selection changes while the buttons stay focusable. Buttons that aren't toggleable keep working. A signal form field writes it.                                               |
| `rounded`    | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`                                                           | `'medium'`       | Border-radius preset applied to the container and the outer corners of the first and last child button.                                                                                |
| `selection`  | `'single' \| 'multiple'`                                                                                       | `'multiple'`     | Whether one button can be selected at a time or each toggles on its own. The buttons stay toggle buttons in both. `SelectionMode` is importable from `@nanahoshi/mona-ui/common`.      |
| `size`       | `'small' \| 'medium' \| 'large'`                                                                               | `'medium'`       | Size preset propagated to all child buttons, overriding their individual `size` inputs.                                                                                                |
| `touched`    | `boolean`                                                                                                      | `false`          | Marks the group as touched. A signal form field writes it.                                                                                                                             |
| `value`      | `T \| readonly T[] \| null`                                                                                     | —                | Two-way bindable. The selected button's value or `null` in `"single"` mode, an array in `"multiple"` mode. While unset, it leaves each button's `selected` alone.                      |

The `value` input on `button[monaButton]` is what the group's `value` holds while that button is selected.

#### Outputs

| Name          | Type   | Description                                                                                                                          |
|---------------|--------|--------------------------------------------------------------------------------------------------------------------------------------|
| `buttonClick` | `ButtonGroupClickEvent<T>` | Emitted when a button placed directly in the group is clicked, toggleable or not, after the selection changed. Carries `button`, `selected` and `value`. |
| `touch`       | `void` | Emitted when a user changes the selection or focus leaves the group. A signal form field listens to it. |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] look default confirmed "outline" (source: input<...>("outline"))
- [x] disabled and selection are plain inputs; value is the two-way binding
- [x] look type union excludes "link" and "clear" (ButtonGroup-specific CVA)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
- [x] SelectionMode exported from @nanahoshi/mona-ui/common — noted in selection row
- [x] buttonClick output documented with its event
- [x] mode-switch reconciliation callout added (multiple→single now deselects all but first)
- [x] Accessibility claims verified against source: role="group" and aria-label host bindings confirmed in button-group.component.ts; aria-pressed on children managed by ButtonDirective
- [x] ARIA info moved from overview into dedicated Accessibility Notes section
- [x] Styling section documents only public inputs — no Tailwind class names exposed
-->

