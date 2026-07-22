## Overview

`LabelComponent` renders a styled native `<label>` element with an optional caption and optional-field text, wrapping any projected control. `LabelDirective` applies the same typography and colors directly to a native `<label>` you write yourself, without managing its content.

```typescript
import {
    LabelComponent,
    LabelDirective,
    type LabelTarget
} from "@nanahoshi/mona-ui/label";
```

## `LabelComponent`

**Selector:** `mona-label`

| Name           | Type          | Default      | Description                                                                                                    |
|----------------|---------------|--------------|------------------------------------------------------------------------------------------------------------------|
| `class`        | `string`      | `''`         | Additional CSS classes merged onto the rendered `<label>` element via `tailwind-merge`.                          |
| `for`          | `LabelTarget` | `undefined`  | Associates the label with a native control ID or a target that exposes a public `focus()` method.               |
| `optional`     | `boolean`     | `false`      | Whether to display optional-field text next to the caption.                                                      |
| `optionalText` | `string`      | `'Optional'` | Text displayed when `optional` is enabled.                                                                       |
| `text`         | `string`      | `''`         | Visible label caption text.                                                                                      |

`LabelComponent` has no model inputs and no event outputs.

**Wrapped control (preferred):**

```html
<mona-label text="Email address">
    <mona-text-box [(value)]="email"></mona-text-box>
</mona-label>
```

**Native `for`/`id` association:**

```html
<mona-label text="Email address" for="email"></mona-label>
<input id="email" monaTextBox />
```

**Component-reference focus delegation:**

```html
<mona-label text="Email address" [for]="textBox"></mona-label>
<mona-text-box #textBox></mona-text-box>
```

**Optional field:**

```html
<mona-label text="Company" optional optionalText="Optional">
    <mona-text-box></mona-text-box>
</mona-label>
```

## `LabelDirective`

**Selector:** `label[monaLabel]`

| Name    | Type          | Default     | Description                                                                          |
|---------|---------------|-------------|----------------------------------------------------------------------------------------|
| `class` | `string`      | `''`        | Additional CSS classes merged onto the native label element via `tailwind-merge`.       |
| `for`   | `LabelTarget` | `undefined` | Associates the label with a native control ID or a target that exposes a public `focus()` method. |

`LabelDirective` has no model inputs and no event outputs. It never inserts or rewrites the label's content — write the caption, and any optional-field text, directly inside the `<label>`:

```html
<label monaLabel for="email">
    Email address
    <span class="text-muted-foreground">(Optional)</span>
</label>
<input id="email" monaTextBox />
```

The directive selector is deliberately scoped to `label[monaLabel]` rather than every `label[for]` — it only affects a `<label>` that explicitly carries the `monaLabel` attribute, so importing it never changes the behavior of other native labels in your application.

## `LabelTarget`

```typescript
interface LabelFocusable {
    focus(options?: FocusOptions): void;
}

type LabelTarget = string | LabelFocusable | null | undefined;
```

- A `string` is reflected as the native `for` attribute; the browser owns focus and click activation.
- An object exposing a public `focus()` method — including a native `HTMLElement` or a Mona UI component reference — receives focus when the label is clicked. No `for` attribute is rendered for these targets.
- `null` and `undefined` are ignored: no `for` attribute is rendered and clicking the label does nothing.

## Accessibility

- Both APIs render a real native `<label>` — no ARIA `role` is added, and none is needed.
- Component-reference focus delegation (a `for` value with a `focus()` method) only delegates focus on click. It does **not** automatically give the target control an accessible name, unlike native `for`/`id` association or wrapping, both of which the browser and assistive technology understand natively. Prefer those two modes; when you must use focus delegation, ensure the target control independently has a correct `aria-label` or `aria-labelledby`.
- `LabelComponent` never reads a projected control's `required` state and never renders a required asterisk — pair it with your own validation messaging if needed.
- Do not wrap `CheckBoxComponent` or `RadioButtonComponent` in `<mona-label>`; both already render their own native `<label>`, and nesting `<label>` elements is invalid HTML. Use their built-in `label` input instead.

## Styling

Both the component and the directive expose a `class` input merged onto the rendered `<label>` via `tailwind-merge`, so consumer Tailwind classes can override the default typography:

```html
<mona-label text="Email" class="text-primary"></mona-label>
<label monaLabel class="text-primary">Email</label>
```

## Out of scope

- Floating labels (`FloatingLabel`).
- Form-field containers, hint/help/validation/error-message components.
- Automatically reading a control's `required` state or rendering a required asterisk.
- Automatically generating IDs for controls or assigning `aria-labelledby` on arbitrary custom components.

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source (label.component.ts, label.directive.ts, LabelTarget.ts)
- [x] No ElementRef exposed in the public LabelTarget API
- [x] No FloatingLabel or form-field behavior documented as implemented
- [x] Checkbox/radio-button nested-label incompatibility documented
-->
