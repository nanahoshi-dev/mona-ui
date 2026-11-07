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

### Other digit forms

A character the rules reject is converted before it's rejected, so fullwidth digits and digits from other scripts, such as Eastern Arabic or Devanagari, count as the digits `0-9` they are. Conversion runs only for a rejected character, so a `characterPattern` can still accept the original.

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

`characterPattern` is evaluated against each individual candidate character and restricts which characters may be entered. When set, it replaces the rule that comes from `type`.

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

### Slot classes

`slotClass` adds classes to each slot and `separatorClass` to each separator. The native input sits on top of the slots to take the pointer, so a hover style in `slotClass` doesn't apply.

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

The `FormField` directive automatically synchronizes value, disabled, name, readonly, required, invalid, and touched state. Don't set those on the same element, because Angular rejects the template. Signal Forms evaluates field-level `pattern(...)` validators over the complete string value and updates form field validity, while character filtering is configured separately via `characterPattern`.

`OtpInputComponent` doesn't implement `ControlValueAccessor`. `[(ngModel)]` binds to its `value` model through Angular's support for custom controls. Prefer `[formField]`.

## State Properties

- `disabled`: Disables user input, focus, and pointer interaction while applying disabled theme styling.
- `readonly`: Keeps the control focusable and selectable while preventing modifications to the value, including paste. The caret isn't drawn in the slots.
- `required`: Marks the control as required. When incomplete and touched, the control enters the visual error state. Note that Angular Signal Forms `required()` enforces non-empty strings; if form-level validity requires an exact code length, use appropriate length validators in your form schema.
- `invalid`: Reports validation state. Visual error styling is displayed when the control is both `invalid` and `touched` (or `required` + `touched` + incomplete).
- `touched`: Indicates whether the control has been interacted with. Error styling is only displayed when touched.

## Native Input Attributes (`inputAttributes`)

The `inputAttributes` input allows forwarding custom HTML attributes to the underlying native `<input>` element:

```html
<mona-otp-input
    [inputAttributes]="{
        'data-testid': 'otp-field',
        'aria-describedby': 'otp-help-text'
    }">
</mona-otp-input>
```

Use the `inputId` and `name` inputs for the id and name of the native input. An `id` or `name` in `inputAttributes` only applies while the matching input isn't set.

### Attribute Categories

- **Protected structural & control attributes**: Attributes that control component mechanics and structure (`value`, `type`, `disabled`, `readonly`, `required`, `maxlength`, `aria-invalid`, `aria-required`, `aria-hidden`, `role`, `class`, `style`) cannot be overridden via `inputAttributes`. Comparison is case-insensitive.
- **Component-managed overrides**: `autocomplete`, `inputmode`, `aria-label`, and `aria-labelledby` can be passed in `inputAttributes` to override component defaults. If omitted in subsequent updates, component defaults are automatically restored.
- **Forwarded custom attributes**: Generic attributes such as `aria-describedby` and `data-*` are forwarded directly and cleanly removed from the DOM if omitted in subsequent updates.

## Clipboard Paste & Autofill

- **Paste**: Pasted strings with delimiters or spaces (e.g. `"12-34-56"`) are sanitized before being inserted. Overlong values are bounded by `length`. A full code replaces what's there, wherever the caret is. A shorter one is inserted at the caret.
- **Autofill**: By default, `autocomplete="one-time-code"` is set on the native input, enabling mobile operating systems (iOS and Android) and browsers to suggest incoming SMS verification codes.
- **Multi-character input**: SMS autofill, replacement text, and virtual keyboard suggestions are supported without character-by-character blocking.

## Completion

`complete` emits the code when user input fills the last slot.

It also emits when a paste or multi-character insertion puts a different full code over a complete one, so auto-submit sees the new code. Correcting a complete code one character at a time doesn't emit it, so auto-submit doesn't run on every correction. Pasting the same code again doesn't emit it either, and neither does setting `value` from code.

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

## Accessibility

- The component exposes **one accessible `<input>` control** to screen readers, preventing repetitive slot-by-slot field announcements.
- Presentation slots and separators are marked with `aria-hidden="true"`.
- Name the control with a `mona-label` with `text` around it, a `mona-label` or `label[monaLabel]` with `[for]="ref"`, a `for` pointing at `inputId`, the `aria-label` or `aria-labelledby` inputs, or the same attributes in `inputAttributes`.
- With none of those, it gets the generic localized name "Verification code". A native `<label>` is detected once, after the first render, so a label added later keeps the generic name until something else sets one.
- Decorative fake caret animation respects user reduced-motion preferences (`motion-reduce:animate-none`).

