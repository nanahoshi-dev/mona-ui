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
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
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
<mona-progress-bar [value]="75" color="#6366f1" aria-label="Quota used"></mona-progress-bar>

<!-- Dynamic -->
<mona-progress-bar [value]="progress" [color]="getColor" aria-label="Upload progress"></mona-progress-bar>
```

```typescript
protected getColor = (percent: number): string =>
    percent >= 100 ? "#22c55e" : "#6366f1";
```

> Arrow functions cannot be defined inline in Angular templates. Assign the function to a class member and reference it by name.

`color` sets the fill only. The label keeps its own color, so set `labelStyles` if your fill needs a different one. `color` doesn't apply while disabled.

**Label visibility and position:**

```html
<!-- Hide the label -->
<mona-progress-bar [value]="50" [labelVisible]="false"></mona-progress-bar>

<!-- Label at the start -->
<mona-progress-bar [value]="50" labelPosition="start"></mona-progress-bar>
```

## Appearance & Styling

### Rounded presets

| `rounded` | Shape                       |
|-----------|-----------------------------|
| `none`    | No rounding                 |
| `small`   | Slight rounding             |
| `medium`  | Moderate rounding (default) |
| `large`   | Strong rounding             |
| `full`    | Pill / fully rounded        |

### Label alignment

| `labelPosition` | Label alignment    |
|-----------------|--------------------|
| `start`         | Flush with the start of the bar, left in LTR and right in RTL |
| `center`        | Centered (default) |
| `end`           | Flush with the end of the bar, right in LTR and left in RTL |

### Visual states

| State         | Appearance                                                    |
|---------------|---------------------------------------------------------------|
| Default       | Fill extends from the start of the bar to `value` percentage of its width |
| Indeterminate | Repeating diagonal stripe animation, or still stripes under `prefers-reduced-motion`; label hidden |
| Disabled      | Disabled colors, non-interactive                              |
| Zero value    | Fill area is transparent (bar appears empty)                  |

### Track animation

When `animate` is `true` (the default), the progress track transitions its fill and color on each value change. Set `[animate]="false"` to disable all transitions — useful when updating value rapidly (e.g., a real-time byte counter).

### Custom label template

The default label is the percentage, formatted for the locale, such as `40%`, `33,33 %` in German or `%40` in Turkish. Replace it with any content using `ng-template[monaProgressBarLabelTemplate]`:

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
| `$implicit` | `number` | The raw `value` input — use `let-value`      |
| `min`       | `number` | The raw `min` input                          |
| `max`       | `number` | The raw `max` input                          |
| `percent`   | `number` | Computed percentage (0–100, rounded to 2 dp) |

The template is rendered twice, one copy over the fill and one over the track, which keeps text readable against both. So don't put ids or anything with a side effect in it.

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

| Attribute       | When present       | Value            |
|-----------------|--------------------|------------------|
| `aria-label`    | Always             | The `aria-label` input, or the localized "Progress" |
| `aria-valuemin` | Determinate mode   | Bound to `min`   |
| `aria-valuemax` | Determinate mode   | Bound to `max`   |
| `aria-valuenow` | Determinate mode   | `value`, clamped to the range. A non-finite value counts as `min`, the same place the bar draws it. |
| `aria-disabled` | `disabled` is true | `true`           |

With a range the wrong way round, where `max` is below `min`, the bar reports no values and a warning is logged in development.

Consumer responsibilities:

- Set `aria-label`, or `aria-labelledby`, which takes precedence, to name what the bar measures (e.g., `"Upload progress"`). "Progress" is only a fallback, and it doesn't tell two bars apart.
- Set `aria-valuetext` when a human-readable announcement is needed. In indeterminate mode, use a localized string such as `"Loading"` so screen readers announce state rather than silence.

## API

### `ProgressBarComponent`

**Selector:** `mona-progress-bar`

#### Inputs

| Name             | Type                                                 | Default    | Description                                                                                                                                                                                                                                                                                    |
|------------------|------------------------------------------------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `animate`        | `boolean`                                            | `true`     | Enables CSS transitions on the fill track. Set to `false` when updating `value` at a high frequency.                                                                                                                                                                                           |
| `aria-label`     | `string`                                             | `''`       | Accessible label on the host. Describe what the progress bar measures (e.g., `"Upload progress"`). When empty, falls back to the localized "Progress". |
| `aria-valuetext` | `string`                                             | `''`       | Overrides the numeric `aria-valuenow` announcement for assistive technology. Particularly useful in indeterminate mode — set to a localized string such as `"Loading"` so screen readers announce state rather than silence. When empty, assistive technology falls back to the numeric value. |
| `class`          | `string`                                             | `''`       | Additional CSS classes merged onto the host element via `tailwind-merge`.                                                                                                                                                                                                                      |
| `color`          | `string \| ((percent: number) => string)`            | `''`       | Fill color of the progress track. When empty, falls back to the primary theme color. Pass a function to return a color based on the current percentage (0–100).                                                                                                                                |
| `disabled`       | `boolean`                                            | `false`    | Renders the component with disabled colors and pointer events removed. `color` doesn't apply while disabled. |
| `indeterminate`  | `boolean`                                            | `false`    | Activates a repeating diagonal stripe animation. The label is hidden in this mode (including custom `monaProgressBarLabelTemplate`). `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` are removed from the host element. |
| `labelPosition`  | `'start' \| 'center' \| 'end'`                       | `'center'` | Horizontal alignment of the label within the bar.                                                                                                                                                                                                                                              |
| `labelStyles`    | `Partial<CSSStyleDeclaration>`                       | `{}`       | Inline styles applied to the default label `<span>`. Has no effect when `monaProgressBarLabelTemplate` is used.                                                                                                                                                                                |
| `labelVisible`   | `boolean`                                            | `true`     | Hides the label when `false`. Has no effect in indeterminate mode (label is always hidden).                                                                                                                                                                                                    |
| `max`            | `number`                                             | `100`      | Maximum value of the progress range.                                                                                                                                                                                                                                                           |
| `min`            | `number`                                             | `0`        | Minimum value of the progress range.                                                                                                                                                                                                                                                           |
| `rounded`        | `'none' \| 'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Border-radius preset applied to the host and both track elements.                                                                                                                                                                                                                              |
| `value`          | `number`                                             | `0`        | Current progress value within `[min, max]`. Values outside the range are clamped, for the bar and for `aria-valuenow`. Non-finite values (e.g. `NaN`) count as `min`. |

