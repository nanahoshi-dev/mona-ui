## Overview

The circular progress bar communicates a quantified progress value within an explicit range. An indeterminate mode plays a continuous rotation animation for tasks where the completion value is unknown.

**Use `CircularProgressBarComponent` when you need to:**

- Show a compact, self-contained progress indicator in a card, dashboard cell, or list item
- Communicate upload, download, or calculation progress in a round visual form
- Display an indeterminate spinner while waiting for an operation of unknown duration

**Use `ProgressBarComponent` instead when:**

- A horizontal bar fits the layout better

## Import & Basic Usage

```typescript
import { CircularProgressBarComponent } from "@mirei/mona-ui";
```

Add `CircularProgressBarComponent` to your standalone component's `imports` array.

**Determinate progress** — bind `value` and optionally `min` / `max`:

```html
<mona-circular-progress-bar
    [value]="uploadPercent"
    aria-label="Upload progress">
</mona-circular-progress-bar>
```

**Indeterminate** — use when the completion percentage is unknown:

```html
<mona-circular-progress-bar
    [indeterminate]="true"
    aria-label="Loading">
</mona-circular-progress-bar>
```

**Custom range** — `min` and `max` default to 0 / 100 but accept any numeric range:

```html
<mona-circular-progress-bar
    [value]="completedSteps"
    [min]="0"
    [max]="totalSteps"
    aria-label="Step completion">
</mona-circular-progress-bar>
```

**Dynamic color** — pass a string or a function that maps the current percentage to a color:

```html
<!-- Fixed color -->
<mona-circular-progress-bar [value]="75" color="#6366f1"></mona-circular-progress-bar>

<!-- Function — green when complete, amber otherwise -->
<mona-circular-progress-bar [value]="progress" [color]="getColor"></mona-circular-progress-bar>
```

```typescript
protected getColor = (percent: number): string =>
    percent >= 100 ? "#22c55e" : "#f59e0b";
```

> Note: arrow functions cannot be defined inline in Angular templates. Assign the function to a class member and reference it by name.

## Appearance & Styling

### Size

The `size` input controls the outer dimension of the SVG in pixels. Both width and height are set to the same value.

| `size` value | Rendered size |
|--------------|---------------|
| `60`         | 60 × 60 px    |
| `100`        | 100 × 100 px (default) |
| `160`        | 160 × 160 px  |

### Stroke thickness

`thickness` controls the stroke width of both the track and the progress arc in pixels. Increasing it reduces the effective radius. The default of `6` suits most sizes; reduce it for small sizes or increase it for bold indicators.

### Color

When `color` is empty the arc color falls back to `var(--color-primary)`. The track (the full circle behind the arc) always uses the `var(--color-input-border)` design token.

### Visual states

| State           | Appearance                                                   |
|-----------------|--------------------------------------------------------------|
| Default         | Arc rendered at `value` percentage of the circumference      |
| Indeterminate   | Arc rendered as a fixed partial stroke, rotating continuously |
| Disabled        | Reduced opacity, non-interactive                             |

### Track animation

When `animate` is `true` (the default), the arc transitions its fill and color on each value change. Set `[animate]="false"` to disable all transitions — useful when updating `value` at high frequency (e.g., a real-time byte counter).

### Custom class

Merge additional Tailwind or custom classes onto the host element via the `class` attribute:

```html
<mona-circular-progress-bar [value]="75" class="shadow-md"></mona-circular-progress-bar>
```

### Custom label template

By default the component renders the computed percentage number inside the circle. Replace it with `ng-template[monaCircularProgressBarLabelTemplate]` for full control:

```html
<mona-circular-progress-bar [value]="steps" [max]="totalSteps" aria-label="Steps">
    <ng-template monaCircularProgressBarLabelTemplate
                 let-value
                 let-min="min"
                 let-max="max"
                 let-percent="percent">
        <span class="text-xs font-semibold">{{ value }} / {{ max }}</span>
    </ng-template>
</mona-circular-progress-bar>
```

