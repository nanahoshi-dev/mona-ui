---

## `RadioButtonComponent`

### Overview

`RadioButtonComponent` renders a custom-styled radio button inside a managed `<label>` wrapper. It implements `FormValueControl` from `@angular/forms/signals`, and doesn't implement `ControlValueAccessor`. Bind it with `[formField]`, `[(value)]` or `[ngModel]`. To group radio buttons as one control, put them in a `mona-radio-group`.

It has two label modes:
- **`label` input** — text is passed as a string and rendered in a `<span>`.
- **Projected content** — any markup projected inside `<mona-radio-button>` is used when `label` is empty.

When both are absent the radio button has no accessible name, and nothing warns about it. Provide `label`, projected content, `aria-label` or `aria-labelledby`.

**Use `RadioButtonComponent` when:**

- You need a self-contained control that handles label placement, disabled state, and form binding without any extra markup
- You want `before` / `after` label positioning or label-size variants without writing custom CSS

### Import & Basic Usage

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

**Disabled item in a group:**

```html
<mona-radio-button name="plan" radioValue="enterprise" label="Enterprise" [disabled]="true">
</mona-radio-button>
```

### Appearance & Styling

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

### Forms Integration

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

### Read-only

`readonly` keeps the radio button focusable and cancels the selection, so clicks and arrow keys restore the previously checked radio. It's shown with `data-readonly` only, because `aria-readonly` isn't allowed on role `radio`. A `mona-radio-group` sets `aria-readonly` on the group.

### Accessibility

`RadioButtonComponent` renders its own `<label>`, so don't wrap it in `mona-label`. To label it from outside, bind a `mona-label` or `label[monaLabel]` to it with `[for]="ref"`, or point a `for` at its `inputId`. A click on such a label selects the radio button.

### API

**Selector:** `mona-radio-button`

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `aria-describedby` | `string` | `''` | Id of an element that describes the radio button, such as an error message. |
| `aria-label` | `string` | `''` | Accessible name of the radio button when it has no visible label. |
| `aria-labelledby` | `string` | `''` | Id of the element that labels the radio button. |
| `class` | `string` | `''` | Additional CSS classes merged onto the label container via `tailwind-merge`. |
| `disabled` | `boolean` | `false` | Sets the disabled state. |
| `inputId` | `string` | generated | Id of the native input. Point a `for` at it to label the radio button from outside. A unique id is generated when it isn't set. |
| `invalid` | `boolean` | `false` | Marks the radio button as invalid. `FormField` writes it. Error styling requires both `invalid` and `touched` to be `true`. Inside a group, the group's state is used instead. |
| `label` | `string` | `''` | Text label alongside the circle. Takes precedence over projected content. |
| `labelPosition` | `'after' \| 'before'` | `'after'` | Position of the label relative to the radio circle. |
| `labelSize` | `'small' \| 'medium' \| 'large'` | `'medium'` | Font size applied to the label text. |
| `name` | `string` | `''` | HTML `name` attribute forwarded to the native input. Radio buttons with the same `name` form a mutually exclusive group. `FormField` writes it. Inside a group, the group's `name` is used instead. |
| `radioValue` | `T` | `undefined` | The identity value of this radio button. Compared against `value` to determine whether this button is selected. When selected, `radioValue` is written as the new value. A radio button without one can't be selected. |
| `readonly` | `boolean` | `false` | Prevents value changes while the control stays focusable and readable. `FormField` writes it. |
| `required` | `boolean` | `false` | Marks the radio button as required, as the native `required` attribute. `FormField` writes it. |
| `rounded` | `'full' \| 'large' \| 'medium' \| 'none' \| 'small'` | `'full'` | Border radius of the radio circle and selected indicator. |
| `touched` | `boolean` | `false` | Marks the radio button as touched. `FormField` writes it. Error styling requires both `invalid` and `touched` to be `true`. |
| `value` | `T` | `undefined` | Two-way. The selected value of a group of radio buttons that aren't in a `mona-radio-group`. `FormField` and `ngModel` keep it in sync. |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| `inputBlur` | `FocusEvent` | Emits when the native input loses focus. |
| `inputClick` | `MouseEvent` | Emits when the native input is clicked. |
| `inputFocus` | `FocusEvent` | Emits when the native input receives focus. |
| `touch` | `void` | Emits when the radio button loses focus or, outside a group, is selected. |

#### Methods

| Method | Description |
|--------|-------------|
| `focus(options?: FocusOptions)` | Moves focus to the native input. |

---

## `RadioGroupComponent`

### Overview

`RadioGroupComponent` (`mona-radio-group`) holds one value for the `mona-radio-button` elements inside it. It has role `radiogroup`, gives the radio buttons one `name`, and takes `[formField]`, so you don't repeat those on each radio button. Radio buttons outside a group work as before.

```typescript
import { RadioButtonComponent, RadioGroupComponent } from "@nanahoshi/mona-ui/radio-button";
```

```html
<mona-radio-group aria-label="Size" orientation="horizontal" [(value)]="size">
    <mona-radio-button radioValue="S" label="Small"></mona-radio-button>
    <mona-radio-button radioValue="M" label="Medium"></mona-radio-button>
    <mona-radio-button radioValue="L" label="Large"></mona-radio-button>
</mona-radio-group>
```

**With signal forms:**

