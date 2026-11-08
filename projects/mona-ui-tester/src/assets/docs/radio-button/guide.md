## Overview

### `RadioButtonComponent`

`RadioButtonComponent` renders a custom-styled radio button inside a managed `<label>` wrapper. It implements `FormValueControl` from `@angular/forms/signals`, and doesn't implement `ControlValueAccessor`. Bind it with `[formField]`, `[(value)]` or `[ngModel]`. To group radio buttons as one control, put them in a `mona-radio-group`.

It has two label modes:
- **`label` input** — text is passed as a string and rendered in a `<span>`.
- **Projected content** — any markup projected inside `<mona-radio-button>` is used when `label` is empty.

When both are absent the radio button has no accessible name, and nothing warns about it. Provide `label`, projected content, `aria-label` or `aria-labelledby`.

**Use `RadioButtonComponent` when:**

- You need a self-contained control that handles label placement, disabled state, and form binding without any extra markup
- You want `before` / `after` label positioning or label-size variants without writing custom CSS

### `RadioGroupComponent`

`RadioGroupComponent` (`mona-radio-group`) holds one value for the `mona-radio-button` elements inside it. It has role `radiogroup`, gives the radio buttons one `name`, and takes `[formField]`, so you don't repeat those on each radio button. Radio buttons outside a group work as before.

### `RadioButtonDirective`

`RadioButtonDirective` applies Mona UI's radio button visual style to a native `<input type="radio">`. It does **not** manage a label — the consumer is responsible for label placement, form binding, and accessibility markup. It adds no ARIA role, because the native input already has role `radio`.

**Use `RadioButtonDirective` when:**

- You need full control over layout, label markup, or DOM structure
- You are integrating into an existing form where the `<input>` and `<label>` are already structured
- You want the Mona UI visual style without the component's label management

### Choosing Between Component and Directive

|                 | `RadioButtonComponent`                   | `RadioButtonDirective`                 |
|-----------------|------------------------------------------|----------------------------------------|
| Selector        | `mona-radio-button`                      | `input[type='radio'][monaRadioButton]` |
| Label managed   | Yes (`label` input + content projection) | No — consumer provides `<label>`       |
| Forms           | `[formField]`, `[ngModel]`, `[(value)]`  | Angular's native radio support         |
| Read-only       | `readonly` input                         | Not available                          |
| Label position  | `labelPosition` input                    | Consumer controls layout               |
| Label size      | `labelSize` input                        | Consumer controls font                 |
| DOM control     | Minimal                                  | Full                                   |
| Accessible name | Via `label` or projected content         | Via explicit `<label>` element         |

## Import & Quick Start

### Radio button

```typescript
import { RadioButtonComponent } from "@nanahoshi/mona-ui/radio-button";
```

**Minimal group with `ngModel`:**

```html
<mona-radio-button name="size" radioValue="S" label="Small"
    [ngModel]="selectedSize()" (ngModelChange)="selectedSize.set($event)">
</mona-radio-button>
<mona-radio-button name="size" radioValue="M" label="Medium"
    [ngModel]="selectedSize()" (ngModelChange)="selectedSize.set($event)">
</mona-radio-button>
<mona-radio-button name="size" radioValue="L" label="Large"
    [ngModel]="selectedSize()" (ngModelChange)="selectedSize.set($event)">
</mona-radio-button>
```

**With signal forms (`FormField` directive):**

```html
<mona-radio-button radioValue="S" label="Small" [formField]="sizeField">
</mona-radio-button>
<mona-radio-button radioValue="M" label="Medium" [formField]="sizeField">
</mona-radio-button>
<mona-radio-button radioValue="L" label="Large" [formField]="sizeField">
</mona-radio-button>
```

**Projected label** (when the label requires custom markup):

```html
<mona-radio-button name="theme" radioValue="dark"
    [ngModel]="selectedTheme()" (ngModelChange)="selectedTheme.set($event)">
    <span class="font-bold text-slate-900">Dark</span>
</mona-radio-button>
```

**Label before the circle:**

```html
<mona-radio-button name="plan" radioValue="pro" label="Pro" labelPosition="before">
</mona-radio-button>
```

### Radio group

```typescript
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
```

Put `[formField]` on the group. A radio button with `[formField]` inside a group isn't supported: the group's value wins.

### Native input directive

```typescript
import { RadioButtonDirective } from "@nanahoshi/mona-ui/radio-button";
```

Pair each input with a `<label>` for accessibility. The `<label>` must either wrap the input or reference it via `for`/`id`.

**With border radius:**

```html
<label class="flex items-center gap-2">
    <input type="radio" monaRadioButton [rounded]="'medium'" name="shape" value="square" />
    <span>Square</span>
</label>
```

**Reactive Forms:**

```html
<label class="flex items-center gap-2">
    <input type="radio" monaRadioButton name="tier" value="pro" [formControl]="tierControl" />
    <span>Pro</span>
</label>
```

## Examples

### A radio group

The group gives its radio buttons one name and one value. A `mona-label` names it through `[for]`. A disabled radio button shows, but can't be chosen.

```example
radio-button/group
```

### Signal forms

