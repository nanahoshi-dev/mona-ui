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
import { CheckBoxComponent } from "@nanahoshi/mona-ui";   // component
import { CheckboxDirective } from "@nanahoshi/mona-ui";   // directive
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
| Checked         | Filled box using the primary color, with a checkmark       |
| Indeterminate   | Filled box using the primary color, with a dash indicator  |
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

`CheckBoxComponent` renders the native `<input type="checkbox">` as visually hidden but accessible to screen readers. When `label` is non-empty, the component also sets `aria-label` on the native input to match that text. When `label` is empty, no `aria-label` is set — the accessible name is derived from the wrapping `<label>` element, which includes any projected content. Always provide either a non-empty `label` or project meaningful content so screen readers announce a useful accessible name.

When `indeterminate` is `true`, the component sets `aria-checked="mixed"` on the native input, which is the correct ARIA value for a partially selected checkbox (e.g., a "select all" control with some children selected).

Keyboard interaction is handled by the underlying native input. Space toggles the checked state; Enter does not activate checkboxes (browser default for `<input type="checkbox">`).

Native `<input type="checkbox">` elements are included in the tab order by default; `CheckboxDirective` does not override this behavior.

## API

### `CheckBoxComponent`

**Selector:** `mona-check-box`

Implements `FormCheckboxControl` from `@angular/forms/signals`. Use `[(checked)]` for direct binding or the signal forms `[formField]` binding for forms integration.

#### Inputs

| Name            | Type                                                 | Default    | Description                                                                                                                                                                                           |
|-----------------|------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `checked`       | `boolean`                                            | `false`    | Two-way bindable checked state. Implements `FormCheckboxControl`, enabling use with the signal forms `[formField]` binding.                                                                           |
| `class`         | `string`                                             | `''`       | Additional CSS classes merged onto the outer `<label>` container via `tailwind-merge`.                                                                                                                |
| `disabled`      | `boolean`                                            | `false`    | Renders the component with reduced visual emphasis and removes pointer interaction.                                                                                                                   |
| `indeterminate` | `boolean`                                            | `false`    | Sets the native indeterminate state. Renders the checkbox filled with a dash indicator, and sets `aria-checked="mixed"` on the native input. Activating an indeterminate checkbox sets it to checked. |
| `label`         | `string`                                             | `''`       | Text label displayed adjacent to the checkbox. When non-empty, takes precedence over projected content and is also used as the accessible name on the native input.                                   |
| `labelPosition` | `'before' \| 'after'`                                | `'after'`  | Position of the label relative to the checkbox box.                                                                                                                                                   |
| `labelSize`     | `'small' \| 'medium' \| 'large'`                     | `'medium'` | Font size of the label text.                                                                                                                                                                          |
| `required`      | `boolean`                                            | `false`    | Marks the native input as required. Activates browser validation and the `:required` CSS pseudo-class.                                                                                                |
| `rounded`       | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset for the visible checkbox box.                                                                                                                                                    |
| `tabIndex`      | `number`                                             | `0`        | Tab index applied to the native input. Ignored when `disabled` is `true` (forced to `-1`).                                                                                                            |

#### Outputs

| Name          | Type         | Description                                                                                                                              |
|---------------|--------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `inputBlur`   | `FocusEvent` | Emitted when the native input loses focus.                                                                                               |
| `inputChange` | `Event`      | Emitted when the native input fires a `change` event.                                                                                    |
| `inputFocus`  | `FocusEvent` | Emitted when the native input gains focus.                                                                                               |
| `touch`       | `void`       | Emitted when the checkbox loses focus or its value changes. Consumed by the signal forms `Field` directive to mark the field as touched. |

---

### `CheckboxDirective`

**Selector:** `input[type='checkbox'][monaCheckbox]`

Applies Mona UI styling to a native `<input type="checkbox">`. All native checkbox behaviors — keyboard interaction, form submission, `indeterminate` state, and Angular forms directives — are preserved.

#### Inputs

| Name      | Type                                                 | Default    | Description                                                               |
|-----------|------------------------------------------------------|------------|---------------------------------------------------------------------------|
| `class`   | `string`                                             | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset for the checkbox.                                    |

`CheckboxDirective` has no outputs. Listen to native events (`(change)`, `(focus)`, `(blur)`) on the host element directly.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Indeterminate visual corrected: now renders a dash indicator (CSS mask) for both CheckBoxComponent and CheckboxDirective
- [x] required input documented correctly: forwarded to native input via [required]="required()" — browser validation and :required pseudo-class activate
- [x] aria-label behavior corrected: falls back to null (not 'Checkbox') when label is empty; accessible name derives from wrapping <label>
- [x] CheckboxDirective tabindex note updated: directive no longer sets tabindex in host; native browser default applies
- [x] role="checkbox" TODO removed: redundant attribute was removed from CheckboxDirective host
- [x] touch output documented (was missing in prior docs)
- [x] ControlValueAccessor claim removed — CheckBoxComponent implements FormCheckboxControl only
- [x] [(ngModel)] / [formControl] examples correctly placed under CheckboxDirective only
- [x] API table sorted A→Z within each section
- [x] No internal or unexported APIs exposed
- [x] Accessibility claims verified against source
-->
