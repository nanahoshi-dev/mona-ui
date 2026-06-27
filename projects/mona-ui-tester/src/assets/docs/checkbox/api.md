## Overview

Mona UI provides two ways to render a styled checkbox:

**`CheckBoxComponent` (`mona-check-box`)** is a self-contained component. It wraps a visually hidden native `<input type="checkbox">` (accessible to screen readers) and a visible custom box that tracks focus and checked state via CSS peer selectors. It implements `FormCheckboxControl` from `@angular/forms/signals` and supports an optional text label or projected content.

**`CheckboxDirective` (`monaCheckbox`)** is an attribute directive applied directly to your own `<input type="checkbox">`. It adds Mona UI styling while keeping the native element as the form control. Because it targets a native input, Angular's built-in form directives (`[(ngModel)]`, `[formControl]`, `formControlName`) work on it without any additional wiring.

**Choose `CheckBoxComponent` when:**

- You want a ready-made label + checkbox layout without writing wrapper markup
- You need indeterminate state, label positioning, or label size variants
- You are using signal forms via the `[formField]` binding

**Choose `CheckboxDirective` when:**

- You need full control over the surrounding markup — your own `<label>`, positioning
- You want to use `[(ngModel)]`, `[formControl]`, or `formControlName` (Angular's standard forms work on the native input directly)
- You want native browser checkbox behavior with Mona UI styling

## Import & Basic Usage

```typescript
import { CheckBoxComponent } from "@mirei/mona-ui";   // component
import { CheckboxDirective } from "@mirei/mona-ui";   // directive
```

Add the imported symbols to your standalone component's `imports` array.

### `CheckBoxComponent`

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

**Indeterminate state:**

```html

<mona-check-box label="Select all" [indeterminate]="someSelected()"></mona-check-box>
```

**Two-way model binding (direct):**

```html

<mona-check-box label="Accept terms" [(checked)]="accepted"></mona-check-box>
```

**Signal forms integration:**

`CheckBoxComponent` implements `FormCheckboxControl` from `@angular/forms/signals`. Use the `[formField]` binding from the signal forms `Field` directive:

```html

<mona-check-box label="Accept terms" [formField]="agreedField"></mona-check-box>
```

> **`CheckBoxComponent` does NOT implement `ControlValueAccessor`.** It cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`. Use `CheckboxDirective` on a native `<input type="checkbox">` for traditional Angular forms.

> **Listening to changes:** Use `(inputChange)` for raw DOM `change` events. For signal forms, the `[formField]` binding handles value synchronization automatically.

### `CheckboxDirective`

```html
<label class="flex items-center gap-2">
    <input type="checkbox" monaCheckbox [(ngModel)]="accepted" />
    Accept terms
</label>
```

The directive leaves all label composition and form wiring to the consumer. The native `<input>` retains its standard keyboard behavior, form submission semantics, and Angular forms support.

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
| Checked         | Filled box using the primary color, with a white checkmark |
| Indeterminate   | Filled box using the primary color, without a checkmark    |
| Focused         | Visible focus ring using the primary color                 |
| Disabled        | Reduced opacity, no pointer interaction                    |
| Invalid (forms) | Border changes to the error color when touched and invalid |

The `Invalid` state activates when the signal forms field is touched and the value fails validation.

### Label size (`CheckBoxComponent` only)

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

`CheckBoxComponent` renders the native `<input type="checkbox">` as visually hidden but accessible to screen readers. The native input has its `aria-label` set from the `label` input, falling back to `'Checkbox'` when no label is provided. Always supply a non-empty `label` (or project meaningful content) so screen readers announce a useful accessible name.

When `indeterminate` is `true`, the component sets `aria-checked="mixed"` on the native input, which is the correct ARIA value for a partially selected checkbox (e.g., a "select all" control with some children selected).

Keyboard interaction is handled by the underlying native input. Space toggles the checked state; Enter does not activate checkboxes (browser default for `<input type="checkbox">`).

`CheckboxDirective` sets `tabindex="0"` on the host, which is the browser default for native checkboxes and is generally safe.

<!-- TODO(owner-review): CheckboxDirective host has [attr.role]="'checkbox'" — this is redundant for a native input[type="checkbox"] (native inputs already have an implicit ARIA role). Safe to remove; confirm before doing so. -->

## API

### `CheckBoxComponent`

**Selector:** `mona-check-box`

Implements `FormCheckboxControl` from `@angular/forms/signals`. Use `[(checked)]` for direct binding or the signal forms `[formField]` binding for forms integration.

#### Inputs

| Name            | Type                                                    | Default    | Description |
|-----------------|---------------------------------------------------------|------------|-------------|
| `checked`       | `boolean`                                               | `false`    | Two-way bindable checked state. Implements `FormCheckboxControl`, enabling use with the signal forms `[formField]` binding. |
| `class`         | `string`                                                | `''`       | Additional CSS classes merged onto the outer `<label>` container via `tailwind-merge`. |
| `disabled`      | `boolean`                                               | `false`    | Disables the checkbox and removes pointer interaction. |
| `indeterminate` | `boolean`                                               | `false`    | Sets the native indeterminate state. Renders the checkbox filled without a checkmark, and sets `aria-checked="mixed"`. Activating an indeterminate checkbox sets it to checked. |
| `label`         | `string`                                                | `''`       | Text label displayed adjacent to the checkbox. When non-empty, takes precedence over projected content and is used as the accessible name on the native input. |
| `labelPosition` | `'before' \| 'after'`                                   | `'after'`  | Position of the label relative to the checkbox box. |
| `labelSize`     | `'small' \| 'medium' \| 'large'`                        | `'medium'` | Font size of the label text. |
| `required`      | `boolean`                                               | `false`    | Intended to mark the field as required. <!-- TODO(owner-review): the `required` input is not forwarded to the native input in the current template — confirm whether this is intentional or an omission before documenting the expected behavior. --> |
| `rounded`       | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`   | `'medium'` | Border-radius preset for the visible checkbox box. |
| `tabIndex`      | `number`                                                | `0`        | Tab index applied to the native input. Ignored when `disabled` is `true` (forced to `-1`). |

#### Outputs

| Name          | Type         | Description |
|---------------|--------------|-------------|
| `inputBlur`   | `FocusEvent` | Emitted when the native input loses focus. |
| `inputChange` | `Event`      | Emitted when the native input fires a `change` event. |
| `inputFocus`  | `FocusEvent` | Emitted when the native input gains focus. |
| `touch`       | `void`       | Emitted when the checkbox loses focus or its value changes. Consumed by the signal forms `Field` directive to mark the field as touched. |

---

### `CheckboxDirective`

**Selector:** `input[type='checkbox'][monaCheckbox]`

Applies Mona UI styling to a native `<input type="checkbox">`. All native checkbox behaviors — keyboard interaction, form submission, `indeterminate` state, and Angular forms directives — are preserved.

#### Inputs

| Name      | Type                                                    | Default    | Description |
|-----------|---------------------------------------------------------|------------|-------------|
| `class`   | `string`                                                | `''`       | Additional CSS classes merged onto the checkbox input element via `tailwind-merge`. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`   | `'medium'` | Border-radius preset for the checkbox. |

`CheckboxDirective` has no outputs. Listen to native events (`(change)`, `(focus)`, `(blur)`) on the host element directly.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source
- [x] false ControlValueAccessor claim removed — component implements FormCheckboxControl only; no NG_VALUE_ACCESSOR, no writeValue/registerOnChange/registerOnTouched in source
- [x] [(ngModel)] and [formControl] examples removed from CheckBoxComponent section; directive section correctly retains them
- [x] touch output added to API table (was missing in prior docs)
- [x] API table sorted A→Z (checked, class, disabled, indeterminate, inputBlur, inputChange, inputFocus, label, labelPosition, labelSize, required, rounded, tabIndex, touch)
- [x] required input description updated with TODO(owner-review) — not forwarded to native input in template
- [x] Tailwind class names removed from Rounded presets, Visual states, and Label size tables; replaced with consumer-facing descriptions
- [x] Accessibility claims verified against source: aria-checked="mixed" confirmed in template, aria-label fallback confirmed, sr-only native input confirmed in checkboxVariants styles
- [x] Stale package name TODO removed
-->
