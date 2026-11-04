# Mona UI Numeric Text Boxes

Two components take a number typed in the user's locale, with spin buttons and the keyboard to step it:

| Component                | Entry point                           | Value                                  | Use it when                                                                                     |
| ------------------------ | ------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `<mona-numeric-text-box>` | `@nanahoshi/mona-ui/numeric-text-box` | `number \| null`                       | the value fits a JavaScript `number`: counts, measurements, percentages                          |
| `<mona-decimal-text-box>` | `@nanahoshi/mona-ui/numeric-text-box` | `string \| null` (`"-1234.5"`)         | the value must be exact beyond 15 digits: money, quantities with many digits, identifiers       |

Both are an `<input role="spinbutton">`, so their focus, label and state live on the inner input.

---

## 1. Basic Usage

```typescript
import { Component, signal } from "@angular/core";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";

@Component({
    selector: "app-order-line",
    imports: [LabelComponent, NumericTextBoxComponent],
    template: `
        <mona-label for="quantity" text="Quantity"></mona-label>
        <mona-numeric-text-box
            inputId="quantity"
            [minValue]="1"
            [maxValue]="99"
            [(value)]="quantity"></mona-numeric-text-box>
    `
})
export class OrderLineComponent {
    protected readonly quantity = signal<number | null>(1);
}
```

- `decimals` is how many fraction digits the user can type and how many are shown once the field loses focus (`0` by default, at most 20).
- `step` is how far the spin buttons and the arrow keys move the value (`1` by default).
- `minValue` and `maxValue` bound the value. Typed text can go outside them while the user is still typing; the value is brought back inside them when focus leaves the field. Spinning never leaves them.
- `nullable` (`true` by default) lets the field be empty. When it is `false`, leaving an empty field sets it to `minValue`, or to zero when there is no minimum (kept within `maxValue`).
- `formatter` replaces the text shown while the field isn't focused, for example to add a currency symbol. While editing, the plain number is shown.

### Decimals and rounding

The text shown when the field isn't focused is rounded to `decimals`, but the value isn't. A value of `1.75` set from code with `decimals` `0` shows "2" and stays `1.75`; `aria-valuenow` reports `1.75`. If the value itself must be rounded, round it before you set it, and use a `step` with no more fraction digits than `decimals`.

### The decimal text box

`<mona-decimal-text-box>` takes the same inputs. Its value, `minValue`, `maxValue` and `step` are decimal strings (numbers are accepted for the bounds and the step), and every step and comparison uses exact decimal arithmetic. The value is canonical: `.` as the separator, no grouping, no exponent, no leading zeros, no trailing fraction zeros.

---

## 2. Labelling

Set `inputId` and point `<label for>` or `<mona-label for>` at it. Without a visible label, use `aria-label`, or `aria-labelledby` with the id of the text that names the field.

```html
<mona-label for="price" text="Unit price"></mona-label>
<mona-decimal-text-box inputId="price" aria-describedby="price-hint" [decimals]="2"></mona-decimal-text-box>
<span id="price-hint">Before tax</span>
```

- `aria-describedby` links hints and error messages to the input.
- `placeholder` shows while the field is empty. It isn't a label: it disappears once there is a value.
- The spin buttons are labelled ("Increase value", "Decrease value", translated by the active locale) and left out of the tab order, since the arrow keys do the same.

---

## 3. Forms

Both components implement Angular's `FormValueControl`, so `[formField]` works directly. `[(ngModel)]` and `[formControl]` work too.

```typescript
import { form, FormField, max, min, required } from "@angular/forms/signals";

@Component({
    imports: [FormField, LabelComponent, NumericTextBoxComponent],
    template: `
        <mona-label for="age" text="Age"></mona-label>
        <mona-numeric-text-box inputId="age" [formField]="person.age"></mona-numeric-text-box>
    `
})
export class PersonComponent {
    readonly #model = signal<{ age: number | null }>({ age: null });
    protected readonly person = form(this.#model, schema => {
        required(schema.age);
        min(schema.age, 0);
        max(schema.age, 130);
    });
}
```

- `[formField]` writes `disabled`, `readonly`, `required`, `invalid` and `touched`. Don't bind those yourself on the same element.
- The field is marked **touched when focus leaves the component**, as with a native input. Typing, spinning and moving focus into a prefix template don't count, so an error gated on `touched` doesn't appear while the user is still typing.
- The value updates as the user types, as soon as the text is a complete number. Text that isn't one yet ("-", "1." or an empty field) keeps the previous value until it is, or until focus leaves the field.
- A value set from code (a form reset, a patch) is shown at once, even while the user is in the field.
- Boolean inputs accept the bare attribute form: `<mona-numeric-text-box required>`.
- `(inputBlur)` fires when focus leaves the component, after the value has been brought within the bounds.

---

## 4. Typing in the User's Locale

The decimal and group separators come from the active locale (`MonaI18nService`):

- The locale's decimal separator is typed as usual. The numpad decimal key types it too, whatever the keyboard layout.
- `.` or `,` is also accepted as the decimal separator when it isn't the locale's group separator.
- Grouped numbers can be pasted when the grouping matches the locale: "1,234.56" in en-US, "1.234,56" in de-DE. Other pastes that aren't a number are refused.
- Digits from other scripts (Arabic-Indic, Devanagari, full-width and others) are read as digits.
- Exponents ("1e5") and spaces are refused.
- When the locale changes, the text is shown again in the new locale.

The number text box refuses numbers a `number` can't hold exactly (more than 15 significant digits). Use the decimal text box for those.

---

## 5. Keyboard and Pointer

| Input                          | Action                                                              |
| ------------------------------ | ------------------------------------------------------------------- |
| <kbd>↑</kbd> / <kbd>↓</kbd>      | one step up / down                                                  |
| <kbd>Page Up</kbd> / <kbd>Page Down</kbd> | ten steps up / down                                      |
| <kbd>Home</kbd> / <kbd>End</kbd> | `minValue` / `maxValue`; without that bound, the caret moves as usual |
| spin buttons                   | one step; holding one repeats                                        |
| mouse wheel                    | one step, only while the field has focus                            |

- Spinning from an empty field starts at zero, kept within the bounds.
- The wheel is ignored on a field that doesn't have focus, so scrolling the page over a form doesn't change values. Horizontal scrolling and <kbd>Ctrl</kbd>+wheel (zoom) are left to the browser too.
- Keys pressed while an IME is composing are left to the IME.
- On a read-only field the value can be selected and copied but not changed, and the spin buttons are hidden.

---

## 6. Prefix Template and Focus

```html
<mona-numeric-text-box inputId="weight" [decimals]="1">
    <ng-template monaNumericTextBoxPrefixTemplate>
        <span aria-hidden="true">kg</span>
    </ng-template>
</mona-numeric-text-box>
```

- The prefix appears before the input. Text in it isn't part of the input's name: mention the unit in the label ("Weight (kg)") or hide decorative text with `aria-hidden="true"`.
- `focus(options?)` moves focus to the input, with the caret at the end. `options` go to the native call, for example `{ preventScroll: true }`.
- `increase()` and `decrease()` step the value and move focus to the input.