Put `[formField]` on the group, not on its radio buttons. The signal forms `required` rule fails until one is chosen.

```example
radio-button/forms
```

### The directive

The directive styles a native `<input type="radio">`, and the consumer provides the label and the group's `name`.

```example
radio-button/directive
```

## Appearance & Styling

### Component variants

| Variant | Input | Options | Default |
|---------|-------|---------|---------|
| Border radius | `rounded` | `'full'` · `'large'` · `'medium'` · `'small'` · `'none'` | `'full'` |
| Label size | `labelSize` | `'small'` · `'medium'` · `'large'` | `'medium'` |
| Label side | `labelPosition` | `'after'` · `'before'` | `'after'` |

Pass additional Tailwind classes via the `class` attribute to style the `<label>` wrapper:

```html
<mona-radio-button name="x" radioValue="1" label="Option" class="gap-3 p-2">
</mona-radio-button>
```

### Directive variants

| Variant       | Input     | Options                                                  | Default  |
|---------------|-----------|----------------------------------------------------------|----------|
| Border radius | `rounded` | `'full'` · `'large'` · `'medium'` · `'small'` · `'none'` | `'full'` |

The directive applies styles directly to the `<input>` element's `class` attribute. Additional classes can be added directly to the `<input>` element.

**Form validation state:** Set `invalid` and `touched` on the directive (e.g. from a `FormControl`'s status) to apply the error styling and `aria-invalid`.

## Behavior

### Read-only

`readonly` keeps the radio button focusable and cancels the selection, so clicks and arrow keys restore the previously checked radio. It's shown with `data-readonly` only, because `aria-readonly` isn't allowed on role `radio`. A `mona-radio-group` sets `aria-readonly` on the group.

**Read-only:** the directive has no `readonly` input, and the HTML `readonly` attribute has no effect on a native radio button.

### Radio groups

- **Name:** a group needs an accessible name from `aria-label`, `aria-labelledby` or a `mona-label`. It warns in development when it has none. Inside a `mona-label` with `text`, a click on the caption focuses the selected radio button, or the first enabled one.
- **Invalid:** `aria-invalid` is on the group, once `touched` and `invalid` are both `true`. The radio buttons only paint it.
- **Touched:** `touch` emits on selection and when focus leaves the group. Moving focus between its radio buttons doesn't count.
- **Disabled, read-only and required:** each applies to every radio button in the group. A radio button's own `disabled`, `readonly` and `required` still work next to it.
- **Read-only:** selection is canceled as on a single radio button, and the group gets `aria-readonly="true"`.

## Forms Integration

`RadioButtonComponent` implements `FormValueControl`, not `ControlValueAccessor`. `[ngModel]` works because Angular binds it to the `value` model of a custom control. Each radio button holds the group's selected value in `value`, and `radioValue` identifies which one is selected when the two match.

```typescript
protected readonly selectedSize = signal<string>("M");
```

```html
<mona-radio-button name="size" radioValue="S" label="S"
    [ngModel]="selectedSize()" (ngModelChange)="selectedSize.set($event)">
</mona-radio-button>
<mona-radio-button name="size" radioValue="M" label="M"
    [ngModel]="selectedSize()" (ngModelChange)="selectedSize.set($event)">
</mona-radio-button>
```

With `[formField]`, `FormField` writes `value`, `disabled`, `invalid`, `name`, `readonly`, `required` and `touched`. Don't set those on the same element, because Angular rejects the template.

A `radioValue` that isn't a primitive is still compared and written through the model, but isn't passed to the native input's `value`. A radio button without a `radioValue` can't be selected.

## Accessibility

`mona-radio-button` renders a native `<input type="radio">` inside its own `<label>`, so each radio button has the native `radio` role and takes its name from the label text or projected content. The `aria-label`, `aria-labelledby` and `aria-describedby` inputs are set on the native input, not the host. Outside a group, the input gets `aria-invalid="true"` once `touched` and `invalid` are both `true`.

`mona-radio-group` has role `radiogroup` and sets `aria-orientation` from `orientation` (`vertical` by default). It also sets `aria-label`, `aria-labelledby`, `aria-describedby`, and `aria-disabled`, `aria-invalid`, `aria-readonly` and `aria-required` when they apply.

`RadioButtonDirective` adds no role. It sets `aria-invalid` on the native input once `invalid` and `touched` are both `true`.

### Keyboard

The keyboard is the browser's native radio behavior. Radio buttons that share a `name` are one Tab stop, the arrow keys move the selection between them, and `Space` selects the focused one. A `mona-radio-group` gives its radio buttons one `name`, so they behave this way without setting it on each one.

### Consumer responsibilities

- Name each radio button with `label`, projected content, `aria-label` or `aria-labelledby`.
- Name a `mona-radio-group` with `aria-label`, `aria-labelledby` or a `mona-label`.
- With the directive, pair each input with a `<label>` and give the inputs of one group the same `name`.

### Labels from outside

`RadioButtonComponent` renders its own `<label>`, so don't wrap it in `mona-label`. To label it from outside, bind a `mona-label` or `label[monaLabel]` to it with `[for]="ref"`, or point a `for` at its `inputId`. A click on such a label selects the radio button.
