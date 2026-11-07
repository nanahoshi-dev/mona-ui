## Overview

Use `SliderComponent` when the user must select a single numeric value within a defined range. The selected value updates immediately as the handle moves.

**Use Slider instead of RangeSlider when:**

- The user selects one value (e.g., volume, brightness, zoom level)
- A minimum bound is fixed and only the upper value changes

**Use RangeSlider when:**

- The user needs to select both a lower and an upper bound simultaneously (e.g., a price filter)

## Import & Quick Start

```typescript
import { SliderComponent } from "@nanahoshi/mona-ui/slider";
```

**Direct value binding:**

```html

<mona-slider [(value)]="volume" aria-label="Volume"></mona-slider>
```

**Signal forms integration:**

```typescript
import { signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";

protected readonly myForm = form(signal({ volume: 5 }));
```

```html

<mona-slider [formField]="myForm.volume" aria-label="Volume"></mona-slider>
```

## Template Hooks

Two structural directives allow customising the handle and tick labels.

### Custom handle

Use `monaSliderHandleTemplate` to replace the default circular handle. The template context exposes the current value as the implicit variable:

```typescript
import { SliderComponent, SliderHandleTemplateDirective } from "@nanahoshi/mona-ui/slider";
```

```html

<mona-slider [(value)]="value" aria-label="Rating">
    <ng-template monaSliderHandleTemplate let-value>
        <span>{{ value }}</span>
    </ng-template>
</mona-slider>
```

### Custom tick labels

Use `monaSliderTickValueTemplate` to replace default numeric tick labels. The template context exposes the tick value as the implicit variable. This template has no effect unless `showTicks` and `showLabels` are both enabled:

```typescript
import { SliderComponent, SliderTickValueTemplateDirective } from "@nanahoshi/mona-ui/slider";
```

```html

<mona-slider [showTicks]="true" [showLabels]="true" aria-label="Temperature">
    <ng-template monaSliderTickValueTemplate let-value>
        {{ value }}°C
    </ng-template>
</mona-slider>
```

## Feature Examples

### Tick marks and labels

```html

<mona-slider
    [minValue]="0"
    [maxValue]="100"
    [step]="10"
    [showTicks]="true"
    [showLabels]="true"
    [(value)]="level"
    aria-label="Level">
</mona-slider>
```

Use `labelStep` to render only every n-th label (e.g., `[labelStep]="2"` shows every other label). Use `largeTickStep` to visually enlarge every n-th tick mark.

### Vertical orientation

```html

<mona-slider
    orientation="vertical"
    [minValue]="0"
    [maxValue]="100"
    [(value)]="value"
    aria-label="Height"
    style="height: 300px">
</mona-slider>
```

### Disabled state

```html

<mona-slider [disabled]="true" [value]="5" aria-label="Level"></mona-slider>
```

### Read-only state

`readonly` blocks dragging, track clicks and keys. The handle stays focusable and readable, and gets `aria-readonly="true"`. With `[formField]`, the signal forms `readonly` rule writes it.

```html

<mona-slider readonly [value]="5" aria-label="Level"></mona-slider>
```

### Accessible value text

Provide `ariaValueText` to give screen readers a richer announcement than the raw number:

```html

<mona-slider
    [minValue]="0"
    [maxValue]="2"
    [step]="1"
    [ariaValueText]="labelFn"
    [(value)]="level"
    aria-label="Priority">
</mona-slider>
```

```typescript
protected readonly labelFn = (value: number) => ['Low', 'Medium', 'High'][value];
```

## Values Out of Range

The slider never writes a corrected value on its own. A value that is out of range or off the step grid is shown at the nearest valid value, and the model keeps its own until the user changes it. The next user change saves a valid value. This way a `maxValue` that loads late can't overwrite saved data.

In development, the slider warns once per instance when this happens. That includes a `maxValue` that loads late, and a value left unset below `minValue`, since `value` defaults to `0`. It also warns once when the minimum isn't lower than the maximum.

`maxValue` can always be reached, even when it isn't a whole number of steps from `minValue`.

## Keyboard Interaction

