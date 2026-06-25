## Overview

Mona UI provides two ways to render a styled checkbox:

**`CheckBoxComponent` (`mona-check-box`)** is a self-contained component. It renders a `<label>` wrapping a hidden native `<input>` and a visible custom `<span>` that handles focus, ARIA, and keyboard interaction. It integrates with Angular forms via `ControlValueAccessor` and supports an optional text label or projected content.

**`CheckboxDirective` (`monaCheckbox`)** is an attribute directive applied directly to your own `<input type="checkbox">`. It adds Mona UI styling classes and a `rounded` variant while keeping the native element as the form control. Use it when you need full control over the surrounding markup — your own `<label>`, positioning, and form wiring.

**Choose `CheckBoxComponent` when:**

- You want a ready-made label + checkbox layout without writing wrapper markup
- You are binding through Angular forms (`ngModel`, `formControl`, `formControlName`)
- You need indeterminate state, label positioning, or label size variants

**Choose `CheckboxDirective` when:**

- You need to compose the checkbox inside your own `<label>` or form layout
- You want native browser checkbox behavior (keyboard, form submission) with Mona UI styling
- You are not using Angular reactive forms

## Import & Basic Usage

```typescript
import { CheckBoxComponent } from "@mirei/mona-ui";           // component
import { CheckboxDirective } from "@mirei/mona-ui";           // directive
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

**Forms integration — Template-driven:**

```html
<mona-check-box label="Subscribe" [(ngModel)]="subscribed"></mona-check-box>
```

**Forms integration — Reactive:**

```html
<mona-check-box label="Subscribe" [formControl]="subscribedControl"></mona-check-box>
```

**Two-way binding (direct):**

```html
<mona-check-box label="Accept terms" [(checked)]="accepted"></mona-check-box>
```

`checked` is available as a two-way model (`[(checked)]`) and also integrates with Angular forms via `ngModel`, `formControl`, or `formControlName`. The component implements `FormCheckboxControl` from `@angular/forms/signals`, making it compatible with Angular's signal-based forms API in addition to `ControlValueAccessor`.

> **Listening to changes:** Use `(inputChange)` for raw DOM `change` events. For form-driven apps, subscribe to the form control's `valueChanges` instead.

### `CheckboxDirective`

```html
<label class="flex items-center gap-2">
    <input type="checkbox" monaCheckbox [(ngModel)]="accepted" />
    Accept terms
</label>
```

The directive leaves all label composition and form wiring to the consumer. The native `<input>` retains its standard keyboard behavior and form submission semantics.

## Appearance & Styling

### Rounded presets

Both `CheckBoxComponent` and `CheckboxDirective` accept the same `rounded` input:

| `rounded` | Shape          |
|-----------|----------------|
| `none`    | No rounding    |
| `small`   | `rounded-sm`   |
| `medium`  | `rounded-md` (default) |
| `large`   | `rounded-lg`   |
| `full`    | `rounded-full` |

### Visual states

| State          | Applied styles                                        |
|----------------|-------------------------------------------------------|
| Unchecked      | `bg-input-background border-input-border`             |
| Checked        | `bg-primary` with white checkmark SVG                 |
| Indeterminate  | `bg-primary` (no checkmark SVG)                       |
| Focused        | `ring-2 ring-primary/40` + `border-primary`           |
| Disabled       | `opacity-50 pointer-events-none cursor-not-allowed`   |
| Invalid (forms)| `border-error` when `ng-touched ng-invalid`           |

### Label size (`CheckBoxComponent` only)

| `labelSize` | Class      |
|-------------|------------|
| `small`     | `text-sm`  |
| `medium`    | `text-md` (default) |
| `large`     | `text-lg`  |

### Custom classes

Use the `class` input to extend styles. On `CheckBoxComponent` it targets the outer `<label>` container; on `CheckboxDirective` it targets the `<input>` element:

```html
<mona-check-box label="Bold label" class="font-semibold"></mona-check-box>
<input type="checkbox" monaCheckbox class="my-2" />
```

## API

### `CheckBoxComponent`

**Selector:** `mona-check-box`

Implements `ControlValueAccessor`. Bind via `ngModel`, `formControl`, or `formControlName`.

| Name            | Kind   | Type                                   | Default    | Required | Description |
|-----------------|--------|----------------------------------------|------------|----------|-------------|
| `class`         | input  | `string`                               | `''`       | Optional | Additional CSS classes merged onto the outer `<label>` container via `tailwind-merge`. |
| `checked`       | model  | `boolean`                              | `false`    | Optional | Two-way bindable checked state. Use `[(checked)]` for direct binding or `ngModel`/`formControl` for Angular forms integration. |
| `disabled`      | input  | `boolean`                              | `false`    | Optional | Disables the checkbox. Applies `opacity-50` and removes pointer interaction. |
| `indeterminate` | input  | `boolean`                              | `false`    | Optional | Sets the native `indeterminate` attribute on the hidden input. Renders the checkbox box in the primary color without a checkmark. Activating an indeterminate checkbox sets it to `checked`. |
| `label`         | input  | `string`                               | `''`       | Optional | Text label displayed adjacent to the checkbox. When non-empty, takes precedence over projected content. |
| `labelPosition` | input  | `'before' \| 'after'`                  | `'after'`  | Optional | Position of the label relative to the checkbox box. |
| `labelSize`     | input  | `'small' \| 'medium' \| 'large'`       | `'medium'` | Optional | Font size of the label text. |
| `required`      | input  | `boolean`                              | `false`    | Optional | Sets the `required` attribute on the hidden native input. |
| `rounded`       | input  | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Optional | Border-radius preset for the visible checkbox box. |
| `tabIndex`      | input  | `number`                               | `0`        | Optional | Tab index applied to the visible focusable checkbox span. |
| `inputBlur`     | output | `FocusEvent`                           | —          | Optional | Emitted when the visible checkbox span loses focus. |
| `inputChange`   | output | `Event`                                | —          | Optional | Emitted when the hidden native input fires a `change` event. |
| `inputFocus`    | output | `FocusEvent`                           | —          | Optional | Emitted when the visible checkbox span gains focus. |

---

### `CheckboxDirective`

**Selector:** `input[type='checkbox'][monaCheckbox]`

Applies styling to a native `<input type="checkbox">`. All native checkbox behaviors (keyboard, form submission, `indeterminate`) are preserved.

| Name      | Kind  | Type                                                    | Default    | Required | Description |
|-----------|-------|---------------------------------------------------------|------------|----------|-------------|
| `class`   | input | `string`                                                | `''`       | Optional | Additional CSS classes merged onto the checkbox input element via `tailwind-merge`. |
| `rounded` | input | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`   | `'medium'` | Optional | Border-radius preset for the checkbox. |

`CheckboxDirective` has no outputs. Listen to native events (`(change)`, `(focus)`, `(blur)`) on the host element directly.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] inputBlur/inputChange/inputFocus corrected from protected to public
- [x] userClass @description added to both CheckBoxComponent and CheckboxDirective
- [x] rounded @description added to CheckboxDirective
- [x] checked model added — confirmed public model(false) in source
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): CheckboxDirective host has [attr.role]="'checkbox'" which is redundant for native input[type="checkbox"] — safe to remove -->
<!-- TODO(owner-review): Confirm public package name is @mirei/mona-ui vs mona-ui -->
