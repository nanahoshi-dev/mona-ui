## Overview

Pick the series by what the reader should take away.

| Series | Use it for | Reads |
| :--- | :--- | :--- |
| `mona-radial-bar-series` | Progress of a few items towards a goal, such as completion rates or quotas. | `categoryField`, `field` |
| `mona-rose-series` | A value for each of a set of cyclical categories, such as compass directions, months or hours of the day. | `categoryField`, `field` |
| `mona-gauge-series` | One value on a known scale, such as a load, a score or a level. | `value`, or `field` |

**Use something else when:**

- Readers must compare the values precisely. Arcs of different radii are hard to compare, and a bar chart reads better, see [Bar & Waterfall](/components/chart-bar).
- The values are parts of one whole. Use a pie or donut, see [Pie & Donut](/components/chart-pie).
- Several series share the same categories. A chart holds only one radial series, so use a radar, see [Radar & Polar](/components/chart-radar).

The chart, legend, tooltip and accessibility parts these series sit in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    RadialBarSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Goal progress" class="h-72 w-full" [data]="goals">
    <mona-radial-bar-series categoryField="team" field="progress" name="Progress" [max]="100" />
    <mona-chart-legend />
    <mona-chart-tooltip />
</mona-chart>
```

Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

A radial bar and a rose read their rows from the chart's `data`, unless they have their own `data`. Each row gives a category, from `categoryField`, and a value, from `field`. A field is a property name or an accessor, `(row, index) => value`. A gauge shows one value: its `value` input when set, or else the first row whose `field` is a number.

| Input | Radial bar | Rose | Gauge |
| :--- | :---: | :---: | :---: |
| `field`, `data`, `keyField`, `valueFormatter` | ✓ | ✓ | ✓ |
| `categoryField`, `categoryFormatter`, `colorField`, `colors` | ✓ | ✓ | |
| `startAngle`, `endAngle`, `innerRadiusRatio`, `outerRadiusRatio`, `cornerRadius` | ✓ | ✓ | ✓ |
| `fillMode`, `fillOpacity` | ✓ | ✓ | ✓ |
| `strokeColor`, `strokeWidth` | ✓ | ✓ | |
| `trackColor`, `trackOpacity` | ✓ | | ✓ |
| `min`, `max` | ✓ | | ✓ |
| `barGap`, `barThickness`, `showTrack` | ✓ | | |
| `padAngle`, `scaleMode` | | ✓ | |
| `value`, `indicator`, `needleColor`, `needleLengthRatio`, `needleWidth`, `hubRadius`, `showValue`, `color` | | | ✓ |
| `[(hiddenItemIds)]`, `(datumVisibilityChange)` | ✓ | ✓ | |

### Axes

Only the rose uses axes. A `mona-chart-angular-axis` labels each category around the edge, and a `mona-chart-radial-axis` draws value rings and sets the petals' scale with `min`, `max`, `nice` and `tickCount`. Their inputs are described on [Radar & Polar](/components/chart-radar). With a rose:

- The angular axis `rotation` turns the petals as well as the labels, and its `tickCount` has no effect. Past 36 categories, only some labels are shown.
- The radial axis grid is always circular. `gridShape="polygon"` falls back to circles, with a development warning.

A radial bar or a gauge ignores both axes, and every radial series ignores the X and Y axes. Each logs a development warning when they're there.

### Templates

- `ng-template[monaChartGaugeCenterTemplate]`, inside a gauge, replaces the value in its middle. The context is a `ChartGaugeCenterTemplateContext`, with `formattedValue`, `value`, `formattedMin`, `formattedMax`, `ratio` (from `0` to `1`), `isClamped`, `seriesName` and `seriesId`. It's shown even when `showValue` is `false`.
- `ng-template[monaChartAxisLabelTemplate]`, inside a rose's angular or radial axis, replaces each label. The context's `$implicit` is the category or the value.
- The chart, legend and tooltip templates are described on [Chart Overview](/components/chart).

## Examples

### Progress rings

A radial bar with `max` set to `100` shows each team's progress as a share of its goal, and `endAngle` stops the rings at three quarters of a turn. The legend toggles a team, and `[(hiddenItemIds)]` and `(datumVisibilityChange)` report it.

```example
chart-radial/goal-rings
```

### Wind rose

A rose gives each direction an equal slice. The angular axis is turned by half a slice so that north points up, and the radial axis labels the value rings. Switch between scaling the petals by area and by radius to see how much larger values look by radius.

```example
chart-radial/wind-rose
```

### Half gauge

A gauge from `-90` to `90` degrees draws a half circle, and `value` sets its reading directly. The center template adds a note when the reading is beyond `max`, where the arc stops.

```example
chart-radial/server-gauge
```

## Appearance & Styling

### Angles and size

Angles are in degrees, with `0` at 12 o'clock, and go clockwise. A series covers the sweep from `startAngle` to `endAngle`, up to a full turn. When `endAngle` isn't past `startAngle`, the sweep wraps around: `270` to `90` is the upper half.

| Series | Default sweep |
| :--- | :--- |
| Radial bar | `0` to `360`, a full circle |
| Rose | `0` to `360`, a full circle |
| Gauge | `-120` to `120`, a circle open at the bottom |

The outer radius is `outerRadiusRatio` of half the plot's shorter side, and the inner radius is `innerRadiusRatio` of the outer radius. A rose first leaves room for its axis labels, and a stroke takes half its width off the outer radius. Every series is centered in the plot, whatever its angles, so a half gauge leaves the lower half of a square plot empty.

### Radial bar

| Input | Effect |
| :--- | :--- |
| `barGap` | Pixels between rings. It shrinks when the rings wouldn't fit. |
| `barThickness` | The thickness of each ring, up to what fits. Thinner rings are centered between the inner and outer radius. Without it, the rings share all the space. |
| `cornerRadius` | Rounds the ends of each ring, up to half its thickness. The default rounds them fully; `0` squares them. |
| `showTrack`, `trackColor`, `trackOpacity` | A track behind each ring, over the whole sweep, so the reader can see how far the ring has to go. |

### Rose

| Input | Effect |
| :--- | :--- |
| `scaleMode` | `"area"` makes each petal's area proportional to its value, so the eye compares them fairly. `"radius"` makes its length proportional, which makes large values look larger than they are. |
| `padAngle` | Degrees between petals, at most about a third of a slice. |
| `cornerRadius` | Rounds the corners of each petal, up to half its length. The default is square. |

### Gauge

| Input | Effect |
| :--- | :--- |
| `indicator` | `"arc"` fills the track up to the value, `"needle"` points at it, and `"both"` does both. |
| `needleLengthRatio`, `needleWidth`, `hubRadius` | The needle's length as a share of the outer radius, its width at the base, and the radius of the hub at the center, in pixels. |
| `showValue` | Writes the formatted value in the middle. Its size follows the inner radius. The needle's hub is in the middle too, so with a needle you may want to turn it off or use a center template that clears it. |
| `cornerRadius` | Rounds the ends of the value arc. The default is square. |

### Color and fill

| Input | Values | Effect |
| :--- | :--- | :--- |
| `colorField` | A field | Reads a CSS color or variable name from each row. It wins over `colors`. |
| `colors` | CSS colors or variable names | Colors the items in turn, starting again when they run out. Without either, items take `--color-chart-1` to `--color-chart-5` in order. |
| `color`, `needleColor` | Any CSS color | A gauge's value color, and its needle and hub color. The needle takes the value color by default. |
| `fillMode` | `"solid"`, `"gradient"` | A gradient runs from a light tint at the inner edge of each arc to a translucent wash at its outer edge, so it's much lighter than a solid fill. |
| `fillOpacity` | A number from `0` to `1` | The opacity of the fill. The default is `1`. |
| `strokeColor`, `strokeWidth` | Any CSS color, pixels | An outline around each ring or petal. There is none by default, and without `strokeColor` it takes the item's color. |
| `trackColor`, `trackOpacity` | Any CSS color, `0` to `1` | The track behind the rings or the gauge. It's `--color-muted` at `0.15` opacity by default. |

## Theming

These custom properties, set on the series element or an ancestor, change the defaults. An input wins over them.

| Property | Series | Sets |
| :--- | :--- | :--- |
| `--mona-chart-radial-track-color` | Radial bar, gauge | The track color. |
| `--mona-chart-radial-track-opacity` | Radial bar, gauge | The track opacity. |
| `--mona-chart-radial-arc-fill-opacity` | All | The fill opacity. |
| `--mona-chart-radial-arc-stroke-color` | Radial bar, rose | The outline color. |
| `--mona-chart-radial-arc-stroke-width` | Radial bar, rose | The outline width. |
| `--mona-chart-gauge-color` | Gauge | The value color. |
| `--mona-chart-gauge-needle-color` | Gauge | The needle color. |
| `--mona-chart-gauge-hub-color` | Gauge | The hub color. It follows the needle color otherwise. |

## Behavior

### One radial series per chart

A chart draws a single radial bar, rose or gauge. With two, or with a radial series next to a Cartesian, pie, donut, radar or polar series, it draws nothing and logs a development warning. Use a chart for each gauge in a dashboard.

### Scales

- **Radial bar:** a ring's length is its value's share of the range from `min` to `max`. `min` is `0` by default, and a negative one is raised to `0`. `max` is the largest value by default, so the largest ring always closes; set it when the values are shares of a known total. A value beyond the range draws an empty or a full ring, and the tooltip still gives the real value.
- **Rose:** a petal's length runs from the radial axis `min`, `0` by default, to its `max`, which is the largest value rounded up to a tidy number unless the axis sets it or turns `nice` off.
- **Gauge:** the dial runs from `min`, `0`, to `max`, `100`. When `max` is below `min` they're swapped, and when they're equal `max` becomes `min + 1`, each with a development warning. A value beyond the dial stops the arc and the needle at its end, while the text still gives the value and `isClamped` is `true`.

### Missing values

| Series | A missing or non-numeric value | A negative value |
| :--- | :--- | :--- |
| Radial bar | Leaves the row out. The other rings share its space. | The same, with a development warning. |
| Rose | Leaves the category's slice empty, so the other petals keep their places. | The same, with a development warning. |
| Gauge | Is skipped in favor of the next row. With no value at all, the chart shows its no-data state. | Is a valid reading, drawn at `min` when below it. |

When two rows have the same category, the first one with a value is kept, and a radial bar logs a development warning. A gauge given several valid rows uses the first and warns.

### Hiding items

The legend of a radial bar or rose has an entry for each item, named by its formatted category. Toggling one hides that item, writes `[(hiddenItemIds)]` and emits `datumVisibilityChange` with the item's `itemId`, category, row and new visibility. It doesn't emit the chart's `seriesVisibilityChange`. The scale stays the same, so the other items keep their lengths: a hidden ring gives its space to the others, and a hidden petal leaves its slice empty. `toggleDatum(itemId)` does the same from code.

An item's id comes from `keyField`, or else its category, or else its row index, and `chartItemKeyId(key)`, `chartItemCategoryId(category)` and `chartItemIndexId(index)` build each kind. So `chartItemCategoryId("Sales")` hides the item whose category is `"Sales"`. These functions are described in the [Chart Overview API](/components/chart). Treat the ids as opaque: compare them, but don't parse them. Set `keyField` when categories can change but items should stay hidden. Ids the data no longer has are dropped, as described under Two-Way Binding on [Chart Overview](/components/chart).

A gauge's legend entry stands for the whole series. Toggling it sets `[(visible)]` and emits `seriesVisibilityChange`.

### Formatting

`valueFormatter` formats the values in the tooltip, in screen reader announcements and in a gauge's middle, and a gauge's `formattedMin` and `formattedMax`. `categoryFormatter` formats the category names in the legend, the tooltip, the announcements and a rose's angular labels. An axis `formatter` formats that axis's labels only. Without them, numbers follow the library locale.

### Tooltip

The tooltip shows one item at a time: `shared` has no effect on these charts. In a tooltip template, `formattedCategory` and `formattedY` hold the category and value. A gauge's point also has `formattedRadialMin`, `formattedRadialMax`, `radialRatio` and `isClamped`.

## Accessibility

The chart is the focusable element, and these series add no roles of their own. Name the chart with `title` or `aria-label`, and give the series a `name`.

- **A radial bar** reads as its name, the item's category and value, and its position, such as "Goal progress, Sales: 82%, 1 of 5".
- **A rose** reads the same way, one petal at a time.
- **A gauge** reads as its name and value, then its range, such as "CPU load: 72, range 0 to 100", and says when the value is beyond the dial.

Use `valueFormatter` to add a unit the reader would otherwise miss, since it's also what screen readers hear.

- **Don't rely on color alone.** A radial bar draws no category labels, so keep the legend or the tooltip. A rose needs an angular axis to name its petals.
- **Keep fills visible.** Graphics need a 3:1 contrast with the background. A gradient fill and a low `fillOpacity` both lighten the arcs, so check them against the background.
- **The gauge's middle is read out.** A center template's content isn't hidden from screen readers, so keep it short and consistent with the value the chart announces.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous ring of a radial bar, from the outermost, or petal of a rose, clockwise. Both wrap around. |
| `Home` / `End` | Move to the first or last ring or petal. |

Hidden items are skipped, and a gauge has a single point. The rest of the keys, including `Enter` for `pointClick`, are listed on [Chart Overview](/components/chart).
