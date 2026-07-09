## Overview

Use `ColorGradientComponent` when a user needs to choose a custom color rather than selecting from a fixed palette. It exposes a two-way `value` model, optional Apply/Cancel buttons, optional alpha editing, and channel inputs that can switch between RGB and HSV entry.

Use `ColorPaletteComponent` when the user should choose only from known colors. Use `ColorPickerComponent` when the color editor should open from a compact dropdown-style control.

> **Signal forms only.** `ColorGradientComponent` implements `FormValueControl<string | null | undefined>` from `@angular/forms/signals`. It does not implement `ControlValueAccessor`, so `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

## Import & Quick Start

```typescript
import { ColorGradientComponent } from "@nanahoshi/mona-ui";
```

**Direct value binding**

```html
<mona-color-gradient [(value)]="color"></mona-color-gradient>
```

```typescript
protected readonly color = signal<string | null | undefined>("#336699");
```

**Signal forms**

```typescript
import { FormField, form } from "@angular/forms/signals";
import { ColorGradientComponent } from "@nanahoshi/mona-ui";

protected readonly form = form({ color: "#336699" });
```

```html
<mona-color-gradient [formField]="form.color" [showButtons]="false"></mona-color-gradient>
```

## Feature Examples

### Immediate updates

Set `showButtons` to `false` when each adjustment should update the bound value immediately:

```html
<mona-color-gradient [(value)]="color" [showButtons]="false"></mona-color-gradient>
```

When `showButtons` is `true`, use `(apply)` and `(cancel)` to react to the visible buttons:

```html
<mona-color-gradient
    [(value)]="draftColor"
    (apply)="saveColor()"
    (cancel)="closeEditor()">
</mona-color-gradient>
```

### Output format

`format` controls the emitted color string when the component writes a value:

```html
<mona-color-gradient [(value)]="color" format="rgb" [showButtons]="false"></mona-color-gradient>
```

Supported output formats are `hex`, `rgb`, and `hsl`.

### Hide optional controls

```html
<mona-color-gradient
    [(value)]="color"
    [opacity]="false"
    [showHexInput]="false"
    [showColorInputs]="false">
</mona-color-gradient>
```

Use this when the surrounding UI already provides text entry or when the editor should stay compact.

### Rounded variants

```html
<mona-color-gradient [(value)]="color" rounded="large"></mona-color-gradient>
```

Supported rounded values are `none`, `small`, `medium`, `large`, and `full`.

## Value Parsing & Output

The `value` model accepts `undefined`, `null`, and color strings. When `value` is `undefined`, the component keeps its default internal color state. When `value` is `null`, the component clears its internal color channels.

The source validates and parses these string shapes:

| Input shape | Example                                          |
|-------------|--------------------------------------------------|
| Hex         | `#336699`, `#369`, `#336699cc`                   |
| RGB/RGBA    | `rgb(51, 102, 153)`, `rgba(51, 102, 153, 0.8)`   |
| HSL/HSLA    | `hsl(210, 50%, 40%)`, `hsla(210, 50%, 40%, 0.8)` |

When the component emits a value, the emitted string follows the `format` input. Alpha is included where the selected format supports it.

## Keyboard Interaction

The saturation/value handle is focusable when the component is enabled.

| Key                 | Action                          |
|---------------------|---------------------------------|
| `ArrowLeft`         | Decrease saturation by 1        |
| `ArrowRight`        | Increase saturation by 1        |
| `ArrowUp`           | Increase value by 1             |
| `ArrowDown`         | Decrease value by 1             |
| `Shift` + arrow key | Adjust by 10 instead of 1       |
| `PageUp`            | Increase value by 25            |
| `PageDown`          | Decrease value by 25            |
| `Home`              | Move to saturation 0, value 100 |
| `End`               | Move to saturation 100, value 0 |

The previous-color swatch is keyboard-activatable with `Enter` and `Space`.

## Accessibility Notes

The saturation/value handle renders a focusable slider with an accessible name and exposes the current saturation and value.

