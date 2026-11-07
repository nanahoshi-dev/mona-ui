## Overview

`LabelComponent` renders a styled native `<label>` element with an optional caption and optional-field text, wrapping any projected control. `LabelDirective` applies the same typography and colors directly to a native `<label>` you write yourself, without managing its content.

### Out of scope

- Floating labels (`FloatingLabel`).
- Form-field containers, hint/help/validation/error-message components.
- Automatically reading a control's `required` state or rendering a required asterisk.
- Automatically generating IDs for controls, or naming custom components that don't support it.

A label that animates into a placeholder position is a separate feature that isn't implemented yet. `LabelComponent` and `LabelDirective` only render static, always-visible captions.

## Import & Quick Start

```typescript
import {
    LabelComponent,
    LabelDirective,
    type LabelTarget
} from "@nanahoshi/mona-ui/label";
```

### `LabelComponent` vs `LabelDirective`

Use `LabelComponent` (`mona-label`) when you want Mona UI's standard label layout, a caption placed above a projected control, and optional-field text:

```html
<mona-label text="Email address">
    <mona-text-box [(value)]="email"></mona-text-box>
</mona-label>
```

Use `LabelDirective` (`label[monaLabel]`) when you want a plain native `<label>` element with full control over its markup, styled with Mona UI typography and colors:

```html
<label monaLabel [for]="textBox">Email address</label>
<mona-text-box #textBox></mona-text-box>
```

The directive is opt-in. It only activates on a `<label>` that carries the `monaLabel` attribute, so importing it never changes the behavior of ordinary native labels elsewhere in your app.

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

Both APIs can indicate that a field is optional. `LabelComponent` renders this text automatically:

```html
<mona-label text="Company" optional>
    <mona-text-box></mona-text-box>
</mona-label>
```

`LabelDirective` does not manage caption content, so write the optional text directly:

```html
<label monaLabel for="company">
    Company
    <span class="text-muted-foreground">(Optional)</span>
</label>
```

## Appearance & Styling

Both the component and the directive expose a `class` input merged onto the rendered `<label>` via `tailwind-merge`, so consumer Tailwind classes can override the default typography:

```html
<mona-label text="Email" class="text-primary"></mona-label>
<label monaLabel class="text-primary">Email</label>
```

## Behavior

- It never inserts or rewrites the label's content. Write the caption, and any optional-field text, directly inside the `<label>`.

### Association Modes

A `<label>` can be connected to a form control in three ways:

1. **Wrapping:** place the control inside `<mona-label>` and set `text`.
2. **`[for]` with a reference:** bind `for` to the control's template reference.
3. **`for` with a string:** pass the id of a native input.

What works depends on the control. See [which controls take what](#which-controls-take-what).

#### Wrapping

Place the control inside `<mona-label>` and set `text`. The control takes its name from that caption.

```html
<mona-label text="Notifications">
    <mona-switch [(checked)]="enabled"></mona-switch>
</mona-label>
```

**`text` is required for a wrapped control to be named.** Only the `text` input can name it: text you project next to the control can't be referenced without pulling in the control's own content. A wrapped control with no `text` and no `for` stays unnamed, and `mona-label` warns in development. The one exception is a control with a native input, which the browser also names from the whole label. Set `text` there too. When `optional` is set, the optional text is part of the caption, so it's part of the name.

A click on the caption focuses or activates the control. A click on the control itself is left to the control.

`label[monaLabel]` has no wrapping contract, only `for`. A control with no native input inside it isn't named or activated.

#### `[for]` with a reference

Bind `for` to a template reference of the control. It works on `mona-label` and on `label[monaLabel]`.

```html
<mona-label text="Notifications" [for]="notifications"></mona-label>
<mona-switch #notifications [(checked)]="enabled"></mona-switch>
```

```html
<label monaLabel [for]="notifications">Notifications</label>
<mona-switch #notifications [(checked)]="enabled"></mona-switch>
```

Controls that support it take their name from the label, and a click activates or focuses them. Any other target with a public `focus()` method, such as a native element, only receives focus on click. It isn't named, so give it its own `aria-label` or `aria-labelledby`.

#### `for` with a string

Pass a string to `for` and the same string as the `id` of a native input. The label reflects it as a real `for` attribute; the browser handles the name, focus and click activation.

```html
<mona-label text="Email" for="email"></mona-label>
<input id="email" monaTextBox />
```

```html
<label monaLabel for="email">Email</label>
<input id="email" monaTextBox />
```

You own the ID. For a component that renders its own native input, point `for` at its `inputId` input.

A string `for` can't work on a component's host element, because a host such as `mona-switch` isn't something a `<label>` can control. The control stays unnamed, and the label warns in development. Use `[for]="ref"` or `inputId` instead.

### Which controls take what

| Control                                                                                                    | Wrapped, with `text`                              | `[for]="ref"`                 | `for="id"`                    |
|------------------------------------------------------------------------------------------------------------|---------------------------------------------------|-------------------------------|-------------------------------|
| Native inputs: `monaTextBox`, `monaTextArea`, your own `<input>`                                           | Named by the browser. A click focuses.            | Focus only, not named         | Yes, on the `id`              |
| `mona-text-box`, `mona-otp-input`                                                                          | Named. A click focuses.                           | Named. A click focuses.       | Yes, on `inputId`             |
| `mona-check-box`, `mona-radio-button`                                                                      | Don't wrap: they render their own `<label>`       | Named. A click activates.     | Yes, on `inputId`             |
| `mona-switch`                                                                                              | Named. A click toggles.                           | Named. A click toggles.       | No, warns in development      |
| `mona-slider`, `mona-range-slider`, `mona-rating`, `mona-segmented`, `mona-radio-group`, `mona-button-group`, `mona-color-palette`, `mona-color-picker`, `mona-color-gradient` | Named. A click focuses. | Named. A click focuses. | No, warns in development |
| Other controls, such as `mona-dropdown-list`                                                               | Not connected, unless they hold a native input    | Focus only, not named         | Only on a native input's `id` |

### Checkbox and radio-button compatibility

Do not wrap `CheckBoxComponent` or `RadioButtonComponent` in `<mona-label>`, and do not apply `monaLabel` to their internal markup. Both components already render their own native `<label>` around their native input, and a `<label>` must not contain another `<label>` — nesting them produces invalid HTML. Use their built-in `label` input, or `[for]` from a label outside them:

```html
<mona-check-box label="Remember me"></mona-check-box>

<mona-radio-button label="Option A"></mona-radio-button>
```

## Accessibility

- Both APIs render a real native `<label>` — no ARIA `role` is added, and none is needed.
- A wrapped control is named by the `text` input or its own `aria-label` or `aria-labelledby`. Text projected next to it can't name it, and `mona-label` warns in development if nothing else does.
- A reference in `for` names the control only if the control supports it. Other targets, such as a native element reference or `mona-dropdown-list`, only receive focus on click, so give them their own `aria-label` or `aria-labelledby`.
- `LabelComponent` never reads a projected control's `required` state and never renders a required asterisk — pair it with your own validation messaging if needed.
- Do not wrap `CheckBoxComponent` or `RadioButtonComponent` in `<mona-label>`; both already render their own native `<label>`, and nesting `<label>` elements is invalid HTML. Use their built-in `label` input, or `[for]="ref"` from outside.
