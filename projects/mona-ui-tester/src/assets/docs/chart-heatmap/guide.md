## Overview

A heatmap answers "where is it high, and where is it low?" across two categories. Each row of data is one cell: a column, a row and a value, and the value picks the cell's color from a scale.

| Color mode | Use it for | Colors |
| :--- | :--- | :--- |
| `"sequential"` (default) | Amounts that run from low to high, such as visits, orders or load. | Two or more stops, from the lowest value to the highest. |
| `"diverging"` | Values that run both ways from a meaningful middle, such as a change, a difference from a target, or a temperature anomaly. | Exactly three stops: below, at and above the midpoint. |

**Use something else when:**

- Readers need to compare exact amounts. Color is hard to read precisely, so bars compare values better, see [Bar & Waterfall](/components/chart-bar).
- One of the dimensions is continuous time and the trend matters more than the pattern. Use a line or area series, see [Line & Area](/components/chart-line-area).
- Both dimensions are numbers and each point stands alone. Use a scatter or bubble series, see [Scatter & Bubble](/components/chart-scatter).

The chart, axes, legend, tooltip and interaction parts the series sits in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    HeatmapSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Visits by day and hour" class="h-80 w-full" xField="hour" [data]="visits">
    <mona-chart-x-axis />
    <mona-chart-y-axis />
    <mona-heatmap-series field="visits" name="Visits" yField="day" />
    <mona-chart-legend />
    <mona-chart-tooltip />
