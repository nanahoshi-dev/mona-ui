## Overview

`TextBoxComponent` wraps a native `<input>` in a styled container element. It exposes prefix and suffix template slots for decorating the input (search icons, unit labels, dropdown buttons), an optional clear button, and full Angular forms support via `ControlValueAccessor`.

Choose `TextBoxComponent` over `TextBoxDirective` when you need:

- An optional clear button to reset the value
- Prefix or suffix decorators rendered inside the input boundary
- Angular forms integration with `[(value)]`, `ngModel`, `formControl`, or `formControlName`
- A `readonly` state independent of `disabled`

For a plain `<input>` with Mona UI styling and no wrapper element, use `TextBoxDirective` (`input[monaTextBox]`) instead.

## Import & Basic Usage

```typescript
import { TextBoxComponent } from "@mirei/mona-ui";
// For template slots:
import { TextBoxPrefixTemplateDirective, TextBoxSuffixTemplateDirective } from "@mirei/mona-ui";
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

**Forms integration — Template-driven:**

```html

<mona-text-box [(ngModel)]="username" placeholder="Username"></mona-text-box>
```

**Forms integration — Reactive:**

```html

<mona-text-box [formControl]="usernameControl" placeholder="Username"></mona-text-box>
```

**Prefix slot (icon on the left):**

```html

<mona-text-box placeholder="Search">
    <ng-template monaTextBoxPrefixTemplate>
        <svg lucideSearch class="pl-1" [size]="16"></svg>
    </ng-template>
</mona-text-box>
```

**Suffix slot (action button on the right):**

```html

<mona-text-box placeholder="Enter value">
    <ng-template monaTextBoxSuffixTemplate>
        <button (click)="submit()">Go</button>
    </ng-template>
</mona-text-box>
```

Multiple prefix and suffix templates are supported; they render in source order.

## Appearance & Styling

### `rounded` presets

| `rounded` | Shape                  |
|-----------|------------------------|
| `none`    | No rounding            |
| `small`   | `rounded-sm`           |
| `medium`  | `rounded-md` (default) |
| `large`   | `rounded-lg`           |
| `full`    | `rounded-full`         |

### `size` presets

| `size`   | Height | Font size           |
|----------|--------|---------------------|
| `small`  | `h-8`  | `text-xs`           |
| `medium` | `h-9`  | `text-sm` (default) |
| `large`  | `h-10` | `text-md`           |

### Visual states

| State           | Applied styles                                                 |
|-----------------|----------------------------------------------------------------|
| Default         | `bg-input-background border-input-border`                      |
| Focused         | `ring-2 ring-primary/40` + `border-primary` (on container)     |
| Disabled        | `opacity-50 pointer-events-none cursor-not-allowed`            |
| Readonly        | `data-readonly="true"` on host; inner `<input>` has `readonly` |
| Invalid (forms) | `border-error ring-error/40` when `ng-touched ng-invalid`      |

### Accessible labels

The component renders an inner `<input>` inside the host element. Use `inputAttributes` to forward `aria-label` or `aria-labelledby` to the inner input:

```html

<mona-text-box [inputAttributes]="{ 'aria-label': 'Search products' }"></mona-text-box>
```

### Custom classes

Use `class` to extend the outer container, `inputClass` to target only the inner `<input>`, and `inputStyle` for inline styles on the inner `<input>`:

```html

<mona-text-box class="w-full" [inputClass]="'text-right'" [inputStyle]="{ fontFamily: 'monospace' }">
</mona-text-box>
```

## API

### `TextBoxComponent`

**Selector:** `mona-text-box`

Implements `ControlValueAccessor`. Bind via `ngModel`, `formControl`, or `formControlName`. Also implements `FormValueControl<string>` for signal-based forms integration.

| Name              | Kind   | Type                                                 | Default    | Required | Description                                                                                                                                                    |
|-------------------|--------|------------------------------------------------------|------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `class`           | input  | `string`                                             | `''`       | Optional | Additional CSS classes merged onto the container element via `tailwind-merge`.                                                                                 |
| `clearButton`     | input  | `boolean`                                            | `false`    | Optional | Displays a button to clear the input value. The button only appears when the value is non-empty.                                                               |
| `disabled`        | input  | `boolean`                                            | `false`    | Optional | Disables the text box. Applies `opacity-50` and removes pointer interaction.                                                                                   |
| `inputAttributes` | input  | `Record<string, unknown>`                            | `{}`       | Optional | Arbitrary attributes forwarded to the inner `<input>` element. Use for `aria-label`, `aria-describedby`, `autocomplete`, `min`, `max`, `pattern`, and similar. |
| `inputClass`      | input  | `string \| string[]`                                 | `''`       | Optional | Additional CSS classes applied to the inner `<input>` element only.                                                                                            |
| `inputStyle`      | input  | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`     | Optional | Inline styles applied to the inner `<input>` element only.                                                                                                     |
| `placeholder`     | input  | `string`                                             | `''`       | Optional | Placeholder text for the inner input.                                                                                                                          |
| `readonly`        | input  | `boolean`                                            | `false`    | Optional | Sets the inner input to read-only. The text box remains focusable and the value is selectable.                                                                 |
| `required`        | input  | `boolean`                                            | `false`    | Optional | Sets the `required` attribute on the inner input.                                                                                                              |
| `rounded`         | input  | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Optional | Border-radius preset for the container.                                                                                                                        |
| `size`            | input  | `'small' \| 'medium' \| 'large'`                     | `'medium'` | Optional | Size preset controlling container height and font size.                                                                                                        |
| `type`            | input  | `'email' \| 'password' \| 'text'`                    | `'text'`   | Optional | `type` attribute forwarded to the inner `<input>`.                                                                                                             |
| `value`           | model  | `string`                                             | `''`       | Optional | Two-way bindable input value. When used with Angular forms, the form control drives this value through `ControlValueAccessor`.                                 |
| `inputBlur`       | output | `FocusEvent`                                         | —          | Optional | Emitted when the inner input loses focus.                                                                                                                      |
| `inputFocus`      | output | `FocusEvent`                                         | —          | Optional | Emitted when the inner input gains focus.                                                                                                                      |

#### Public methods

| Name      | Signature  | Description                                                                     |
|-----------|------------|---------------------------------------------------------------------------------|
| `focus()` | `(): void` | Programmatically focuses the inner input and scrolls to the end of its content. |

---

### `TextBoxPrefixTemplateDirective`

**Selector:** `ng-template[monaTextBoxPrefixTemplate]`

Marks an `<ng-template>` as a prefix slot. The template content is rendered in a `<span>` to the left of the inner input. Multiple prefix templates are supported and render in source order.

---

### `TextBoxSuffixTemplateDirective`

**Selector:** `ng-template[monaTextBoxSuffixTemplate]`

Marks an `<ng-template>` as a suffix slot. The template content is rendered in a `<span>` to the right of the inner input (and after the optional clear button). Multiple suffix templates are supported and render in source order.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] userClass @description and @default added to source
- [x] value is a model — confirmed from source (model(""))
- [x] clearButton only visible when value is non-empty — confirmed from template
- [x] inputAttributes is Record<string, unknown> (AttributeConfig = Record<string, unknown>)
- [x] FormValueControl<string> confirmed from component implements clause
- [x] focus() confirmed as a public method in source
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): AttributeConfig (= Record<string, unknown>) is not exported from the public API, yet it is the type of the public inputAttributes input -->
