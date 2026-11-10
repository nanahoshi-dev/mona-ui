## Overview

A funnel shows how many items, such as visitors, deals or sessions, reach each stage of a process that runs in a fixed order, and how many are lost on the way. The widest stage takes the most room, and every other stage is as wide as its share of it.

Use it for:

- Sign-up, onboarding and checkout flows, where the reader asks where people leave.
- Sales pipelines, from leads to won deals.
- Any sequence of steps where each stage is a subset of the one before it, or at least follows it.

**Use something else when:**

- The stages have no order, or they're parts of one total. Use a pie or donut, see [Pie & Donut](/components/chart-pie).
- You need to compare the stages of several funnels, or one funnel over time. A chart takes one funnel, so use grouped bars, see [Bar & Waterfall](/components/chart-bar).
- The values add up and subtract to a total. Use a waterfall, see [Bar & Waterfall](/components/chart-bar).

The chart, legend, tooltip and interaction parts the series sits in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    FunnelSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Sign-up funnel" class="h-80 w-full" [data]="stages">
    <mona-funnel-series categoryField="stage" field="users" name="Users" />
    <mona-chart-legend />
    <mona-chart-tooltip />
</mona-chart>
```

```typescript
protected readonly stages = [
    { stage: "Visited", users: 12400 },
    { stage: "Signed up", users: 4820 },
    { stage: "Subscribed", users: 1120 }
];
```

Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

The series reads its rows from the chart's `data`, unless it has its own `data`. Each row is one stage, in the order of the rows.

| Input | Reads | Default |
| :--- | :--- | :--- |
| `field` | The stage's value. | `"value"` |
| `categoryField` | The stage's name, for its label, legend entry, tooltip and announcement. | `"category"` |
| `keyField` | A key that identifies the stage, used for its stage ID. Optional. | |
| `colorField` | A CSS color for the stage. Optional. | |

A field is a property name or an accessor, `(row, index) => value`. A row without a name is called "Stage" and its position, as in "Stage 3".

### What each stage carries

The stage label template, the tooltip context (`point.funnel`) and the `pointClick` and `pointFocusChange` events (`funnel`) describe a stage with these values. They're worked out from the visible stages only.

| Value | Holds |
| :--- | :--- |
| `value`, `formattedValue` | The stage's value, and its text from `valueFormatter` or the library locale. |
| `previousValue` | The value of the visible stage before it. The first stage has none. |
| `conversionRate`, `formattedConversionRate` | The value divided by the previous value, as a ratio and as a percentage with at most one decimal. The first stage has none, and neither does a stage after one whose value is `0`. |
| `overallConversionRate`, `formattedOverallConversionRate` | The value divided by the first visible stage's value. |
| `dropOff` | The previous value minus this value. It's negative when the stage is larger than the one before it. |
| `stageId`, `stageIndex` | The stage's ID, and its position among the visible stages. |

### Templates

- `ng-template[monaChartFunnelLabelTemplate]`, inside the series, replaces the text of the stage labels. The context is the stage, as `$implicit` and `stage`, with the values above plus `bounds`, `color`, `textColor`, `datum`, `category`, `formattedCategory` and `dataIndex`. The template replaces only the text, so `labelContent` no longer applies, while `showLabels`, `maxLabels` and the minimum sizes still decide which stages get a label.
- The chart, legend, tooltip and no-data templates are described on [Chart Overview](/components/chart).

## Examples

### Sales pipeline

`labelContent="category-value-conversion"` adds each stage's conversion from the stage before to its label, and `valueFormatter` adds the unit to the labels, tooltips and announcements. The legend lists the stages, one entry each.

```example
chart-funnel/sales-pipeline
```

### Conversion labels

A label template writes each stage's label with your own markup. Here a horizontal funnel shows the conversion and the drop-off under each step's name, and `minLabelWidth` leaves out labels on stages too narrow for them.

```example
chart-funnel/conversion-labels
```

### Stage visibility

`[(hiddenStageIds)]` holds the hidden stages, and the legend writes to it when the user toggles a stage. With `keyField`, a stage keeps its ID when the rows change order. Hiding a stage works out the conversion of the stages after it again, from the visible stages.

```example
chart-funnel/stage-visibility
```

## Appearance & Styling

| Input | Values | Effect |
| :--- | :--- | :--- |
| `orientation` | `"vertical"`, `"horizontal"` | Vertical runs the stages from top to bottom, horizontal from left to right. |
| `widthRatio` | A number from `0.1` to `1` | The widest stage's share of the plot's width, or of its height when horizontal. Values outside the range are clamped. |
| `gap` | Pixels | The space between stages. Together the gaps never take more than half the funnel's length. |
| `showLabels` | `boolean` | Whether stages get a label. |
| `labelContent` | `"category"`, `"value"`, `"category-value"`, `"category-value-conversion"` | What a built-in label shows. The conversion is left out on the first stage. |
| `maxLabels` | A number | The most labels shown, in stage order. |
| `minLabelWidth`, `minLabelHeight` | Pixels | The smallest space a label needs inside its stage, `48` wide and `20` tall by default. Both apply in either orientation, and a stage without room has no label. |
| `color` | Any CSS color | One color for every stage. |
| `colors` | An array of CSS colors | Colors for the stages in row order, starting over when they run out. |
| `colorField` | A field | A color for each stage from its row. |
| `fillOpacity` | A number from `0` to `1` | The opacity of the stages. `1` by default. |
| `strokeColor`, `strokeWidth` | A CSS color, pixels | The outline between stages. By default it's the surface color, 1 pixel wide. |

A stage takes the first color it finds in this order: its `colorField` value, `colors`, `color`, a text color class on the series element, then the chart palette, `--color-chart-1` to `--color-chart-5` by row.

Each stage starts as wide as its value and ends as wide as the next stage's value, and the last stage keeps one width. A stage larger than the one before it widens instead of narrowing, as when invitations bring in more people than sent them.

Built-in labels pick white or a dark text color, whichever contrasts more with the stage color.

## Theming

These CSS custom properties style a funnel when the matching input isn't set. Put them on the chart, or on the series with its `class`.

| Property | Default | Styles |
| :--- | :--- | :--- |
| `--mona-chart-funnel-stroke-color` | The surface color | The outline between stages. |
| `--mona-chart-funnel-stroke-width` | `1` | The outline width, in pixels. |
| `--mona-chart-funnel-fill-opacity` | `1` | The opacity of the stages. |
| `--mona-chart-funnel-label-color` | White or dark, by contrast | The text color of every label. |

## Behavior

### One funnel per chart

A funnel has its chart to itself. A chart with two funnels, or with a funnel and another series, draws no stages, shows its no-data message and logs a development warning. Axes inside a funnel chart are ignored, with a development warning.

### Values

- A stage needs a finite number of `0` or more. A row whose value is negative, missing, `NaN`, infinite or text that isn't a number is left out, and negative or invalid values log a development warning.
- A stage whose value is `0` is kept, with no width, and the stage after it has no conversion rate.
- When no stage is above zero, or every stage is hidden, the chart shows its no-data message. The legend stays, so the user can show hidden stages again. A hidden series shows the message too.

### Stage IDs

Each stage has an ID, which `hiddenStageIds`, `stageVisibilityChange` and the label context use.

- Without `keyField`, the ID is `i:` followed by the row's index, such as `i:2`. It follows the position, not the row, when rows are reordered.
- With `keyField`, the ID is `k:s:` followed by a string key, such as `k:s:trial`, or `k:n:` followed by a number key. It stays with the row when rows are reordered. A key used twice logs a development warning, and the later row falls back to its index.

The ID also matches stages from one data set to the next, so stages with the same ID animate from where they were.

### Stage visibility

- `[(hiddenStageIds)]` holds the IDs of the hidden stages. The legend writes to it when the user toggles a stage, and the parent can write to it too. IDs the data no longer has are dropped when the data changes, see [Two-Way Binding](/components/chart).
- `stageVisibilityChange` emits when the legend or a method shows or hides a stage, with the stage's ID, name, row and new visibility. It doesn't emit when the parent writes `hiddenStageIds`.
- The series has methods for code that holds it through `viewChild`: `setDatumVisibility(stageId, visible)`, `toggleDatumVisibility(stageId)`, `isDatumVisible(stageId)` and `resetVisibility()`, which shows every stage. `resetVisibility()` doesn't emit `stageVisibilityChange`.
- A hidden stage keeps its legend entry. The other stages close up, and their widths, conversions and drop-offs are worked out again from the visible stages.
- `[(visible)]` hides the whole series.

### Value formatting

- `valueFormatter` formats a stage's value in its label, tooltip and announcement. `categoryFormatter` formats its name everywhere it appears, including the legend. Both get the value and the row's index.
- Conversion rates are percentages for the library locale. The drop-off in the tooltip and announcements is a number for the library locale, and `valueFormatter` doesn't apply to it.

### Tooltip

The tooltip shows one stage: its name, value, conversion and overall conversion, leaving out what the stage doesn't have, and its drop-off when that's above zero. `shared` has no effect on a funnel.

## Accessibility

The chart is the focusable element, and the series adds no roles of its own. Moving to a stage announces the series name, the stage's name, its position ("stage 2 of 5") and value, then its conversion from the previous stage, its overall conversion, and its drop-off when that's above zero. Give the series a `name`, and use `valueFormatter` to add a unit.

- **Stage labels are hidden from screen readers.** The announcements carry each stage's name, value, conversions and drop-off, and the chart's `dataTable` lists the visible stages and their values. Don't put information only in a label template.
- **Don't rely on color alone.** Each stage's position and label tell it apart. Keep the labels or the legend so stages can be named without their color.
- **Check label contrast with custom colors.** Built-in labels pick their text color for the stage's color at full opacity, so a low `fillOpacity` or `--mona-chart-funnel-label-color` needs its own check.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowDown` / `ArrowUp` | In a vertical funnel, move to the next or previous stage. |
| `ArrowRight` / `ArrowLeft` | In a horizontal funnel, move to the next or previous stage. |
| `Home` / `End` | Move to the first or last stage. |

The legend toggles stages with `Enter` and `Space`. The rest of the keys, including `Enter` for `pointClick` and `Escape`, are listed on [Chart Overview](/components/chart).
