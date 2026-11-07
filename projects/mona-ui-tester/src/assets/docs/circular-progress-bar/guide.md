## Overview

The circular progress bar communicates a quantified progress value within an explicit range. An indeterminate mode plays a continuous rotation animation for tasks where the completion value is unknown, or a slow fade under `prefers-reduced-motion`.

**Use `CircularProgressBarComponent` when you need to:**

- Show a compact, self-contained progress indicator in a card, dashboard cell, or list item
- Communicate upload, download, or calculation progress in a round visual form
- Display an indeterminate spinner while waiting for an operation of unknown duration

**Use `ProgressBarComponent` instead when:**

- A horizontal bar fits the layout better

## Import & Basic Usage

```typescript
import { CircularProgressBarComponent } from "@nanahoshi/mona-ui/circular-progress-bar";
```

Add `CircularProgressBarComponent` to your standalone component's `imports` array.

**Determinate progress** — bind `value` and optionally `min` / `max`:

```html
<mona-circular-progress-bar
    [value]="uploadPercent"
    aria-label="Upload progress">
</mona-circular-progress-bar>
```

## Examples

### Size, thickness and color

`color` takes a string, or a function that maps the current percentage to a color. Arrow functions cannot be defined inline in Angular templates, so assign the function to a class member and reference it by name.

```example
circular-progress-bar/sizes
```

### Indeterminate

Use it when the completion percentage is unknown. Set `aria-valuetext` so screen readers announce a state.

```example
circular-progress-bar/indeterminate
```

### Custom range and label

`min` and `max` default to 0 / 100 but accept any numeric range. `ng-template[monaCircularProgressBarLabelTemplate]` replaces the percentage inside the circle.

```example
circular-progress-bar/label
```

## Appearance & Styling

### Size

The `size` input controls the outer dimension of the SVG in pixels. Both width and height are set to the same value.

| `size` value | Rendered size          |
|--------------|------------------------|
| `60`         | 60 × 60 px             |
| `100`        | 100 × 100 px (default) |
| `160`        | 160 × 160 px           |

### Stroke thickness

`thickness` controls the stroke width of both the track and the progress arc in pixels. The stroke fits inside `size`, so increasing it reduces the effective radius. The default of `6` suits most sizes; reduce it for small sizes or increase it for bold indicators.

### Color

When `color` is empty the arc color falls back to `var(--color-primary)`. The track (the full circle behind the arc) always uses the `var(--color-surface-muted)` design token.

### Visual states

| State         | Appearance                                                    |
|---------------|---------------------------------------------------------------|
| Default       | Arc rendered at `value` percentage of the circumference       |
| Indeterminate | Arc rendered as a fixed partial stroke, rotating continuously, or fading under `prefers-reduced-motion` |
| Disabled      | Reduced opacity, non-interactive                              |

### Track animation

When `animate` is `true` (the default), the arc transitions its fill and color on each value change. Set `[animate]="false"` to disable all transitions — useful when updating `value` at high frequency (e.g., a real-time byte counter).

### Custom class

Merge additional Tailwind or custom classes onto the host element via the `class` attribute:

```html
<mona-circular-progress-bar [value]="75" class="shadow-md" aria-label="Upload progress"></mona-circular-progress-bar>
```

### Custom label template

By default the component renders the percentage inside the circle, formatted for the locale, such as `40%`, `33,33 %` in German or `%40` in Turkish. Hide it with `[labelVisible]="false"`, or replace it with `ng-template[monaCircularProgressBarLabelTemplate]` for full control, as in the custom label example.

The template context exposes four variables:

| Variable    | Type     | Description                                  |
|-------------|----------|----------------------------------------------|
| `$implicit` | `number` | The raw `value` input — use `let-value`      |
| `min`       | `number` | The raw `min` input                          |
| `max`       | `number` | The raw `max` input                          |
| `percent`   | `number` | Computed percentage (0–100, rounded to 2 dp) |

The label is hidden in indeterminate mode. Importing the context type:

```typescript
import type { LabelTemplateContext } from "@nanahoshi/mona-ui/circular-progress-bar";
```

## Accessibility Notes

The host element carries `role="progressbar"`. The component manages the following ARIA attributes automatically:

| Attribute       | When present       | Value            |
|-----------------|--------------------|------------------|
| `aria-label`    | Always             | The `aria-label` input, or the localized "Progress" |
| `aria-valuemin` | Determinate mode   | Bound to `min`   |
| `aria-valuemax` | Determinate mode   | Bound to `max`   |
| `aria-valuenow` | Determinate mode   | `value`, clamped to the range. A non-finite value counts as `min`, the same place the ring draws it. |
| `aria-disabled` | `disabled` is true | `true`           |

With a range that holds nothing, where `max` isn't above `min`, the ring reports no values and a warning is logged in development.

Consumer responsibilities:

- Set `aria-label`, or `aria-labelledby`, which takes precedence, to name what the indicator measures (e.g., `"Upload progress"`). "Progress" is only a fallback, and it doesn't tell two apart.
- Set `aria-valuetext` in indeterminate mode to provide a localized state announcement (e.g., `"Loading"`) so screen readers announce state rather than silence.

<!-- verification-checklist
- [x] API definitions and defaults verified against source
- [x] aria-valuenow/min/max removed in indeterminate mode (WAI-ARIA 1.2 compliance)
- [x] aria-busy isn't used; indeterminate is expressed by leaving out aria-valuenow
- [x] aria-valuetext input documented and host binding present
- [x] aria-valuenow bound to the normalized range, not the raw value()
- [x] aria-label input present on source and host binding
- [x] aria-disabled uses disabled() || null
- [x] animate input documented — suppresses arc transitions
- [x] class input documented — merged via tailwind-merge
- [x] getPercentage clamps to [0, 100] and guards non-finite values
- [x] center computed fixed — returns plain object, not nested computed()
- [x] LabelTemplateContext exported from public API (index.ts)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
- [x] ARIA details moved to Accessibility Notes section only
-->
