## Overview

Use a form field around each control of a form. It draws the label above or beside the control, a hint below it, and the control's errors under the hint, and it connects all three to the control for assistive technology. Bound to a signal form, it reads the errors and the `required` rule itself, so a field needs no `@if` blocks of its own.

It works with every Mona UI form control, and with a native `<input>`, `<select>` or `<textarea>`.

Use `mona-label` instead when a control only needs a caption, and `mona-fieldset` to group several fields under one legend. A form field holds one control: for a group of check boxes, use a fieldset.

## Import & Quick Start

```typescript
import { FormFieldComponent } from "@nanahoshi/mona-ui/form-field";
```

```html
<mona-form-field label="Email" hint="We send the confirmation here.">
    <mona-text-box [formField]="account.email"></mona-text-box>
</mona-form-field>
```

## Anatomy

```html
<mona-form-field label="…" hint="…" [error]="…">
    <ng-template monaFormFieldLabelTemplate>…</ng-template>
    <ng-template monaFormFieldHintTemplate>…</ng-template>
    <ng-template monaFormFieldErrorTemplate let-message let-error="error">…</ng-template>
    <!-- one control -->
</mona-form-field>
```

| Part | What it is |
| --- | --- |
| Label | A `<label>` with the `label` text or the label template, then the optional text or the required marker. It names the control. |
| Control | The projected control. |
| Hint | The `hint` text or the hint template. It describes the control. |
| Errors | The `error` text, then each error of the bound field, one per line. They describe the control while shown. |

The error template is rendered once for each error. Its `$implicit` is the message the field would show, and `error` is the validation error, or null for the `error` input.

## Examples

### Validation from a signal form

The field shows the errors of the control's `[formField]` once the control is touched, which happens when focus leaves it or when `submit()` marks the whole form. Each validator has a message in every built-in locale.

```example
form-field/signal-forms
```

### Hints and optional fields

`hint` describes the control. Use the hint template for content such as a link. `optional` adds text after the label, which reads "Optional" unless `optionalText` replaces it. A field shows a required marker when its form rule or its `required` input says so.

```example
form-field/hint-and-optional
```

### Label beside the control

With `orientation` set to `horizontal`, the label takes a column of its own and the hint and errors line up under the control. The `--mona-form-field-label-width` custom property sets that column, on the field or on any element around a set of fields.

```example
form-field/horizontal
```

### Your own error messages

A validator's `message` option wins over the built-in one. The error template changes how each error is drawn, here with an icon.

```example
form-field/custom-errors
```

### An error from a server

`error` shows text whether or not the control is touched, such as an answer from a server. Set the control's `invalid` and `touched` too, so it draws its error state.

```example
form-field/server-error
```

### Other controls

The field names and describes any Mona UI control, and a native `<input>`, `<select>` or `<textarea>`. A click on the label focuses the control, or toggles a switch, as a native label does.

```example
form-field/other-controls
```

## Appearance & Styling

- **Spacing:** the label, hint and errors are spaced with margins, so the error row takes no room while it's empty.
- **Width:** the field is a grid that fills its container, and the control keeps its own width inside it. Text boxes and pickers fill the field; a dropdown list or a native `<textarea>` is as wide as its content, so give it `class="w-full"` to fill the field. Set the field's own width with `class`.
- **Label column:** in horizontal fields, the label column is `10rem` unless `--mona-form-field-label-width` says otherwise. The label is centered on the control's first row.
- **Colors:** the hint uses `muted-foreground` and the errors and the required marker use `error`. Both read at 4.5:1 or more on the background in every built-in theme.
- **`class`** is merged onto the host with `tailwind-merge`.

## Behavior

### Where the errors come from

- **A bound signal form field:** the field finds the first `[formField]` inside it. Its errors show once it's touched, and its `required` rule shows the required marker.
- **The `error` input:** its text shows at once, before the field's own errors. It doesn't change the control, so set the control's `invalid` and `touched` as well.
- With neither, the field shows no errors. Reactive forms and `ngModel` take the `error` input.

### Messages

A validator's `message` option always wins. Otherwise the message comes from the `formField` messages of the locale: `required`, `email`, `pattern`, `min`, `max`, `minLength`, `maxLength`, `minDate` and `maxDate` have their own, and any other kind, such as a custom validator without a message or a parse error, gets `invalid`. Dates are written in the locale's long format. Change any of them with `provideMonaI18n`, like the other messages.

### One control per field

The first control inside the field takes the label and the description. Composite controls, such as a date picker, a color picker or a dropdown with a filter, keep them for themselves: the inputs inside their popups have names of their own. A radio group takes them, not its radios, and a check box keeps its own label as its name while the field describes it.

### Native controls

A native `<input>`, `<select>` or `<textarea>` has no Mona UI code to read the field, so the field sets its `aria-labelledby`, `aria-describedby` and, while an error shows, `aria-invalid`. It adds its ids after the element's own and removes only what it added. An element with its own `aria-label` or `aria-labelledby` keeps its name.

## Forms Integration

Bind the control, not the field:

```html
<mona-form-field label="Quantity">
    <mona-numeric-text-box [formField]="order.quantity"></mona-numeric-text-box>
</mona-form-field>
```

The field reads the binding's `touched()`, `required()` and errors, and the control reads the rest of its state from the same binding, as described in [Forms](/components/forms). `field().focusBoundControl()` still moves focus to the control, so focusing the first invalid field works as before.

## Accessibility

- The label is a native `<label>`. The control is named by it through `aria-labelledby`, so the name is the label text and the optional text, without the required marker, which is `aria-hidden`. The control's own `aria-required` says it's required.
- The hint and the shown errors describe the control through `aria-describedby`, after any ids the control already has. The errors sit in a polite live region that stays in the page, so a new error is announced once.
- A control's own `aria-label` or `aria-labelledby` wins over the label, as everywhere in Mona UI.
- A click on the label focuses the control, or activates it the way a native label would: it toggles a switch.
- Keep interactive elements out of the label template, since the label is the control's name. A link belongs in the hint.
- The field adds no keyboard handling of its own and no tab stop.
