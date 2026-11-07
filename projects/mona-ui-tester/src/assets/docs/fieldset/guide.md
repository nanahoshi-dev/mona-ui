## Overview

`FieldsetComponent` renders a styled native `<fieldset>` element. The component provides Mona UI theming for the border and legend notch without replacing the underlying HTML semantics — screen readers still announce the legend as the accessible group label for all form controls projected inside.

The legend is hidden entirely when neither `legend` nor `monaFieldsetLegendTemplate` is provided, avoiding an empty `<legend>` element in the DOM.

**Use `FieldsetComponent` when you need to:**

- Group related form controls (inputs, checkboxes, radios) under a shared visible label
- Communicate to assistive technology that a set of fields belongs together
- Add a bordered, themed container around a form section

**Do not use `FieldsetComponent` when:**

- The grouping is purely visual with no form controls — a plain `<div>` or a card component is more appropriate; `<fieldset>` carries form semantics AT will announce

## Import & Basic Usage

```typescript
import { FieldsetComponent } from "@nanahoshi/mona-ui/fieldset";
```

Add `FieldsetComponent` to your standalone component's `imports` array.

**Basic usage with a string legend:**

```html
<mona-fieldset legend="Personal information">
    <div class="p-4 flex flex-col gap-3">
        <input monaTextBox placeholder="First name" aria-label="First name" />
        <input monaTextBox placeholder="Last name" aria-label="Last name" />
    </div>
</mona-fieldset>
```

> **Accessibility note:** Provide `legend` or `monaFieldsetLegendTemplate`. Without a legend, name the group with `aria-label` or `aria-labelledby`. A `<fieldset>` with no name offers no benefit over a plain `<div>`.

## Examples

### Custom legend

`monaFieldsetLegendTemplate` replaces the string legend with any content. The legend's own surface, border and padding aren't applied to a template, so style it yourself.

```example
fieldset/legend-template
```

### Disabling a section

`disabled` disables the controls inside it. The switch stays outside the fieldset, so it stays enabled. "Disabled state" below lists which controls follow it and its limits.

```example
fieldset/disabled
```

## Appearance & Styling

### Rounded presets

| `rounded` | Shape                  |
|-----------|------------------------|
| `none`    | Square corners         |
| `small`   | `rounded-sm`           |
| `medium`  | `rounded-md` (default) |
| `large`   | `rounded-lg`           |
| `full`    | `rounded-full`         |

The `rounded` value applies to both the fieldset border and the legend notch, keeping them visually aligned.

### Legend styling

When a plain `legend` string is supplied, the legend notch has a raised surface background, a border, and padding. When `monaFieldsetLegendTemplate` is used, none of that is applied — the consumer controls the appearance entirely.

### Custom class

Pass additional classes via the `class` attribute; they are merged onto the rendered `<fieldset>` element via `tailwind-merge`, so they can override the default border, background, or rounding:

```html
<mona-fieldset legend="Preferences" class="border-primary"></mona-fieldset>
```

### Disabled state

Set `disabled` to disable the rendered `<fieldset>`, to apply the disabled colors, and to disable the controls inside it.

It reaches controls in two ways:

- **Native controls** are disabled by the browser, because the rendered `<fieldset>` has the native `disabled` attribute. This covers `monaTextBox`, `monaTextArea`, `monaCheckbox`, `monaRadioButton` and any other native input, select, textarea or button.
- **Mona UI controls** read the state of the enclosing `mona-fieldset`, at any depth, including nested fieldsets: auto complete, button group, calendar, check box, color gradient, color palette, color picker, combo box, date picker, date-time picker, dropdown list, editor, multi-select, numeric text box, OTP input, radio button, radio group, rating, segmented, slider, range slider, switch, text box, time picker and time selector.

It has these limits:

- **Other controls:** chip, tree view and the list controls (list box, list view) don't read it. Disable those yourself.
- **A nested fieldset** shows the disabled colors under a disabled parent, as well as disabling its controls.
- **The form model:** a signal form field inside stays enabled in the form model, so its validation keeps running. Use the signal forms `disabled` rule when the field itself should be disabled.
- **The first legend:** the browser leaves native controls in a fieldset's first `<legend>` enabled. Mona UI controls get no such exemption, so one in `monaFieldsetLegendTemplate` is disabled too.
- **A plain `<fieldset>`:** a native `<fieldset disabled>` you write yourself only reaches native controls. Mona UI controls that draw their own focusable element stay enabled inside it. Use `mona-fieldset` for those.
