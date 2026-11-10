## Overview

Pick the series by what the angle means.

| Series | Use it for | Reads |
| :--- | :--- | :--- |
| `mona-radar-series` | A profile of the same metrics for one or more items, such as review scores, skills or the health of a product. Each category gets a spoke, evenly spaced. | `categoryField`, `field` |
| `mona-polar-series` | Values that depend on a direction or a cycle, such as wind by bearing, an antenna's reach or activity by hour. The angle is a number of degrees. | `categoryField` (the angle), `field` |

**Use something else when:**

- The reader needs to compare exact values, or to compare items on one metric. Bars on a straight axis are easier to read, see [Bar & Waterfall](/components/chart-bar).
- The categories have an order that matters more than the shape, such as months. A line keeps the order readable, see [Line & Area](/components/chart-line-area).
- You want the parts of a whole. Use a pie or donut, see [Pie & Donut](/components/chart-pie).
- You want each category as its own arc or wedge, sized by value. Use a radial bar or rose series, see [Radial](/components/chart-radial).

A chart takes several radar series, or several polar series, but not both: a chart that mixes them draws nothing and logs a development warning. Radar and polar series don't mix with Cartesian series either. The chart, legend, tooltip and other shared parts are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    RadarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Review scores" class="h-80 w-full" [data]="scores">
    <mona-radar-series categoryField="skill" field="phoneA" name="Phone A" />
    <mona-radar-series categoryField="skill" field="phoneB" name="Phone B" />
    <mona-chart-legend />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

Give the chart a height. It fills its host, and a host without a height has none. The axes are optional: without `mona-chart-angular-axis` and `mona-chart-radial-axis`, the chart draws both with their defaults. Add them to change the labels, grid or scale.

## Anatomy

| Part | Selector | Role |
| :--- | :--- | :--- |
| Radar series | `mona-radar-series` | A closed shape through one value per category. |
| Polar series | `mona-polar-series` | A line through values placed at numeric angles. |
| Angular axis | `mona-chart-angular-axis` | The spokes, the outer boundary and the labels around the edge: one per category for radar, a degree scale for polar. |
| Radial axis | `mona-chart-radial-axis` | The value scale from the center outwards: the grid rings, their labels and the line they sit on. |

Each series reads its rows from the chart's `data`, unless it has its own `data`. The chart's `xField` doesn't apply here: the angle comes from the series' `categoryField`, and the value from `field`. A field is a property name or an accessor, `(row, index) => value`.

| Input | Radar | Polar |
| :--- | :--- | :--- |
| `categoryField` | The category of a spoke. Defaults to `"category"`. | The angle in degrees. Defaults to the deprecated `angleField`, which defaults to `"angle"`. |
| `field` | The value. Defaults to `"value"`. | The value. Defaults to `"value"`. |
| `keyField` | A stable identity for each row, so animations follow the row when the data changes. | The same. |
| `showPoints` | `true` by default. | `false` by default. |

The remaining inputs, `curve`, `connectNulls`, `fillMode`, `fillOpacity`, `strokeWidth`, `pointRadius`, `color`, `name` and `valueFormatter`, are the same on both.

### Templates

`ng-template[monaChartAxisLabelTemplate]` works inside both axes. Its context is a `ChartAxisLabelTemplateContext`: `axis` is `"angular"` or `"radial"`, `index` is the label's position, and `$implicit` and `value` are the raw value, not the formatted text. That's the category for a radar spoke, the number of degrees for a polar tick, and the number for a ring. Apply the formatting you need inside the template.

The chart, legend and tooltip templates are described on [Chart Overview](/components/chart). These series have no data labels.

## Examples

### Comparing profiles

Two radar series read the same rows, each with its own `field`. A solid fill shows the area each one covers, and fixing the radial axis to `0`–`100` keeps the scale honest when the scores are all high. `valueFormatter` adds the scale to the tooltip.

```example
chart-radar/compare
```

### Wind rose

A polar series places each row at its `categoryField` angle, with `0` at the top and angles going clockwise. The angular axis `formatter` turns the degrees into compass points, both on the axis and in the tooltip, and `tickCount` sets how many there are.

```example
chart-radar/wind-rose
```

### Axis labels

