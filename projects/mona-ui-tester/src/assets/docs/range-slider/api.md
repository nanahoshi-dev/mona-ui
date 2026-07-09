## Overview

Use `RangeSliderComponent` when the user must select both a lower and upper bound simultaneously — for example, a price filter, a date window, or a speed range.

**Use RangeSlider instead of Slider when:**

- The user needs to constrain both ends of a range
- Two independent values must stay ordered (lower ≤ upper)

**Use Slider when:**

- The user selects a single value within a fixed lower bound

The selected range is always returned as a sorted `[min, max]` tuple — even if the user drags the lower handle past the upper handle during interaction.

## Import & Quick Start

```typescript
import { RangeSliderComponent } from "@nanahoshi/mona-ui";
```

**Direct value binding:**

```html
<mona-range-slider [(value)]="priceRange" aria-labelledby="price-label"></mona-range-slider>
```

**Signal forms integration:**

```typescript
import { form } from "@angular/forms/signals";

protected readonly filterForm = form({ price: [0, 100] as [number, number] });
```

```html
<mona-range-slider [formField]="filterForm.price" aria-labelledby="price-label"></mona-range-slider>
```

> **`RangeSliderComponent` does NOT implement `ControlValueAccessor`.** It cannot be used with `[(ngModel)]`, `[formControl]`, or `formControlName`. Use the signal forms `[formField]` binding instead.

## Template Hooks

`RangeSliderComponent` shares the same structural template directives as `SliderComponent`.

### Custom handle

`monaSliderHandleTemplate` applies to **both** handles. The implicit variable is the current value of the respective handle:

```typescript
import { RangeSliderComponent, SliderHandleTemplateDirective } from "@nanahoshi/mona-ui";
```

```html
<mona-range-slider [(value)]="range" aria-labelledby="range-label">
    <ng-template monaSliderHandleTemplate let-value>
        <span class="badge">{{ value }}</span>
    </ng-template>
</mona-range-slider>
```

### Custom tick labels

`monaSliderTickValueTemplate` replaces default numeric labels. Only takes effect when both `showTicks` and `showLabels` are `true`.

## Feature Examples

### Tick marks and labels

```html
<mona-range-slider
    [minValue]="0"
    [maxValue]="1000"
    [step]="100"
    [showTicks]="true"
    [showLabels]="true"
    [(value)]="priceRange"
    aria-labelledby="price-label">
</mona-range-slider>
```

### Vertical orientation

```html
<mona-range-slider
    orientation="vertical"
    [minValue]="0"
    [maxValue]="100"
    [(value)]="range"
    aria-labelledby="range-label"
    style="height: 300px">
</mona-range-slider>
```

### Overlapping handles

When the two handles share the same value, the secondary (upper) handle is rendered on top by default. Dragging either handle past the other will cause them to swap roles.

### Disabled state

```html
<mona-range-slider [disabled]="true" [value]="[20, 80]" aria-labelledby="range-label"></mona-range-slider>
```

### Custom accessible handle labels

The primary (lower) handle defaults to `"Minimum value"` and the secondary (upper) handle defaults to `"Maximum value"`. Override with `aria-label-start` and `aria-label-end`:

```html
<mona-range-slider
    [(value)]="priceRange"
    aria-label-start="Minimum price"
    aria-label-end="Maximum price">
</mona-range-slider>
```

## Keyboard Interaction

Each handle is independently focusable. Tab to switch between handles; the same key bindings apply to whichever handle has focus.

| Key                               | Action                                  |
|-----------------------------------|-----------------------------------------|
| `ArrowRight` / `ArrowUp`          | Increase focused handle value by `step` |
| `ArrowLeft` / `ArrowDown`         | Decrease focused handle value by `step` |
| `Shift` + `ArrowRight`/`ArrowUp`  | Increase by `step × shiftMultiplier`    |
| `Shift` + `ArrowLeft`/`ArrowDown` | Decrease by `step × shiftMultiplier`    |
| `Home`                            | Jump focused handle to `minValue`       |
| `End`                             | Jump focused handle to `maxValue`       |
| `PageUp`                          | Increase by 10% of the total range      |
| `PageDown`                        | Decrease by 10% of the total range      |

## Accessibility Notes

`RangeSliderComponent` renders two focusable `div` elements each with `role="slider"`. Both handles share the same `aria-valuemin` and `aria-valuemax`. Each handle manages its own `aria-valuenow`.