## Security Notes

- OTP Input is a client-side entry interface. Verification tokens must always be validated securely on the server.
- Masked mode (`type="password"`) visually masks characters in the DOM, but does not encrypt the underlying Angular model value.
- Never log user-entered OTP codes in console logs or telemetry.

## API

### `OtpInputComponent`

**Selector:** `mona-otp-input`

#### Inputs

| Name               | Type                             | Default    | Description                                                                                                                                 |
|--------------------|----------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-describedby` | `string \| null`                 | `null`     | Id of an element that describes the inner `<input>`, such as an error message.                                                              |
| `aria-label`       | `string \| null`                 | `null`     | Accessible name for the inner `<input>`. Without a name from anywhere, the generic localized "Verification code" applies.                   |
| `aria-labelledby`  | `string \| null`                 | `null`     | Id of the element that labels the inner `<input>`.                                                                                          |
| `characterPattern` | `RegExp \| null`                 | `null`     | Regular expression each character must match. When set, it replaces the rule that comes from `type`.                                        |
| `class`            | `string`                         | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                   |
| `disabled`         | `boolean`                        | `false`    | Disables user input and focus, and applies the disabled styling. `FormField` writes it.                                                     |
| `groupLength`      | `number \| number[] \| null`     | `null`     | Slot grouping: a uniform group size or an array of group sizes.                                                                             |
| `inputAttributes`  | `AttributeConfig`                | `{}`       | Additional HTML attributes applied to the inner `<input>`. See [Native Input Attributes](#native-input-attributes-inputattributes).         |
| `inputId`          | `string`                         | generated  | Id of the inner `<input>`. Point a `for` at it to label the control. A unique id is generated when it isn't set.                            |
| `invalid`          | `boolean`                        | `false`    | Marks the control as invalid. It shows once `touched` is also `true`. `FormField` writes it.                                                |
| `length`           | `number`                         | `4`        | Number of characters accepted and of visual slots.                                                                                          |
| `name`             | `string`                         | `''`       | Name of the native input, used in native form submission and by browsers for autofill. `FormField` writes it.                               |
| `placeholder`      | `string`                         | `''`       | Hint character displayed in empty slots. Only the first character is used.                                                                  |
| `readonly`         | `boolean`                        | `false`    | Prevents value changes while the control stays focusable and readable. `FormField` writes it.                                               |
| `required`         | `boolean`                        | `false`    | Marks the control as required. Shows the invalid state when touched and incomplete. `FormField` writes it.                                  |
| `rounded`          | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the slots.                                                                              |
| `separator`        | `string`                         | `''`       | Text displayed between slot groups.                                                                                                         |
| `separatorClass`   | `string \| string[]`             | `''`       | Additional CSS classes applied to separator elements.                                                                                       |
| `size`             | `'small' \| 'medium' \| 'large'` | `'medium'` | Size preset controlling the dimensions and font size of the slots.                                                                          |
| `slotClass`        | `string \| string[]`             | `''`       | Additional CSS classes applied to each slot. A hover style doesn't apply, because the native input sits on top.                             |
| `spacing`          | `boolean`                        | `true`     | Whether slots within a group have spacing between them. `false` joins them.                                                                 |
| `tabindex`         | `number`                         | `0`        | Tab index of the inner `<input>`. Numeric strings are converted.                                                                            |
| `touched`          | `boolean`                        | `false`    | Marks the control as touched. `FormField` writes it.                                                                                        |
| `type`             | `'text' \| 'number' \| 'password'` | `'text'` | Which characters are accepted, and whether they're masked.                                                                                  |
| `value`            | `string`                         | `''`       | Two-way. The current code.                                                                                                                  |

#### Outputs

| Name         | Type         | Description                                                                                        |
|--------------|--------------|----------------------------------------------------------------------------------------------------|
| `complete`   | `string`     | Emitted when user input completes the code. See [Completion](#completion).                         |
| `inputBlur`  | `FocusEvent` | Emitted when the native input loses focus.                                                         |
| `inputFocus` | `FocusEvent` | Emitted when the native input gains focus.                                                         |
| `touch`      | `void`       | Emitted when the native input loses focus. `FormField` listens to it to mark the field as touched. |

#### Methods

| Method                                    | Description                                                                                                 |
|-------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `focus(target?: number \| FocusOptions)`  | Focuses the input: at the given slot, with the given options, or at the next unfilled slot. Does nothing while disabled. |
| `blur()`                                  | Removes focus from the input.                                                                               |