| Key                               | Action                                                  |
|-----------------------------------|---------------------------------------------------------|
| `ArrowRight` / `ArrowUp`          | Increase value by `step`                                |
| `ArrowLeft` / `ArrowDown`         | Decrease value by `step`                                |
| `Shift` + `ArrowRight`/`ArrowUp`  | Increase value by `step × shiftMultiplier`              |
| `Shift` + `ArrowLeft`/`ArrowDown` | Decrease value by `step × shiftMultiplier`              |
| `Home`                            | Jump to the lower bound                                 |
| `End`                             | Jump to the upper bound                                 |
| `PageUp`                          | Increase value by 10% of the total range, at least `step` |
| `PageDown`                        | Decrease value by 10% of the total range, at least `step` |

In RTL, `ArrowLeft` increases and `ArrowRight` decreases.

## Accessibility Notes

`SliderComponent` renders a focusable `div` with `role="slider"` and manages the following ARIA attributes on that element:

| Attribute          | When present                      | Value                                 |
|--------------------|-----------------------------------|---------------------------------------|
| `role`             | Always                            | `"slider"`                            |
| `aria-valuemin`    | Always                            | The lower bound                       |
| `aria-valuemax`    | Always                            | The upper bound                       |
| `aria-valuenow`    | Always                            | Current value (clamped and snapped)   |
| `aria-valuetext`   | When `ariaValueText` is provided  | Return value of the provided function |
| `aria-orientation` | Always                            | `"horizontal"` or `"vertical"`        |
| `aria-disabled`    | When disabled                     | `true`                                |
| `aria-readonly`    | When read-only                    | `true`                                |
| `aria-invalid`     | When `invalid` and `touched`      | `true`                                |
| `aria-describedby` | When `aria-describedby` is set    | The given id                          |
| `tabindex`         | Always                            | `0` (enabled) or `-1` (disabled)      |

The slider has no required state, because ARIA doesn't allow one on role `slider`.

**Accessible name:**

The slider has no visible text label of its own. Provide a name using one of:

- `aria-label` input: `<mona-slider aria-label="Volume">`
- `aria-labelledby` input: reference an existing element by ID: `<mona-slider aria-labelledby="volume-label-id">`
- A `mona-label` with `text` wrapped around it. A click on the caption focuses the handle.
- A `mona-label` or `label[monaLabel]` bound to it with `[for]="ref"`. A string `for` can't work, because the slider has no native input.

Without any of these, it falls back to the generic localized name "Slider value".

## Forms Integration

`SliderComponent` implements `FormValueControl<number>` from `@angular/forms/signals`. Connect it to a signal form field using the `[formField]` binding:

```typescript
import { signal } from "@angular/core";
import { form, FormField, max, min } from "@angular/forms/signals";

protected readonly priceForm = form(signal({ price: 50 }), schema => {
    min(schema.price, 0);
    max(schema.price, 100);
});
```

```html

<mona-slider [formField]="priceForm.price" aria-label="Price"></mona-slider>
```

`FormField` writes `value`, `disabled`, `invalid`, `readonly`, `touched`, and, from the field's `min` and `max` rules, the `min` and `max` inputs, which win over `minValue` and `maxValue`. Don't set those on the same element, because Angular rejects the template. `minValue` and `maxValue` are still allowed. The `touch` output fires when the handle loses focus, marking the field as touched. A click on the track moves focus to the handle first.

`SliderComponent` doesn't implement `ControlValueAccessor`. `[(ngModel)]` binds to its `value` model through Angular's support for custom controls. Prefer `[formField]`.

## API

### `SliderComponent`

**Selector:** `mona-slider`

Implements `FormValueControl<number>` from `@angular/forms/signals`.

#### Inputs