The angular axis label template adds a number to each spoke, and `rotation` turns the whole chart. On the radial axis, `formatter` adds a percent sign, and `gridShape="circle"` draws round rings instead of the polygons a radar chart uses by default.

```example
chart-radar/axis-labels
```

## Appearance & Styling

### Series

| Input | Values | Effect |
| :--- | :--- | :--- |
| `fillMode` | `"none"`, `"solid"`, `"gradient"` | `"solid"` fills evenly. `"gradient"` is faint at the center and reaches `fillOpacity` at the series' farthest point. A radar series fills its closed shape, and a polar series fills from the center out to its line. |
| `fillOpacity` | A number from `0` to `1` | The opacity of a solid fill, and the outer opacity of a gradient. Defaults to `0.18`. |
| `curve` | `"linear"`, `"smooth"` | `"smooth"` draws a curve through the points. It needs at least three, and draws straight lines below that. A smooth curve can bulge past a point, so keep `"linear"` when the exact vertices matter. |
| `strokeWidth` | Pixels | The width of the outline. Defaults to `2`. `0` leaves only the fill and the points. |
| `showPoints`, `pointRadius` | `boolean`, pixels | Markers at each value. The radius defaults to `3.5` on radar and `3` on polar. |
| `color` | Any CSS color or `var()` | Replaces the palette color for the line, fill and points. By default series take `--color-chart-1` to `--color-chart-5` in order. |

When several radar series overlap, keep the fill light, or fill only one of them and leave the others as outlines.

### Angular axis

| Input | Default | Effect |
| :--- | :--- | :--- |
| `rotation` | `0` | Turns every spoke and label clockwise by this many degrees. `0` puts the first category, or 0°, at the top. |
| `tickCount` | `12` | The number of degree ticks on a polar chart, from `2` to `72`, evenly spaced. Above 12, every second label is shown, and above 24, every fourth, while every spoke is still drawn. A radar chart has one spoke per category and ignores it. |
| `formatter` | Category text, or degrees in the locale | Formats the labels, and the category or angle in the tooltip and announcements. It receives the raw value and its index. |
| `labelOffset` | `10` | Pixels between the outer edge and the labels. |
| `gridLines` | `true` | The spokes from the center to the edge. |
| `axisLine` | `true` | The outer boundary: a polygon or a circle, matching the radial axis `gridShape`. |
| `labels` | `true` | The labels around the edge. |
| `visible` | `true` | `false` hides the spokes, the boundary and the labels. |

### Radial axis

| Input | Default | Effect |
| :--- | :--- | :--- |
| `gridShape` | `"auto"` | `"polygon"` joins the spokes into rings with corners, `"circle"` draws round rings. `"auto"` uses polygons for radar and circles for polar. A polygon needs at least three spokes, and is drawn as a circle with fewer. On a polar chart the corners are at the degree ticks. |
| `min`, `max` | From the data | Fix the ends of the scale. See Scale under Behavior. |
| `nice` | `true` | Rounds the ends the data sets to tidy values. An end you set with `min` or `max` stays as set. |
| `tickCount` | `5` | The number of rings to aim for, from `1` to `20`. The actual number follows round values. |
| `labelAngle` | `0` | The direction of the ring labels and the axis line, in degrees clockwise from the top. It doesn't follow the angular `rotation`. |
| `labelOffset` | `6` | Pixels between a ring and its label. |
| `formatter` | Numbers in the locale | Formats the ring labels. The tooltip keeps the series' `valueFormatter`. |
| `gridLines` | `true` | The rings. |
| `axisLine` | `true` | The line from the center to the edge, at `labelAngle`. |
| `labels` | `true` | The ring labels. |
| `visible` | `true` | `false` hides the rings, their labels and the axis line. |

## Theming

The series read these custom properties from their own host element, so set them with `class`, for example `class="[--mona-chart-radial-stroke-width:3px]"`. An input set on the series wins over them.

| Property | Default | Sets |
| :--- | :--- | :--- |
| `--mona-chart-radial-stroke-width` | `2` | The outline width. |
| `--mona-chart-radial-point-radius` | `3.5` radar, `3` polar | The marker radius. |
| `--mona-chart-radial-fill-opacity` | `0.18` | The fill opacity. |

