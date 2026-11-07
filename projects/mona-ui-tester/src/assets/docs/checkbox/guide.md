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

```html
<mona-check-box label="Accept terms"></mona-check-box>
```

**`ngModel`:**

`CheckBoxComponent` doesn't implement `ControlValueAccessor`. `[(ngModel)]` still works, because Angular binds it to the `checked` model of a custom control. Import `FormsModule` for it.

```html

<mona-check-box label="Accept terms" [(ngModel)]="accepted"></mona-check-box>
```

> **Listening to changes:** Use `(inputChange)` for raw DOM `change` events. For signal forms, the `[formField]` binding handles value synchronization automatically.

## Examples

### Labels

The text comes from `label` or from projected content. When `label` is non-empty it takes precedence over projected content. `labelPosition="before"` puts the text before the box.

```example
checkbox/labels
```

### Select all

`indeterminate` shows a dash and sets `aria-checked="mixed"`. It's independent of `checked`.

```example
checkbox/indeterminate
```

A user change clears it and then toggles `checked`, as on a native checkbox, and `indeterminateChange` emits `false`. A one-way `[indeterminate]` binding only writes again when its bound value changes: if it stays `true` after a click, the dash stays gone. Use `[(indeterminate)]`, or recompute the bound value after each change, as this example does.

### Signal forms

`CheckBoxComponent` implements `FormCheckboxControl` from `@angular/forms/signals`, so it takes `[formField]`. `FormField` writes `checked`, `disabled`, `invalid`, `name`, `readonly`, `required` and `touched`. Don't set those on the same element, because Angular rejects the template. The signal forms `required` rule treats an unchecked box as empty.

```example
checkbox/forms
```

### The directive

The directive leaves all label composition and form wiring to the consumer. The native `<input>` retains its standard keyboard behavior, form submission semantics, and Angular forms support.

```example
checkbox/directive
```

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
