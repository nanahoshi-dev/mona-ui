## Overview

`TextBoxComponent` wraps a native `<input>` in a styled container element. It provides prefix and suffix content slots (for icons, unit labels, or embedded controls), an optional clear button, and a two-way bindable `value` model.

Choose `TextBoxComponent` over `TextBoxDirective` when you need:

- An optional clear button that resets the value
- Prefix or suffix content rendered inside the input boundary
- Signal forms integration via `[formField]`
- A `readonly` or `disabled` state managed through Angular inputs

For a plain styled `<input>` without a wrapper element, use `TextBoxDirective` (`input[monaTextBox]`) instead.

> **Signal forms only.** `TextBoxComponent` implements `FormValueControl<string>` from `@angular/forms/signals`. It does **not** implement `ControlValueAccessor` and cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`.

## Import & Basic Usage

```typescript
import { TextBoxComponent } from "@nanahoshi/mona-ui";
// For template slots:
import { TextBoxPrefixTemplateDirective, TextBoxSuffixTemplateDirective } from "@nanahoshi/mona-ui";
```

Add the imported symbols to your standalone component's `imports` array.

**Basic usage:**

```html
<mona-text-box placeholder="Search..."></mona-text-box>
```

**Two-way value binding:**

```html
<mona-text-box [(value)]="searchTerm" placeholder="Search..."></mona-text-box>
```

**With clear button:**

```html
<mona-text-box [(value)]="query" [clearButton]="true" placeholder="Enter query"></mona-text-box>
```

**Signal forms integration:**

`TextBoxComponent` implements `FormValueControl<string>` and connects to an Angular signal form field via `[formField]`:

```typescript
import { form, required, FormField } from "@angular/forms/signals";

protected readonly myForm = form({ search: "" }, schema => {
    required(schema.search);
});
```

```html
<mona-text-box [formField]="myForm.search" placeholder="Search..."></mona-text-box>
```

The `FormField` directive automatically writes `value`, `invalid`, `touched`, `disabled`, `readonly`, and `required` into the component.

**With required validation (standalone):**

```html
<mona-text-box [(value)]="name" [required]="true" [touched]="wasTouched"></mona-text-box>
```

The invalid state activates when `required` is `true`, the value is empty, and `touched` is `true`.

## Template Slots

`TextBoxComponent` supports `ng-template` content slots placed inside the component tag.

**Prefix slot** — rendered inside the left side of the input boundary:

```html
<mona-text-box placeholder="Search">
    <ng-template monaTextBoxPrefixTemplate>
        <svg lucideSearch class="pl-1" [size]="16"></svg>
    </ng-template>
</mona-text-box>
```

**Suffix slot** — rendered inside the right side of the input boundary (after the optional clear button):

```html
<mona-text-box placeholder="Enter value">
    <ng-template monaTextBoxSuffixTemplate>
        <button (click)="submit()">Go</button>
    </ng-template>
</mona-text-box>
```

Multiple prefix and suffix templates are supported and render in source order.

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

## Accessibility Notes

`TextBoxComponent` sets `aria-invalid="true"` on the inner `<input>` when the text box is in an invalid state.

The component does not set an accessible name automatically. Use `inputAttributes` to forward ARIA attributes to the inner `<input>`:

```html
<mona-text-box [inputAttributes]="{ 'aria-label': 'Search products' }"></mona-text-box>
```

Or reference an external label element:

```html
<label id="search-label">Search products</label>
<mona-text-box [inputAttributes]="{ 'aria-labelledby': 'search-label' }"></mona-text-box>
```

| Attribute      | When present                          | Value    |
|----------------|---------------------------------------|----------|
| `aria-invalid` | When the text box is in invalid state | `"true"` |

**Consumer responsibilities:**

- Provide an accessible name via `inputAttributes` (`aria-label` or `aria-labelledby`). Alternatively, forward an `id` to the inner input and link it to a `<label for>` element.

## API

### `TextBoxComponent`

**Selector:** `mona-text-box`

Implements `FormValueControl<string>` from `@angular/forms/signals`. Use the `[formField]` binding from the signal forms `FormField` directive for forms integration. Does **not** implement `ControlValueAccessor`.

#### Inputs

| Name              | Type                                                 | Default    | Description                                                                                                                                                                |
|-------------------|------------------------------------------------------|------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `class`           | `string`                                             | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                  |
| `clearButton`     | `boolean`                                            | `false`    | Displays a clear button that resets the value to empty. The button only appears when the value is non-empty.                                                               |
| `disabled`        | `boolean`                                            | `false`    | Renders the component with reduced visual emphasis and removes pointer interaction.                                                                                        |
| `inputAttributes` | `Record<string, unknown>`                            | `{}`       | Additional HTML attributes applied directly to the inner `<input>` element. Use for `aria-label`, `aria-labelledby`, `autocomplete`, `min`, `max`, `pattern`, and similar. |
| `inputClass`      | `string \| string[]`                                 | `''`       | Additional CSS classes applied to the inner `<input>` element.                                                                                                             |
| `inputStyle`      | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`     | Inline styles applied to the inner `<input>` element.                                                                                                                      |
| `invalid`         | `boolean`                                            | `false`    | Marks the text box as invalid. When using `[formField]`, the `FormField` directive writes this automatically.                                                              |
| `placeholder`     | `string`                                             | `''`       | Placeholder text shown when no value has been entered.                                                                                                                     |
| `readonly`        | `boolean`                                            | `false`    | Prevents value changes while preserving the component's visual state.                                                                                                      |
| `required`        | `boolean`                                            | `false`    | Marks the text box as required. Triggers the invalid state when the value is empty and `touched` is `true`.                                                                |
| `rounded`         | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the component.                                                                                                                             |
| `size`            | `'small' \| 'medium' \| 'large'`                     | `'medium'` | Size preset controlling the component's dimensions.                                                                                                                        |
| `touched`         | `boolean`                                            | `false`    | Sets the touched state. When using `[formField]`, the `FormField` directive writes this automatically.                                                                     |
| `type`            | `'email' \| 'password' \| 'text'`                    | `'text'`   | Sets the `type` attribute of the inner `<input>` element.                                                                                                                  |
| `value`           | `string`                                             | `''`       | Two-way bindable current value of the text box.                                                                                                                            |

#### Outputs

| Name         | Type         | Description                                                                                                                                             |
|--------------|--------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `inputBlur`  | `FocusEvent` | Emitted when the inner input loses focus.                                                                                                               |
| `inputFocus` | `FocusEvent` | Emitted when the inner input gains focus.                                                                                                               |
| `touch`      | `void`       | Emitted when the text box is interacted with — on blur, value change, or clear. The `FormField` directive listens to this to mark the field as touched. |

#### Public methods

| Name      | Signature  | Description                                                                     |
|-----------|------------|---------------------------------------------------------------------------------|
| `focus()` | `(): void` | Programmatically focuses the inner input and scrolls to the end of its content. |

---

### `TextBoxPrefixTemplateDirective`

**Selector:** `ng-template[monaTextBoxPrefixTemplate]`

Marks an `<ng-template>` as a prefix slot. The template is rendered inside the container's left side. Multiple prefix templates are supported and render in source order.

---

### `TextBoxSuffixTemplateDirective`

**Selector:** `ng-template[monaTextBoxSuffixTemplate]`

Marks an `<ng-template>` as a suffix slot. The template is rendered inside the container's right side, after the optional clear button. Multiple suffix templates are supported and render in source order.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] ControlValueAccessor claim removed — TextBoxComponent implements FormValueControl<string> only
- [x] [(ngModel)], [formControl], formControlName examples removed (not supported by this component)
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
