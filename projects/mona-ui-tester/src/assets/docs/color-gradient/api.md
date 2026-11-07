## Overview

Use `ColorGradientComponent` when a user needs to choose a custom color rather than selecting from a fixed palette. It exposes a two-way `value` model, optional Apply/Cancel buttons, optional alpha editing, and channel inputs that can switch between RGB and HSV entry.

Use `ColorPaletteComponent` when the user should choose only from known colors. Use `ColorPickerComponent` when the color editor should open from a compact dropdown-style control.

> **Forms.** `ColorGradientComponent` implements `FormValueControl<string | null | undefined>` from `@angular/forms/signals`, so use `[formField]` with signal forms. It has no `ControlValueAccessor`, but `[(ngModel)]`, `[formControl]` and `formControlName` work too, because Angular binds a control's `value` and `touch` directly when it has no accessor.

## Import & Quick Start

```typescript
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
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
import { signal } from "@angular/core";
import { FormField, form } from "@angular/forms/signals";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";

protected readonly form = form(signal<{ color: string | null }>({ color: "#336699" }));
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

The `value` model accepts `undefined`, `null`, and color strings. When `value` is `undefined`, the controls stay as they are, white to begin with. When `value` is `null`, the controls show no color.

It reads what the browser can paint:

| Input shape   | Example                                                                   |
|---------------|---------------------------------------------------------------------------|
| Hex           | `#336699`, `#369`, `#336699cc`                                            |
| RGB/RGBA      | `rgb(51, 102, 153)`, `rgba(51, 102, 153, 0.8)`, `rgb(51 102 153 / 80%)`   |
| HSL/HSLA      | `hsl(210, 50%, 40%)`, `hsla(210.5, 50%, 40%, 0.8)`, `hsl(210 50% 40%)`    |
| Anything else | `red`, `transparent`, `oklch(50% 0.1 200)`, through the browser's canvas  |

A value it still can't read, such as `var(--brand)`, shows as no color and warns in development. Apply only writes after an edit, so that value and any other stay exactly as written until a user changes the color. The exception is a `value` of `undefined`, where Apply writes the color on screen. A color outside sRGB comes back as its closest sRGB color once edited.

When the component emits a value, the emitted string follows the `format` input:

| `format` | Written as                                                 |
|----------|------------------------------------------------------------|
| `hex`    | `#336699`, or `#336699cc` when the color isn't fully opaque |
| `rgb`    | `rgba(51, 102, 153, 0.8)`, with alpha always included      |
| `hsl`    | `hsla(210, 50%, 40%, 0.8)`, with alpha always included     |

Alpha is written with as few decimals as read back the same, so a saved `0.5` stays `0.5`. HSL channels have one decimal, because whole percentages can't bring most colors back.

Cancel puts the controls back on `value`. With the buttons shown, Clear only empties the controls until Apply, and the previous color stays available until then. With `showButtons` off, Clear writes `null` at once.

## Right to Left

The hue and alpha sliders stay left to right on an RTL page, like the saturation and value area, so each handle sits over the color it selects, and the right arrow moves up the scale.

## Keyboard Interaction

The saturation/value handle is focusable when the component is enabled. Pressing anywhere in the area starts a drag with the primary button.

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

The host is a `role="group"` named by the `aria-label` input, `aria-labelledby` or a `mona-label`, or `"Color gradient"` otherwise. It has `aria-invalid="true"` once `touched` and either `invalid`, or `required` with no color. Every slider and input has a name of its own, and the alpha slider reads as a percentage. The saturation/value handle renders a focusable slider and exposes the current saturation and value.

| Attribute        | When present                          | Value                                |
|------------------|---------------------------------------|--------------------------------------|
| `role`           | Always on the saturation/value handle | `"slider"`                           |
| `aria-label`     | Always on the saturation/value handle | `"Color saturation and value"`       |
| `aria-valuemin`  | Always on the saturation/value handle | `0`                                  |
| `aria-valuemax`  | Always on the saturation/value handle | `100`                                |
| `aria-valuenow`  | Always on the saturation/value handle | Current saturation, `0` with no color |
| `aria-valuetext` | Always on the saturation/value handle | `"Saturation n%, Value n%"`          |
| `aria-disabled`  | When disabled                         | `true`                               |
| `aria-readonly`  | When read-only                        | `true`                               |
| `tabindex`       | Always on the saturation/value handle | `0` when enabled, `-1` when disabled |

The previous-color swatch has `role="button"`. The current-color preview is marked `aria-hidden`.

**Consumer responsibilities**

- Provide nearby text or form labeling that explains what color the control edits.
- When using signal forms, use `[formField]` so the form field can receive `value` and listen to `touch`.

## Forms Integration

