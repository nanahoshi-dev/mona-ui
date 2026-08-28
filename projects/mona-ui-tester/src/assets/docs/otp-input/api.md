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

## Custom Character Pattern

Provide a `pattern` regular expression to customize per-character validation:

```typescript
protected readonly hexPattern = /^[A-F0-9]$/;
```

```html
<mona-otp-input
    type="text"
    [length]="6"
    [pattern]="hexPattern">
</mona-otp-input>
```

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
import { form, FormField, required, disabled } from "@angular/forms/signals";
import { OtpInputComponent } from "@nanahoshi/mona-ui/otp-input";

@Component({
    imports: [OtpInputComponent, FormField],
    template: `
        <mona-otp-input
            type="number"
            [length]="6"
            [formField]="loginForm.code">
        </mona-otp-input>
    `
})
export class OtpLoginComponent {
    readonly #loginModel = signal({ code: "" });

    protected readonly loginForm = form(this.#loginModel, schema => {
        required(schema.code);
    });
}
```

The `FormField` directive automatically synchronizes value, disabled, readonly, required, invalid, and touched state.

## State Properties

- `disabled`: Disables user input, focuses, and pointer interaction while applying disabled theme styling.
- `readonly`: Keeps the control focusable and selectable while preventing modifications to the value.
- `required`: Marks the control as required. When incomplete and touched, the control enters the invalid error state.
- `invalid`: Manually triggers the visual error border and focus ring.
- `touched`: Controls error state visibility following user interaction.

## Clipboard Paste

Pasting is supported out of the box:
- Formatted codes containing hyphens or spaces (e.g. `"12-34-56"`) are sanitized before being inserted.
- Overlong clipboard text is truncated to the component's `length`.
- Pasting with a selected slot replaces the selection.

## One-Time-Code Autofill

By default, the inner native input includes `autocomplete="one-time-code"`, allowing modern browsers and mobile operating systems (such as iOS and Android) to suggest incoming SMS verification codes.

To override or disable autofill:

```html
<mona-otp-input
    [inputAttributes]="{ autocomplete: 'off' }">
</mona-otp-input>
```

## Programmatic Focus

Focus a specific slot or the next empty position using the component's `focus` method:

```typescript
// Focus next incomplete slot
otpComponent.focus();

// Focus specific slot index
otpComponent.focus(2);

// Blur input
otpComponent.blur();
```

## Events

- `complete`: Emitted when user interaction completes the verification code.
- `touch`: Emitted on blur or user interaction to mark the form field touched.
- `inputFocus`: Emitted when the native input gains focus.
- `inputBlur`: Emitted when the native input loses focus.

## Accessibility

- The component exposes **one accessible `<input>` control** to screen readers, preventing repetitive slot-by-slot field announcements.
- Presentation slots and separators are marked with `aria-hidden="true"`.
- Supports external labels via `[inputAttributes]="{ 'aria-labelledby': 'my-label-id' }"`.
- Passes all standard **AXE** accessibility checks and conforms to WCAG AA guidelines.

## Security Notes

- OTP Input is a client-side entry interface. Verification tokens must always be validated securely on the server.
- Masked mode (`type="password"`) visually masks characters in the DOM, but does not encrypt the underlying Angular model value.
- Never log user-entered OTP codes in console logs or telemetry.
