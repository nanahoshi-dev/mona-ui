# Mona UI Forms

This guide covers what the form controls have in common: binding them to a form, naming them, and the states they share. Each control's own page has its inputs and limits.

The controls covered here are check box, radio button and radio group, switch, text area, text box, OTP input, rating, slider and range slider, segmented, color palette, color picker and color gradient.

---

## 1. Binding to a Form

The controls implement Angular's `FormValueControl` or `FormCheckboxControl`, so `[formField]` from `@angular/forms/signals` reads and writes their value and hands them their state.

```typescript
import { Component, signal } from "@angular/core";
import { form, FormField, required } from "@angular/forms/signals";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { SwitchComponent } from "@nanahoshi/mona-ui/switch";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-profile",
    imports: [FormField, LabelComponent, SwitchComponent, TextBoxComponent],
    template: `
        <mona-label text="Name">
            <mona-text-box [formField]="profile.name"></mona-text-box>
        </mona-label>
        <mona-label text="Send me updates">
            <mona-switch [formField]="profile.updates"></mona-switch>
        </mona-label>
    `
})
export class ProfileComponent {
    protected readonly model = signal({ name: "", updates: false });
    protected readonly profile = form(this.model, path => {
        required(path.name);
    });
}
```

Without a form, use the control's two-way binding: `[(value)]`, or `[(checked)]` on a check box or switch.

`[ngModel]`, `[formControl]` and `formControlName` work too. These controls have no `ControlValueAccessor`, but Angular binds their `value` or `checked` and their `touch` directly when there isn't one. Prefer `[formField]`, which also hands them `disabled`, `readonly`, `required` and validation state.

---

## 2. Naming a Control

Every control needs a name that assistive technology can read. There are four ways to give one.

**Wrap it in a label.** The label's `text` names the control, and a click on it reaches the control. Only `text` can do this, because text projected next to the control can't be referenced without pulling in the control's own content. A wrapped control with no `text` warns in development.

```html
<mona-label text="Volume">
    <mona-slider [(value)]="volume"></mona-slider>
</mona-label>
```

**Point a label at it with `[for]` and a reference.** Use this when the label and the control can't be nested.

```html
<mona-label text="Volume" [for]="volumeSlider"></mona-label>
<mona-slider #volumeSlider [(value)]="volume"></mona-slider>
```

**Point a label at a native input with `for` and an id.** A string only works for an element that has that id and can be labelled. On a component's host it can't work, so it warns in development. Use `[for]` with a reference, or `inputId` where the control has one.

```html
<mona-label text="Email" for="email"></mona-label> <mona-text-box inputId="email" [(value)]="email"></mona-text-box>
```

**Name it directly.** Use `aria-label` when there's no visible label, or `aria-labelledby` for one you've written yourself.

If more than one applies, an explicit `aria-labelledby` wins, and then `aria-label`, which turns off any label.

### Which control takes what

| Control               | Wrap in `mona-label` | `[for]="ref"` | `aria-label`, `aria-labelledby` | `inputId` | Its own `label` |
| --------------------- | -------------------- | ------------- | ------------------------------- | --------- | --------------- |
| `mona-check-box`      | No                   | Yes           | Yes                             | Yes       | Yes             |
| `mona-radio-button`   | No                   | Yes           | Yes                             | Yes       | Yes             |
| `mona-radio-group`    | Yes                  | Yes           | Yes                             | No        | No              |
| `mona-switch`         | Yes                  | Yes           | Yes                             | No        | No              |
| `mona-text-box`       | Yes                  | Yes           | Yes                             | Yes       | No              |
| `mona-otp-input`      | Yes                  | Yes           | Yes                             | Yes       | No              |
| `mona-rating`         | Yes                  | Yes           | Yes                             | No        | Yes             |
| `mona-slider`         | Yes                  | Yes           | Yes                             | No        | No              |
| `mona-range-slider`   | Yes                  | Yes           | Yes                             | No        | No              |
| `mona-segmented`      | Yes                  | Yes           | Yes                             | No        | No              |
| `mona-color-palette`  | Yes                  | Yes           | Yes                             | No        | No              |
| `mona-color-picker`   | Yes                  | Yes           | Yes                             | No        | No              |
| `mona-color-gradient` | Yes                  | Yes           | Yes                             | No        | No              |

A check box and a radio button render their own `<label>`, and its text has to stay their name, so a wrapping `mona-label` doesn't name them. Use their `label` input, or `[for]` from outside.

A text area is a directive on a native `<textarea>`, so a label's `for` and an `id` work as they do for any native element.

Dropdowns, date pickers and the numeric text box have their own pages, and their `[for]` moves focus to them. See each one for how to name it.

---

## 3. Shared States

| State      | What it does                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------- |
| `disabled` | Removes the control from the tab order and stops changes.                                      |
| `readonly` | The control keeps focus and shows its value, but the value can't change.                       |
| `required` | Tells assistive technology and validation, where the control's role allows it.                 |
| `invalid`  | Shows an error once `touched` is also true, so a field isn't red before anyone has reached it. |
| `touched`  | Set by a form when the control is left. `(touch)` reports that moment.                         |

`[formField]` sets all of these from the form. Set by hand, they work without one.

`touch` fires when focus leaves the control, so moving between a group's own parts doesn't count as leaving.

Some controls can't offer everything:

- **Range slider:** no `required`, because `aria-required` isn't allowed on role `slider`. Its value also can't take `min` and `max` from a form rule, since those are typed for a single number.
- **Switch, rating, sliders, color picker and color gradient:** no `name`, since they have no native input to give it to.
- **Check box and radio button directives:** `input[monaCheckbox]` and `input[monaRadioButton]` have no `readonly`, because native check boxes and radios ignore it.
- **Rating:** `required` shows the error state at `0` once touched, but the signal forms `required` rule doesn't treat `0` as empty. To fail the form, use `min(path, 1)`.

---

## 4. Disabling a Section

`mona-fieldset` with `disabled` disables the controls inside it. Native controls follow the browser's rule, and the controls above follow through a shared token, which also reaches text box, dropdowns and date pickers.

Three things it doesn't do:

- Controls in the fieldset's first legend stay enabled for the native rule, but not for the token, which doesn't exempt them.
- The token doesn't reach through a plain native `<fieldset disabled>`. Only `mona-fieldset` provides it.
- The fields stay enabled in the form model, so a disabled section is still validated and submitted. Use the form's `disabled()` rule to change that.

---

## 5. Focusing the First Invalid Field

Each control has a public `focus()`, so `field().focusBoundControl()` from signal forms moves focus to it.

---

## 6. Radio Groups

Use `mona-radio-group`. It gives the radios a shared name, a shared value, arrow keys and one Tab stop, and it holds `required` and the group's name.

```html
<mona-label text="Delivery">
    <mona-radio-group [formField]="order.delivery">
        <mona-radio-button radioValue="standard" label="Standard"></mona-radio-button>
        <mona-radio-button radioValue="express" label="Express"></mona-radio-button>
    </mona-radio-group>
</mona-label>
```

A radio with its own `[formField]` inside a group isn't supported, since the group's value wins. Standalone radios still work without a group, as long as they share a `name` and a value.

To choose among a few options with a button look, use `mona-segmented`. `mona-button-group` is a toggle group, not a radio group: it has `aria-pressed` and Tab, not arrow keys.
