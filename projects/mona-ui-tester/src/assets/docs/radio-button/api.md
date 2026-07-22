---

## `RadioButtonComponent`

### Overview

`RadioButtonComponent` renders a custom-styled radio button inside a managed `<label>` wrapper. It implements `ControlValueAccessor` and works with both `[(ngModel)]` and Angular Reactive Forms.

It has two label modes:
- **`label` input** — text is passed as a string and rendered in a `<span>`.
- **Projected content** — any markup projected inside `<mona-radio-button>` is used when `label` is empty.

When both are absent the radio button has no accessible name. Always provide either `label` or projected content.

**Use `RadioButtonComponent` when:**

- You need a self-contained control that handles label placement, disabled state, and form binding without any extra markup
- You want `before` / `after` label positioning or label-size variants without writing custom CSS

### Import & Basic Usage

```typescript
import { RadioButtonComponent } from "@nanahoshi/mona-ui";
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

**With signal forms (`Field` directive):**

```html
<mona-radio-button name="size" radioValue="S" label="Small" [control]="sizeField">
</mona-radio-button>
<mona-radio-button name="size" radioValue="M" label="Medium" [control]="sizeField">
</mona-radio-button>
<mona-radio-button name="size" radioValue="L" label="Large" [control]="sizeField">
</mona-radio-button>
```

**Projected label** (when the label requires custom markup):

```html
<mona-radio-button name="theme" radioValue="dark"
    [ngModel]="selectedTheme()" (ngModelChange)="selectedTheme.set($event)">
    <span class="font-bold text-slate-900">Dark</span>
</mona-radio-button>
```

**Reactive Forms:**

```html
<mona-radio-button name="priority" radioValue="high" label="High"
    [formControl]="priorityControl">
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
| Label size | `labelSize` | `'default'` · `'small'` · `'large'` | `'default'` |
| Label side | `labelPosition` | `'after'` · `'before'` | `'after'` |

Pass additional Tailwind classes via the `class` attribute to style the `<label>` wrapper:

```html
<mona-radio-button name="x" radioValue="1" label="Option" class="gap-3 p-2">
</mona-radio-button>
```

### Forms Integration

`RadioButtonComponent` implements `ControlValueAccessor`. Bind the selected value at the group level using `[(ngModel)]` or `[formControl]`. The `value` input identifies which radio button is selected when the form value matches.

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

### API — `RadioButtonComponent`

**Selector:** `mona-radio-button`

| Name | Kind | Type | Default | Required | Description |
|------|------|------|---------|----------|-------------|
| `class` | input | `string` | `''` | Optional | Additional CSS classes merged onto the label container via `tailwind-merge`. |
| `disabled` | input | `boolean` | `false` | Optional | Sets the disabled state. |
| `invalid` | input | `boolean` | `false` | Optional | Marks the radio button as invalid. When bound to a signal form field via `[field]`, this is written by the signal forms `Field` directive. Error styling requires both `invalid` and `touched` to be `true`. |
| `label` | input | `string` | `''` | Optional | Text label alongside the circle. Takes precedence over projected content. Always provide `label` or projected content for an accessible name. |
| `labelPosition` | input | `'after' \| 'before'` | `'after'` | Optional | Position of the label relative to the radio circle. |
| `labelSize` | input | `'default' \| 'large' \| 'small'` | `'default'` | Optional | Font size applied to the label text. |
| `name` | input | `string` | `''` | Optional | HTML `name` attribute forwarded to the native input. Radio buttons with the same `name` form a mutually exclusive group. |
| `radioValue` | input | `any` | `undefined` | Optional | The identity value of this radio button. Compared against `value` to determine whether this button is selected. When selected, `radioValue` is written to the form as the new group value. |
| `rounded` | input | `'full' \| 'large' \| 'medium' \| 'none' \| 'small'` | `'full'` | Optional | Border radius of the radio circle and selected indicator. |
| `touched` | input | `boolean` | `false` | Optional | Marks the radio button as touched. When bound to a signal form field via `[field]`, this is written by the signal forms `Field` directive. Error styling requires both `invalid` and `touched` to be `true`. |
| `value` | model | `any` | `undefined` | Optional | The currently selected value in the radio group. Kept in sync by the `Field` directive (signal forms) or by the CVA layer (`ngModel` / `formControl`). |
| `inputBlur` | output | `FocusEvent` | — | — | Emits when the native input loses focus. |
| `inputClick` | output | `MouseEvent` | — | — | Emits when the native input is clicked. |
| `inputFocus` | output | `FocusEvent` | — | — | Emits when the native input receives focus. |