`ProgressBarComponent` has no event outputs.

### `ProgressBarLabelTemplateDirective`

**Selector:** `ng-template[monaProgressBarLabelTemplate]`

Structural template directive that replaces the default percentage label. The template is hidden when `indeterminate` is `true`. Import alongside the component:

```typescript
import { ProgressBarComponent, ProgressBarLabelTemplateDirective } from "@nanahoshi/mona-ui/progress-bar";
```

The `LabelPosition` type used by the `labelPosition` input is also exported for use in consuming components:

```typescript
import type { LabelPosition } from "@nanahoshi/mona-ui/progress-bar";
```

---

<!-- verification-checklist
- [x] API definitions and defaults verified against source and component-metadata.json
- [x] aria-valuenow/min/max removed in indeterminate mode (WAI-ARIA 1.2 compliance)
- [x] aria-busy isn't used; indeterminate is expressed by leaving out aria-valuenow
- [x] aria-valuetext input documented — overrides numeric value announcement
- [x] aria-valuenow bound to the normalized range, not the raw value()
- [x] aria-label input present on source and host binding
- [x] aria-disabled uses disabled() || null
- [x] getPercentage clamps to [0, 100] and guards against non-finite values
- [x] data-[prev] CSS selector aligned with template attribute
- [x] animate=false suppresses transitions on both prev and next tracks
- [x] LabelPosition exported from public API (index.ts)
- [x] Basic examples compile against the public API surface
- [x] No internal or unexported APIs exposed
-->
