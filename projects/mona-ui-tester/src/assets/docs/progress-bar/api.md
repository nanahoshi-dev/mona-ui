## Overview

`ProgressBarComponent` renders a full-width horizontal bar that fills proportionally to a numeric value within an explicit range. The label remains readable regardless of the current fill level.

An indeterminate mode is available for tasks where the total duration is unknown. In that mode the default label is hidden and a repeating diagonal stripe animation fills the bar.

**Use `ProgressBarComponent` when you need to:**

- Show file upload, download, or step-based task progress inline in a layout
- Display a multi-step wizard progress indicator in a horizontal banner
- Communicate an indeterminate loading state with a full-width animated bar

**Use `CircularProgressBarComponent` instead when:**

- A compact, self-contained round indicator suits the layout better (e.g., a dashboard card)

## Import & Basic Usage

```typescript
import { ProgressBarComponent } from "@mirei/mona-ui";
```

Add `ProgressBarComponent` to your standalone component's `imports` array.

**Determinate** — bind `value`, optionally `min` / `max`:

```html
<mona-progress-bar [value]="uploadPercent" aria-label="Upload progress"></mona-progress-bar>
```

**Indeterminate** — use when the completion value is unknown:

```html
<mona-progress-bar [indeterminate]="true" aria-label="Loading"></mona-progress-bar>
```

**Custom range:**

```html
<mona-progress-bar
    [value]="completedSteps"
    [min]="0"
    [max]="totalSteps"
    aria-label="Step completion">
</mona-progress-bar>
```

**Dynamic color** — pass a CSS string or a function that maps the current percentage to a color:

```html
<!-- Fixed -->
<mona-progress-bar [value]="75" color="#6366f1"></mona-progress-bar>

<!-- Dynamic -->
<mona-progress-bar [value]="progress" [color]="getColor"></mona-progress-bar>
```

```typescript
protected getColor = (percent: number): string =>
    percent >= 100 ? "#22c55e" : "#6366f1";
```

> Arrow functions cannot be defined inline in Angular templates. Assign the function to a class member and reference it by name.

**Label visibility and position:**

```html
<!-- Hide the label -->
<mona-progress-bar [value]="50" [labelVisible]="false"></mona-progress-bar>

<!-- Label at the start -->
<mona-progress-bar [value]="50" labelPosition="start"></mona-progress-bar>
```

## Appearance & Styling

### Rounded presets

| `rounded` | Shape                      |
|-----------|----------------------------|
| `none`    | No rounding                |
| `small`   | Slight rounding            |
| `medium`  | Moderate rounding (default)|
| `large`   | Strong rounding            |
| `full`    | Pill / fully rounded       |

### Label alignment

| `labelPosition` | Label alignment |
|-----------------|-----------------|
| `start`         | Flush left      |
| `center`        | Centered (default) |
| `end`           | Flush right     |

### Visual states

| State         | Appearance                                                        |
|---------------|-------------------------------------------------------------------|
| Default       | Fill extends from left to `value` percentage of the bar width     |
| Indeterminate | Repeating diagonal stripe animation; label hidden                 |
| Disabled      | Reduced opacity, non-interactive                                  |
| Zero value    | Fill area is transparent (bar appears empty)                      |

### Track animation

When `animate` is `true` (the default), the progress track transitions its fill and color on each value change. Set `[animate]="false"` to disable all transitions — useful when updating value rapidly (e.g., a real-time byte counter).

### Custom label template

Replace the default `progress%` label with any content using `ng-template[monaProgressBarLabelTemplate]`:

```html
<mona-progress-bar [value]="steps" [max]="totalSteps" aria-label="Steps">
    <ng-template monaProgressBarLabelTemplate
                 let-value
                 let-min="min"
                 let-max="max"
                 let-percent="percent">
        <span class="text-xs font-medium">{{ value }} / {{ max }}</span>
    </ng-template>
</mona-progress-bar>
```

The template context exposes four variables:

| Variable    | Type     | Description                                  |
|-------------|----------|----------------------------------------------|
| `$implicit` | `number` | The raw `value` input — use `let-value`       |
| `min`       | `number` | The raw `min` input                           |
| `max`       | `number` | The raw `max` input                           |
| `percent`   | `number` | Computed percentage (0–100, rounded to 2 dp)  |

The template renders in a way that keeps text readable against both the filled and unfilled areas.

### Custom label styles