</mona-chart>
```

Each item of `visits` is one cell, such as `{ day: "Mon", hour: "09:00", visits: 42 }`. Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

| Part | Input | Description |
| :--- | :--- | :--- |
| Columns | `xField`, `xCategories` | The X category of each row. The series' `xField` wins over the chart's. |
| Rows | `yField`, `yCategories` | The Y category of each row. Required. |
| Value | `field` | The number that colors the cell. Required. |
| Color scale | `colorMode`, `colors`, `color`, `min`, `max`, `midpoint` | How values become colors. |
| Cells | `cellGap`, `borderRadius`, `strokeColor`, `strokeWidth`, `fillOpacity`, `showValues` | How each cell is drawn. |
| Color legend | `mona-chart-legend` | A gradient bar with the lowest, highest and, in diverging mode, the midpoint value. |

The series reads the chart's `data` unless it has its own `data`. A field is a property name or an accessor, `(row, index) => value`.

### Categories

Columns and rows appear in the order the data first uses them, left to right and top to bottom. `xCategories` and `yCategories` set the order instead:

- Listed categories come first, in the order given.
- A listed category with no data stays in the grid as an empty column or row.
- A category in the data but missing from the list is added after the listed ones.

A category is a string, a finite number, a boolean or a date. `"5"` and `5` are different categories. Dates are shown as numeric dates in the library locale; use the axis `formatter` to show them another way.

### Templates

The heatmap has no templates of its own. The tooltip, legend item, title, subtitle and no-data templates work as described on [Chart Overview](/components/chart). The tooltip context of a cell has `formattedXValue` for its column, `formattedYCategory` for its row, `formattedY` for its formatted value and `color` for its fill. Axis label templates aren't used by heatmap axes.

## Examples

### Weekly activity

A sequential scale from the theme's first chart color, with `showValues` writing each value inside its cell.

```example
chart-heatmap/weekly-activity
```

### Diverging scale

`colorMode="diverging"` with three `colors` centers the scale on `midpoint`, so values below and above it read as opposites. The legend sits at the end and shows the midpoint, and `valueFormatter` adds the sign and the unit.

```example
chart-heatmap/diverging
```

### Ordered categories and cell clicks

`xCategories` and `yCategories` fix the order of the columns and rows and keep a week with no data as an empty column. The chart's `pointClick` reports the clicked cell, also when the user presses Enter on it.

```example
chart-heatmap/cell-details
```

## Appearance & Styling

| Input | Values | Effect |
| :--- | :--- | :--- |
| `colorMode` | `"sequential"`, `"diverging"` | Whether the scale runs from low to high, or both ways from `midpoint`. |
| `colors` | An array of CSS colors | The color stops. Sequential takes two or more, spread evenly from the lowest value to the highest. Diverging takes exactly three. A stop may be a CSS variable, such as `"var(--color-chart-2)"`. |
| `color` | Any CSS color | Without `colors`, the high end of a sequential scale. It defaults to `--color-chart-1`. Diverging ignores it. |
| `min`, `max` | Numbers | The ends of the scale. Values beyond them take the end color. |
| `midpoint` | A number | The value at the middle color of a diverging scale. |
| `cellGap` | Pixels, default `1` | The space between cells. |
| `borderRadius` | Pixels, default `2` | The corner radius of each cell, at most half its size. |
| `strokeColor`, `strokeWidth` | A CSS color, pixels | A border around each cell. It needs both. |
| `fillOpacity` | `0` to `1`, default `1` | The opacity of the cells. |
| `showValues` | `boolean` | Writes each formatted value inside its cell. |

Colors between the stops are blended in the OKLab color space, so a ramp changes evenly in lightness. Without `colors`, a sequential scale runs from a pale blue to `color`, and a diverging one from blue through near-white to red.

- **Value labels** take white or a dark color, whichever contrasts more with the cell. A label is left out when its cell is too small for it.
- **Grid lines** between the columns and rows come from the axes. Turn them off with `[gridLines]="false"` on an axis.
- **Axis labels** are thinned when the columns or rows are too narrow for all of them, and the last one is always kept.

## Theming

These CSS variables, set on the series or on the chart, change the heatmap's defaults. An input with a value wins over its variable.

| Variable | Default | Effect |
| :--- | :--- | :--- |
| `--mona-chart-heatmap-low-color` | A pale blue, or blue in diverging mode | The lowest color when there are no `colors`. |
| `--mona-chart-heatmap-mid-color` | Near-white | The middle color of a diverging scale when there are no `colors`. |
| `--mona-chart-heatmap-high-color` | `color`, or red in diverging mode | The highest color when there are no `colors`. It wins over `color`. |
| `--mona-chart-heatmap-cell-border-color` | None | The border color, like `strokeColor`. |
| `--mona-chart-heatmap-cell-border-width` | `0` | The border width, like `strokeWidth`. |
| `--mona-chart-heatmap-cell-radius` | `2` | The corner radius, like `borderRadius`. |
| `--mona-chart-heatmap-fill-opacity` | `1` | The cell opacity, like `fillOpacity`. |
| `--mona-chart-heatmap-hover-outline-color` | `--color-border-control` | The outline of the cell under the pointer. |

The grid lines use `--mona-chart-grid-color`, and the focused cell's outline uses `--color-ring`.

## Behavior

### One heatmap per chart

A chart draws one heatmap and nothing else. With a second heatmap, or with another kind of series beside it, the chart draws nothing and a development warning says why. The axes are always category axes: an axis `type` other than `"auto"` or `"category"` is treated as a category axis, with a development warning.

### Value domain

- Without `min` and `max`, the scale runs from the lowest to the highest value in the data.
- With only one of them, the other end comes from the data, and the scale still covers the bound you set.
- When `min` is greater than `max`, they are swapped.
- When every value is the same, every cell takes the middle color of the scale.

### Diverging midpoint

Without `midpoint`, the midpoint is `0` when the values run both below and above zero, and halfway between the ends otherwise. A `midpoint` outside the domain is ignored, with a development warning. Each side of the midpoint uses its own half of the scale, so the lowest value always takes the first color and the highest value the last, however far each is from the midpoint.

### Invalid colors

Sequential mode needs at least two valid colors and diverging mode exactly three. Otherwise the series uses its default colors and a development warning says why.

### Missing and duplicate values

- A row whose value is `null`, `undefined` or not a finite number adds its categories but no cell, so its place stays empty.
- A row without a valid X or Y category is skipped.
- When two rows land on the same cell, the first one is kept and a development warning names the cell.
- When there are no cells to draw, or the series is hidden, the chart shows its no-data message.

### Value formatting

`valueFormatter` formats a cell's value in its label, the tooltip, the color legend, the data table and screen reader announcements. Without it, values follow the library locale, and values of 1,000 or more are shortened, as in `1.2K`. The axis `formatter` formats the column and row names, on the axis and in the tooltip and announcements.

### Color legend

`mona-chart-legend` shows the color scale by default, with `mode="auto"`. Its title is the series `name`. At `start`, `end`, `left` or `right` it is a vertical bar. While the series is hidden or has nothing to draw, the legend shows a series entry instead, so the user can show the series again. `mode="series"` always shows that entry, and `mode="color"` asks for the color scale.

### Tooltips and clicks

The tooltip shows the series name, the cell's column and row, and its value. A heatmap tooltip always describes one cell, so `shared` has no effect.

The chart's `pointClick` emits a `ChartPointEvent` for the clicked cell: `xValue` is its column, `yCategory` its row, `yValue` its value and `datum` the row of data, with `formattedXValue` and `formattedYCategory` as shown. `HeatmapCellClickEvent` is deprecated, since nothing emits it.

### Animation and identity

When the data changes and the columns and rows stay the same, each cell animates to its new color. When the categories change, the old grid cross-fades into the new one. A cell is matched across updates by its column and row; `keyField` adds your own key to that, so a cell whose key changes fades out and in instead of changing color.

The heatmap is never downsampled.

### Two-way binding

`[(visible)]` holds whether the series is shown. The legend sets it when the user toggles the series entry.

## Accessibility

The chart is the focusable element, and the heatmap adds no roles of its own. When a cell is focused, the chart announces the series name, the column and row, each after its axis title when the axis has one, and the formatted value. Give the series a `name`, give the axes a `title` when the categories don't explain themselves, and use `valueFormatter` to add a unit.

- **Don't rely on color alone.** Turn on `showValues` when the cells are large enough, keep the tooltip, and consider `dataTable` on the chart, which lists each column as a row with a cell per heatmap row.
- **Pick ramps that change in lightness.** A sequential ramp from light to dark, or a diverging ramp with a pale middle, stays readable for color-blind readers and in grayscale. Avoid red to green.
- **The color legend is described in words.** Its accessible name is the series name and the range, such as "Visits, 3 to 120", and includes the midpoint in diverging mode.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous cell in the row, skipping empty cells. |
| `ArrowDown` / `ArrowUp` | Move to the next or previous cell in the column, skipping empty cells. |
| `Home` / `End` | Move to the first or last cell in the row. |
| `Ctrl` + `Home` / `Ctrl` + `End` (`Cmd` on macOS) | Move to the first or last cell of the grid. |
| `Enter` / `Space` | Activate the focused cell, which emits `pointClick`. |

The first arrow key, `Home` or `End` focuses the first or last cell. The rest of the keys are listed on [Chart Overview](/components/chart).
