## Overview

`CircularProgressBarComponent` communicates a quantified progress value within an explicit range using an SVG arc. The arc length, color, and label are all computed reactively from signal inputs. A separate indeterminate mode animates the arc in a continuous loop when the actual progress value is unknown.

The host element carries `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` bound to the component inputs. Provide `aria-label` to describe what the bar measures so that assistive technology can announce it meaningfully.

**Use `CircularProgressBarComponent` when you need to:**

- Show a compact, self-contained progress indicator in a card, dashboard cell, or list item
- Communicate upload, download, or calculation progress in a round visual form
- Display an indeterminate spinner while waiting for an operation of unknown duration

**Do not use `CircularProgressBarComponent` when:**

- A horizontal bar fits the layout better — use `ProgressBarComponent` instead
- The progress bar is purely decorative with no semantic meaning — even then, provide an empty `aria-label` and ensure adjacent text describes the context

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

## API

### `CircularProgressBarComponent`

**Selector:** `mona-circular-progress-bar`

#### Inputs

| Name            | Type                                      | Default | Description |
|-----------------|-------------------------------------------|---------|-------------|
| `aria-label`    | `string`                                  | `''`    | Accessible label forwarded to the host `aria-label` attribute. Describe what the progress bar measures (e.g., `"Upload progress"`). When empty, assistive technology announces the role and numeric values without a label. |
| `color`         | `string \| ((percent: number) => string)` | `''`    | Color of the progress arc. When empty, falls back to `var(--color-primary)`. Pass a function to return a color based on the current percentage (0–100). |
| `disabled`      | `boolean`                                 | `false` | Renders the component at reduced opacity with pointer events removed. |
| `indeterminate` | `boolean`                                 | `false` | Activates a continuous rotation animation when the completion value is unknown. The label is hidden in this mode. |
| `max`           | `number`                                  | `100`   | Maximum value of the progress range. |
| `min`           | `number`                                  | `0`     | Minimum value of the progress range. |
| `size`          | `number`                                  | `100`   | Width and height of the component in pixels. |
| `thickness`     | `number`                                  | `6`     | Stroke width of both the track and progress arc in pixels. |
| `value`         | `number`                                  | `0`     | Current progress value within `[min, max]`. Values outside the range are clamped visually but the raw value is still forwarded to `aria-valuenow`. |

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
- [x] aria-valuenow fix verified — now bound to value() not progress()
- [x] aria-label input added to source and host binding
- [x] LabelTemplateContext exported from public API (index.ts)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->

