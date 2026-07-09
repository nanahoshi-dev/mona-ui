## Overview

Use `SliderComponent` when the user must select a single numeric value within a defined range. The selected value updates immediately as the handle moves.

**Use Slider instead of RangeSlider when:**

- The user selects one value (e.g., volume, brightness, zoom level)
- A minimum bound is fixed and only the upper value changes

**Use RangeSlider when:**

- The user needs to select both a lower and an upper bound simultaneously (e.g., a price filter)

## Import & Quick Start

```typescript
import { SliderComponent } from "@nanahoshi/mona-ui";
```

**Direct value binding:**

```html

<mona-slider [(value)]="volume" aria-label="Volume"></mona-slider>
```

**Signal forms integration:**

```typescript
import { form, disabled } from "@angular/forms/signals";

protected readonly
myForm = form({volume: 5});
```

```html

<mona-slider [formField]="myForm.volume" aria-label="Volume"></mona-slider>
```

> **`SliderComponent` does NOT implement `ControlValueAccessor`.** It cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`. For forms integration, use the signal forms `[formField]` binding.

## Template Hooks

Two structural directives allow customising the handle and tick labels.

### Custom handle

Use `monaSliderHandleTemplate` to replace the default circular handle. The template context exposes the current value as the implicit variable:

```typescript
import { SliderComponent, SliderHandleTemplateDirective } from "@nanahoshi/mona-ui";
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
import { SliderComponent, SliderTickValueTemplateDirective } from "@nanahoshi/mona-ui";
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

<mona-slider [disabled]="true" [value]="5" aria-label="Read-only level"></mona-slider>
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
protected readonly
labelFn = (value: number) => ['Low', 'Medium', 'High'][value];
```

## Keyboard Interaction

| Key                               | Action                                     |
|-----------------------------------|--------------------------------------------|
| `ArrowRight` / `ArrowUp`          | Increase value by `step`                   |
| `ArrowLeft` / `ArrowDown`         | Decrease value by `step`                   |
| `Shift` + `ArrowRight`/`ArrowUp`  | Increase value by `step × shiftMultiplier` |
| `Shift` + `ArrowLeft`/`ArrowDown` | Decrease value by `step × shiftMultiplier` |
| `Home`                            | Jump to `minValue`                         |
| `End`                             | Jump to `maxValue`                         |
| `PageUp`                          | Increase value by 10% of the total range   |
| `PageDown`                        | Decrease value by 10% of the total range   |

## Accessibility Notes

`SliderComponent` renders a focusable `div` with `role="slider"` and manages the following ARIA attributes on that element:

| Attribute          | When present                     | Value                                 |
|--------------------|----------------------------------|---------------------------------------|
| `role`             | Always                           | `"slider"`                            |
| `aria-valuemin`    | Always                           | `minValue`                            |
| `aria-valuemax`    | Always                           | `maxValue`                            |
| `aria-valuenow`    | Always                           | Current value (clamped and snapped)   |
| `aria-valuetext`   | When `ariaValueText` is provided | Return value of the provided function |
| `aria-orientation` | Always                           | `"horizontal"` or `"vertical"`        |
| `aria-disabled`    | When disabled                    | `true`                                |
| `aria-invalid`     | When `invalid` is `true`         | `true`                                |
| `tabindex`         | Always                           | `0` (enabled) or `-1` (disabled)      |

**Consumer responsibilities:**

The slider has no visible text label of its own. You must provide an accessible name using one of:

- `aria-label` input: `<mona-slider aria-label="Volume">`
- `aria-labelledby` input: reference an existing element by ID: `<mona-slider aria-labelledby="volume-label-id">`

## Forms Integration

`SliderComponent` implements `FormValueControl<number>` from `@angular/forms/signals`. Connect it to a signal form field using the `[formField]` binding:

```typescript
import { form, disabled } from "@angular/forms/signals";

protected readonly
priceForm = form({price: 50});
```

```html

<mona-slider [formField]="priceForm.price" aria-label="Price"></mona-slider>
```

The `disabled` state can be driven declaratively from the form schema. The `touch` output fires when the slider loses focus or its value changes via keyboard, signaling the field as touched.

> `ControlValueAccessor` is not implemented. `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

## API

### `SliderComponent`

**Selector:** `mona-slider`

Implements `FormValueControl<number>` from `@angular/forms/signals`.

#### Inputs

