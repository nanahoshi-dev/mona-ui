# Mona UI Text Boxes

`@nanahoshi/mona-ui/text-box` exports two ways to style a single-line text input:

- `<mona-text-box>` (`TextBoxComponent`) wraps an `<input>` in a field that can hold a clear button and prefix or suffix content. It's a form control: it works with `[formField]`, `ngModel` and `formControl`.
- `input[monaTextBox]` (`TextBoxDirective`) styles a native `<input>` you write yourself. Use it when you need full control over the element, for example inside your own composite control. combo-box, auto-complete and numeric-text-box use it.

Both share the same sizes (`small`, `medium`, `large`) and corner presets (`none`, `small`, `medium`, `large`, `full`).

---

## 1. Basic Usage

```typescript
import { Component, signal } from '@angular/core';
import { LabelComponent } from '@nanahoshi/mona-ui/label';
import { TextBoxComponent } from '@nanahoshi/mona-ui/text-box';

@Component({
    selector: 'app-profile',
    imports: [LabelComponent, TextBoxComponent],
    template: `
        <mona-label for="profile-name" text="Name"></mona-label>
        <mona-text-box inputId="profile-name" [(value)]="name" clearButton></mona-text-box>
    `
})
export class ProfileComponent {
    protected readonly name = signal('');
}
```

- `value` is a two-way `model()`. `(valueChange)` fires on every keystroke.
- `type` takes `"text"` (the default), `"email"`, `"password"`, `"search"`, `"tel"` or `"url"`. Use `@nanahoshi/mona-ui/numeric-text-box` for numbers.
- `clearButton`, `disabled`, `readonly` and `required` accept the bare attribute form (`<mona-text-box disabled>`) as well as bindings.
- `class` is merged onto the field through `tailwind-merge`. `inputClass` and `inputStyle` go to the inner `<input>`.

---

## 2. Labelling

The element that takes focus is the inner `<input>`, not `<mona-text-box>`. A custom element can't be the target of a `<label>`, so `<mona-text-box id="name">` with `<label for="name">` names nothing. Use one of these instead:

- **A visible label (preferred):** set `inputId` and point `<label for>` or `<mona-label for>` at it. Without `inputId`, the input gets a generated id.
- **Wrapping:** `<mona-label text="Name"><mona-text-box></mona-text-box></mona-label>`. A label names the input inside it.
- **`aria-labelledby`:** the id of an element on the page whose text names the field.
- **`aria-label`:** when there's no visible text, for example a search field with only an icon.

Use `aria-describedby` for hints and error messages. All three ARIA inputs are applied to the inner input. The placeholder isn't a label: it disappears as soon as the user types.

```html
<mona-label for="email" text="Email"></mona-label>
<mona-text-box inputId="email" type="email" aria-describedby="email-hint"></mona-text-box>
<p id="email-hint">We'll only use it to send receipts.</p>
```

---

## 3. Forms

`TextBoxComponent` implements Angular's `FormValueControl<string>`, so you bind it the same way as a native input.

```typescript
import { form, FormField, maxLength, required } from '@angular/forms/signals';

@Component({
    imports: [FormField, TextBoxComponent],
    template: `<mona-text-box inputId="postcode" [formField]="address.postcode"></mona-text-box>`
})
export class AddressComponent {
    readonly #model = signal({ postcode: '' });
    protected readonly address = form(this.#model, schema => {
        required(schema.postcode);
        maxLength(schema.postcode, 8);
    });
}
```

- `[formField]` writes `disabled`, `readonly`, `required`, `invalid`, `touched`, `name`, `maxLength` and `minLength`. Don't bind those yourself on the same element.
- `name`, `maxLength` and `minLength` end up as attributes on the inner input. A `maxLength` rule stops typing at the limit, and `name` helps browsers and password managers autofill the field.
- `[(ngModel)]` and `[formControl]` work too, through Angular's support for signal-based custom controls. No `ControlValueAccessor` is involved.
- The field is marked **touched when focus leaves the text box**, as with a native input. Moving to the clear button or to prefix or suffix content doesn't count. Typing doesn't mark it touched, so an error gated on `touched` doesn't appear while the user is still typing, and `debounce('blur')` rules wait for the blur.
- The invalid look (and `aria-invalid`) appears only once the field is touched: when `invalid` is set, or when `required` is set and the value is empty.

Without a form directive, bind the same inputs directly: `[required]`, `[invalid]`, `[touched]`, and listen to `(touch)` to learn when the user left the field.

---

## 4. Clear Button

`clearButton` shows a button that empties the value and returns focus to the input. It's shown only while the value isn't empty, and never on a disabled or read-only text box. It's a 24 × 24 px target, and its label comes from the `textBox.clear` message ("Clear" in English), so it follows the active locale.

---

## 5. Prefix and Suffix

Put content inside the field, before or after the input, with `monaTextBoxPrefixTemplate` and `monaTextBoxSuffixTemplate`. The suffix comes after the clear button.

```html
<mona-text-box inputId="site" type="url" aria-describedby="site-hint">
    <ng-template monaTextBoxPrefixTemplate>
        <span class="ps-2 text-muted-foreground">https://</span>
    </ng-template>
    <ng-template monaTextBoxSuffixTemplate>
        <button monaButton look="ghost" size="small" type="button" (click)="check()">Check</button>
    </ng-template>
</mona-text-box>
```

Decorative icons in a prefix should be `aria-hidden="true"`. Buttons in a suffix need an accessible name.

---

## 6. Focus and Events

- `focus(options?)` focuses the inner input and puts the caret after the value, so the end of a long value is in view. It passes `options` (for example `{ preventScroll: true }`) to the native call. Signal forms call it when you focus a field.
- `(inputFocus)` and `(inputBlur)` report focus on the inner input itself. `(inputBlur)` also fires when focus moves to the clear button or to affix content. Use `(touch)` to know when the user left the whole text box.
- `inputAttributes` sets any other attribute on the inner input, such as `autocomplete`, `inputmode` or `spellcheck`. Values set there win over the component's own bindings, so prefer the dedicated inputs where one exists.

---

## 7. `monaTextBox`

```html
<label for="city">City</label>
<input id="city" monaTextBox size="small" [formField]="address.city" />
```

The directive only styles the element. It takes `size`, `rounded`, `class`, and `invalid` and `touched`, which drive the error look and `aria-invalid` (shown when both are true). `[formField]` on the same input writes those two for you. Everything else is the native input's own behavior, so label it and set `type`, `name` or `maxlength` as you would on any `<input>`.
