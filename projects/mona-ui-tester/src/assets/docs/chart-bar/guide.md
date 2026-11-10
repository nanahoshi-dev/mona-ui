## Overview

Pick the series by what the reader should compare.

| Series | Use it for | Reads |
| :--- | :--- | :--- |
| `mona-bar-series` | Amounts across categories, such as revenue per region. Several series sit side by side, or stack into a total or into shares of 100%. | `field` |
| `mona-range-bar-series` | An interval per category, such as a day's low and high, a price span or a tolerance. | `fromField`, `toField` |
| `mona-waterfall-series` | How a starting value becomes a final one through increases and decreases, such as a profit and loss bridge or a cash flow. | `field`, `kindField` |

Lay bars horizontally when the category names are long or there are many of them, as in a ranking. They're easier to read along a row than rotated under a column.

**Use something else when:**

- The X values are a continuous measure, such as dates you want spaced by time, and the shape of the change matters. Use a line or area series, see [Line & Area](/components/chart-line-area).
- The values are the parts of one whole and there are only a few of them. Use a pie or donut, see [Pie & Donut](/components/chart-pie).
- The stages narrow from one to the next, as in a sales pipeline. Use a funnel, see [Funnel](/components/chart-funnel).
- You need the open, high, low and close of each period. Use a candlestick or OHLC series, see [Financial](/components/chart-financial).

The chart, axes, legend, tooltip and interaction parts these series sit in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    BarSeriesComponent,
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Revenue by region" class="h-72 w-full" xField="region" [data]="revenue">
    <mona-chart-x-axis />
    <mona-chart-y-axis />
    <mona-bar-series field="total" name="Revenue" />
    <mona-chart-legend />
    <mona-chart-tooltip />