Use `labelStyles` to apply arbitrary inline styles to the default `<span>` label. This has no effect when a custom `monaProgressBarLabelTemplate` is in use:

```html
<mona-progress-bar [value]="60" [labelStyles]="{ fontWeight: '700', fontSize: '10px' }">
</mona-progress-bar>
```

### Custom class

Merge additional Tailwind or custom classes onto the host element via the `class` attribute. They are applied through `tailwind-merge` to avoid conflicts with the computed classes:

```html
<mona-progress-bar [value]="80" class="h-3"></mona-progress-bar>
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

- Set `aria-label` to name what the bar measures (e.g., `"Upload progress"`). When omitted, assistive technology announces the role and numeric values without context.
- Set `aria-valuetext` when a human-readable announcement is needed. In indeterminate mode, use a localized string such as `"Loading"` so screen readers announce state rather than silence.

## API

### `ProgressBarComponent`

**Selector:** `mona-progress-bar`

#### Inputs

| Name            | Type                                      | Default    | Description |
|-----------------|-------------------------------------------|------------|-------------|
| `animate`       | `boolean`                                 | `true`     | Enables CSS transitions on the fill track. Set to `false` when updating `value` at a high frequency. |
| `aria-label`    | `string`                                  | `''`       | Accessible label forwarded to the host `aria-label` attribute. Describe what the progress bar measures (e.g., `"Upload progress"`). When empty, assistive technology announces the role and numeric values without a label. |
| `aria-valuetext` | `string`                                 | `''`       | Overrides the numeric `aria-valuenow` announcement for assistive technology. Particularly useful in indeterminate mode — set to a localized string such as `"Loading"` so screen readers announce state rather than silence. When empty, assistive technology falls back to the numeric value. |
| `class`         | `string`                                  | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`. |
| `color`         | `string \| ((percent: number) => string)` | `''`       | Fill color of the progress track. When empty, falls back to the primary theme color. Pass a function to return a color based on the current percentage (0–100). |
| `disabled`      | `boolean`                                 | `false`    | Renders the component at reduced opacity with pointer events removed. |
| `indeterminate` | `boolean`                                 | `false`    | Activates a repeating diagonal stripe animation. The label is hidden in this mode (including custom `monaProgressBarLabelTemplate`). `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` are removed from the host element; `aria-busy="true"` is added. |
| `labelPosition` | `'start' \| 'center' \| 'end'`            | `'center'` | Horizontal alignment of the label within the bar. |
| `labelStyles`   | `Partial<CSSStyleDeclaration>`            | `{}`       | Inline styles applied to the default label `<span>`. Has no effect when `monaProgressBarLabelTemplate` is used. |
| `labelVisible`  | `boolean`                                 | `true`     | Hides the label when `false`. Has no effect in indeterminate mode (label is always hidden). |
| `max`           | `number`                                  | `100`      | Maximum value of the progress range. |
| `min`           | `number`                                  | `0`        | Minimum value of the progress range. |
| `rounded`       | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the host and both track elements. |
| `value`         | `number`                                  | `0`        | Current progress value within `[min, max]`. Values outside the range are clamped to `[0, 100]` before rendering. Non-finite values (e.g. `NaN`) are treated as `0`. |

`ProgressBarComponent` has no event outputs.

### `ProgressBarLabelTemplateDirective`

**Selector:** `ng-template[monaProgressBarLabelTemplate]`

Structural template directive that replaces the default percentage label. The template is hidden when `indeterminate` is `true`. Import alongside the component:

```typescript
import {
    ProgressBarComponent,
    ProgressBarLabelTemplateDirective
} from "@mirei/mona-ui";
```

The `LabelPosition` type used by the `labelPosition` input is also exported for use in consuming components:

```typescript
import type { LabelPosition } from "@mirei/mona-ui";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] aria-valuenow/min/max removed in indeterminate mode (WAI-ARIA 1.2 compliance)
- [x] aria-busy="true" added in indeterminate mode
- [x] aria-valuetext input documented — overrides numeric value announcement
- [x] aria-valuenow bound to value(), not progress()
- [x] aria-label input present on source and host binding
- [x] aria-disabled uses disabled() || null
- [x] getPercentage clamps to [0, 100] and guards against non-finite values
- [x] data-[prev] CSS selector aligned with template attribute
- [x] animate=false suppresses transitions on both prev and next tracks
- [x] LabelPosition exported from public API (index.ts)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->