| Attribute          | When present                     | Value                                                         |
|--------------------|----------------------------------|---------------------------------------------------------------|
| `role`             | Always (each handle)             | `"slider"`                                                    |
| `aria-valuemin`    | Always                           | `minValue`                                                    |
| `aria-valuemax`    | Always                           | `maxValue`                                                    |
| `aria-valuenow`    | Always                           | Current value of that handle                                  |
| `aria-valuetext`   | When `ariaValueText` is provided | Return value of the provided function for that handle's value |
| `aria-orientation` | Always                           | `"horizontal"` or `"vertical"`                                |
| `aria-disabled`    | When disabled                    | `true`                                                        |
| `aria-required`    | When `required` is `true`        | `true`                                                        |
| `aria-invalid`     | When `invalid` is `true`         | `true`                                                        |
| `tabindex`         | Always                           | `0` (enabled) or `-1` (disabled)                              |

**Consumer responsibilities:**

Each handle must have its own accessible name. Use `aria-label-start` and `aria-label-end` to customize the labels for the lower and upper handles respectively (defaults: `"Minimum value"` / `"Maximum value"`).

Use `aria-labelledby` to associate a group-level label with both handles simultaneously.

## Forms Integration

`RangeSliderComponent` implements `FormValueControl<[number, number]>` from `@angular/forms/signals`. Connect it using the `[formField]` binding:

```typescript
import { form } from "@angular/forms/signals";

protected readonly filterForm = form({ range: [10, 90] as [number, number] });
```

```html
<mona-range-slider [formField]="filterForm.range" aria-labelledby="range-label"></mona-range-slider>
```

The `touch` output fires when either handle loses focus or its value changes, signaling the field as touched.

> `ControlValueAccessor` is not implemented. `[(ngModel)]`, `[formControl]`, and `formControlName` are not supported.

## API

### `RangeSliderComponent`

**Selector:** `mona-range-slider`

Implements `FormValueControl<[number, number]>` from `@angular/forms/signals`.

#### Inputs

