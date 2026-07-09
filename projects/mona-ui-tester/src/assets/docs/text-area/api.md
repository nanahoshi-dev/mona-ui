## Overview

Apply `monaTextArea` directly to a `<textarea>` element. The directive adds a consistent border, background, focus ring, and validation state visuals without wrapping the element or altering its native behavior.

Use `TextAreaDirective` when you need a styled multi-line input and want full control over the `<textarea>`'s attributes, dimensions, and form binding.

## Import & Basic Usage

```typescript
import { TextAreaDirective } from "@nanahoshi/mona-ui";
```

Add the imported symbol to your standalone component's `imports` array.

**Basic usage:**

```html
<textarea monaTextArea rows="4" placeholder="Enter description..."></textarea>
```

**Controlling size:**

The directive does not constrain dimensions. Apply CSS or Tailwind utilities directly on the element:

```html
<textarea monaTextArea class="w-full h-32 resize-none" rows="4"></textarea>
```

**Signal forms integration:**

`TextAreaDirective` works with Angular signal forms. Bind `[formField]` to a signal form field — the `FormField` directive automatically writes `invalid` and `touched` into the directive:

```typescript
import { form, FormField } from "@angular/forms/signals";

protected readonly myForm = form({ notes: "" });
```

```html
<textarea
    monaTextArea
    [formField]="myForm.notes"
    rows="4">
</textarea>
```

**Angular Reactive Forms:**

When used with Angular Reactive Forms (`formControl`, `formControlName`, or `ngModel`), the invalid border and ring activate automatically based on the native Angular form validation state, without setting `invalid` or `touched` manually.

```html
<textarea monaTextArea [formControl]="notesControl" rows="4"></textarea>
```

## Appearance & Styling

### `rounded` presets

| `rounded` | Shape                       |
|-----------|-----------------------------|
| `none`    | No rounding                 |
| `small`   | Slight rounding             |
| `medium`  | Moderate rounding (default) |
| `large`   | Strong rounding             |

### Visual states

| State    | Appearance                                                 |
|----------|------------------------------------------------------------|
| Default  | Mona UI themed border and background                       |
| Focused  | Visible focus ring using the primary color (keyboard only) |
| Disabled | Reduced visual emphasis; pointer interaction removed       |
| Invalid  | Error-colored border and ring                              |

The invalid state activates when both `invalid` and `touched` are `true`. When using `[formField]`, `FormField` writes these automatically. When using Angular Reactive Forms without signal forms, the invalid styling is applied automatically based on Angular's validation class state.

### Custom classes

Pass additional CSS classes via the `class` attribute. Classes are merged using `tailwind-merge`:

```html
<textarea monaTextArea class="w-full h-48 resize-y" rows="6"></textarea>
```

## Accessibility Notes

The directive sets `aria-invalid="true"` on the host element when both `invalid` and `touched` are `true`.

The directive does not manage an accessible name. Associate a label using one of these patterns:

```html
<!-- Implicit label -->
<label>
    Notes
    <textarea monaTextArea rows="4"></textarea>
</label>

<!-- Explicit label -->
<label for="notes-field">Notes</label>
<textarea id="notes-field" monaTextArea rows="4"></textarea>
```

| Attribute      | When present                                 | Value    |
|----------------|----------------------------------------------|----------|
| `aria-invalid` | When both `invalid` and `touched` are `true` | `"true"` |

**Consumer responsibilities:**

- Provide an accessible name via a `<label>` element (`for`/`id` association or wrapping), `aria-label`, or `aria-labelledby` on the `<textarea>`.

## API

### `TextAreaDirective`

**Selector:** `textarea[monaTextArea]`

#### Inputs

| Name      | Type                                       | Default    | Description                                                                                                                                                               |
|-----------|--------------------------------------------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `class`   | `string`                                   | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                 |
| `invalid` | `boolean`                                  | `false`    | Marks the textarea as invalid, triggering error border and ring styling. When using `[formField]`, `FormField` writes this automatically.                                 |
| `rounded` | `'large' \| 'medium' \| 'none' \| 'small'` | `'medium'` | Border-radius preset applied to the component.                                                                                                                            |
| `touched` | `boolean`                                  | `false`    | Marks the textarea as touched. Error styling is only shown when both `invalid` and `touched` are `true`. When using `[formField]`, `FormField` writes this automatically. |

`TextAreaDirective` has no outputs. All native `<textarea>` events (`input`, `change`, `blur`, `focus`, etc.) are available directly on the host element.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] `class` alias used in API table (not internal name `userClass`)
- [x] Signal forms ([formField]) documented with demo evidence
- [x] Angular Reactive Forms validation state documented (ng-touched ng-invalid)
- [x] aria-invalid documented — set when invalid && touched
- [x] No unexported types exposed in API table
- [x] No internal Tailwind class names in styling section
- [x] Accessibility consumer responsibilities stated explicitly
- [x] No Outputs table (directive has no outputs)
- [x] API table rows sorted A→Z
- [x] focus-visible behavior noted correctly (keyboard-only focus ring)
- [x] Disabled state noted (CSS only, via native disabled attribute)
- [x] No ControlValueAccessor claim
-->
