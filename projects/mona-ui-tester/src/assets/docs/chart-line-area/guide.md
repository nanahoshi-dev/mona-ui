## Overview

Pick the series by what the reader should compare.

| Series | Use it for | Reads |
| :--- | :--- | :--- |
| `mona-line-series` | Trends and comparisons across several series, where the shape of the change matters more than the amount. | `field` |
| `mona-area-series` | Volume over time, and the parts of a total when stacked. | `field` |
| `mona-range-area-series` | An interval at each X, such as a forecast's confidence band or a day's low and high. | `fromField`, `toField` |

**Use something else when:**

- The X values are unrelated categories with no order, such as products or regions. Bars compare them better, see [Bar & Waterfall](/components/chart-bar).
- Each point stands alone and the order of the points means nothing. Use a scatter series, see [Scatter & Bubble](/components/chart-scatter).
- You need the open, high, low and close of each period. Use a candlestick or OHLC series, see [Financial](/components/chart-financial).

The chart, axes, legend, tooltip and interaction parts these series sit in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Monthly visitors" class="h-72 w-full" xField="month" [data]="visitors">
    <mona-chart-x-axis />
    <mona-chart-y-axis />
    <mona-line-series field="web" name="Web" />
    <mona-chart-legend />
    <mona-chart-tooltip />
</mona-chart>
```

Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

Each series reads its rows from the chart's `data`, unless it has its own `data`. It takes the X value from the chart's `xField`, or from its own `xField`, and the Y value from `field`, or from `fromField` and `toField` for a range area. A field is a property name or an accessor, `(row, index) => value`.

| Input | Line | Area | Range area |
| :--- | :---: | :---: | :---: |
| `field` | ✓ | ✓ | |
| `fromField`, `toField` | | | ✓ |
| `curve`, `connectNulls`, `showPoints`, `pointRadius`, `strokeWidth` | ✓ | ✓ | ✓ |
| `lineStyle` | ✓ | ✓ | |
| `fillMode` | | ✓ | |
| `fillOpacity` | | ✓ | ✓ |
| `stack`, `stackMode` | | ✓ | |
| `dataLabels`, `downsampling`, `valueFormatter` | ✓ | ✓ | ✓ |

### Templates

- `ng-template[monaChartDataLabel]`, inside a series, replaces the text of its data labels. The context is a `ChartDataLabelContext`, with `formattedValue`, `value`, `datum` and the stack values. Turn `dataLabels` on as well.
- The chart, axis, legend and tooltip templates are described on [Chart Overview](/components/chart).

## Examples

### Line

Series read their values from the chart's `data`, using `field` for the value and the chart's `xField` for the category. `lineStyle` tells two series apart without relying on color.

```example
chart-line-area/line
```

### Stacked areas

Area series with the same `stack` name stack on top of each other, in the order they're declared. `stackMode="percent"` turns the totals into each series' share of 100%.

```example
chart-line-area/stacked-area
```

### Range band

A range area fills between `fromField` and `toField`. Here it shows each month's range behind a line of the average, and `valueFormatter` adds the unit to the tooltip.

```example
chart-line-area/range-band
```

## Appearance & Styling

| Input | Values | Effect |
| :--- | :--- | :--- |
| `curve` | `"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"` | How the line goes between points. `monotone-x` is smooth and never overshoots a value, so it suits most data. `natural` is smoother but can swing past the points. `step` changes at each point, `step-after` just before the next. |
| `lineStyle` | `"solid"`, `"dashed"`, `"dotted"` | The stroke pattern. Use it for a forecast or a target, or to tell series apart in print and in forced colors. |
| `fillMode` | `"gradient"`, `"solid"` | A gradient fades to the baseline; a solid fill is even. Use solid for stacked areas, so the bands stay distinct. |
| `fillOpacity` | A number from `0` to `1` | The most opaque the fill gets. |
| `showPoints`, `pointRadius` | `boolean`, pixels | Markers at each value. They also help when few points are far apart. |
| `strokeWidth` | Pixels | The width of the line. |
| `color` | Any CSS color | Replaces the palette color. By default series take `--color-chart-1` to `--color-chart-5` in order. |

## Behavior

### Missing values

A row whose value is `null`, `undefined` or not a number leaves a gap. With `connectNulls`, the line or area goes straight across it instead. A range area needs both `fromField` and `toField`, and a row missing either one is a gap.

### Stacking

- Area series stack when their `stack` names match after trimming, so several stacks can share one chart. Bar series stack the same way, see [Bar & Waterfall](/components/chart-bar). Line and range area series don't stack.
- Every series in a stack needs the same `stackMode`. When they differ, or when the Y axis isn't `linear`, the group isn't stacked, and a development warning says why.
- A hidden series leaves its stack, and the series above it move down. With `stackMode="percent"` the shares are worked out again from the visible series.
- Stacked values, totals and percentages are in the tooltip and the data label context (`stackTotal`, `stackPercentage`).

### Value formatting

`valueFormatter` formats a series' values in its tooltip, data labels and screen reader announcements, and leaves the axis ticks alone. To format ticks, use the axis `formatter`. Without either, numbers and dates follow the library locale.

### Dense data

Line, unstacked area, stacked area and range area series on a continuous X axis (numbers or dates) reduce what they draw when they have more points than the plot has room for, and keep every point for hover, tooltips and selection. A series' `downsampling` overrides the chart's. The rules are on [Chart Overview](/components/chart), under High-density downsampling. A category X axis is never reduced.

### Two-way binding

`[(visible)]` holds whether the series is shown. The legend sets it when the user toggles the series.

## Accessibility

The chart is the focusable element, and these series add no roles of their own. Each point is announced with its series name, X value and formatted value, so give each series a `name`, and use `valueFormatter` to add a unit the reader would otherwise miss.

- **Don't rely on color alone.** Use `lineStyle` or `showPoints` to tell series apart, and keep the legend.
- **Areas hide what's behind them.** Prefer stacking, or a lower `fillOpacity`, over overlapping unstacked areas.
- **Range areas announce both ends.** A point reads as its range, from the low to the high value.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous X value. |
| `ArrowUp` / `ArrowDown` | Move to another series at the same X value. |
| `Home` / `End` | Move to the first or last X value. |

The rest of the keys, including selection, brushing and navigation, are listed on [Chart Overview](/components/chart).
