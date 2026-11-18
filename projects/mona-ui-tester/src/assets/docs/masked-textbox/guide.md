## Overview

Use a masked text box when a value always has the same shape, and people copy it from somewhere else: a phone number in one country's format, a postal code, the expiry date on a card, a licence key. The mask shows the shape before they start, and fills in the separators so they only type what matters.

**Use a masked text box when you need to:**

- Take a value whose length and separators never change
- Show the format in the field itself, as people type
- Keep separators out of the value, or put them in, whichever way the user typed them

**Use something else when:**

- The format varies, such as phone numbers from any country, names or street addresses: use a [text box](/components/textbox) with a hint, and check the value with a validator. A mask that doesn't fit someone's real value stops them from entering it at all.
- The value is a date or a time: use the [date picker](/components/date-picker) or the [time picker](/components/time-picker), which follow the user's locale and offer a calendar or a list.
- The value is a number in a range: use the [numeric text box](/components/numeric-textbox).
- The value is a one-time code: use the [OTP input](/components/otp-input), which shows a box per character and works with autofill from text messages.

## Import & Quick Start

```typescript
import { MaskedTextBoxComponent } from "@nanahoshi/mona-ui/masked-text-box";
```

```html
<mona-form-field label="Phone" hint="10 digits, such as (555) 123-4567.">
    <mona-masked-text-box mask="(000) 000-0000" [(value)]="phone" />
</mona-form-field>
```

The value holds what's typed into the slots, `5551234567`. Set `includeLiterals` for `(555) 123-4567`.

## Anatomy

### Mask characters

| Character | Takes | Required |
|-----------|-------|----------|
| `0` | A digit | Yes |
| `9` | A digit | No |
| `#` | A digit, `+` or `-` | No |
| `L` | A letter | Yes |
| `?` | A letter | No |
| `A` | A letter or a digit | Yes |
| `a` | A letter or a digit | No |
| `&` | Any character but a space | Yes |
| `C` | Any character but a space | No |

Any other character is a literal, shown as it is and filled in as you type, such as the parentheses, space and dash of `(000) 000-0000`. A backslash makes a mask character a literal: `\#` is a hash sign. In a template that's `mask="\#HHHHHH"`, and in a TypeScript string the backslash needs escaping, `"\\#HHHHHH"`.

A letter is a letter of any script. Digits of any script, such as the Arabic-Indic `٣`, and the full-width digits and letters CJK input methods type, are kept as ASCII, so the value is `3`.

`rules` adds mask characters of your own, each a pattern one character must match, such as `{ H: /[0-9a-f]/i }` for a hexadecimal digit. A rule can replace a built-in one, and its slots are required.

### Parts

| Part | What it is |
|------|------------|
| Input | The native `<input>`. It holds what's typed and the literals up to it, and takes the id, the name, the description and `aria-invalid`. |
| The rest of the mask | Muted text after what's typed: the `prompt` character for each empty slot, and the literals between them. It's drawn behind the input and hidden from assistive technology. |
| Clear button | Shown with `clearButton` while there's a value. |
| Prefix and suffix | Content from `ng-template monaMaskedTextBoxPrefixTemplate` and `ng-template monaMaskedTextBoxSuffixTemplate`, such as a country code or a unit. |

## Examples

### A phone number

The value is the ten digits. `formatMaskedValue` formats a stored value with the same mask, for showing it elsewhere, such as in a table. The `autocomplete` token asks autofill for a number in the national format the mask takes.

```example
masked-textbox/phone
```

### Checking the value is complete

`isMaskComplete` tells a validator whether every required slot is filled, and the validator can check more, such as that the month is from 01 to 12. Once touched, the box shows as invalid while it's partly filled, and the form field shows the validator's message.

```example
masked-textbox/validation
```

### A format of your own

A rule for `H` takes a hexadecimal digit, and `\#` puts a literal hash sign first. With `includeLiterals`, the value is a CSS color, which the suffix shows once all six digits are in.

```example
masked-textbox/custom-rules
```

## Appearance & Styling

The masked text box has the sizes and corner roundings of the [text box](/components/textbox): `size` is `small`, `medium` (default) or `large`, and `rounded` is `none`, `small`, `medium` (default), `large` or `full`.

