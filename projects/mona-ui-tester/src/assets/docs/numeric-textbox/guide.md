## Overview

Use `NumericTextBoxComponent` when the user must enter a numeric value and the control should stay numeric throughout editing. It is a good fit for counts, quantities, prices, and other fixed-point values where step changes and clamping are useful.

Use `TextBoxComponent` when the user needs freeform text. `NumericTextBoxComponent` formats the value for display and keeps the underlying value numeric.

> **Forms.** `NumericTextBoxComponent` implements `FormValueControl<number | null>` from `@angular/forms/signals`, so use `[formField]` with signal forms. It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

## Import & Quick Start

```typescript
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { FormField, form } from "@angular/forms/signals";
```

**Direct value binding**

```html
<mona-numeric-text-box
    [(value)]="quantity"
    [minValue]="0"
    [maxValue]="100"
    aria-label="Quantity">
</mona-numeric-text-box>
```

## Examples

### Fixed-point display while editing

When the value is `12`, the unfocused control displays `12.00`. While focused, it shows `12`. If the value is `12.5`, the focused edit buffer shows `12.5`.

```example
numeric-textbox/decimals
```

### Custom formatter

`formatter` affects the unfocused display string. It does not replace the focused edit buffer.

```example
numeric-textbox/formatter
```

### Spinner buttons and step size

The spinner buttons and arrow keys use the configured `step` value, and stop at `minValue` and `maxValue`.

```example
numeric-textbox/step
```

### Signal forms with bounds

Use the `FormField` directive when you want the form schema to write `value`, `touched`, `invalid`, `disabled`, `readonly`, and `required` into the component.

```example
numeric-textbox/forms
```

### Precision

A JavaScript `number` holds integers exactly only up to `9007199254740991` (`Number.MAX_SAFE_INTEGER`), and decimals only up to 15 significant digits. Rather than round a value silently, the control refuses the keystroke or paste that would go past that limit, and the spinner buttons stop at `±Number.MAX_SAFE_INTEGER`. For amounts that need more digits, such as money stored as a decimal type, use [`DecimalTextBoxComponent`](/decimal-textbox), whose value is a decimal string with no precision limit.

## Forms Integration

`NumericTextBoxComponent` implements `FormValueControl<number | null>` from `@angular/forms/signals` and is intended for signal forms use via `[formField]`.

```typescript
import { disabled, form, FormField, required } from "@angular/forms/signals";
```

The `touch` output fires when focus leaves the component, after the value has been clamped to the bounds. Typing and spinning don't fire it, and neither does moving focus between the input and content inside the component, such as a prefix template.

The `invalid` and `touched` inputs are written by `FormField` when the control is used with signal forms. `required` contributes to the invalid state when the value is empty and the control has been touched.

## Accessibility

`NumericTextBoxComponent` renders `role="spinbutton"` on the inner input element. The host element has no role, and the ARIA inputs below go to the inner input, not the host.

| Attribute          | When present                                                                   | Value                   |
|--------------------|--------------------------------------------------------------------------------|-------------------------|
| `role`             | Always                                                                         | `"spinbutton"`          |
| `aria-label`       | The `aria-label` input is set                                                  | Its value               |
| `aria-labelledby`  | The `aria-labelledby` input is set                                             | Its value               |
| `aria-describedby` | The `aria-describedby` input is set                                            | Its value               |
| `aria-invalid`     | Once `touched`, when `invalid` is `true` or `required` is `true` with no value | `"true"`                |
| `aria-valuemax`    | When `maxValue` is set                                                         | `maxValue`              |
| `aria-valuemin`    | When `minValue` is set                                                         | `minValue`              |
| `aria-valuenow`    | When a numeric value is present                                                | Current numeric value   |
| `aria-valuetext`   | When the input shows text                                                      | Formatted display value |

`disabled`, `readonly` and `required` are set as the native attributes of the inner input, which assistive technology reads as those states.

**Consumer responsibilities**

- Name the control. Point a `<label for>` or `<mona-label for>` at `inputId`, wrap it in `<mona-label text="...">` (the browser names the inner input from the label), or set `aria-labelledby` or `aria-label`. The placeholder is not a label. `[for]` bound to a template reference only moves focus to the input on click, and doesn't name it.

<!-- verification-checklist
- [ ] API definitions and defaults verified against source and component metadata
- [ ] Basic example compiles successfully
- [ ] No internal or unexported APIs exposed
- [ ] Accessibility claims verified against source or marked for owner review
- [ ] Styling section includes only public customization points
-->