</mona-chart>
```

Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

Each series reads its rows from the chart's `data`, unless it has its own `data`. It takes the category from the chart's `xField`, or from its own `xField`, and the value from `field`, or from `fromField` and `toField` for a range bar. A field is a property name or an accessor, `(row, index) => value`.

| Input | Bar | Range bar | Waterfall |
| :--- | :---: | :---: | :---: |
| `field` | ✓ | | ✓ (default `"value"`) |
| `fromField`, `toField` | | ✓ (required) | |
| `kindField`, `startValue` | | | ✓ |
| `orientation` | ✓ | ✓ | |
| `stack`, `stackMode` | ✓ | | |
| `color` | ✓ | ✓ | |
| `increaseColor`, `decreaseColor`, `neutralColor`, `subtotalColor`, `totalColor` | | | ✓ |
| `borderRadius`, `fillOpacity`, `maxBarWidth`, `valueFormatter` | ✓ | ✓ | ✓ |
| `dataLabels` | ✓ | ✓ | |
| `showLabels`, `maxLabels`, `minLabelWidth` | | | ✓ |
| `showConnectors`, `connectorColor`, `connectorWidth`, `strokeColor`, `strokeWidth` | | | ✓ |
| `xAxisId`, `yAxisId` | ✓ | ✓ | |

### Waterfall steps

Each waterfall row is a step, and `kindField` (default `"kind"`) says what kind:

| Kind | Draws | Reads `field` |
| :--- | :--- | :--- |
| `"change"`, or no kind | A floating bar from the running total to the running total plus the value. Positive values are increases, negative ones decreases, and zero is no change. | Yes |
| `"subtotal"` | A bar from zero to the running total so far. The running total carries on after it. | No |
| `"total"` | The same bar as a subtotal, in the total color. Use it for the final result. | No |

The running total starts at `startValue`, which is `0` by default. The kind is matched without regard to case or surrounding spaces, and an unknown kind counts as a change, with a development warning.

### Templates

- `ng-template[monaChartDataLabel]`, inside a bar or range bar series, replaces the text of its data labels. The context is a `ChartDataLabelContext`, with `formattedValue`, `value`, `datum`, the stack values (`stackTotal`, `stackPercentage`) and, for a range bar, `fromValue`, `toValue`, `formattedFrom` and `formattedTo`. Turn `dataLabels` on as well.
- `ng-template[monaChartWaterfallLabelTemplate]`, inside a waterfall series, replaces the text of its step labels. The context is a `ChartWaterfallLabelTemplateContext`: `let-step` gives the step, with `kind`, `visualKind`, `value`, `deltaValue`, `cumulativeBefore`, `cumulativeAfter`, their formatted versions and `datum`. Turn `showLabels` on as well.
- The chart, axis, legend and tooltip templates are described on [Chart Overview](/components/chart).

## Examples

### Stacked bars

Bar series with the same `stack` name stack on top of each other, in the order they're declared, and `valueFormatter` adds the unit to the tooltip. Without `stack`, the same series would stand side by side in each quarter.

```example
chart-bar/bar
```

### Horizontal bars

`orientation="horizontal"` lays the bars along the X axis, which becomes the value axis, and puts the categories on the Y axis. Long names stay readable. `maxBarWidth` keeps a few bars from growing too thick, and `dataLabels` writes each value at the end of its bar.

```example
chart-bar/horizontal
```

### Range bars

A range bar spans `fromField` to `toField`. Here it shows each month's range of temperatures, with a line of the average in the same chart.

```example
chart-bar/range-bar
```

### Waterfall

A profit bridge from revenue to net profit. Rows without a value are subtotals and a total, which the chart works out. `showLabels` writes each step's value, and a `monaChartWaterfallLabelTemplate` puts the subtotals and the total in bold.

```example
chart-bar/waterfall
```

## Appearance & Styling

| Input | Values | Effect |
| :--- | :--- | :--- |
| `orientation` | `"vertical"`, `"horizontal"` | Upright columns, or rows along the X axis. Bars and range bars only. |
| `borderRadius` | Pixels, `4` by default | Rounds the end of a bar away from zero. In a stack only the outermost segment is rounded. Range bars and waterfall bars round all four corners. |
| `maxBarWidth` | Pixels | The most a bar's thickness can be. A narrower bar stays centered in its slot. In a stack the smallest `maxBarWidth` of its series applies. |
| `fillOpacity` | A number from `0` to `1` | The opacity of the fill. Bars are fully opaque by default. |
| `color` | Any CSS color | Replaces the palette color of a bar or range bar series. By default series take `--color-chart-1` to `--color-chart-5` in order. |
| `increaseColor`, `decreaseColor`, `neutralColor` | Any CSS color | The fill of waterfall changes that rise, fall or stay level. |
| `subtotalColor`, `totalColor` | Any CSS color | The fill of waterfall subtotals and totals. |
| `showConnectors`, `connectorColor`, `connectorWidth` | `boolean`, CSS color, pixels | The level lines joining each waterfall bar to the next, `1` pixel wide by default. A width of `0` hides them. |
| `strokeColor`, `strokeWidth` | CSS color, pixels | An outline around each waterfall bar. There's none by default. |

### Data labels

`dataLabels` on a bar or range bar series takes `true`, `false` or the options described on [Chart Overview](/components/chart). With `position: "auto"`, an unstacked bar tries outside its end first, then inside its end, then its middle. A stacked bar and a range bar try their middle first. A percent-stacked bar shows its share by default.

### Waterfall labels

`showLabels` writes the value of each waterfall step: the signed change, such as `+18`, for a change, and the running total for a subtotal or total. A label sits above a bar that rises and below one that falls, and moves inside the bar when there's no room. Bars narrower than `minLabelWidth` (default `24` pixels) get no label, and `maxLabels` (default `100`) keeps totals first, then subtotals, then the largest changes.

## Theming

Waterfall colors and sizes can also come from CSS custom properties, set on the chart or on the series through `class`. An input wins over its property.

| Property | Default |
| :--- | :--- |
| `--mona-chart-waterfall-increase-color` | `--color-emerald-600` |
| `--mona-chart-waterfall-decrease-color` | `--color-red-500` |
| `--mona-chart-waterfall-neutral-color` | `--color-muted-foreground` |
| `--mona-chart-waterfall-subtotal-color` | `--color-chart-2` |
| `--mona-chart-waterfall-total-color` | `--color-chart-1` |
| `--mona-chart-waterfall-connector-color` | `--color-muted-foreground` |
| `--mona-chart-waterfall-connector-width` | `1` |
| `--mona-chart-waterfall-stroke-color`, `--mona-chart-waterfall-stroke-width` | No outline |
| `--mona-chart-waterfall-fill-opacity` | `1` |
| `--mona-chart-waterfall-border-radius` | `4` |
| `--mona-chart-waterfall-label-color` | The foreground color, or a readable color on the bar for a label inside it |

## Behavior

### Category axis

Bars and range bars draw one band per category, so their category axis is always a category axis. Numbers such as years become categories too. On an upright chart the categories are on the X axis and the values on the Y axis; with `orientation="horizontal"` they swap. A category axis set to another `type`, or a value axis set to `"category"`, leaves the series out with a development warning. A bar series also needs a value axis that starts from zero, so a `log` value axis leaves it out.

### Grouping and stacking

- In each category, every unstacked bar series, every stack and every range bar series gets its own slot, side by side in the order they're declared.
- Bar series stack when their `stack` names match after trimming, so several stacks can share one chart. Area series stack the same way, see [Line & Area](/components/chart-line-area), but a bar and an area never stack together. Range bars don't stack.
- Positive values stack up from zero and negative values down from it, so a stack with both reaches either side of the axis.
- `stackMode="percent"` turns each value into its share of the positive, or negative, total in its category.
- Every series in a stack needs the same `stackMode`. When they differ, or the value axis isn't `linear`, the stack is left out and a development warning says why. Percent stacks and raw values can't share a value axis either. `stackMode` without a `stack` does nothing, with a warning.
- A hidden series leaves its stack, and the segments above it move down. With `stackMode="percent"` the shares are worked out again from the visible series.
- When a stacked series has two rows for one category, only the first is drawn.

### Horizontal charts

Only bar and range bar series can lie horizontally, and every visible one in the chart must use the same `orientation`. A horizontal chart with a line, area or another series type, or with bars of both orientations, logs a development warning and leaves the plot empty.

### Missing values

A bar whose value is `null`, `undefined` or not a number is not drawn, and the other series keep their slots. A range bar needs both `fromField` and `toField`, in either order, since it spans from the lower to the higher. A waterfall change without a value is skipped, and the running total goes on without it.

### Waterfall rules

- A waterfall must be the only series in its chart. A second waterfall, or any other series beside it, leaves the chart empty and logs a development warning.
- It's always upright. Its X axis is a category axis and its Y axis a linear one, whatever their `type`. Of the axis inputs, it uses `visible`, `position`, `title`, `titlePadding`, `labels`, `labelPadding`, `formatter`, `gridLines`, `axisLine`, `tickMarks` and `tickSize`, and on the Y axis also `min`, `max`, `nice` and `tickCount`. The X labels thin out when they don't fit.
- A step without a category is named "Step 1", "Step 2" and so on.
- The legend shows one entry for each kind of step the data has: increase, decrease, no change, subtotal and total. They can't be clicked, so `[(visible)]` is the only way to hide the series.

### Value formatting

`valueFormatter` formats a series' values in its tooltip, data labels and screen reader announcements. To format the axis ticks, use the axis `formatter`. A waterfall's Y axis without a `formatter` uses the series' `valueFormatter` for its ticks as well. For a waterfall change, the formatter gets the change; for a subtotal or total, the running total. Without either formatter, numbers follow the library locale, and a waterfall change shows its sign.

### Two-way binding

`[(visible)]` holds whether the series is shown. The legend sets it when the user toggles a bar or range bar series.

## Accessibility

The chart is the focusable element, and these series add no roles of their own. Each bar is announced with its series name, category and formatted value, so give each series a `name`, and use `valueFormatter` to add a unit the reader would otherwise miss. A range bar reads as its range, from one end to the other. A waterfall step reads as its change and the running total before and after it, such as "increase +18, running total 76 to 94", or as its subtotal or total.

- **Don't rely on color alone.** Keep the legend, and use data labels or the tooltip so the values can be read without telling colors apart. A waterfall's increase and decrease colors are green and red by default; with `showLabels` the signed labels carry the direction too, and the announcements always do.
- **Labels are hidden from screen readers.** Data labels and waterfall labels are `aria-hidden`, because the announcements already read the values. Don't put information in a label template that the announcements don't have.
- **Say what a percent stack shows.** Its axis and labels are shares, not amounts, so say so in the chart's `title` or `aria-description`.

### Keyboard Navigation

On an upright bar or range bar chart:

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous category. |
| `ArrowUp` / `ArrowDown` | Move to another series in the same category. |
| `Home` / `End` | Move to the first or last category. |

On a horizontal chart, `ArrowDown` and `ArrowUp` move between categories, and `ArrowRight` and `ArrowLeft` between the series in a category. In a waterfall, `ArrowRight` and `ArrowLeft` move from step to step and stop at the ends, and `Home` and `End` go to the first and last step.

The rest of the keys, including selection, brushing and navigation, are listed on [Chart Overview](/components/chart).