`ColorGradientComponent` implements `FormValueControl<string | null | undefined>` from `@angular/forms/signals`.

```typescript
import { signal } from "@angular/core";
import { FormField, disabled, form } from "@angular/forms/signals";

protected readonly form = form(signal<{ color: string | null }>({ color: "#336699" }), schema => {
    disabled(schema.color, { when: () => this.locked() });
});
```

```html
<mona-color-gradient [formField]="form.color" [showButtons]="false"></mona-color-gradient>
```

The `touch` output fires when focus leaves the component. Moving between its controls doesn't fire it. The signal forms `FormField` directive listens to this output to mark the field as touched.

## API

### `ColorGradientComponent`

**Selector:** `mona-color-gradient`

Implements `FormValueControl<string | null | undefined>` from `@angular/forms/signals`.

#### Inputs

| Name              | Type                                                 | Default     | Description                                                                                                                                                    |
|-------------------|------------------------------------------------------|-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`      | `string`                                             | `""`        | Accessible name of the group of controls. When empty, and nothing else names it, a localized "Color gradient".                                                 |
| `aria-labelledby` | `string`                                             | `""`        | Id of the element that names the group of controls.                                                                                                            |
| `disabled`        | `boolean`                                            | `false`     | Sets the disabled state of the color gradient.                                                                                                                 |
| `format`          | `'hex' \| 'rgb' \| 'hsl'`                            | `'hex'`     | Output format used when the component emits a color value.                                                                                                     |
| `invalid`         | `boolean`                                            | `false`     | Marks the color gradient as invalid once `touched`. When bound via `[formField]`, this is written by the `FormField` directive.                                |
| `opacity`         | `boolean`                                            | `true`      | Shows or hides the alpha slider.                                                                                                                               |
| `readonly`        | `boolean`                                            | `false`     | Prevents value changes while the control stays focusable and readable. When bound via `[formField]`, this is written by the `FormField` directive.             |
| `required`        | `boolean`                                            | `false`     | With no color, makes the color gradient invalid once `touched`. `aria-required` isn't set, because `role="group"` doesn't allow it. When bound via `[formField]`, this is written by the `FormField` directive. |
| `rounded`         | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'`  | Border-radius preset applied to the color gradient controls.                                                                                                   |
| `showButtons`     | `boolean`                                            | `true`      | Shows Apply and Cancel buttons. When `false`, value changes emit immediately.                                                                                  |
| `showColorInputs` | `boolean`                                            | `true`      | Shows or hides the RGB/HSV numeric channel inputs.                                                                                                             |
| `showHexInput`    | `boolean`                                            | `true`      | Shows or hides the hex text input.                                                                                                                             |
| `touched`         | `boolean`                                            | `false`     | Marks the color gradient as touched. When bound via `[formField]`, this is written by the `FormField` directive.                                               |
| `value`           | `string \| null \| undefined`                        | `undefined` | Two-way bindable current color value. `undefined` leaves the controls as they are, white to begin with; `null` shows no color. Implements `FormValueControl<string \| null \| undefined>`, enabling signal forms `[formField]` binding. |

#### Outputs

| Name     | Type   | Description                                                                                                                                                      |
|----------|--------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `apply`  | `void` | Emitted when the Apply button is clicked. The button is only displayed when `showButtons` is `true`.                                                             |
| `cancel` | `void` | Emitted when the Cancel button is clicked, after the controls go back to `value`. The button is only displayed when `showButtons` is `true`.                     |
| `touch`  | `void` | Emitted when focus leaves the color gradient. Consumed by the signal forms `FormField` directive to mark the field as touched.                                   |

### Exported Types

| Name                        | Shape                     | Description                                                                         |
|-----------------------------|---------------------------|-------------------------------------------------------------------------------------|
| `ColorOutputFormat`         | `"hex" \| "rgb" \| "hsl"` | The type of `format`. Import it from `@nanahoshi/mona-ui/common`.                   |
| `ColorGradientVariantProps` | —                         | Variant prop type backing the `rounded` input's literal union, exported for advanced typing scenarios. |

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source
- [x] Basic examples use public imports from @nanahoshi/mona-ui
- [x] Signal forms support verified against FormValueControl implementation and specs
- [x] ControlValueAccessor absence documented, and the custom-control path verified in @angular/forms 22 (NgControl.ngControlCreate)
- [x] Keyboard map verified against source and focused specs
- [x] ARIA attributes verified against color-gradient.component.html
- [x] Inputs and outputs tables sorted A-Z within each section
- [x] No private methods, internal signals, Tailwind utility classes, or implementation-only DOM details exposed
- [x] ColorOutputFormat and ColorGradientVariantProps verified as exported
-->
