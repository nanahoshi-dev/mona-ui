## Association Modes

A `<label>` can be connected to a form control in three ways. Prefer them in this order:

1. **Native wrapping** or **native `for`/`id`** — both are understood natively by every browser and screen reader with no JavaScript involved.
2. **Component-reference focus delegation** — only when neither of the above is possible.

### 1. Native `for`/`id`

Pass a string to `for` and the same string as the target control's native `id`. The label reflects it as a real `for` attribute; the browser handles focus and click activation.

```html
<mona-label text="Email" for="email"></mona-label>
<input id="email" monaTextBox />
```

```html
<label monaLabel for="email">Email</label>
<input id="email" monaTextBox />
```

Neither API calls `document.getElementById` or generates IDs on your behalf — you own the ID.

### 2. Native wrapping

Place the control inside `<mona-label>`. No `for` attribute is rendered; the browser locates the descendant labelable control itself. This is the preferred way to label components such as `TextBoxComponent`, whose internal native `<input>` is a descendant of the rendered label.

```html
<mona-label text="Email">
    <mona-text-box></mona-text-box>
</mona-label>
```

### 3. Component-reference focus delegation

Pass a component reference that exposes a public `focus()` method (or a native element reference) to `for`. On click, the label calls `target.focus()`.

```html
<mona-label text="Email" [for]="textBox"></mona-label>
<mona-text-box #textBox></mona-text-box>
```

```html
<label monaLabel [for]="textBox">Email</label>
<mona-text-box #textBox></mona-text-box>
```

> **Accessibility limitation:** this delegates focus only — it does not give the target control an accessible name the way native `for`/`id` or wrapping does. Prefer those two modes whenever possible. If you must use component-reference delegation, make sure the target control independently has a correct `aria-label` or `aria-labelledby`.

## Checkbox and radio-button compatibility

Do not wrap `CheckBoxComponent` or `RadioButtonComponent` in `<mona-label>`, and do not apply `monaLabel` to their internal markup. Both components already render their own native `<label>` around their native input, and a `<label>` must not contain another `<label>` — nesting them produces invalid HTML. Use their built-in `label` input instead:

```html
<mona-check-box label="Remember me"></mona-check-box>

<mona-radio-button label="Option A"></mona-radio-button>
```
