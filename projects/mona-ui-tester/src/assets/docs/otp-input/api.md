## Overview

The `OtpInputComponent` (`mona-otp-input`) is designed for entering fixed-length verification codes and one-time passwords.

## Import

Import the component and optional separator directive from `@nanahoshi/mona-ui/otp-input`:

```typescript
import {
    OtpInputComponent,
    OtpInputSeparatorTemplateDirective
} from "@nanahoshi/mona-ui/otp-input";
```

## Basic Usage

Bind to a signal or model property using two-way `[(value)]`:

```html
<mona-otp-input
    type="number"
    [length]="6"
    [(value)]="verificationCode">
</mona-otp-input>
```

## Value Model

The `value` property is a contiguous string (e.g. `"123456"`).
- It never contains grouping separators or sentinel space characters.
- Leading zeroes (such as `"004219"`) are preserved and never coerced to numeric quantities.
- Its maximum length is bounded by the configured `length`.

## Length

The `length` input sets the expected code length and determines the number of visual slots rendered:

```html
<!-- 4-digit PIN -->
<mona-otp-input [length]="4"></mona-otp-input>

<!-- 6-digit MFA token -->
<mona-otp-input [length]="6"></mona-otp-input>
```

If `length` is reduced at runtime, any existing value is truncated to fit the new length.

## Input Types

Three input types are supported:

### 1. Numeric (`type="number"`)

Accepts digits `0-9` and requests a numeric virtual keyboard on mobile devices using `inputmode="numeric"`.

```html
<mona-otp-input type="number" [length]="6"></mona-otp-input>
```

### 2. Alphanumeric (`type="text"`)

Accepts letters (`a-z`, `A-Z`) and digits (`0-9`), preserving input casing.

```html
<mona-otp-input type="text" [length]="6"></mona-otp-input>
```

### 3. Password / Masked (`type="password"`)

Accepts alphanumeric characters while masking the visual presentation slots with a bullet glyph (`•`). The actual string value remains accessible in the underlying model.

```html
<mona-otp-input type="password" [length]="4"></mona-otp-input>
```

## Allowed Character Pattern (`characterPattern`)

Provide a `characterPattern` regular expression (`RegExp | null`) to customize per-character keystroke validation:

```typescript
protected readonly hexadecimalCharacter = /^[A-F0-9]$/;
```

```html
<mona-otp-input
    type="text"
    [length]="6"
    [characterPattern]="hexadecimalCharacter">
</mona-otp-input>
```

`characterPattern` is evaluated against each individual candidate character and restricts which characters may be entered.

## Placeholder

Display a placeholder character in unoccupied slots:

```html
<mona-otp-input placeholder="○" [length]="6"></mona-otp-input>
```

## Grouping & Separators

Visual slots can be grouped into segments with string or template separators:

### Uniform Grouping

```html
<!-- 123 - 456 -->
<mona-otp-input
    [length]="6"
    [groupLength]="3"
    separator="-">
</mona-otp-input>
```

### Unequal Grouping Arrays

```typescript
protected readonly customGroups = [2, 4];
```

```html
<!-- 12 / 3456 -->
<mona-otp-input
    [length]="6"
    [groupLength]="customGroups"
    separator="/">
</mona-otp-input>
```

### Custom Separator Template

Use the `monaOtpInputSeparatorTemplate` directive to render custom markup between groups:

```html
<mona-otp-input [length]="6" [groupLength]="3">
    <ng-template monaOtpInputSeparatorTemplate let-groupIndex="groupIndex">
        <span class="px-1 text-muted-foreground font-bold">•</span>
    </ng-template>
</mona-otp-input>
```

## Adjacent vs Spaced Slots

Set `[spacing]="false"` to join visual slots into a segmented appearance:

```html
<mona-otp-input [spacing]="false" [length]="4" rounded="medium"></mona-otp-input>
```

When joined, outer edges retain corner rounding while interior slot borders collapse cleanly without seams.

## Appearance

### Size

Adjust slot dimensions with `size` (`"small"`, `"medium"`, `"large"`):

```html
<mona-otp-input size="small"></mona-otp-input>
<mona-otp-input size="medium"></mona-otp-input>
<mona-otp-input size="large"></mona-otp-input>
```

### Rounded

Configure corner radius via `rounded` (`"none"`, `"small"`, `"medium"`, `"large"`, `"full"`):

```html
<mona-otp-input rounded="full"></mona-otp-input>
```

## Signal Forms Integration

`OtpInputComponent` implements `FormValueControl<string>`, enabling full integration with Angular Signal Forms:

```typescript
import { Component, signal } from "@angular/core";
import { form, FormField, pattern, required } from "@angular/forms/signals";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";

@Component({
    imports: [OtpInputComponent, FormField],
    template: `
        <mona-otp-input
            type="number"
            [length]="6"
            [characterPattern]="digitPattern"
            [formField]="loginForm.code">
        </mona-otp-input>
    `
})
export class OtpLoginComponent {
    readonly #loginModel = signal({ code: "" });
    protected readonly digitPattern = /^[0-9]$/;

    protected readonly loginForm = form(this.#loginModel, schema => {
        required(schema.code);
        pattern(schema.code, /^\d{6}$/);
    });
}
```

The `FormField` directive automatically synchronizes value, disabled, readonly, required, invalid, and touched state. Signal Forms evaluates field-level `pattern(...)` validators over the complete string value and updates form field validity, while character filtering is configured separately via `characterPattern`.

## State Properties

- `disabled`: Disables user input, focus, and pointer interaction while applying disabled theme styling.
- `readonly`: Keeps the control focusable and selectable while preventing modifications to the value.
- `required`: Marks the control as required. When incomplete and touched, the control enters the visual error state. Note that Angular Signal Forms `required()` enforces non-empty strings; if form-level validity requires an exact code length, use appropriate length validators in your form schema.
- `invalid`: Reports validation state. Visual error styling is displayed when the control is both `invalid` and `touched` (or `required` + `touched` + incomplete).
- `touched`: Indicates whether the control has been interacted with. Error styling is only displayed when touched.

## Native Input Attributes (`inputAttributes`)

The `inputAttributes` input allows forwarding custom HTML attributes to the underlying native `<input>` element:

```html
<mona-otp-input
    [inputAttributes]="{
        id: 'otp-field',
        name: 'two-factor-code',
        'aria-describedby': 'otp-help-text'
    }">
</mona-otp-input>
```

### Attribute Categories

- **Protected structural & control attributes**: Attributes that control component mechanics and structure (`value`, `type`, `disabled`, `readonly`, `required`, `maxlength`, `aria-invalid`, `aria-required`, `aria-hidden`, `role`, `class`, `style`) cannot be overridden via `inputAttributes`. Comparison is case-insensitive.
- **Component-managed overrides**: `autocomplete`, `inputmode`, `aria-label`, and `aria-labelledby` can be passed in `inputAttributes` to override component defaults. If omitted in subsequent updates, component defaults are automatically restored.
- **Forwarded custom attributes**: Generic attributes such as `id`, `name`, `aria-describedby`, and `data-*` are forwarded directly and cleanly removed from the DOM if omitted in subsequent updates.

## Clipboard Paste & Autofill

- **Paste**: Pasted strings with delimiters or spaces (e.g. `"12-34-56"`) are sanitized before being inserted. Overlong values are bounded by `length`.
- **Autofill**: By default, `autocomplete="one-time-code"` is set on the native input, enabling mobile operating systems (iOS and Android) and browsers to suggest incoming SMS verification codes.
- **Multi-character input**: SMS autofill, replacement text, and virtual keyboard suggestions are supported without character-by-character blocking.

## Programmatic Focus

Focus a specific slot index, pass standard browser `FocusOptions`, or focus the next unfilled slot using the component's `focus` method:

```typescript
// Focus next incomplete slot
otpComponent.focus();

// Focus specific slot index
otpComponent.focus(2);

// Focus with browser FocusOptions
otpComponent.focus({ preventScroll: true });

// Blur input
otpComponent.blur();
```

## Right-to-Left (RTL) Layout

`OtpInputComponent` explicitly enforces `dir="ltr"` on its host element. When used inside an RTL page or container, the OTP token and slot sequence always maintain left-to-right ordering to eliminate ambiguity during verification code entry.

## Events

- `complete`: Emitted when user interaction completes the verification code.
- `touch`: Emitted on blur or user interaction to mark the form field touched.
- `inputFocus`: Emitted when the native input gains focus.
- `inputBlur`: Emitted when the native input loses focus.

## Accessibility

- The component exposes **one accessible `<input>` control** to screen readers, preventing repetitive slot-by-slot field announcements.
- Presentation slots and separators are marked with `aria-hidden="true"`.
- External labels are supported via `[inputAttributes]="{ 'aria-labelledby': 'my-label-id' }"` or `[ariaLabel]`.
- Decorative fake caret animation respects user reduced-motion preferences (`motion-reduce:animate-none`).
- The component is designed to meet WCAG AA requirements and is verified with automated AXE accessibility checks.

## Security Notes

- OTP Input is a client-side entry interface. Verification tokens must always be validated securely on the server.
- Masked mode (`type="password"`) visually masks characters in the DOM, but does not encrypt the underlying Angular model value.
- Never log user-entered OTP codes in console logs or telemetry.
