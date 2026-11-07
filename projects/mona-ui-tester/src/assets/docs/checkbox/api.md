## Overview

Mona UI provides two ways to render a styled checkbox:

**`CheckBoxComponent` (`mona-check-box`)** is a self-contained component. It wraps a visually hidden native `<input type="checkbox">` (accessible to screen readers) and a visible custom box that tracks focus and checked state via CSS peer selectors. It implements `FormCheckboxControl` from `@angular/forms/signals` and supports an optional text label or projected content.

**`CheckboxDirective` (`monaCheckbox`)** is an attribute directive applied directly to your own `<input type="checkbox">`. It adds Mona UI styling while keeping the native element as the form control. Because it targets a native input, Angular's built-in form directives (`[(ngModel)]`, `[formControl]`, `formControlName`) work on it without any additional wiring.

**Choose `CheckBoxComponent` when:**

- You want a ready-made label + checkbox layout without writing wrapper markup
- You need indeterminate state, read-only state, label positioning, or label size variants
- You are using signal forms via the `[formField]` binding

**Choose `CheckboxDirective` when:**

- You need full control over the surrounding markup — your own `<label>`, positioning
- You want to use `[formControl]` or `formControlName` (Angular's standard forms work on the native input directly)
- You want native browser checkbox behavior with Mona UI styling

## Import & Basic Usage

```typescript
import { CheckBoxComponent } from "@nanahoshi/mona-ui/check-box";   // component
import { CheckboxDirective } from "@nanahoshi/mona-ui/check-box";   // directive
```

Add the imported symbols to your standalone component's `imports` array.

### The component

**Label via input:**

```html

<mona-check-box label="Accept terms"></mona-check-box>
```

**Label via projected content:**

```html

<mona-check-box>
    I agree to the <a href="/terms">Terms of Service</a>
</mona-check-box>
```

When `label` is non-empty it takes precedence over projected content.

**Label before the checkbox:**

```html

<mona-check-box label="Notify me" labelPosition="before"></mona-check-box>
```

**Two-way model binding (direct):**

```html

<mona-check-box label="Accept terms" [(checked)]="accepted"></mona-check-box>
```

**Signal forms integration:**

`CheckBoxComponent` implements `FormCheckboxControl` from `@angular/forms/signals`. Use the `[formField]` binding from the signal forms `FormField` directive:

```html

<mona-check-box label="Accept terms" [formField]="agreedField"></mona-check-box>
```

`FormField` writes `checked`, `disabled`, `invalid`, `name`, `readonly`, `required` and `touched`. Don't set those on the same element, because Angular rejects the template. The signal forms `required` rule treats an unchecked box as empty.

**`ngModel`:**

`CheckBoxComponent` doesn't implement `ControlValueAccessor`. `[(ngModel)]` still works, because Angular binds it to the `checked` model of a custom control. Import `FormsModule` for it.

```html

<mona-check-box label="Accept terms" [(ngModel)]="accepted"></mona-check-box>
```

> **Listening to changes:** Use `(inputChange)` for raw DOM `change` events. For signal forms, the `[formField]` binding handles value synchronization automatically.

### The directive

```html
<label class="flex items-center gap-2">
    <input type="checkbox" monaCheckbox [(ngModel)]="accepted" />
    Accept terms
</label>
```

The directive leaves all label composition and form wiring to the consumer. The native `<input>` retains its standard keyboard behavior, form submission semantics, and Angular forms support.

## Indeterminate

```html

<mona-check-box label="Select all" [(checked)]="allSelected" [(indeterminate)]="someSelected"></mona-check-box>
```

`indeterminate` shows a dash and sets `aria-checked="mixed"`. It's independent of `checked`.

A user change clears it and then toggles `checked`, as on a native checkbox, and `indeterminateChange` emits `false`. A one-way `[indeterminate]` binding only writes again when its bound value changes: if it stays `true` after a click, the dash stays gone. Use `[(indeterminate)]`, or recompute the bound value after each change.

## Read-only

`readonly` cancels the click, so the value and the indeterminate state don't change. The control stays focusable and readable, and the native input gets `aria-readonly="true"`. With `[formField]`, the signal forms `readonly` rule writes it.

`CheckboxDirective` has no `readonly` input, and the HTML `readonly` attribute has no effect on a native checkbox.

## Appearance & Styling

### Rounded presets

Both `CheckBoxComponent` and `CheckboxDirective` accept the same `rounded` input:

| `rounded` | Shape                       |
|-----------|-----------------------------|
| `none`    | No rounding                 |
| `small`   | Slight rounding             |
| `medium`  | Moderate rounding (default) |
| `large`   | Strong rounding             |
| `full`    | Pill / fully rounded        |

### Visual states

| State           | Appearance                                                 |
|-----------------|------------------------------------------------------------|
| Unchecked       | Empty box with the theme's input background and border     |
| Checked         | Filled box using the primary color, with a checkmark       |
| Indeterminate   | Filled box using the primary color, with a dash indicator  |
| Focused         | Focus border and ring                                      |
| Disabled        | Disabled colors, no pointer interaction                    |
| Read-only       | Default cursor, otherwise unchanged                        |
| Invalid (forms) | Error border and ring                                      |

On the component, the invalid state shows once `touched` is `true` and either `invalid` is `true` or `required` is `true` and the box is unchecked. On the directive it needs both `invalid` and `touched`.

### Label size (component only)

| `labelSize` | Description                   |
|-------------|-------------------------------|
| `small`     | Compact label text            |
| `medium`    | Standard label text (default) |
| `large`     | Larger label text             |

### Custom classes

Use the `class` input to extend styles. On `CheckBoxComponent` it targets the outer `<label>` container; on `CheckboxDirective` it targets the `<input>` element directly:

```html

<mona-check-box label="Bold label" class="font-semibold"></mona-check-box>
<input type="checkbox" monaCheckbox class="my-2" />
```

## Accessibility Notes

`CheckBoxComponent` renders the native `<input type="checkbox">` as visually hidden but accessible to screen readers. The native input's `aria-label` is the `aria-label` input, or else the `label` text. When both are empty, the accessible name comes from the wrapping `<label>` element, which includes any projected content. Always provide a `label`, meaningful projected content, `aria-label` or `aria-labelledby`.

`CheckBoxComponent` renders its own `<label>`, so don't wrap it in `mona-label`. To label it from outside, bind a `mona-label` or `label[monaLabel]` to it with `[for]="ref"`, or point a `for` at its `inputId`. A click on such a label toggles the box.

When `indeterminate` is `true`, the component sets `aria-checked="mixed"` on the native input, which is the correct ARIA value for a partially selected checkbox (e.g., a "select all" control with some children selected).

Keyboard interaction is handled by the underlying native input. Space toggles the checked state; Enter does not activate checkboxes (browser default for `<input type="checkbox">`).

Native `<input type="checkbox">` elements are included in the tab order by default; `CheckboxDirective` does not override this behavior.

## API

### `CheckBoxComponent`

**Selector:** `mona-check-box`

Implements `FormCheckboxControl` from `@angular/forms/signals`. Use `[(checked)]` for direct binding or the signal forms `[formField]` binding for forms integration.

#### Inputs

| Name               | Type                                                 | Default    | Description                                                                                                                                          |
|--------------------|------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-describedby` | `string`                                             | `''`       | Id of an element that describes the checkbox, such as an error message.                                                                              |
| `aria-label`       | `string`                                             | `''`       | Accessible name of the checkbox when it has no visible label.                                                                                        |
| `aria-labelledby`  | `string`                                             | `''`       | Id of the element that labels the checkbox.                                                                                                          |
| `checked`          | `boolean`                                            | `false`    | Two-way. Whether the checkbox is checked. `FormField` keeps it in sync when bound with `[formField]`.                                                |
| `class`            | `string`                                             | `''`       | Additional CSS classes merged onto the outer `<label>` container via `tailwind-merge`.                                                               |
| `disabled`         | `boolean`                                            | `false`    | Uses the disabled colors and removes pointer and keyboard interaction.                                                                               |
| `indeterminate`    | `boolean`                                            | `false`    | Shows a dash and sets `aria-checked="mixed"`. A user change clears it. Use `[(indeterminate)]` to follow that.                                       |
| `inputId`          | `string`                                             | generated  | Id of the native input. Point a `for` at it to label the checkbox from outside. A unique id is generated when it isn't set.                          |
| `invalid`          | `boolean`                                            | `false`    | Marks the checkbox as invalid. It shows once `touched` is also `true`. `FormField` writes it.                                                        |
| `label`            | `string`                                             | `''`       | Text label displayed next to the checkbox. When non-empty, takes precedence over projected content.                                                  |
| `labelPosition`    | `'before' \| 'after'`                                | `'after'`  | Position of the label relative to the checkbox box.                                                                                                  |
| `labelSize`        | `'small' \| 'medium' \| 'large'`                     | `'medium'` | Font size of the label text.                                                                                                                         |
| `name`             | `string`                                             | `''`       | Name of the native input, used in native form submission. `FormField` writes it.                                                                     |
| `readonly`         | `boolean`                                            | `false`    | Prevents value changes while the control stays focusable and readable. `FormField` writes it.                                                        |
| `required`         | `boolean`                                            | `false`    | Sets the native `required` attribute, and shows the invalid state once touched while unchecked. `FormField` writes it.                               |
| `rounded`          | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset for the visible checkbox box.                                                                                                   |
| `tabIndex`         | `number`                                             | `0`        | Tab index applied to the native input. Ignored when disabled (forced to `-1`).                                                                       |
| `touched`          | `boolean`                                            | `false`    | Marks the checkbox as touched. `FormField` writes it.                                                                                                |

#### Outputs

| Name                  | Type         | Description                                                                                                                                  |
|-----------------------|--------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `indeterminateChange` | `boolean`    | Emitted with `false` when a user change clears the indeterminate state.                                                                      |
| `inputBlur`           | `FocusEvent` | Emitted when the native input loses focus.                                                                                                   |
| `inputChange`         | `Event`      | Emitted when the native input fires a `change` event.                                                                                        |
| `inputFocus`          | `FocusEvent` | Emitted when the native input gains focus.                                                                                                   |
| `touch`               | `void`       | Emitted when the checkbox loses focus or its value changes. Consumed by the signal forms `FormField` directive to mark the field as touched. |

#### Methods

| Method                          | Description                       |
|---------------------------------|-----------------------------------|
| `focus(options?: FocusOptions)` | Moves focus to the native input.  |

---

### `CheckboxDirective`

**Selector:** `input[type='checkbox'][monaCheckbox]`

Applies Mona UI styling to a native `<input type="checkbox">`. All native checkbox behaviors — keyboard interaction, form submission, `indeterminate` state, and Angular forms directives — are preserved.

#### Inputs

| Name      | Type                                                 | Default    | Description                                                                                      |
|-----------|------------------------------------------------------|------------|--------------------------------------------------------------------------------------------------|
| `class`   | `string`                                             | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                        |
| `invalid` | `boolean`                                            | `false`    | Marks the checkbox as invalid, triggering error border and ring styling.                         |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset for the checkbox.                                                           |
| `touched` | `boolean`                                            | `false`    | Marks the checkbox as touched. Error styling requires both `invalid` and `touched` to be `true`. |

#### Outputs

`CheckboxDirective` has no outputs. Listen to native events (`(change)`, `(focus)`, `(blur)`) on the host element directly.
