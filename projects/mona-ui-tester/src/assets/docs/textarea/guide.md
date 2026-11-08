## Overview

Apply `monaTextArea` directly to a `<textarea>` element. The directive adds a consistent border, background, focus ring, and validation state visuals without wrapping the element or altering its native behavior.

Use `TextAreaDirective` when you need a styled multi-line input and want full control over the `<textarea>`'s attributes, dimensions, and form binding.

## Import & Quick Start

```typescript
import { TextAreaDirective } from "@nanahoshi/mona-ui/text-area";
```

Add the imported symbol to your standalone component's `imports` array.

**Basic usage:**

```html
<textarea monaTextArea rows="4" placeholder="Enter description..."></textarea>
```

## Examples

### Labels and size

The directive doesn't constrain dimensions. Apply CSS or Tailwind utilities directly on the element. For a read-only text area, use the native `readonly` attribute, or the signal forms `readonly` rule with `[formField]`. The directive has no input for it. A read-only text area only changes its cursor. It looks otherwise the same, and stays focusable and selectable.

```example
textarea/basic
```

### Signal forms

`TextAreaDirective` works with Angular signal forms. Bind `[formField]` to a signal form field, and the `FormField` directive writes `invalid` and `touched` into the directive.

```example
textarea/forms
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

| State     | Appearance                                           |
|-----------|------------------------------------------------------|
| Default   | Mona UI themed border and background                 |
| Focused   | Focus border and ring                                |
| Disabled  | Disabled colors; pointer interaction removed         |
| Read-only | Default cursor, otherwise unchanged                  |
| Invalid   | Error-colored border and ring                        |

The invalid state activates when both `invalid` and `touched` are `true`. When using `[formField]`, `FormField` writes these automatically. Without signal forms, set `invalid` and `touched` manually (e.g. from a `FormControl`'s status).

### Custom classes

Pass additional CSS classes via the `class` attribute. Classes are merged using `tailwind-merge`:

```html
<textarea monaTextArea class="w-full h-48 resize-y" rows="6"></textarea>
```

## Accessibility

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