```html
<mona-radio-group aria-label="Size" [formField]="orderForm.size">
    <mona-radio-button radioValue="S" label="Small"></mona-radio-button>
    <mona-radio-button radioValue="M" label="Medium"></mona-radio-button>
</mona-radio-group>
```

Put `[formField]` on the group. A radio button with `[formField]` inside a group isn't supported: the group's value wins.

### Behavior

- **Name:** a group needs an accessible name from `aria-label`, `aria-labelledby` or a `mona-label`. It warns in development when it has none. Inside a `mona-label` with `text`, a click on the caption focuses the selected radio button, or the first enabled one.
- **Invalid:** `aria-invalid` is on the group, once `touched` and `invalid` are both `true`. The radio buttons only paint it.
- **Touched:** `touch` emits on selection and when focus leaves the group. Moving focus between its radio buttons doesn't count.
- **Disabled, read-only and required:** each applies to every radio button in the group. A radio button's own `disabled`, `readonly` and `required` still work next to it.
- **Read-only:** selection is canceled as on a single radio button, and the group gets `aria-readonly="true"`.

### API

**Selector:** `mona-radio-group`

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `aria-describedby` | `string` | `''` | Id of an element that describes the group, such as an error message. |
| `aria-label` | `string` | `''` | Accessible name of the group. A group needs a name from this, `aria-labelledby` or a `mona-label`. |
| `aria-labelledby` | `string` | `''` | Id of the element that labels the group. |
| `class` | `string` | `''` | Additional CSS classes merged onto the group via `tailwind-merge`. |
| `disabled` | `boolean` | `false` | Disables every radio button in the group. `FormField` writes it. |
| `invalid` | `boolean` | `false` | Marks the group as invalid. It shows once `touched` is also `true`. `FormField` writes it. |
| `name` | `string` | `''` | The native `name` shared by the radio buttons in the group. When empty, a unique name is generated. `FormField` writes it. |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | The direction the radio buttons are laid out and announced in. |
| `readonly` | `boolean` | `false` | Prevents value changes while the radio buttons stay focusable and readable. `FormField` writes it. |
| `required` | `boolean` | `false` | Marks the group as required, as `aria-required` on the group and `required` on each native input. `FormField` writes it. |
| `touched` | `boolean` | `false` | Marks the group as touched. Error styling needs both `invalid` and `touched`. `FormField` writes it. |
| `value` | `T` | `undefined` | Two-way. The `radioValue` of the selected radio button. |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| `touch` | `void` | Emits when a radio button is selected and when focus leaves the group. |

#### Methods

| Method | Description |
|--------|-------------|
| `focus(options?: FocusOptions)` | Moves focus to the selected radio button, or the first enabled one. |

---

## `RadioButtonDirective`

### Overview

`RadioButtonDirective` applies Mona UI's radio button visual style to a native `<input type="radio">`. It does **not** manage a label — the consumer is responsible for label placement, form binding, and accessibility markup. It adds no ARIA role, because the native input already has role `radio`.

**Use `RadioButtonDirective` when:**

- You need full control over layout, label markup, or DOM structure
- You are integrating into an existing form where the `<input>` and `<label>` are already structured
- You want the Mona UI visual style without the component's label management

### Import & Basic Usage

```typescript
import { RadioButtonDirective } from "@nanahoshi/mona-ui/radio-button";
```

Pair each input with a `<label>` for accessibility. The `<label>` must either wrap the input or reference it via `for`/`id`:

```html
<!-- Label wrapping the input -->
<label class="flex items-center gap-2">
    <input type="radio" monaRadioButton name="direction" value="North"
        [ngModel]="selectedDirection()" (ngModelChange)="selectedDirection.set($event)" />
    <span>North</span>
</label>

<!-- Label referencing by id -->
<input id="north" type="radio" monaRadioButton name="direction" value="North"
    [ngModel]="selectedDirection()" (ngModelChange)="selectedDirection.set($event)" />
<label for="north">North</label>
```

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

### Appearance & Styling

| Variant       | Input     | Options                                                  | Default  |
|---------------|-----------|----------------------------------------------------------|----------|
| Border radius | `rounded` | `'full'` · `'large'` · `'medium'` · `'small'` · `'none'` | `'full'` |

The directive applies styles directly to the `<input>` element's `class` attribute. Additional classes can be added directly to the `<input>` element.

**Form validation state:** Set `invalid` and `touched` on the directive (e.g. from a `FormControl`'s status) to apply the error styling and `aria-invalid`.

**Read-only:** the directive has no `readonly` input, and the HTML `readonly` attribute has no effect on a native radio button.

### API

**Selector:** `input[type='radio'][monaRadioButton]`

#### Inputs

| Name      | Type                                                 | Default  | Description                                                                                          |
|-----------|------------------------------------------------------|----------|------------------------------------------------------------------------------------------------------|
| `invalid` | `boolean`                                            | `false`  | Marks the radio button as invalid, triggering error border and ring styling.                         |
| `rounded` | `'full' \| 'large' \| 'medium' \| 'none' \| 'small'` | `'full'` | Sets the border radius of the radio button.                                                          |
| `touched` | `boolean`                                            | `false`  | Marks the radio button as touched. Error styling requires both `invalid` and `touched` to be `true`. |

#### Outputs

The directive has no outputs. All native input events (`change`, `blur`, `focus`, etc.) are available directly on the host element.

---

## Choosing Between Component and Directive

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
