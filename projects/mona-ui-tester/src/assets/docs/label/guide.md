## Overview

`LabelComponent` renders a styled native `<label>` element with an optional caption and optional-field text, wrapping any projected control. `LabelDirective` applies the same typography and colors directly to a native `<label>` you write yourself, without managing its content.

```typescript
import {
    LabelComponent,
    LabelDirective,
    type LabelTarget
} from "@nanahoshi/mona-ui/label";
```

## Examples

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

**Component reference:**

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

## Behavior

- It never inserts or rewrites the label's content — write the caption, and any optional-field text, directly inside the `<label>`:

## Accessibility

- Both APIs render a real native `<label>` — no ARIA `role` is added, and none is needed.
- A wrapped control is named by the `text` input or its own `aria-label` or `aria-labelledby`. Text projected next to it can't name it, and `mona-label` warns in development if nothing else does.
- A reference in `for` names the control only if the control supports it. Other targets, such as a native element reference or `mona-dropdown-list`, only receive focus on click, so give them their own `aria-label` or `aria-labelledby`.
- `LabelComponent` never reads a projected control's `required` state and never renders a required asterisk — pair it with your own validation messaging if needed.
- Do not wrap `CheckBoxComponent` or `RadioButtonComponent` in `<mona-label>`; both already render their own native `<label>`, and nesting `<label>` elements is invalid HTML. Use their built-in `label` input, or `[for]="ref"` from outside.

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
- Automatically generating IDs for controls, or naming custom components that don't support it.