The template context exposes four variables:

| Variable   | Type     | Description                                  |
|------------|----------|----------------------------------------------|
| `$implicit` | `number` | The raw `value` input — use `let-value`       |
| `min`      | `number` | The raw `min` input                           |
| `max`      | `number` | The raw `max` input                           |
| `percent`  | `number` | Computed percentage (0–100, rounded to 2 dp)  |

The label is hidden in indeterminate mode. Importing the context type:

```typescript
import type { LabelTemplateContext } from "@mirei/mona-ui";
```

## Accessibility Notes

The host element carries `role="progressbar"`. The component manages the following ARIA attributes automatically:

| Attribute        | When present       | Value                        |
|------------------|--------------------|------------------------------|
| `aria-valuemin`  | Determinate mode   | Bound to `min`               |
| `aria-valuemax`  | Determinate mode   | Bound to `max`               |
| `aria-valuenow`  | Determinate mode   | Bound to `value`             |
| `aria-busy`      | Indeterminate mode | `true`                       |
| `aria-disabled`  | `disabled` is true | `true`                       |

Consumer responsibilities:

- Set `aria-label` to name what the indicator measures (e.g., `"Upload progress"`). When omitted, assistive technology announces the role and numeric values without context.
- Set `aria-valuetext` in indeterminate mode to provide a localized state announcement (e.g., `"Loading"`) so screen readers announce state rather than silence.

## API

### `CircularProgressBarComponent`

**Selector:** `mona-circular-progress-bar`

#### Inputs

| Name             | Type                                      | Default | Description |
|------------------|-------------------------------------------|---------|-------------|
| `animate`        | `boolean`                                 | `true`  | Enables CSS transitions on the arc fill and color. Set to `false` when updating `value` at a high frequency. |
| `aria-label`     | `string`                                  | `''`    | Accessible name for the host element. Describe what the indicator measures (e.g., `"Upload progress"`). When empty, assistive technology announces the role without context. |
| `aria-valuetext` | `string`                                  | `''`    | Human-readable override for the `aria-valuenow` announcement. Useful in indeterminate mode — set to a localized string such as `"Loading"`. When empty, assistive technology falls back to the numeric value. |
| `class`          | `string`                                  | `''`    | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `color`          | `string \| ((percent: number) => string)` | `''`    | Accent color of the progress arc. When empty, falls back to the primary theme color. Pass a function to return a color based on the current percentage (0–100). |
| `disabled`       | `boolean`                                 | `false` | Renders the component with reduced visual emphasis and removes pointer interaction. |
| `indeterminate`  | `boolean`                                 | `false` | Activates indeterminate mode when the completion value is unknown. The label is hidden and `aria-busy` is set on the host element. `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` are removed. |
| `max`            | `number`                                  | `100`   | Upper bound of the value range. Must be greater than `min`. |
| `min`            | `number`                                  | `0`     | Lower bound of the value range. |
| `size`           | `number`                                  | `100`   | Diameter of the indicator in pixels. Controls both width and height of the host element. |
| `thickness`      | `number`                                  | `6`     | Stroke width of the circular track in pixels. |
| `value`          | `number`                                  | `0`     | Current progress value within `[min, max]`. Values outside the range are clamped before rendering; non-finite values are treated as `0`. |

`CircularProgressBarComponent` has no event outputs.

### `CircularProgressBarLabelTemplateDirective`

**Selector:** `ng-template[monaCircularProgressBarLabelTemplate]`

Structural template directive that replaces the default numeric label inside the circle. The template is hidden when `indeterminate` is `true`. Import alongside the component:

```typescript
import {
    CircularProgressBarComponent,
    CircularProgressBarLabelTemplateDirective
} from "@mirei/mona-ui";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source
- [x] aria-valuenow/min/max removed in indeterminate mode (WAI-ARIA 1.2 compliance)
- [x] aria-busy="true" added in indeterminate mode
- [x] aria-valuetext input documented and host binding present
- [x] aria-valuenow bound to value(), not progress()
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

