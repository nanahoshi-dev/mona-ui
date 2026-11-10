## Overview

Pick the series by what else the chart has to say.

| Series | Use it for | Reads |
| :--- | :--- | :--- |
| `mona-pie-series` | A few parts of one whole, where the reader should see at a glance which part is largest. | `field`, `categoryField` |
| `mona-donut-series` | The same, with the total or a summary in the hole, through `ng-template[monaChartCenterTemplate]`. | `field`, `categoryField` |

**Use something else when:**

- There are more than five or six parts, or they're close in size. Angles are hard to compare, and bars show small differences better, see [Bar & Waterfall](/components/chart-bar).
- You need to compare the parts of several wholes, such as each year's split. A chart takes one pie or donut, so use stacked bars with `stackMode="percent"`, see [Bar & Waterfall](/components/chart-bar).
- The parts form a hierarchy. Use a [Treemap](/components/chart-treemap).
- The values are stages that narrow, such as a sign-up flow. Use a [Funnel](/components/chart-funnel).
- You want to show one value against a target. Use a gauge, see [Radial](/components/chart-radial).

The chart, legend, tooltip and templates these series sit in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import { ChartComponent, ChartLegendComponent, ChartTooltipComponent, PieSeriesComponent } from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Visits by traffic source" class="h-72 w-full" [data]="sources">
    <mona-pie-series categoryField="source" field="visits" name="Visits" />
    <mona-chart-legend position="end" />
    <mona-chart-tooltip />
