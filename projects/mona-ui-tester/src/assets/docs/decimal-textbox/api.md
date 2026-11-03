## Overview

A JavaScript `number` holds integers exactly only up to `9007199254740991` (`Number.MAX_SAFE_INTEGER`), and decimals only up to about 15 significant digits. `NumericTextBoxComponent` refuses input past that limit rather than round it. `DecimalTextBoxComponent` keeps its value as a decimal string and does all of its arithmetic exactly, so there is no limit:

- Typing `12345678901234567890.12` stores `"12345678901234567890.12"`.
- Stepping `"0.1"` by `"0.2"` gives `"0.3"`, not `0.30000000000000004`.

Use `NumericTextBoxComponent` when a `number` is enough, such as for counts or percentages. Use `DecimalTextBoxComponent` when the value is sent to a backend as a decimal type (for example `DECIMAL`, `BigDecimal` or `decimal`), or when its digits must survive unchanged.

> **Signal forms only.** `DecimalTextBoxComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`. It does not implement `ControlValueAccessor`, so `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

## The value format

The value is a **canonical decimal string**: an optional `-`, ASCII digits, and an optional `.` followed by digits. It never contains grouping, an exponent, leading zeros or trailing fraction zeros, so equal amounts always have equal strings:

| User types (`de-DE`) | `value`          |
|----------------------|------------------|
| `1.234,50`           | `"1234.5"`       |
| `-0,0`               | `"0"`            |
| `0012`               | `"12"`           |

The displayed text is localized; the value is not. `decimals` controls how many fraction digits are shown and accepted, not the value's format. Set a value the same way, as a canonical decimal string. A value that is not a decimal string (for example `"1,5"` or `"1e3"`) logs a dev-mode warning.

## Import & Quick Start

```typescript
import { DecimalTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
```

**Direct value binding**

```html
<mona-decimal-text-box
    [(value)]="amount"
    [decimals]="2"
    minValue="0"
    aria-label="Amount">
</mona-decimal-text-box>
```

**Signal forms**

```typescript
import { FormField, form } from "@angular/forms/signals";

protected readonly form = form({ amount: "1250.00" as string | null });
```

```html
<mona-decimal-text-box [formField]="form.amount" [decimals]="2" aria-label="Amount"></mona-decimal-text-box>
```

## Feature Examples

### Bounds and step

`minValue`, `maxValue` and `step` accept a decimal string or a number. A string keeps every digit; a number is converted to its shortest decimal form.

```html
<mona-decimal-text-box
    [(value)]="rate"
    [decimals]="4"
    minValue="0"
    maxValue="99999999999999999999.9999"
    step="0.0001"
    aria-label="Rate">
</mona-decimal-text-box>
```

The spinner buttons, arrow keys and mouse wheel stop at `minValue` and `maxValue`. On blur, a value outside the range is corrected to the nearest bound.

### Custom formatter

```typescript
protected readonly currencyFormatter = (value: string | null) =>
    value == null ? "" : formatNumber(value, "en-US", { style: "currency", currency: "USD" });
```

`formatNumber` from `@nanahoshi/mona-ui/i18n` formats a decimal string exactly. `formatter` affects the unfocused display string. It does not replace the focused edit buffer.

## Accessibility Notes

`DecimalTextBoxComponent` renders the same markup as `NumericTextBoxComponent`: `role="spinbutton"` on the inner input, with `aria-valuenow`, `aria-valuemin` and `aria-valuemax` set to the decimal strings and `aria-valuetext` set to the formatted display value.

**Consumer responsibilities**

- Provide an accessible name through `aria-label`. The component does not generate one automatically.

## API

### `DecimalTextBoxComponent`

**Selector:** `mona-decimal-text-box`

Implements `FormValueControl<string | null>` from `@angular/forms/signals`.

#### Inputs

Every input except the ones below behaves as in `NumericTextBoxComponent`: `ariaLabel`, `decimals`, `disabled`, `invalid`, `nullable`, `readonly`, `required`, `rounded`, `size`, `spinners`, `tabindex`, `touched` and `userClass`.

| Name        | Type                                          | Default | Description                                                              |
|-------------|-----------------------------------------------|---------|--------------------------------------------------------------------------|
| `formatter` | `((value: string \| null) => string) \| null` | `null`  | Formats the value for display when the control is not focused.           |
| `maxValue`  | `string \| number \| null`                    | `null`  | Upper bound of the value that can be entered.                            |
| `minValue`  | `string \| number \| null`                    | `null`  | Lower bound of the value that can be entered.                            |
| `step`      | `string \| number`                            | `"1"`   | Step used by the spinner buttons, arrow keys and mouse wheel.            |
| `value`     | `string \| null`                              | `null`  | Two-way bindable current value, as a canonical decimal string.           |

#### Outputs

The same as `NumericTextBoxComponent`: `inputBlur`, `inputFocus`, `inputFocusOut` and `touch`.

#### Public methods

| Name         | Signature  | Description                               |
|--------------|------------|-------------------------------------------|
| `decrease()` | `(): void` | Steps the value down by `step`.           |
| `focus()`    | `(): void` | Programmatically focuses the inner input. |
| `increase()` | `(): void` | Steps the value up by `step`.             |

### Related helpers (`@nanahoshi/mona-ui/i18n`)

| Name                           | Description                                                                                |
|--------------------------------|--------------------------------------------------------------------------------------------|
| `parseLocalizedDecimal`        | Parses localized text to a canonical decimal string, with no precision limit.              |
| `validateLocalizedDecimal`     | Validates complete or pasted text and returns the decimal string and an invalid `reason`.  |
| `validateLocalizedDecimalEdit` | Validates text while it is typed.                                                          |
| `formatNumber`                 | Accepts a decimal string and formats it exactly.                                           |
