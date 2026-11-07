## Overview

`TextBoxComponent` wraps a native `<input>` in a styled container element. It provides prefix and suffix content slots (for icons, unit labels, or embedded controls), an optional clear button, and a two-way bindable `value` model.

Choose `TextBoxComponent` over `TextBoxDirective` when you need:

- An optional clear button that resets the value
- Prefix or suffix content rendered inside the input boundary
- Signal forms integration via `[formField]`
- A `readonly` or `disabled` state managed through Angular inputs

For a plain styled `<input>` without a wrapper element, use `TextBoxDirective` (`input[monaTextBox]`) instead.

> **Forms.** `TextBoxComponent` implements `FormValueControl<string>` from `@angular/forms/signals`, so use `[formField]` with signal forms. It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

## Import & Quick Start

```typescript
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
// For template slots:
import { TextBoxPrefixTemplateDirective, TextBoxSuffixTemplateDirective } from "@nanahoshi/mona-ui/text-box";
```

Add the imported symbols to your standalone component's `imports` array.

**Basic usage:**

```html
<mona-text-box placeholder="Search..."></mona-text-box>
```

**With required validation (standalone):**

```html
<mona-text-box [(value)]="name" [required]="true" [touched]="wasTouched"></mona-text-box>
```

The invalid state activates when `required` is `true`, the value is empty, and `touched` is `true`.

## Examples

### Prefix and suffix

Put `ng-template` slots inside the component. A prefix renders at the start of the input boundary, and a suffix at the end, after the optional clear button. Multiple prefix and suffix templates render in source order.

```example
textbox/slots
```

### Clear button

```example
textbox/clear-button
```

### Signal forms

`TextBoxComponent` implements `FormValueControl<string>` and connects to a signal form field via `[formField]`. The `FormField` directive writes `value`, `invalid`, `touched`, `disabled`, `readonly`, and `required` into the component.

```example
textbox/forms
```

## Appearance & Styling

### `rounded` presets

| `rounded` | Shape                                    |
|-----------|------------------------------------------|
| `none`    | No rounding                              |
| `small`   | Slight rounding                          |
| `medium`  | Moderate rounding (default)              |
| `large`   | Strong rounding                          |
| `full`    | Pill shape; horizontal padding increased |

### `size` presets

| `size`   | Height | Font size       |
|----------|--------|-----------------|
| `small`  | 32px   | Extra-small     |
| `medium` | 36px   | Small (default) |
| `large`  | 40px   | Medium          |

### Visual states

| State    | Appearance                                                                |
|----------|---------------------------------------------------------------------------|
| Default  | Mona UI themed border and background                                      |
| Focused  | Visible focus ring using the primary color                                |
| Disabled | Reduced visual emphasis; pointer interaction removed                      |
| Readonly | Value not editable; visual state preserved; inner input remains focusable |
| Invalid  | Error-colored border and ring when the text box is in an invalid state    |

The invalid state activates when `required` is `true` and the value is empty and `touched` is `true`, or when `invalid` is set to `true` directly (e.g., by the signal forms `FormField` directive).

### Custom classes

Use `class` to extend the outer container, `inputClass` to target only the inner `<input>`, and `inputStyle` for inline styles on the inner `<input>`:

```html
<mona-text-box class="w-full" [inputClass]="'text-right'" [inputStyle]="{ fontFamily: 'monospace' }">
</mona-text-box>
```

## Accessibility

`TextBoxComponent` sets `aria-invalid="true"` on the inner `<input>` when the text box is in an invalid state.

Name the text box with `aria-label` or `aria-labelledby` on `mona-text-box`. Both go to the inner `<input>`, and the host keeps neither. The placeholder is not a name.

```html
<mona-text-box aria-label="Search products"></mona-text-box>
```

Or point a label at the inner input through `inputId`:

```html
<label for="search">Search products</label>
<mona-text-box inputId="search"></mona-text-box>
```

| Attribute      | When present                          | Value    |
|----------------|---------------------------------------|----------|
| `aria-invalid` | When the text box is in invalid state | `"true"` |

**Consumer responsibilities:**

- Provide an accessible name: `aria-label`, `aria-labelledby`, or a `<label for>` that matches `inputId`.

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] No ControlValueAccessor; ngModel and formControl work through Angular's binding of accessor-less controls (tests/forms-interop.spec.ts)
- [x] Signal forms ([formField]) documented correctly
- [x] invalid, touched, touch added to API tables
- [x] Tailwind class names removed from rounded, size, and visual states tables
- [x] API table columns: Name, Type, Default, Description only (no Kind, no Required)
- [x] API table rows sorted A→Z within each section
- [x] TextBoxVariantProps["rounded"] replaced with concrete union (not exported from public API)
- [x] AttributeConfig documented as Record<string, unknown> (not exported from public API)
- [x] onClearClick, onInputBlur, onValueChange not exposed (template-only public methods)
- [x] aria-invalid documented in Accessibility Notes
- [x] Consumer label responsibility stated explicitly
- [x] Basic examples compile against public API surface
- [x] No unexported types exposed in API tables
- [x] focus() confirmed as public consumer-facing method
- [x] InputType is exported — used in type column
-->
