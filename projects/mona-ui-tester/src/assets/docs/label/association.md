## Association Modes

A `<label>` can be connected to a form control in three ways:

1. **Wrapping:** place the control inside `<mona-label>` and set `text`.
2. **`[for]` with a reference:** bind `for` to the control's template reference.
3. **`for` with a string:** pass the id of a native input.

What works depends on the control. See [which controls take what](#which-controls-take-what).

### Wrapping

Place the control inside `<mona-label>` and set `text`. The control takes its name from that caption.

```html
<mona-label text="Notifications">
    <mona-switch [(checked)]="enabled"></mona-switch>
</mona-label>
```

**`text` is required for a wrapped control to be named.** Only the `text` input can name it: text you project next to the control can't be referenced without pulling in the control's own content. A wrapped control with no `text` and no `for` stays unnamed, and `mona-label` warns in development. The one exception is a control with a native input, which the browser also names from the whole label. Set `text` there too. When `optional` is set, the optional text is part of the caption, so it's part of the name.

A click on the caption focuses or activates the control. A click on the control itself is left to the control.

`label[monaLabel]` has no wrapping contract, only `for`. A control with no native input inside it isn't named or activated.

### `[for]` with a reference

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

### `for` with a string

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

## Which controls take what

| Control                                                                                                    | Wrapped, with `text`                              | `[for]="ref"`                 | `for="id"`                    |
|------------------------------------------------------------------------------------------------------------|---------------------------------------------------|-------------------------------|-------------------------------|
| Native inputs: `monaTextBox`, `monaTextArea`, your own `<input>`                                           | Named by the browser. A click focuses.            | Focus only, not named         | Yes, on the `id`              |
| `mona-text-box`, `mona-otp-input`                                                                          | Named. A click focuses.                           | Named. A click focuses.       | Yes, on `inputId`             |
| `mona-check-box`, `mona-radio-button`                                                                      | Don't wrap: they render their own `<label>`       | Named. A click activates.     | Yes, on `inputId`             |
| `mona-switch`                                                                                              | Named. A click toggles.                           | Named. A click toggles.       | No, warns in development      |
| `mona-slider`, `mona-range-slider`, `mona-rating`, `mona-segmented`, `mona-radio-group`, `mona-button-group`, `mona-color-palette`, `mona-color-picker`, `mona-color-gradient` | Named. A click focuses. | Named. A click focuses. | No, warns in development |
| Other controls, such as `mona-dropdown-list`                                                               | Not connected, unless they hold a native input    | Focus only, not named         | Only on a native input's `id` |

## Checkbox and radio-button compatibility

Do not wrap `CheckBoxComponent` or `RadioButtonComponent` in `<mona-label>`, and do not apply `monaLabel` to their internal markup. Both components already render their own native `<label>` around their native input, and a `<label>` must not contain another `<label>` — nesting them produces invalid HTML. Use their built-in `label` input, or `[for]` from a label outside them:

```html
<mona-check-box label="Remember me"></mona-check-box>

<mona-radio-button label="Option A"></mona-radio-button>
```
