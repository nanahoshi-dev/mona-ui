## Overview

Use `NumericTextBoxComponent` when the user must enter a numeric value and the control should stay numeric throughout editing. It is a good fit for counts, quantities, prices, and other fixed-point values where step changes and clamping are useful.

Use `TextBoxComponent` when the user needs freeform text. `NumericTextBoxComponent` formats the value for display and keeps the underlying value numeric.

> **Signal forms only.** `NumericTextBoxComponent` implements `FormValueControl<number | null>` from `@angular/forms/signals`. It does not implement `ControlValueAccessor`, so `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

## Import & Quick Start

```typescript
import { NumericTextBoxComponent } from "@mirei/mona-ui";
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

**Signal forms**

```typescript
import { FormField, form } from "@angular/forms/signals";

protected readonly form = form({ quantity: 1 });
```

```html
<mona-numeric-text-box [formField]="form.quantity" aria-label="Quantity"></mona-numeric-text-box>
```

## Feature Examples

### Fixed-point display while editing

```html
<mona-numeric-text-box
    [(value)]="amount"
    [decimals]="2"
    aria-label="Amount">
</mona-numeric-text-box>
```

When the value is `12`, the unfocused control displays `12.00`. While focused, it shows `12`. If the value is `12.5`, the focused edit buffer shows `12.5`.

### Custom formatter

```typescript
protected readonly currencyFormatter = (value: number | null) =>
    value == null ? "" : `$ ${value.toFixed(2)}`;
```

```html
<mona-numeric-text-box
    [(value)]="price"
    [decimals]="2"
    [formatter]="currencyFormatter"
    aria-label="Price">
</mona-numeric-text-box>
```

`formatter` affects the unfocused display string. It does not replace the focused edit buffer.

### Signal forms with bounds

```typescript
import { form, FormField, required } from "@angular/forms/signals";

protected readonly form = form({ quantity: 1 }, schema => {
    required(schema.quantity);
});
```

```html
<mona-numeric-text-box
    [formField]="form.quantity"
    [minValue]="0"
    [maxValue]="10"
    aria-label="Quantity">
</mona-numeric-text-box>
```

Use the `FormField` directive when you want the form schema to write `value`, `touched`, `invalid`, `disabled`, `readonly`, and `required` into the component.

### Spinner buttons and step size

```html
<mona-numeric-text-box
    [(value)]="stepValue"
    [step]="5"
    [spinners]="true"
    aria-label="Step value">
</mona-numeric-text-box>
```

The spinner buttons and arrow keys use the configured `step` value.

## Accessibility Notes

`NumericTextBoxComponent` renders `role="spinbutton"` on the inner input element and keeps the following ARIA attributes in sync with state:

| Attribute | When present | Value |
|-----------|--------------|-------|
| `role` | Always | `"spinbutton"` |
| `aria-disabled` | Always | `disabled()` |
| `aria-invalid` | When the control is invalid | `"true"` |
| `aria-readonly` | Always | `readonly()` |
| `aria-required` | Always | `required()` |
| `aria-valuemax` | When `maxValue` is set | `maxValue` |
| `aria-valuemin` | When `minValue` is set | `minValue` |
| `aria-valuenow` | When a numeric value is present | Current numeric value |
| `aria-valuetext` | Always | Formatted display value |

**Consumer responsibilities**

- Provide an accessible name through `aria-label`. The component does not generate one automatically.

## Forms Integration

`NumericTextBoxComponent` implements `FormValueControl<number | null>` from `@angular/forms/signals` and is intended for signal forms use via `[formField]`.

```typescript
import { disabled, form, FormField, required } from "@angular/forms/signals";
```

```html
<mona-numeric-text-box [formField]="form.quantity" aria-label="Quantity"></mona-numeric-text-box>
```

The `touch` output fires when the value changes, when the control blurs, and when the spinner buttons update the value.

The `invalid` and `touched` inputs are written by `FormField` when the control is used with signal forms. `required` contributes to the invalid state when the value is empty and the control has been touched.

## API

### `NumericTextBoxComponent`

**Selector:** `mona-numeric-text-box`

Implements `FormValueControl<number | null>` from `@angular/forms/signals`.

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `ariaLabel` | `string \| null` | `null` | Accessible name for the input. |
| `decimals` | `number` | `0` | Number of decimals to show when the value is displayed. |
| `disabled` | `boolean` | `false` | Renders the control with reduced visual emphasis and prevents interaction. |
| `formatter` | `((value: number \| null) => string) \| null` | `null` | Formats the value for display when the control is not focused. |
| `invalid` | `boolean` | `false` | Marks the control as invalid. When used with `[formField]`, the `FormField` directive writes this automatically. |
| `maxValue` | `number \| null` | `null` | Upper bound of the value that can be entered. |
| `minValue` | `number \| null` | `null` | Lower bound of the value that can be entered. |
| `nullable` | `boolean` | `true` | Allows the value to become empty. |
| `readonly` | `boolean` | `false` | Prevents value changes while preserving the control's visual state. |
| `required` | `boolean` | `false` | Marks the control as required. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the control. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size preset controlling the control's dimensions. |
| `spinners` | `boolean` | `true` | Shows the increment and decrement buttons. |
| `step` | `number` | `1` | Step value used by the spinner buttons and arrow-key changes. |
| `tabindex` | `number` | `0` | Tab index of the inner input element. |
| `touched` | `boolean` | `false` | Sets the touched state. When used with `[formField]`, the `FormField` directive writes this automatically. |
| `userClass` | `string` | `""` | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `value` | `number \| null` | `null` | Two-way bindable current value of the numeric text box. |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| `inputBlur` | `FocusEvent` | Emitted when the inner input is blurred. |
| `inputFocus` | `FocusEvent` | Emitted when the inner input is focused. |
| `inputFocusOut` | `FocusEvent` | Emitted when the inner input loses focus. |
| `touch` | `void` | Emitted when the control is interacted with on blur, value change, or spinner update. |

#### Public methods

| Name | Signature | Description |
|------|-----------|-------------|
| `focus()` | `(): void` | Programmatically focuses the inner input. |

## Verification Checklist

- [ ] API definitions and defaults verified against source and component metadata
- [ ] Basic example compiles successfully
- [ ] No internal or unexported APIs exposed
- [ ] Accessibility claims verified against source or marked for owner review
- [ ] Styling section includes only public customization points
