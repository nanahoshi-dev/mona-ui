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
import { TextBoxDirective } from "@mirei/mona-ui";
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

| `rounded` | Shape                      |
|-----------|----------------------------|
| `none`    | No rounding                |
| `small`   | `rounded-sm`               |
| `medium`  | `rounded-md` (default)     |
| `large`   | `rounded-lg`               |
| `full`    | `rounded-full` + `px-4`    |

### `size` presets

| `size`   | Height | Font size        |
|----------|--------|------------------|
| `small`  | `h-8`  | `text-xs`        |
| `medium` | `h-9`  | `text-sm` (default) |
| `large`  | `h-10` | `text-md`        |

### Visual states

| State           | Applied styles                                              |
|-----------------|-------------------------------------------------------------|
| Default         | `bg-input-background border-input-border`                   |
| Focused         | `ring-2 ring-primary/40` + `border-primary`                 |
| Disabled        | `opacity-50 pointer-events-none cursor-not-allowed`         |
| Invalid (forms) | `border-error ring-error/40` when `ng-touched ng-invalid`   |

### Custom classes

Use the `class` input to extend styles. Classes are merged via `tailwind-merge`, so Tailwind utility conflicts resolve predictably:

```html
<input type="text" monaTextBox class="w-full" />
```

## API

### `TextBoxDirective`

**Selector:** `input[monaTextBox]`

| Name      | Kind  | Type                                                    | Default    | Required | Description |
|-----------|-------|---------------------------------------------------------|------------|----------|-------------|
| `class`   | input | `string`                                                | `''`       | Optional | Additional CSS classes merged onto the input element via `tailwind-merge`. |
| `rounded` | input | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'`   | `'medium'` | Optional | Border-radius preset for the input. |
| `size`    | input | `'small' \| 'medium' \| 'large'`                        | `'medium'` | Optional | Size preset controlling height and font size. |

`TextBoxDirective` has no outputs. Listen to native events (`(focus)`, `(blur)`, `(change)`, `(input)`) directly on the host element.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] userClass @description and @default added to source
- [x] standalone: true removed from prefix/suffix template directives (CLAUDE.md compliance)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->
