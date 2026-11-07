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

### Wrapping a control

Wrapping is the preferred way. The `text` input names the wrapped control, and a click on the caption reaches it.

```example
label/wrapping
```

### Pointing at a control

Use `for` when the label and the control can't be nested. A string `for` works for a native input with that `id`. For a component, bind `[for]` to a template reference. `label[monaLabel]` takes `for` the same way.

```example
label/for
```

### Optional fields

`optional` adds text after the caption. It reads "Optional" unless you set `optionalText`.

```example
label/optional
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
