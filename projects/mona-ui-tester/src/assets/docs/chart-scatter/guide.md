## Overview

Pick the series by how many numbers each row has.

| Series | Use it for | Reads |
| :--- | :--- | :--- |
| `mona-scatter-series` | The relationship between two numbers: correlation, clusters and outliers. | `field` |
| `mona-bubble-series` | The same, with a third number shown as the area of each marker, such as population or revenue. | `field`, `sizeField` |

**Use something else when:**

- The X values are categories, such as products or months by name. Scatter and bubble series need a numeric or time X axis, so use bars, see [Bar & Waterfall](/components/chart-bar).
- The rows are a sequence and the reader should follow it from one to the next. A line connects them, see [Line & Area](/components/chart-line-area).
- The third number matters as much as the other two. Readers compare areas far less precisely than positions, so give it an axis of its own in a second chart.

The chart, axes, legend, tooltip and interaction parts these series sit in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    ScatterSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Fuel use by weight" class="h-72 w-full" xField="weight" [data]="cars">
    <mona-chart-x-axis title="Weight (kg)" />
    <mona-chart-y-axis title="L/100 km" />
    <mona-scatter-series field="consumption" name="Cars" />
    <mona-chart-tooltip />
</mona-chart>
```

Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

Each series reads its rows from the chart's `data`, unless it has its own `data`. It takes the X value from the chart's `xField`, or from its own `xField`, the Y value from `field`, and a bubble's size from `sizeField`. A field is a property name or an accessor, `(row, index) => value`.

| Input | Scatter | Bubble |
| :--- | :---: | :---: |
| `field`, `xField`, `data`, `keyField` | ✓ | ✓ |
| `sizeField`, `sizeFormatter` | | ✓ |
| `pointRadius` | ✓ | |
| `minRadius`, `maxRadius` | | ✓ |
| `color`, `fillOpacity`, `strokeColor`, `strokeWidth` | ✓ | ✓ |
| `dataLabels`, `downsampling`, `valueFormatter` | ✓ | ✓ |

`keyField` names a value that identifies a row across data changes, such as an id, so the chart can tell which marker moved rather than which was replaced. Without it, rows are matched by their X value, and rows that share one by their order.

### Templates

- `ng-template[monaChartDataLabel]`, inside a series, replaces the text of its data labels. The context is a `ChartDataLabelContext`, with `formattedValue`, `formattedX`, `xValue`, `yValue` and `datum`, and for a bubble `sizeValue` and `formattedSize`. Turn `dataLabels` on as well.
- The chart, axis, legend and tooltip templates are described on [Chart Overview](/components/chart).

## Examples

### Correlation

Two scatter series, each with its own `data`, share the chart's `xField`. A larger `pointRadius` on the second tells them apart without relying on color, and `valueFormatter` adds the unit to the tooltip.

```example
chart-scatter/correlation
```

### Bubbles on a log axis

A bubble series sizes each marker by `sizeField`. Here the X axis is `type="log"`, since incomes span two orders of magnitude, `minRadius` and `maxRadius` widen the size range, and `sizeFormatter` writes the population in the tooltip.

```example
chart-scatter/bubble
```

### Dense data

Twenty thousand markers are more than the plot can show apart, so by default the chart draws a representative subset, and the tooltip still finds every row, drawn or not. Switch to every marker to compare, and zoom in with the wheel or by pinching: the chart draws more of the rows as fewer are in view.

```example
chart-scatter/dense
```

## Appearance & Styling

| Input | Values | Effect |
| :--- | :--- | :--- |
| `pointRadius` | Pixels, from `1` to `100` | The radius of every scatter marker. Defaults to `4`. |
| `minRadius`, `maxRadius` | Pixels, from `1` to `100` | The radius of the smallest and the largest bubble. When unset, they come from the theme, or are `4` and `24`. When `minRadius` is the larger, the two are swapped. |
| `fillOpacity` | A number from `0` to `1` | How opaque the markers are. Defaults to `0.9` for scatter and `0.55` for bubbles, so overlapping bubbles stay visible. |
| `strokeColor` | Any CSS color | The outline. A scatter marker is outlined in the surface color by default, which separates touching markers; a bubble is outlined in its own color. |
| `strokeWidth` | Pixels | The width of the outline. Defaults to `1.5`; `0` removes it, which helps dense data. |
| `color` | Any CSS color, or a CSS variable such as `var(--color-chart-3)` | Replaces the palette color. By default series take `--color-chart-1` to `--color-chart-5` in order. A `text-*` class on the series sets it too. |

## Theming

These custom properties set the defaults of every scatter or bubble series inside the element that declares them, so a theme can set them once. An input on the series wins over them.

| Property | Default | Sets |
| :--- | :--- | :--- |
| `--mona-chart-point-radius` | `4` | `pointRadius` |
| `--mona-chart-marker-fill-opacity` | `0.9` scatter, `0.55` bubble | `fillOpacity`, falling back to `--mona-chart-fill-opacity` |
| `--mona-chart-marker-stroke-color` | Surface color for scatter, series color for bubbles | `strokeColor` |
| `--mona-chart-marker-stroke-width` | `1.5` | `strokeWidth` |
| `--mona-chart-bubble-min-radius` | `4` | `minRadius` of a bubble series |
| `--mona-chart-bubble-max-radius` | `24` | `maxRadius` of a bubble series |

```css
.dense-charts {
    --mona-chart-point-radius: 2;
    --mona-chart-marker-stroke-width: 0;
}
```

The bubble radii have no custom property: set `minRadius` and `maxRadius` on the series.

## Behavior

### X axis

Scatter and bubble series need a continuous X axis: `linear`, `log`, `symlog`, `pow`, `sqrt`, `time` or `utc`. An `auto` X axis is `linear` when the X values are numbers and `time` when they are dates. When the X values are text, or the X axis is `category`, the series draws nothing, and a development warning says why.

### Missing and invalid values

A row is left out when its X value doesn't fit the axis, its Y value isn't a finite number, or, for a bubble, its size is missing, zero or negative. Left-out rows don't count toward the axis ranges or the bubble sizes. Numbers written as text, such as `"12.5"`, are read as numbers for Y and size.

### Bubble size

- A bubble's area, not its radius, is proportional to its size, so a value twice as large covers twice the area. The smallest size gets `minRadius` and the largest `maxRadius`.
- The size range covers every visible bubble series on the chart, so the same size draws the same bubble in each. Hiding a series from the legend recomputes the range from the series that remain.
- When every bubble has the same size, each is drawn halfway between `minRadius` and `maxRadius`.
- `sizeFormatter` formats the size in the tooltip, the data label context and screen reader announcements. Without it, sizes are written in compact notation, such as `1.4K`.

### Overlapping markers

Markers are drawn in the order of the series, then of the rows, so a later row covers an earlier one. When markers overlap, the pointer picks the one on top. Put the largest bubbles first in the data so the smaller ones stay visible and reachable, or lower `fillOpacity`.

### Value formatting

`valueFormatter` formats a series' Y values in its tooltip, data labels and screen reader announcements, and leaves the axis ticks alone. The X value in the tooltip uses the X axis `formatter`. Without either, numbers and dates follow the library locale.

### Data labels

`dataLabels` writes each marker's Y value beside it. `position: "auto"` tries above, below, ahead and behind the marker, then its center, and skips a label that would collide. `inside-start`, `inside-center` and `inside-end` fall back to `center`, and `outside-start` and `outside-end` to `bottom` and `top`. Label a few markers rather than all: on dense data most labels collide and are skipped. The shared options are on [Chart Overview](/components/chart), under Data labels.

### Navigation

With `navigation` on and a scatter or bubble series in the chart, `zoomAxes` and `panAxes` of `"auto"` zoom and pan X and Y together, since both are continuous. Over an axis, the wheel and a drag zoom or pan that axis alone. Set them to `"x"` or `"y"` to lock the other axis.

### Dense data

- When more markers are in view than `downsampling.threshold`, by default the larger of 2,000 and four times the plot width in pixels, the chart draws a representative subset spread over the plot. `maxPoints` caps the markers drawn, and a higher `samplesPerPixel` keeps more of them.
- Scatter and bubble series always use their own spatial reducer, so the `algorithm` option doesn't change what they draw.
- Hover, click and brushing still find the exact row under the pointer, drawn or not, and the bubble sizes still come from every row. Keyboard navigation and data labels follow the markers that are drawn.
- A series' `downsampling` overrides the chart's, and `false` draws every marker. The rules are on [Chart Overview](/components/chart), under High-density downsampling.

### Two-way binding

`[(visible)]` holds whether the series is shown. The legend sets it when the user toggles the series.

## Accessibility

The chart is the focusable element, and these series add no roles of their own. Each marker is announced with its series name, X value and formatted Y value, and a bubble adds its size, so give each series a `name`, title both axes, and use `valueFormatter` and `sizeFormatter` to add units the reader would otherwise miss.

- **Don't rely on color alone.** Tell series apart by `pointRadius` or `strokeColor` as well, and keep the legend.
- **Don't rely on size alone.** Readers judge areas loosely. Put the exact size in the tooltip with `sizeFormatter`, and consider `dataTable` so the values can be read as a table.
- **Keep markers apart.** Overlapping markers hide each other from the pointer as well as the eye; a lower `fillOpacity` or a smaller radius helps.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Move to the markers at the next or previous X value, from left to right, wrapping at the ends. |
| `ArrowUp` / `ArrowDown` | Move between the markers that share the focused X value, in any series. |
| `Home` / `End` | Move to the first or last X value. |

Only the markers drawn in the plot can be focused, so zoom in to reach markers a dense chart leaves out. The rest of the keys, including selection, brushing and navigation, are listed on [Chart Overview](/components/chart).
