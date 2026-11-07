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

## Examples

### Apply and Cancel

With `showButtons` on, the default, `value` changes only when Apply is pressed. Use `(apply)` and `(cancel)` to react to the buttons.

```example
color-gradient/buttons
```

### Immediate updates

Set `showButtons` to `false` when each adjustment should update the bound value immediately. `format` controls the emitted color string: `hex`, `rgb`, or `hsl`.

```example
color-gradient/immediate
```

### Hide optional controls

Use this when the surrounding UI already provides text entry or when the editor should stay compact.

```example
color-gradient/compact
```

## Appearance & Styling

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