---

## `RadioButtonDirective`

### Overview

`RadioButtonDirective` applies Mona UI's radio button visual style to a native `<input type="radio">`. It does **not** manage a label or implement `ControlValueAccessor` — the consumer is responsible for label placement, form binding, and accessibility markup.

**Use `RadioButtonDirective` when:**

- You need full control over layout, label markup, or DOM structure
- You are integrating into an existing form where the `<input>` and `<label>` are already structured
- You want the Mona UI visual style without the component's label management

### Import & Basic Usage

```typescript
import { RadioButtonDirective } from "@nanahoshi/mona-ui";
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
| Border radius | `rounded` | `'full'` · `'large'` · `'medium'` · `'small'` · `'none'` | `'none'` |

The directive applies styles directly to the `<input>` element's `class` attribute. Additional classes can be added directly to the `<input>` element.

**Form validation state:** Set `invalid` and `touched` on the directive (e.g. from a `FormControl`'s status) to apply `border-error` styling.

### API — `RadioButtonDirective`

**Selector:** `input[type='radio'][monaRadioButton]`

| Name      | Kind  | Type                                                 | Default  | Required | Description                                                                                    |
|-----------|-------|------------------------------------------------------|----------|----------|--------------------------------------------------------------------------------------------------|
| `invalid` | input | `boolean`                                            | `false`  | Optional | Marks the radio button as invalid, triggering error border and ring styling.                     |
| `rounded` | input | `'full' \| 'large' \| 'medium' \| 'none' \| 'small'` | `'none'` | Optional | Sets the border radius of the radio button.                                                      |
| `touched` | input | `boolean`                                            | `false`  | Optional | Marks the radio button as touched. Error styling requires both `invalid` and `touched` to be `true`. |

The directive has no outputs. All native input events (`change`, `blur`, `focus`, etc.) are available directly on the host element.

---

## Choosing Between Component and Directive

|                        | `RadioButtonComponent`                   | `RadioButtonDirective`                    |
|------------------------|------------------------------------------|-------------------------------------------|
| Selector               | `mona-radio-button`                      | `input[type='radio'][monaRadioButton]`    |
| Label managed          | Yes (`label` input + content projection) | No — consumer provides `<label>`          |
| `ControlValueAccessor` | Yes                                      | No — use `ngModel`/`formControl` directly |
| Label position         | `labelPosition` input                    | Consumer controls layout                  |
| Label size             | `labelSize` input                        | Consumer controls font                    |
| DOM control            | Minimal                                  | Full                                      |
| Accessible name        | Via `label` or projected content         | Via explicit `<label>` element            |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] @description and @default added to all inputs including userClass
- [x] Output JSDoc capitalization fixed ("emits" → "Emits")
- [x] RadioButtonDirective @default added to rounded
- [x] label/projected-content accessible-name requirement documented
- [x] ControlValueAccessor behavior documented
- [x] Directive validation state documented via invalid/touched inputs
- [x] No internal or unexported APIs exposed
-->

<!-- TODO(owner-review): RadioButtonDirective sets `[attr.role]="'radio'"` on a native `<input type="radio">`. The native element's implicit ARIA role is already `radio` — this attribute is redundant. Evaluate removing it. -->
<!-- TODO(owner-review): When label is empty and no content is projected into RadioButtonComponent, the radio button has no accessible name. Consider emitting a dev-mode warning or enforcing a minimum accessible name. -->
