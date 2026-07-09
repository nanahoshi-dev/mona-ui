## Overview

`TextBoxDirective` styles a native `<input>` element using Mona UI theme tokens. Because it applies directly to the native element, all browser defaults — keyboard interaction, form submission, `type`, `required`, `disabled` — remain fully intact.

**Use `TextBoxDirective` when:**

- You need to compose the input inside your own `<label>` or form layout
- You are already providing a native `<input>` and need Mona UI styling without extra wrapper markup
- You need native input types beyond `text | email | password` (e.g., `number`, `date`, `file`)
- You need attributes available natively on `<input>` (`autocomplete`, `min`, `max`, `pattern`, etc.)

**Use `TextBoxComponent` (`mona-text-box`) instead when:**

- You want a ready-made wrapper with prefix/suffix templates or a clear button
- You need `disabled`, `readonly`, or `placeholder` managed through Angular inputs
- You prefer Angular forms integration with a managed `value` model

## Import & Basic Usage

```typescript
import { TextBoxDirective } from "@nanahoshi/mona-ui";
```

Add `TextBoxDirective` to your standalone component's `imports` array.

**Minimal usage:**

```html
<label for="name">Name</label>
<input id="name" type="text" monaTextBox />
```

Always pair `monaTextBox` with an accessible label — either a `<label for>`, or `aria-label` / `aria-labelledby` on the `<input>` itself. The directive does not add any label mechanism.

**With Angular forms:**

```html
<label for="email">Email</label>
<input id="email" type="email" monaTextBox [(ngModel)]="email" />
```

**Size and rounding:**

```html
<input type="text" monaTextBox [size]="'large'" [rounded]="'full'" />
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

| State           | Appearance                                                                                 |
|-----------------|--------------------------------------------------------------------------------------------|
| Default         | Mona UI themed border and background                                                       |
| Focused         | Focus ring visible for keyboard-initiated focus                                            |
| Disabled        | Reduced visual emphasis; pointer interaction removed. Use the native `disabled` attribute. |
| Invalid (forms) | Error-colored border when the input is touched and invalid                                 |

### Custom classes

Use the `class` input to extend styles. Classes are merged predictably, so Tailwind utility conflicts resolve in favor of the consumer's classes:

```html
<input type="text" monaTextBox class="w-full" />
```

## Accessibility Notes

The directive applies to a native `<input>` element, so browser keyboard interaction, tab order, and form semantics are preserved by default.

The directive does not add an accessible name. The consumer must provide one using one of the following:

- A `<label for="id">` element linked to the input via `id`
- An `aria-label` attribute directly on the `<input>` element
- An `aria-labelledby` attribute pointing to an external label element

The focus ring appears only for keyboard-initiated focus, matching browser `focus-visible` behavior.

## API

### `TextBoxDirective`

**Selector:** `input[monaTextBox]`

#### Inputs

| Name      | Type                                                 | Default    | Description                                                               |
|-----------|------------------------------------------------------|------------|---------------------------------------------------------------------------|
| `class`   | `string`                                             | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `rounded` | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the component.                            |
| `size`    | `'small' \| 'medium' \| 'large'`                     | `'medium'` | Size preset controlling the component's dimensions.                       |

`TextBoxDirective` has no outputs. Listen to native events (`(focus)`, `(blur)`, `(change)`, `(input)`) directly on the host element.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] API table columns match required format: Name, Type, Default, Description (no Kind, no Required)
- [x] Visual states updated: Disabled now uses native :disabled (not data-[disabled='true']), Focused reflects focus-visible behavior
- [x] Tailwind class names removed from visual states and rounded preset tables
- [x] Accessibility Notes section added: native <input> semantics preserved, consumer label responsibility stated
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->