| Name                  | Type                                                 | Default           | Description                                                                                                                                                                                                                                                              |
|-----------------------|------------------------------------------------------|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aria-label`          | `string \| null`                                     | `null`            | Accessible name applied to both handles simultaneously. When provided, takes precedence over `aria-label-start`/`aria-label-end`. Prefer `aria-labelledby` to associate a visible group label.                                                                           |
| `aria-label-end`      | `string \| null`                                     | `'Maximum value'` | Accessible name for the upper-value (secondary) handle.                                                                                                                                                                                                                  |
| `aria-label-start`    | `string \| null`                                     | `'Minimum value'` | Accessible name for the lower-value (primary) handle.                                                                                                                                                                                                                    |
| `aria-labelledby`     | `string \| null`                                     | `null`            | ID of an external element that provides the accessible name for both handles.                                                                                                                                                                                            |
| `ariaValueText`       | `((value: number) => string) \| null`                | `null`            | Human-readable override for the `aria-valuenow` announcement. The function is called independently for each handle's value.                                                                                                                                              |
| `disabled`            | `boolean`                                            | `false`           | Renders the component with reduced visual emphasis and removes pointer interaction.                                                                                                                                                                                      |
| `handleClasses`       | `string \| string[]`                                 | `[]`              | Additional CSS classes to apply to both slider handles.                                                                                                                                                                                                                  |
| `handleStyles`        | `Partial<CSSStyleDeclaration>`                       | `{}`              | Additional inline styles to apply to both slider handles.                                                                                                                                                                                                                |
| `invalid`             | `boolean`                                            | `false`           | Marks the control as invalid for form validation purposes, reflecting `aria-invalid` on both handle elements.                                                                                                                                                            |
| `labelPosition`       | `'before' \| 'after'`                                | `'after'`         | Position of the tick label list relative to the track.                                                                                                                                                                                                                   |
| `labelStep`           | `number`                                             | `1`               | Controls which tick labels are shown — only every n-th label is rendered.                                                                                                                                                                                                |
| `largeTickStep`       | `number \| null`                                     | `null`            | Controls which ticks render at large size — only every n-th tick is enlarged. Pass `null` to disable large ticks.                                                                                                                                                        |
| `maxValue`            | `number`                                             | `10`              | Upper bound of the selectable range. Must be greater than `minValue`.                                                                                                                                                                                                    |
| `minValue`            | `number`                                             | `0`               | Lower bound of the selectable range.                                                                                                                                                                                                                                     |
| `orientation`         | `'horizontal' \| 'vertical'`                         | `'horizontal'`    | Layout orientation of the component.                                                                                                                                                                                                                                     |
| `required`            | `boolean`                                            | `false`           | Marks the slider as required in a form context, reflecting `aria-required` on both handle elements.                                                                                                                                                                      |
| `rounded`             | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'full'`          | Border-radius preset applied to both slider handles.                                                                                                                                                                                                                     |
| `selectionBackground` | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`            | Background color of the filled selection area between the two handles. Accepts a CSS color string or a `CSSStyleDeclaration` partial.                                                                                                                                    |
| `shiftMultiplier`     | `number`                                             | `10`              | Multiplier applied to the step when the user holds Shift while pressing an arrow key.                                                                                                                                                                                    |
| `showLabels`          | `boolean`                                            | `false`           | Displays value labels alongside tick marks. Only takes effect when `showTicks` is `true`.                                                                                                                                                                                |
| `showTicks`           | `boolean`                                            | `false`           | Displays tick marks at each step position along the track.                                                                                                                                                                                                               |
| `smallTickStep`       | `number`                                             | `1`               | Controls how many ticks are visible — only every n-th tick is rendered.                                                                                                                                                                                                  |
| `step`                | `number`                                             | `1`               | Increment applied when a handle value changes via keyboard navigation.                                                                                                                                                                                                   |
| `trackBackground`     | `string \| Partial<CSSStyleDeclaration> \| null`     | `null`            | Background color of the unfilled track portions. Accepts a CSS color string or a `CSSStyleDeclaration` partial.                                                                                                                                                          |
| `trackSize`           | `string \| number`                                   | `undefined`       | Width (vertical orientation) or height (horizontal orientation) of the track. Accepts a pixel number or any CSS length string.                                                                                                                                           |
| `value`               | `[number, number]`                                   | `[0, 10]`         | Two-way bindable. Selected range as `[minimum, maximum]`. Values outside `[minValue, maxValue]` are clamped; the tuple is always sorted so index 0 ≤ index 1. Implements `FormValueControl<[number, number]>`, enabling use with the signal forms `[formField]` binding. |

#### Outputs

| Name    | Type   | Description                                                                                                                                                       |
|---------|--------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `touch` | `void` | Emitted when either handle loses focus or its value changes via keyboard navigation. Consumed by the signal forms `Field` directive to mark the field as touched. |

---

### Template Directives

These structural directives are projected inside `<mona-range-slider>` and are shared with `SliderComponent`.

| Directive selector                         | Template context                   | Description                                                                                                             |
|--------------------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| `ng-template[monaSliderHandleTemplate]`    | `$implicit: number` (handle value) | Replaces the default handle element. Applied to both handles; the implicit variable is each handle's own current value. |
| `ng-template[monaSliderTickValueTemplate]` | `$implicit: number` (tick value)   | Replaces the default numeric tick label. Has no effect unless both `showTicks` and `showLabels` are `true`.             |

**Imports:**

```typescript
import {
    RangeSliderComponent,
    SliderHandleTemplateDirective,
    SliderTickValueTemplateDirective
} from "@nanahoshi/mona-ui";
```

---

<!-- verification-checklist
- [x] API table cross-checked against current source (slider-base + range-slider component)
- [x] value model documented as two-way bindable [number, number]
- [x] aria-label-start and aria-label-end documented with correct defaults
- [x] aria-label behavior on both handles noted (applies to both simultaneously)
- [x] touch output documented
- [x] ariaValueText documented as per-handle function
- [x] required and invalid documented with aria reflection on both handles
- [x] Template directives documented with context — handles receive their own value
- [x] FormValueControl<[number, number]> documented; ControlValueAccessor absence explicitly stated
- [x] Overlapping handles behavior documented
- [x] Full keyboard map verified against source
- [x] All ARIA attributes verified against range-slider.component.html
- [x] Inputs table sorted A→Z (value listed last per model convention)
- [x] No internal computed signals, Tailwind classes, or data attributes exposed
- [ ] component-metadata.json is stale — needs `npm run build:metadata` after this pass
-->