A series also takes its color from a `text-*` class on its host, as in `class="text-chart-3"`, when `color` isn't set. The rings and spokes take `--mona-chart-grid-color`, the zero ring `--mona-chart-zero-line-color`, and the outer boundary and radial axis line `--mona-chart-axis-line-color`. Without them, they fall back to the theme's border and muted colors.

## Behavior

### Categories on a radar chart

- The spokes are the categories of all visible series together, in the order they first appear in the data. A series that lacks a category has a gap at that spoke.
- Hiding a series in the legend removes the categories only it has, and the radial scale is worked out again from the visible series.
- A row whose category is empty, `null` or `undefined` gets a generated name, "Category" followed by the row's position.
- When a series has the same category twice, the first row with a number wins, and a development warning names the category.

### Angles on a polar chart

- Angles are degrees, clockwise from the top, and are reduced to `0`–`360`: `-90` and `270` are the same angle, and so are `360` and `0`.
- Each series is drawn in order of angle, whatever the order of the rows, and its line runs from the smallest angle to the largest without joining back to the first point. A row at `360` doesn't close the loop, since it is the same angle as `0`.
- A row whose angle isn't a number is skipped. When a series has the same angle twice, the first row with a number wins, and a development warning names the angle.
- The deprecated `angleField` still works, but `categoryField` wins when both are set.

### Missing values

A row whose value is `null`, `undefined` or not a number leaves a gap.

- On a radar series a gap breaks the outline, so the shape is no longer closed and isn't filled. With `connectNulls`, the outline goes straight from one value to the next and the shape closes again, as long as at least three values are left.
- On a polar series a gap breaks the line and the fill. With `connectNulls`, they go straight across it.
- A radar fill needs at least three values, a polar fill at least two, and an outline at least two. A single value still shows as a point when `showPoints` is on.

### Scale

- The radial scale always includes zero, so a value's distance from the center stays proportional to it. When the data has negative values, the center is the lowest value, and the zero ring is drawn darker.
- With `min` or `max`, a value outside the range is drawn at the center or at the edge rather than beyond it.
- Every series in the chart shares one scale, so put metrics with very different ranges on a common scale, such as a score out of 100, before comparing them on a radar chart.

### Tooltip

- Without `shared`, the tooltip shows the point nearest the pointer, within a few pixels of it.
- With `shared` on a radar chart, pointing anywhere in the wedge around a spoke shows every series at that spoke.
- With `shared` on a polar chart, the tooltip shows every series with a value at the nearest angle. Series only share a tooltip where their angles match exactly, so give them the same angles when you want to compare them.
- The pointer near the center, or far outside the edge, shows nothing.

### Value formatting

`valueFormatter` formats a series' values in its tooltip and screen reader announcements, and receives the value and the row's index. It leaves the ring labels alone: format those with the radial axis `formatter`. Without either, numbers follow the library locale.

### Not in polar charts

Panning and zooming (`navigation` and the viewport), downsampling, the crosshair and cross-chart synchronization are for Cartesian charts. A `mona-chart-x-axis` or `mona-chart-y-axis` inside a radar or polar chart is ignored, with a development warning.

### Two-way binding

`[(visible)]` holds whether the series is shown. The legend sets it when the user toggles the series.

## Accessibility

The chart is the focusable element, and these series add no roles of their own. Each point is announced with its series name, its category or angle, and its formatted value. The chart's description names the series and gives each one's lowest and highest value, and with `dataTable` the hidden table has a row per spoke or angle and a column per series. The axis labels are `aria-hidden`, so what a reader hears comes from the series and the formatters.

- **Name each series** with `name`, and use `valueFormatter` to add a unit or a scale, such as "/ 100" or "km/h".
- **Format angles for people.** On a polar chart, an angular `formatter` that turns degrees into compass points or hours also changes what's announced.
- **Don't rely on color alone.** Keep the legend, and use fills sparingly so overlapping series stay distinguishable. Points help in forced colors and print.
- **Keep the number of spokes readable.** Many categories crowd the labels around the edge. Above a dozen, bars are often clearer.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous spoke or angle, going round: after the last comes the first. |
| `ArrowUp` / `ArrowDown` | Move to another series at the same spoke or angle. |
| `Home` / `End` | Move to the first or last spoke or angle. |

On a polar chart, a series with values at different angles from the others is reached by moving to its angles. The rest of the keys, including selection, are listed on [Chart Overview](/components/chart).
