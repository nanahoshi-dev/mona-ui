## Overview

Give the sparkline its values and a name. It draws them from left to right, scaled to fill its box, which is 6rem wide and 1.5rem tall unless a class sizes it.

**Use Sparkline when:**

- A trend matters more than its values: in a table row, a dashboard tile or a sentence.
- Many small charts should compare at a glance, on one scale.

To read values off axes, see a tooltip or interact with the data, use a [chart](/components/chart).

## Import & Quick Start

```typescript
import { SparklineComponent } from "@nanahoshi/mona-ui/sparkline";
```

```html
<mona-sparkline aria-label="Visitors per day" [data]="visitors" />
```

```typescript
protected readonly visitors = [320, 410, 380, 520, 490, 610, 580, 720];
```

## Examples

### Line, area, column and win-loss

`type` sets how the values are drawn. A column sparkline stands its bars on zero, in the error color below it. A win-loss sparkline draws a bar up for each positive value, down for each negative one, and a short tick for each zero, all of one height.

```example
sparkline/types
```

### Smooth and stepped lines

`curve` sets how a line or an area joins its values, with the same choices as a chart's line series:

- `"linear"`, the default, joins them with straight segments.
- `"monotone-x"` draws a smooth curve that never swings past the values, so none looks higher or lower than it is.
- `"natural"` is smoother still, but it can overshoot where the values rise and fall sharply.
- `"step"` changes halfway between values.
- `"step-after"` holds each value until the next, for something that changes at a moment, such as a price, a plan or a stock level.

Columns and win-loss bars ignore it.

```example
sparkline/curves
```

### In a table

Give every row's sparkline the same `min` and `max`, and they share a scale, so their heights compare. `markers` puts a dot on the latest week.

```example
sparkline/table
```

### Markers and a reference line

`markers` marks the first, the last, the lowest and the highest values with dots. `referenceValue` draws a dashed line at a target or an average, and the range widens to show it. `color` sets the sparkline's color, and `format` how the summary reads its values.

```example
sparkline/reference
```

## Appearance & Styling

The sparkline is an inline block, aligned to the middle of the text around it. Size it with a class, such as `class="h-8 w-40"`.

Its colors are custom properties, so a class or a style sheet can set them too:

| Custom property | Input | Default | Colors |
| --- | --- | --- | --- |
| `--mona-sparkline-color` | `color` | The first chart color, `--color-chart-1` | The line, the area, columns above zero and wins |
| `--mona-sparkline-negative-color` | `negativeColor` | The error color, `--color-error` | Columns below zero and losses |

The line is 1.5 pixels wide and markers are 5 pixels across, whatever the sparkline's size. An area under the line is a wash of its color, with the line carrying the shape. Keep a color you choose at 3:1 against the background, as the default chart colors are. In forced colors, the sparkline is drawn in the system's text color.

## Behavior

### Values and gaps

`data` takes the values in order. A `null`, or anything that isn't a finite number, leaves a gap: the line breaks there, and a value alone between gaps shows as a dot. Gaps keep their place, so the values on either side stay where they'd be. A curve joins each run of values between gaps on its own.

### The range

Without `min` and `max`, the lowest value is at the bottom and the highest at the top. Columns always take zero into the range, as they stand on it, and so does a reference value. Values outside a range you set are drawn at its edge. When all the values are the same, the line runs across the middle. A `"natural"` curve can swing a little past the lowest and highest values, and out of the box; `"monotone-x"` stays inside it.

An area fills down to zero when the values cross it, and to the bottom edge when they're all above it.

### Direction

Values run from left to right in right-to-left layouts too, as on a chart's axis.

## Accessibility

The sparkline is an image (`role="img"`) to assistive technology. `aria-label` names it, and a summary of its values describes it: "12 values, first 6, last 15, lowest 4, highest 18", or for a win-loss sparkline, "7 wins, 3 losses, 1 draw". Without a name, the summary is its name. `format` sets how the summary formats values, such as a currency, in the locale's number format.

When the text beside a sparkline already gives its values, set `decorative` to hide it from assistive technology.

The sparkline isn't focusable and has no keyboard interaction.

### ARIA

| Attribute | When present | Value |
| --- | --- | --- |
| `role` | Unless `decorative` | `"img"` |
| `aria-label` | Unless `decorative` | The `aria-label` input, or the summary without one |
| `aria-describedby` | With a name, or `aria-describedby` given | The ids given, then the summary's |
| `aria-hidden` | `decorative` is set | `"true"` |
