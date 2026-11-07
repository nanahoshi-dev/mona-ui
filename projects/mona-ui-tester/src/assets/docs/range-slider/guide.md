## Overview

Use `RangeSliderComponent` when the user must select both a lower and upper bound simultaneously — for example, a price filter, a date window, or a speed range.

**Use RangeSlider instead of Slider when:**

- The user needs to constrain both ends of a range
- Two independent values must stay ordered (lower ≤ upper)

**Use Slider when:**

- The user selects a single value within a fixed lower bound

A user change always writes a sorted `[min, max]` tuple. Dragging a handle stops at the other handle, as the keyboard does.

## Import & Quick Start

```typescript
import { RangeSliderComponent } from "@nanahoshi/mona-ui/slider";
```

**Direct value binding:**

```html
<mona-range-slider [(value)]="priceRange" aria-labelledby="price-label"></mona-range-slider>
```

**Signal forms integration:**

```typescript
import { signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";

protected readonly filterForm = form(signal({ price: [0, 100] as [number, number] }));
```

```html
<mona-range-slider [formField]="filterForm.price" aria-labelledby="price-label"></mona-range-slider>
```

## Template Hooks

`RangeSliderComponent` shares the same structural template directives as `SliderComponent`.

### Custom handle

`monaSliderHandleTemplate` applies to **both** handles. The implicit variable is the current value of the respective handle:

```typescript
import { RangeSliderComponent, SliderHandleTemplateDirective } from "@nanahoshi/mona-ui/slider";
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

When the two handles share the same value, the upper handle is on top by default, and a handle moved onto the other stays on top. The direction you drag in decides which handle moves, so neither can get stuck.

### Disabled state

```html
<mona-range-slider [disabled]="true" [value]="[20, 80]" aria-labelledby="range-label"></mona-range-slider>
```

### Read-only state

`readonly` blocks dragging, track clicks and keys. Both handles stay focusable and readable, and get `aria-readonly="true"`. With `[formField]`, the signal forms `readonly` rule writes it.

```html
<mona-range-slider readonly [value]="[20, 80]" aria-labelledby="range-label"></mona-range-slider>
```

### Custom accessible handle labels

The primary (lower) handle defaults to the localized `"Minimum value"` and the secondary (upper) handle defaults to the localized `"Maximum value"`. Override with `aria-label-start` and `aria-label-end`:

```html
<mona-range-slider
    [(value)]="priceRange"
    aria-label-start="Minimum price"
    aria-label-end="Maximum price">
</mona-range-slider>
```

## Values Out of Range

The range slider never writes a corrected value on its own. A value that is out of range, off the step grid or unsorted is shown at the nearest valid values, and the model keeps its own until the user changes it. The next user change saves a valid tuple. This way a `maxValue` that loads late can't overwrite saved data.

In development, the range slider warns once per instance when this happens, including for a `maxValue` that loads late. It also warns once when the minimum isn't lower than the maximum.

`maxValue` can always be reached, even when it isn't a whole number of steps from `minValue`.

## Keyboard Interaction

Each handle is independently focusable. Tab to switch between handles; the same key bindings apply to whichever handle has focus. A handle stops at the other one.

| Key                               | Action                                                 |
|-----------------------------------|--------------------------------------------------------|
| `ArrowRight` / `ArrowUp`          | Increase focused handle value by `step`                |
| `ArrowLeft` / `ArrowDown`         | Decrease focused handle value by `step`                |
| `Shift` + `ArrowRight`/`ArrowUp`  | Increase by `step × shiftMultiplier`                   |
| `Shift` + `ArrowLeft`/`ArrowDown` | Decrease by `step × shiftMultiplier`                   |
| `Home`                            | Move focused handle toward `minValue`                  |
| `End`                             | Move focused handle toward `maxValue`                  |
| `PageUp`                          | Increase by 10% of the total range, at least `step`    |
| `PageDown`                        | Decrease by 10% of the total range, at least `step`    |

In RTL, `ArrowLeft` increases and `ArrowRight` decreases.

## Accessibility Notes

`RangeSliderComponent` has role `group` and renders two focusable `div` elements each with `role="slider"`. Each handle's range ends at the other handle.

| Attribute          | When present                      | Value                                                         |
|--------------------|-----------------------------------|---------------------------------------------------------------|
| `role`             | Always (each handle)              | `"slider"`                                                    |
| `aria-valuemin`    | Always                            | Lower handle: `minValue`. Upper handle: the lower handle's value |
| `aria-valuemax`    | Always                            | Lower handle: the upper handle's value. Upper handle: `maxValue` |
| `aria-valuenow`    | Always                            | Current value of that handle                                  |
| `aria-valuetext`   | When `ariaValueText` is provided  | Return value of the provided function for that handle's value |
| `aria-orientation` | Always                            | `"horizontal"` or `"vertical"`                                |
| `aria-disabled`    | When disabled                     | `true`                                                        |
| `aria-readonly`    | When read-only                    | `true`                                                        |
| `aria-invalid`     | When `invalid` and `touched`      | `true`                                                        |
| `aria-describedby` | When `aria-describedby` is set    | The given id, on each handle                                  |
| `tabindex`         | Always                            | `0` (enabled) or `-1` (disabled)                              |

The range slider has no required state, because ARIA doesn't allow one on role `slider`. It has no `min` and `max` inputs either, so use `minValue` and `maxValue`.

**Accessible name:**

Each handle has its own name, from `aria-label-start` and `aria-label-end` (defaults: the localized `"Minimum value"` / `"Maximum value"`).

- `aria-labelledby` labels the group, and each handle reads it before its own name, such as "Price Minimum value". A `mona-label` with `text` around it, or bound with `[for]="ref"`, does the same. A click on a wrapping caption focuses the lower handle.
- `aria-label` names the group only. The handles keep just their own names.

A string `for` can't work, because the range slider has no native input.

## Forms Integration

`RangeSliderComponent` implements `FormValueControl<[number, number]>` from `@angular/forms/signals`. Connect it using the `[formField]` binding:

```typescript
import { signal } from "@angular/core";
import { form, FormField } from "@angular/forms/signals";

protected readonly filterForm = form(signal({ range: [10, 90] as [number, number] }));
```

```html
<mona-range-slider [formField]="filterForm.range" aria-labelledby="range-label"></mona-range-slider>
```

`FormField` writes `value`, `disabled`, `invalid`, `readonly` and `touched`. Don't set those on the same element, because Angular rejects the template. The `touch` output fires when either handle loses focus, marking the field as touched.

`RangeSliderComponent` doesn't implement `ControlValueAccessor`. `[(ngModel)]` binds to its `value` model through Angular's support for custom controls. Prefer `[formField]`.