</mona-chart>
```

Give the chart a height. It fills its host, and a host without a height has none. Pie and donut charts have no axes, so leave out `mona-chart-x-axis` and `mona-chart-y-axis`, and the chart's `xField`.

## Anatomy

Each row of data is one slice. The series reads its rows from the chart's `data`, unless it has its own `data`, and takes the value from `field` and the slice's name from `categoryField`. A field is a property name or an accessor, `(row, index) => value`. The defaults are `"value"` and `"category"`, so rows shaped `{ category, value }` need neither.

| Input | Pie | Donut | What it reads or sets |
| :--- | :---: | :---: | :--- |
| `field`, `categoryField` | ✓ | ✓ | The value and the name of each slice. |
| `colorField`, `colors` | ✓ | ✓ | The color of each slice. |
| `keyField` | ✓ | ✓ | A stable identity for each row, so slices animate as the same slice when the data changes. |
| `valueFormatter`, `categoryFormatter` | ✓ | ✓ | How values and names read in the tooltip, labels, legend and announcements. |
| `startAngle`, `endAngle`, `padAngle`, `cornerRadius`, `outerRadiusRatio` | ✓ | ✓ | The shape of the circle and its slices. |
| `innerRadiusRatio` | | ✓ | The size of the hole. |
| `showLabels`, `labelPosition`, `labelContent`, `minLabelAngle` | ✓ | ✓ | The slice labels. |
| `fillMode`, `fillOpacity`, `strokeColor`, `strokeWidth` | ✓ | ✓ | The fill and the lines between slices. |
| `[(hiddenIndices)]`, `[(visible)]` | ✓ | ✓ | Which slices are hidden, and whether the series is shown. |

A chart takes one pie or donut series. With a second one, the chart draws neither and logs a development warning. They also can't share a chart with Cartesian series, such as lines or bars.

### Templates

- `ng-template[monaChartSliceLabelTemplate]`, inside either series, replaces the text of each slice label. The context is a `ChartSliceLabelTemplateContext`: the slice is `$implicit` and `slice`, and its fields, such as `formattedCategory`, `formattedValue`, `formattedPercentage`, `percentage`, `color`, `dataIndex` and `datum`, are also on the context itself. Turn `showLabels` on as well.
- `ng-template[monaChartCenterTemplate]`, inside a donut, fills the hole. The context is a `ChartCenterTemplateContext`, with `total` (also `$implicit`), `formattedTotal`, `visibleSliceCount`, `seriesId` and `seriesName`.
- The chart, legend and tooltip templates are described on [Chart Overview](/components/chart).

## Examples

### Donut

A donut with the total in its hole. The rows are shaped `{ category, value }`, so the series needs no fields, and `padAngle` leaves a small gap between slices.

```example
chart-pie/donut
```

### Outside labels

`showLabels` writes a label beside each slice, joined to it by a leader line. `labelContent="category-percentage"` names the slice and gives its share, so this pie needs no legend. `strokeColor` set to the surface color draws a gap between the slices, and `valueFormatter` adds the unit to the tooltip.

```example
chart-pie/outside-labels
```

### Hiding slices

`[(hiddenIndices)]` holds the indices of the hidden rows. The legend and the buttons above the chart change the same list, and the center shows how many regions are left and their total.

```example
chart-pie/hidden-slices
```

### Slice label template

With `labelPosition="inside"`, a template puts the name and the share on each slice. `colorField` takes each slice's color from its row. A slice narrower than `minLabelAngle`, here Training, gets no label, and the legend and tooltip still name it.

```example
chart-pie/slice-template
```

## Appearance & Styling

### Shape

| Input | Values | Effect |
| :--- | :--- | :--- |
| `startAngle`, `endAngle` | Degrees, default `0` and `360` | Where the slices begin and end, clockwise from 12 o'clock. `-90` to `90` draws a half circle across the top. When `endAngle` isn't after `startAngle`, the span wraps around, so `270` to `90` is also a half circle. A span is never more than a full circle. |
| `padAngle` | Degrees, default `0` | The gap between neighboring slices. All the gaps together never take more than 35% of the span, and a single visible slice has none. |
| `cornerRadius` | Pixels | Rounds the corners of each slice. It's capped at half the ring's thickness, or half the radius for a pie. |
| `outerRadiusRatio` | `0.1` to `1`, default `0.9` | The radius, as a share of the room the chart has for it. |
| `innerRadiusRatio` | `0` to `0.95`, default `0.6` | Donut only. The radius of the hole, as a share of the outer radius. `0` draws a pie. |

Values outside a range are clamped to it.

### Color and fill

| Input | Values | Effect |
| :--- | :--- | :--- |
| `colorField` | A field returning a CSS color | The color of each slice, read from its row. A row without one falls back to `colors`. |
| `colors` | CSS colors | The slice colors in order, repeated when there are more slices than colors. |
| `fillMode` | `"solid"`, `"gradient"` | A gradient is a translucent radial wash that grows stronger toward the outer edge. |
| `fillOpacity` | `0` to `1` | The opacity of the fill. A gradient is translucent already, and gets lighter still. |
| `strokeColor` | A CSS color | The color of the line around each slice. Set it to the background, such as `var(--color-surface)`, to separate the slices. |
| `strokeWidth` | Pixels, default `1` | The width of that line. `0` removes it. |

Without `colorField` or `colors`, slices take `--color-chart-1` to `--color-chart-5` in order, and the sixth slice starts over. Colors can be CSS colors or theme variables, written `var(--name)` or `--name`. Without `strokeColor`, each slice's outline is its own color, so the slices meet without a visible line.

### Slice labels

Slice labels are off by default. `showLabels` turns them on, in either position.

| Input | Values | Effect |
| :--- | :--- | :--- |
| `labelPosition` | `"outside"`, `"inside"` | Outside labels sit beside the circle, with a leader line to their slice. Inside labels sit on the slice. |
| `labelContent` | `"percentage"`, `"value"`, `"category"`, `"category-percentage"` | What a label says when there's no template. `"category-percentage"` reads as `Search: 42%`. |
| `minLabelAngle` | Degrees, default `12` | Inside labels only. A slice narrower than this gets no label. |

- **Outside labels take room.** The chart keeps space for them on the left and the right, so the circle gets smaller. Labels on each side are spread out so they don't overlap. When a side has more labels than height, the labels of the smallest slices are dropped first, and a label that would run past the edge of the plot is dropped too.
- **Inside labels pick their own text color**, white or dark, whichever contrasts more with the slice. They're centered a little past the middle of the ring.
- **Percentages are shares of what's visible.** When a slice is hidden, the others' labels and tooltips are worked out again from the slices that are left. They're formatted for the chart locale, with at most one decimal.

## Theming

These variables set the slice style without an input. They're read from the series element, so set them on the chart or on the series with a class. An input wins over its variable.

| Variable | Default | Sets |
| :--- | :--- | :--- |
| `--mona-chart-slice-stroke-color` | Each slice's own color | The line around each slice, like `strokeColor`. |
| `--mona-chart-slice-stroke-width` | `1` | Its width in pixels, like `strokeWidth`. |
| `--mona-chart-slice-fill-opacity` | `1` | The fill opacity, like `fillOpacity`. |
| `--mona-chart-slice-hover-overlay` | A translucent white | The color laid over the slice under the pointer. |
| `--mona-chart-label-line-color` | `--color-muted-foreground` | The leader lines of outside labels. |

The slice palette is `--color-chart-1` to `--color-chart-5`, shared with every chart, and the keyboard focus ring uses `--color-focus-indicator`.

## Behavior

### Values that draw no slice

A row whose value is `null`, `undefined`, zero, negative or not a finite number draws no slice and gets no legend entry. A numeric string, such as `"42"`, counts as its number. Negative and non-finite values log a development warning, and so does a series with no value above zero. A row without a name is called "Item" and its position, such as `Item 3`. The data can also be plain numbers, `[42, 18, 7]`, with those names.

### Hiding slices

- The legend lists each slice, and toggling an entry hides or shows that slice. It doesn't hide the series, so the chart's `seriesVisibilityChange` doesn't fire. The series emits `sliceVisibilityChange` instead, with the slice's `dataIndex`, `category`, `datum` and whether it's now `visible`.
- `[(hiddenIndices)]` holds the hidden slices as indices into the data, counting every row, including rows that draw no slice. The legend writes to it, and the series drops indices past the end of the data when the data gets shorter. Because they're positions, a hidden index stays with the position, not the item, when rows are reordered.
- `toggleSlice(dataIndex)`, a method on the series, shows or hides a slice from code, and returns whether it's now visible.
- A hidden slice leaves its room to the others, and the percentages, the donut's total and `visibleSliceCount` follow. In a legend item template, `percentage` is each slice's share of the whole total, hidden slices included, so it doesn't change as slices come and go.
- When every slice is hidden, the chart shows its no data state, and the legend stays so the user can bring them back.

### The donut center

The center template is drawn in the middle of the hole and limited to a box a little smaller than it. It appears only while the donut has a visible slice. `total` is the sum of the visible slices, and `formattedTotal` is that sum formatted by `valueFormatter`, called with the index `-1`, or by the chart locale without one.

### Value formatting

`valueFormatter` formats the values in the tooltip, value labels, screen reader announcements and the donut's `formattedTotal`. `categoryFormatter` formats the slice names in the legend, labels, tooltip and announcements. Both receive the value and the row's index.

### Two-way binding

`[(visible)]` holds whether the whole series is shown. The legend toggles slices, not the series, so it doesn't change `visible`. `[(hiddenIndices)]` is described under [Hiding slices](#hiding-slices).

## Accessibility

The chart is the focusable element, and these series add no roles of their own. When a slice gets focus, the chart announces the series name, the slice's name and formatted value, its percentage, and its position, such as 2 of 5. Give the series a `name`, and use `valueFormatter` to add a unit.

- **Name the chart.** Give it an `aria-label` or a `title`, as for any chart, see [Chart Overview](/components/chart).
- **Don't rely on color alone.** Keep the legend, or turn on labels that name the slices with `labelContent="category"` or `"category-percentage"`. Slice colors next to each other should differ in lightness, and a `strokeColor` that matches the background helps tell them apart.
- **Labels are hidden from screen readers**, since the announcements already carry the same values. The content of the donut center template isn't hidden, so screen readers can reach it. Keep it short, and make its text meet contrast against the chart background.
- **The tooltip shows one slice at a time.** The tooltip's `shared` input has no effect on these series.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowDown` | Move to the next slice, clockwise. After the last slice, go back to the first. |
| `ArrowLeft` / `ArrowUp` | Move to the previous slice. Before the first slice, go to the last. |
| `Home` / `End` | Move to the first or last visible slice. |
| `Enter` / `Space` | Activate the focused slice, which emits the chart's `pointClick`. |

The focused slice gets a ring in `--color-focus-indicator`. The legend's entries are buttons, toggled with `Enter` or `Space`. The rest of the chart's keys are listed on [Chart Overview](/components/chart).