| Attribute        | When present                          | Value                                |
|------------------|---------------------------------------|--------------------------------------|
| `role`           | Always on the saturation/value handle | `"slider"`                           |
| `aria-label`     | Always on the saturation/value handle | `"Color saturation and value"`       |
| `aria-valuemin`  | Always on the saturation/value handle | `0`                                  |
| `aria-valuemax`  | Always on the saturation/value handle | `100`                                |
| `aria-valuenow`  | Always on the saturation/value handle | Current saturation                   |
| `aria-valuetext` | Always on the saturation/value handle | `"Saturation n%, Value n%"`          |
| `aria-disabled`  | When disabled                         | `true`                               |
| `tabindex`       | Always on the saturation/value handle | `0` when enabled, `-1` when disabled |

The previous-color swatch renders as a button only for the previous color. The current-color preview is marked `aria-hidden`.

**Consumer responsibilities**

- Provide nearby text or form labeling that explains what color the control edits.
- When using signal forms, use `[formField]` so the form field can receive `value` and listen to `touch`.

## Forms Integration

`ColorGradientComponent` implements `FormValueControl<string | null | undefined>` from `@angular/forms/signals`.

```typescript
import { FormField, disabled, form } from "@angular/forms/signals";

protected readonly form = form({ color: "#336699" }, schema => {
    disabled(schema.color, { when: () => this.locked() });
});
```

```html
<mona-color-gradient [formField]="form.color" [showButtons]="false"></mona-color-gradient>
```

The `touch` output fires when the user blurs the saturation/value handle, slider controls, numeric inputs, or hex input. The signal forms `FormField` directive listens to this output to mark the field as touched.

## API

### `ColorGradientComponent`

**Selector:** `mona-color-gradient`

Implements `FormValueControl<string | null | undefined>` from `@angular/forms/signals`.

#### Inputs

| Name              | Type                                                 | Default     | Description                                                                                                                                                    |
|-------------------|------------------------------------------------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `disabled`        | `boolean`                                            | `false`     | Sets the disabled state of the color gradient.                                                                                                                 |
| `format`          | `'hex' \| 'rgb' \| 'hsl'`                            | `'hex'`     | Output format used when the component emits a color value.                                                                                                     |
| `opacity`         | `boolean`                                            | `true`      | Shows or hides the alpha slider.                                                                                                                               |
| `rounded`         | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'`  | Border-radius preset applied to the color gradient controls.                                                                                                   |
| `showButtons`     | `boolean`                                            | `true`      | Shows Apply and Cancel buttons. When `false`, value changes emit immediately.                                                                                  |
| `showColorInputs` | `boolean`                                            | `true`      | Shows or hides the RGB/HSV numeric channel inputs.                                                                                                             |
| `showHexInput`    | `boolean`                                            | `true`      | Shows or hides the hex text input.                                                                                                                             |
| `value`           | `string \| null \| undefined`                        | `undefined` | Two-way bindable current color value. `undefined` keeps the default internal color state; `null` clears the current color. Implements `FormValueControl<string | null | undefined>`, enabling signal forms `[formField]` binding. |

#### Outputs

| Name     | Type   | Description                                                                                                                                                      |
|----------|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `apply`  | `void` | Emitted when the Apply button is clicked. The button is only displayed when `showButtons` is `true`.                                                             |
| `cancel` | `void` | Emitted when the Cancel button is clicked. The button is only displayed when `showButtons` is `true`.                                                            |
| `touch`  | `void` | Emitted when the color gradient is interacted with on blur or value adjustment. Consumed by the signal forms `FormField` directive to mark the field as touched. |

---

TODO(owner-review): `format` is typed as the internal `ColorOutputFormat` alias and `rounded` is typed through `ColorGradientVariantProps["rounded"]` in source. Consider exporting these public-signature types or keeping the docs' literal-union expansion as the supported consumer contract.

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] Basic examples use public imports from @nanahoshi/mona-ui
- [x] Signal forms support verified against FormValueControl implementation and specs
- [x] ControlValueAccessor absence documented
- [x] Keyboard map verified against source and focused specs
- [x] ARIA attributes verified against color-gradient.component.html
- [x] Inputs and outputs tables sorted A-Z within each section
- [x] No private methods, internal signals, Tailwind utility classes, or implementation-only DOM details exposed
- [x] Unexported public-signature types marked with TODO(owner-review)
-->