| Name                  | Type                                                 | Default        | Description                                                                                                                                       |
|-----------------------|------------------------------------------------------|----------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-describedby`    | `string \| null`                                     | `null`         | Id of an element that describes the slider, such as an error message.                                                                             |
| `aria-label`          | `string \| null`                                     | `null`         | Accessible name for the handle. Without any name, the generic localized "Slider value" applies.                                                   |
| `aria-labelledby`     | `string \| null`                                     | `null`         | ID of an external element that provides the accessible name for the handle.                                                                      |
| `ariaValueText`       | `((value: number) => string) \| null`                | `null`         | Human-readable override for the `aria-valuenow` announcement. Pass a function that receives the current value and returns the string to announce. |
| `disabled`            | `boolean`                                            | `false`        | Renders the component with reduced visual emphasis and removes pointer and keyboard interaction.                                                  |
| `handleClasses`       | `string \| string[]`                                 | `[]`           | Additional CSS classes to apply to the slider handle.                                                                                             |
| `handleStyles`        | `Partial<CSSStyleDeclaration>`                       | `{}`           | Additional inline styles to apply to the slider handle.                                                                                           |
| `invalid`             | `boolean`                                            | `false`        | Marks the control as invalid, reflecting `aria-invalid` on the handle once the control is touched. `FormField` writes it.                         |
| `labelPosition`       | `'before' \| 'after'`                                | `'after'`      | Position of the tick label list relative to the track.                                                                                            |
| `labelStep`           | `number`                                             | `1`            | Controls which tick labels are shown — only every n-th label is rendered.                                                                         |
| `largeTickStep`       | `number \| null`                                     | `null`         | Controls which ticks render at large size — only every n-th tick is enlarged. Pass `null` to disable large ticks.                                 |
| `max`                 | `number \| undefined`                                | `undefined`    | Upper bound that wins over `maxValue`. `FormField` writes it from the field's `max` rule.                                                         |
| `maxValue`            | `number`                                             | `10`           | Upper bound of the value range. Must be greater than the lower bound.                                                                             |
| `min`                 | `number \| undefined`                                | `undefined`    | Lower bound that wins over `minValue`. `FormField` writes it from the field's `min` rule.                                                         |
| `minValue`            | `number`                                             | `0`            | Lower bound of the value range.                                                                                                                   |
| `orientation`         | `'horizontal' \| 'vertical'`                         | `'horizontal'` | Layout orientation of the component.                                                                                                              |
| `readonly`            | `boolean`                                            | `false`        | Prevents value changes while the control stays focusable and readable. `FormField` writes it.                                                     |
| `rounded`             | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'full'`       | Border-radius preset applied to the slider handle.                                                                                                |
| `selectionBackground` | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`         | Background color of the filled selection area. Accepts a CSS color string or a `CSSStyleDeclaration` partial.                                     |
| `shiftMultiplier`     | `number`                                             | `10`           | Multiplier applied to the step when the user holds Shift while pressing an arrow key.                                                             |
| `showLabels`          | `boolean`                                            | `false`        | Displays value labels alongside tick marks. Only takes effect when `showTicks` is `true`.                                                         |
| `showTicks`           | `boolean`                                            | `false`        | Displays tick marks at each step position along the track.                                                                                        |
| `smallTickStep`       | `number`                                             | `1`            | Controls how many ticks are visible — only every n-th tick is rendered. Values below `1` are raised to `1`.                                       |
| `step`                | `number`                                             | `1`            | Distance between the values the control can take. A value of `0` or less falls back to `1`.                                                       |
| `touched`             | `boolean`                                            | `false`        | Marks the slider as touched. Error styling requires both `invalid` and `touched` to be `true`. `FormField` writes it.                             |
| `trackBackground`     | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`         | Background color of the unfilled track portion. Accepts a CSS color string or a `CSSStyleDeclaration` partial.                                    |
| `trackSize`           | `string \| number`                                   | `undefined`    | Width (vertical orientation) or height (horizontal orientation) of the track. Accepts a pixel number or any CSS length string.                    |
| `value`               | `number`                                             | `0`            | Two-way. Current value. A value out of range or off the step grid is shown at the nearest valid value, and the model keeps its own until the user changes it. |

#### Outputs

| Name    | Type   | Description                                                                                                                              |
|---------|--------|------------------------------------------------------------------------------------------------------------------------------------------|
| `touch` | `void` | Emitted when the handle loses focus. A click on the track moves focus to the handle first. `FormField` uses it to mark the field as touched. |

#### Methods

| Method                          | Description                                               |
|---------------------------------|-----------------------------------------------------------|
| `focus(options?: FocusOptions)` | Moves focus to the handle. Does nothing while disabled.   |

---

### Template Directives

These structural directives are projected inside `<mona-slider>` to customise specific parts.

| Directive selector                         | Template context                    | Description                                                                                                 |
|--------------------------------------------|-------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `ng-template[monaSliderHandleTemplate]`    | `$implicit: number` (current value) | Replaces the default handle element. The implicit variable exposes the current slider value.                |
| `ng-template[monaSliderTickValueTemplate]` | `$implicit: number` (tick value)    | Replaces the default numeric tick label. Has no effect unless both `showTicks` and `showLabels` are `true`. |

**Imports:**

```typescript
import { SliderComponent, SliderHandleTemplateDirective, SliderTickValueTemplateDirective } from "@nanahoshi/mona-ui/slider";
```