| Name                  | Type                                                 | Default        | Description                                                                                                                                                                                           |
|-----------------------|------------------------------------------------------|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`          | `string \| null`                                     | `null`         | Accessible name for the host element. Describe what the component represents. When empty, assistive technology announces the role without a label.                                                    |
| `aria-labelledby`     | `string \| null`                                     | `null`         | ID of an external element that provides the accessible name for the host element.                                                                                                                     |
| `ariaValueText`       | `((value: number) => string) \| null`                | `null`         | Human-readable override for the `aria-valuenow` announcement. Pass a function that receives the current value and returns the string to announce.                                                     |
| `disabled`            | `boolean`                                            | `false`        | Renders the component with reduced visual emphasis and removes pointer interaction.                                                                                                                   |
| `handleClasses`       | `string \| string[]`                                 | `[]`           | Additional CSS classes to apply to the slider handle.                                                                                                                                                 |
| `handleStyles`        | `Partial<CSSStyleDeclaration>`                       | `{}`           | Additional inline styles to apply to the slider handle.                                                                                                                                               |
| `invalid`             | `boolean`                                            | `false`        | Marks the control as invalid for form validation purposes, reflecting `aria-invalid` on the handle element.                                                                                           |
| `labelPosition`       | `'before' \| 'after'`                                | `'after'`      | Position of the label relative to the component.                                                                                                                                                      |
| `labelStep`           | `number`                                             | `1`            | Controls which tick labels are shown — only every n-th label is rendered.                                                                                                                             |
| `largeTickStep`       | `number \| null`                                     | `null`         | Controls which ticks render at large size — only every n-th tick is enlarged. Pass `null` to disable large ticks.                                                                                     |
| `maxValue`            | `number`                                             | `10`           | Upper bound of the value range. Must be greater than `minValue`.                                                                                                                                      |
| `minValue`            | `number`                                             | `0`            | Lower bound of the value range.                                                                                                                                                                       |
| `orientation`         | `'horizontal' \| 'vertical'`                         | `'horizontal'` | Layout orientation of the component.                                                                                                                                                                  |
| `rounded`             | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'full'`       | Border-radius preset applied to the slider handle.                                                                                                                                                    |
| `selectionBackground` | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`         | Background color of the filled selection area. Accepts a CSS color string or a `CSSStyleDeclaration` partial.                                                                                         |
| `shiftMultiplier`     | `number`                                             | `10`           | Multiplier applied to the step when the user holds Shift while pressing an arrow key.                                                                                                                 |
| `showLabels`          | `boolean`                                            | `false`        | Displays value labels alongside tick marks. Only takes effect when `showTicks` is `true`.                                                                                                             |
| `showTicks`           | `boolean`                                            | `false`        | Displays tick marks at each step position along the track.                                                                                                                                            |
| `smallTickStep`       | `number`                                             | `1`            | Controls how many ticks are visible — only every n-th tick is rendered.                                                                                                                               |
| `step`                | `number`                                             | `1`            | Increment applied when the value changes via keyboard navigation.                                                                                                                                     |
| `trackBackground`     | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`         | Background color of the unfilled track portion. Accepts a CSS color string or a `CSSStyleDeclaration` partial.                                                                                        |
| `trackSize`           | `string \| number`                                   | `undefined`    | Width (vertical orientation) or height (horizontal orientation) of the track. Accepts a pixel number or any CSS length string.                                                                        |
| `value`               | `number`                                             | `0`            | Two-way bindable. Current value. Values outside `[minValue, maxValue]` are clamped before rendering. Implements `FormValueControl<number>`, enabling use with the signal forms `[formField]` binding. |

#### Outputs

| Name    | Type   | Description                                                                                                                                                    |
|---------|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `touch` | `void` | Emitted when the slider loses focus or its value changes via keyboard navigation. Consumed by the signal forms `Field` directive to mark the field as touched. |

---

### Template Directives

These structural directives are projected inside `<mona-slider>` to customise specific parts.

| Directive selector                         | Template context                    | Description                                                                                                 |
|--------------------------------------------|-------------------------------------|-------------------------------------------------------------------------------------------------------------|
| `ng-template[monaSliderHandleTemplate]`    | `$implicit: number` (current value) | Replaces the default handle element. The implicit variable exposes the current slider value.                |
| `ng-template[monaSliderTickValueTemplate]` | `$implicit: number` (tick value)    | Replaces the default numeric tick label. Has no effect unless both `showTicks` and `showLabels` are `true`. |

**Imports:**

```typescript
import {
    SliderComponent,
    SliderHandleTemplateDirective,
    SliderTickValueTemplateDirective
} from "@nanahoshi/mona-ui";
```

---

<!-- verification-checklist
- [x] API table cross-checked against current source (slider-base + slider component)
- [x] value model documented as two-way bindable
- [x] touch output documented
- [x] aria-label and aria-labelledby documented as consumer responsibility
- [x] ariaValueText (function-type input) documented
- [x] shiftMultiplier documented
- [x] Both template directives documented with context
- [x] FormValueControl<number> documented; ControlValueAccessor absence explicitly stated
- [x] ngModel/formControl/formControlName unsupported — noted prominently
- [x] Full keyboard map verified against source calculateNewValue()
- [x] All ARIA attributes verified against slider.component.html
- [x] Inputs table sorted A→Z (value listed last per model convention)
- [x] SliderLabelPosition, Orientation types expanded to literals (not exported from public API)
- [x] No internal computed signals, Tailwind classes, or data attributes exposed
- [ ] component-metadata.json is stale — needs `npm run build:metadata` after this pass
-->
