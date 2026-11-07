## Overview

A JavaScript `number` holds integers exactly only up to `9007199254740991` (`Number.MAX_SAFE_INTEGER`), and decimals only up to about 15 significant digits. `NumericTextBoxComponent` refuses input past that limit rather than round it. `DecimalTextBoxComponent` keeps its value as a decimal string and does all of its arithmetic exactly, so there is no limit:

- Typing `12345678901234567890.12` stores `"12345678901234567890.12"`.
- Stepping `"0.1"` by `"0.2"` gives `"0.3"`, not `0.30000000000000004`.

Use `NumericTextBoxComponent` when a `number` is enough, such as for counts or percentages. Use `DecimalTextBoxComponent` when the value is sent to a backend as a decimal type (for example `DECIMAL`, `BigDecimal` or `decimal`), or when its digits must survive unchanged.

> **Forms.** `DecimalTextBoxComponent` implements `FormValueControl<string | null>` from `@angular/forms/signals`, so use `[formField]` with signal forms. It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

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

### The value format

The value is a **canonical decimal string**: an optional `-`, ASCII digits, and an optional `.` followed by digits. It never contains grouping, an exponent, leading zeros or trailing fraction zeros, so equal amounts always have equal strings:

| User types (`de-DE`) | `value`          |
|----------------------|------------------|
| `1.234,50`           | `"1234.5"`       |
| `-0,0`               | `"0"`            |
| `0012`               | `"12"`           |

The displayed text is localized; the value is not. `decimals` controls how many fraction digits are shown and accepted, not the value's format. Set a value the same way, as a canonical decimal string. A value that is not a decimal string (for example `"1,5"` or `"1e3"`) logs a dev-mode warning.

## Examples

### Bounds and step

`minValue`, `maxValue` and `step` accept a decimal string or a number. A string keeps every digit; a number is converted to its shortest decimal form.

```example
decimal-textbox/bounds
```

The spinner buttons, arrow keys and mouse wheel stop at `minValue` and `maxValue`. On blur, a value outside the range is corrected to the nearest bound.

### Custom formatter

`formatNumber` from `@nanahoshi/mona-ui/i18n` formats a decimal string exactly. `formatter` affects the unfocused display string. It does not replace the focused edit buffer.

```example
decimal-textbox/formatter
```

### Signal forms

The form field holds the canonical decimal string, whatever the display locale.

```example
decimal-textbox/forms
```

### Parsing and validating text

`@nanahoshi/mona-ui/i18n` has helpers for working with the same text outside the component:

| Name                           | Description                                                                                |
|--------------------------------|--------------------------------------------------------------------------------------------|
| `parseLocalizedDecimal`        | Parses localized text to a canonical decimal string, with no precision limit.              |
| `validateLocalizedDecimal`     | Validates complete or pasted text and returns the decimal string and an invalid `reason`.  |
| `validateLocalizedDecimalEdit` | Validates text while it is typed.                                                          |
| `formatNumber`                 | Accepts a decimal string and formats it exactly.                                           |

## Accessibility

`DecimalTextBoxComponent` renders the same markup as `NumericTextBoxComponent`: `role="spinbutton"` on the inner input, with `aria-valuenow`, `aria-valuemin` and `aria-valuemax` set to the decimal strings and `aria-valuetext` set to the formatted display value.

**Consumer responsibilities**

- Provide an accessible name through `aria-label`. The component does not generate one automatically.