| Input | What it shows |
|-------|---------------|
| `prompt` | The character in each empty slot, `_` by default |
| `placeholder` | Text in place of the mask while the box is empty and doesn't have focus |
| `clearButton` | A button that empties the value |

The rest of the mask is drawn in the muted text color, and in forced colors in the system's gray text color. The field is always left to right, in a right-to-left page too, since phone numbers and codes read that way.

`class` is merged onto the box and `inputClass` onto the input, through `tailwind-merge`. The box fills its container, so set a width that fits the mask, such as `class="w-40"`.

## Behavior

### Typing and deleting

- A character goes into the slot at the caret, or the next one after the literals. A character the slot doesn't take is turned down, and a literal typed where the mask has it, such as a space or a dash, moves past it.
- Typing over a filled slot replaces it. Slots keep their places, so nothing moves along as you type or delete in the middle.
- Backspace empties the slot before the caret, past any literals, and Delete the slot after it. Deleting a word empties the group of slots between two literals.
- Pasted text is fitted in from the caret, skipping what doesn't fit, so `555.123.4567` and `555-123-4567` both fill `(000) 000-0000`.
- Cut copies the selection as it shows, then empties its slots.
- Undo and redo go through the box's own history, since the browser's would go back to text the box replaced. A run of typing undoes in one step.
- Text an input method composes, and text autofill writes, are fitted in once they're done.
- On touch devices, a mask of only digits brings up the number keyboard. An `inputmode` in `inputAttributes` replaces it.

### The value

- The value is the characters in the slots, up to the last one filled, with a space for an empty slot before it. With `includeLiterals`, it has the literals between them too: `(55 ) 123-4567` once the third digit is deleted. The literals at the end of a mask, such as ` kg` in `000 kg`, come along once its last slot is filled.
- A value set from outside that lines up with the mask fills the slots in place. One that doesn't, such as `555-123-4567` without `includeLiterals`, is fitted in as a paste would be and written back as it reads.
- An empty box's value is `""`. ngModel's first `null` reads as empty, and isn't written back.
- `focus()` puts the caret at the first empty slot.

## Forms Integration

The masked text box is a signal forms control: bind it with `[formField]`, and the form writes its disabled, read-only, required, invalid and touched states. `ngModel` and `formControl` work too.

The box doesn't add errors to the form. Once touched, it shows as invalid while it's partly filled, but a validator has to say so, to stop the form from submitting and to give a message. `isMaskComplete` takes the value, the mask and the box's `includeLiterals` and `rules`:

```typescript
const PHONE_MASK = "(000) 000-0000";

protected readonly contact = form(this.#model, path => {
    validate(path.phone, ({ value }) =>
        value() === "" || isMaskComplete(value(), PHONE_MASK)
            ? undefined
            : { kind: "mask", message: "Enter all 10 digits." }
    );
});
```

## Accessibility

- The input is a native text input. Name it with `mona-form-field`, a `mona-label` whose `for` points at it, or `aria-label`.
- Give the format in a hint, with an example, such as "10 digits, such as (555) 123-4567". The rest of the mask is hidden from assistive technology, so the hint is what tells screen reader users the format, and it helps everyone else too.
- Screen readers read what's typed and the literals up to it, not the prompts after it. A slot emptied in the middle reads as its prompt character.
- A character a slot turns down is announced politely with what the slot takes, such as "Only a digit fits here".
- Once touched, a partly filled box has `aria-invalid="true"`, and so does one the form marks invalid. Pair it with a message: the form field shows the validator's.
- In forced colors, the rest of the mask is drawn in the system's gray text color and the focus outline stays visible.
- Use a mask only for a format that really is fixed. One that doesn't fit someone's real value, such as a phone number from another country, leaves them no way to enter it.

| Key | Action |
|-----|--------|
| A character | Fills the slot at the caret, or is turned down |
| `Backspace` | Empties the slot before the caret |
| `Delete` | Empties the slot after the caret |
| `Ctrl` + `Backspace` / `Option` + `Backspace` | Empties the group of slots before the caret |
| `Ctrl` + `Z` / `Cmd` + `Z` | Undoes the last edit |
| `Ctrl` + `Y` / `Cmd` + `Shift` + `Z` | Redoes it |

The announcement and the clear button's name are in the `maskedTextBox` messages: `characterNotAllowed`, `clear`, `digitOnly`, `digitOrSignOnly`, `letterOnly` and `letterOrDigitOnly`.
