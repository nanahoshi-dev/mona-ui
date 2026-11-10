## Overview

Pick the series by how the reader is used to seeing prices.

| Series | Use it for | Reads |
| :--- | :--- | :--- |
| `mona-candlestick-series` | Price action at a glance. The body makes the move from open to close easy to compare between periods, and hollow or filled bodies tell rising from falling periods without relying on color. | `openField`, `highField`, `lowField`, `closeField` |
| `mona-ohlc-series` | Dense or technical price charts, where thin bars leave more room and the open and close ticks keep each price exact. | `openField`, `highField`, `lowField`, `closeField` |

**Use something else when:**

- You only have one value per period, such as the closing price. A line or area series reads better, see [Line & Area](/components/chart-line-area).
- You need the low and high of each period without the open and close. A range area or range bar shows the band, see [Line & Area](/components/chart-line-area) and [Bar & Waterfall](/components/chart-bar).
- You want to show how a value is built up step by step from gains and losses. Use a waterfall series, see [Bar & Waterfall](/components/chart-bar).

The chart, axes, legend, tooltip and interaction parts these series sit in are described on [Chart Overview](/components/chart).

## Import & Quick Start

```typescript
import {
    CandlestickSeriesComponent,
    ChartComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="ACME share price" class="h-72 w-full" xField="date" [data]="prices">
    <mona-chart-x-axis type="time" />
    <mona-chart-y-axis />
    <mona-candlestick-series closeField="close" highField="high" lowField="low" name="ACME" openField="open" />
    <mona-chart-tooltip />
</mona-chart>
```

Give the chart a height. It fills its host, and a host without a height has none.

## Anatomy

Each series reads its rows from the chart's `data`, unless it has its own `data`. It takes the X value from the chart's `xField`, or from its own `xField`, and the four prices from `openField`, `highField`, `lowField` and `closeField`, which are all required. A field is a property name or an accessor, `(row, index) => value`. `keyField` gives each row a stable identity, so animations follow the row rather than its X value when the data changes.

| Part | Candlestick | OHLC |
| :--- | :--- | :--- |
| High to low | A wick through the middle | A vertical stem |
| Open | The top or bottom of the body | A tick to the left |
| Close | The other end of the body | A tick to the right |

| Input | Candlestick | OHLC |
| :--- | :---: | :---: |
| `openField`, `highField`, `lowField`, `closeField` | ✓ | ✓ |
| `risingColor`, `fallingColor`, `neutralColor`, `color` | ✓ | ✓ |
| `bodyWidth`, `bodyWidthRatio`, `maxBodyWidth` | ✓ | ✓ |
| `wickColor`, `wickWidth`, `fillOpacity` | ✓ | ✓ |
| `fillMode` | ✓ | |
| `tickLength` | | ✓ |
| `dataLabels`, `valueFormatter` | ✓ | ✓ |

A period is **rising** when it closes above its open, **falling** when it closes below, and **neutral** when the two are equal. The tooltip, the data label context and screen reader announcements carry the direction (`ChartFinancialDirection`), along with the change from open to close and its percentage.

### Templates

- `ng-template[monaChartDataLabel]`, inside a series, replaces the text of its data labels. The context is a `ChartDataLabelContext`, with `open`, `high`, `low`, `close` and their `formattedOpen`, `formattedHigh`, `formattedLow` and `formattedClose`. Turn `dataLabels` on as well.
- `ng-template[monaChartTooltipTemplate]`, inside the tooltip, gets the same prices on each point, along with `financialDirection`, `formattedChange` and `formattedChangePercentage`.
- The chart, axis, legend and tooltip templates are described on [Chart Overview](/components/chart).

## Examples

### Candlestick

A candlestick series on a time axis. `valueFormatter` formats the four prices and the change in the tooltip, and the Y axis `formatter` formats its ticks. By default rising candles are hollow and falling ones filled.

```example
chart-financial/candlestick
```

### Direction colors

`risingColor`, `fallingColor` and `neutralColor` replace the green, red and gray defaults. Blue and orange stay apart for readers who can't tell red from green. The OHLC bars use a longer `tickLength` and a thicker `wickWidth`, so the open and close ticks are easier to see.

```example
chart-financial/direction-colors
```

### Moving average

A line series shares the chart and its time axis with the candles, here to draw a 20-day moving average. The shared tooltip lists both, and `navigation` lets the reader zoom into the half year with the wheel, a drag or a pinch.

```example
chart-financial/moving-average
```

## Appearance & Styling

| Input | Values | Effect |
| :--- | :--- | :--- |
| `fillMode` | `"hollow"`, `"filled"` | Candlestick only. `hollow`, the default, draws rising bodies as an outline and fills falling and neutral ones. `filled` fills every body. |
| `risingColor`, `fallingColor`, `neutralColor` | Any CSS color, or a `var(--token)` | The color of rising, falling and neutral marks. Empty uses the theme tokens, then green, red and gray. |
| `color` | Any CSS color | One color for every mark, whatever its direction. It wins over the three direction colors. |
| `wickColor` | Any CSS color | The color of a candle's wicks or an OHLC bar's stem. Empty uses the mark's direction color. |
| `wickWidth` | Pixels | The width of wicks, stems and OHLC ticks, and of a hollow body's outline. It's never thinner than half a pixel. When unset, it comes from `--mona-chart-financial-wick-width`, or is `1`. |
| `bodyWidthRatio` | `0.05` to `1` | How much of the room each mark takes. |
| `bodyWidth` | Pixels | A fixed width for every body, or every pair of OHLC ticks, instead of the ratio. |
| `maxBodyWidth` | Pixels | The widest a mark gets, `32` by default, so a few marks on a wide chart don't turn into blocks. |
| `tickLength` | Pixels | OHLC only. The length of each open and close tick. It's never more than half the mark's width, which is also the default. |
| `fillOpacity` | A number from `0` to `1` | The opacity of the whole mark. |

### Mark width

On a category X axis each mark takes `bodyWidthRatio` of its category's band. On a time or numeric X axis it takes that ratio of the gap to its nearest neighbor, so a weekend or holiday gap doesn't make the candles around it wider. Either way the width stays between 2 pixels and `maxBodyWidth`. A neutral candle still draws a body 1 pixel tall.

## Theming

These tokens set the colors and wick width of every financial series inside the element they're set on, so they can go on `:root`, on a container or on one chart. An input on the series wins over its token.

| Token | Default | Sets |
| :--- | :--- | :--- |
| `--mona-chart-financial-rising-color` | `#16a34a` | Rising marks, like `risingColor`. |
| `--mona-chart-financial-falling-color` | `#ef4444` | Falling marks, like `fallingColor`. |
| `--mona-chart-financial-neutral-color` | `#6b7280` | Neutral marks, like `neutralColor`. |
| `--mona-chart-financial-wick-color` | The direction color | Wicks and stems, like `wickColor`. |
| `--mona-chart-financial-wick-width` | `1` | The width of wicks, stems and ticks, like `wickWidth`. |
| `--mona-chart-financial-hollow-fill` | The surface color | The inside of hollow candles. Without it, the theme's surface, card or background color is used, so a hollow body matches the chart behind it. |

```css
.trading-view {
    --mona-chart-financial-rising-color: #2563eb;
    --mona-chart-financial-falling-color: #ea580c;
}
```

The legend swatch of a financial series is split diagonally between the rising and falling colors, or the single `color` when one is set.

## Behavior

### Data rules

A row is skipped, with a development warning, when:

- any of its four prices is missing or not a finite number,
- its low is above the open or close, or its high is below them,
- its X value isn't valid for a time or numeric X axis,
- its X value, or its `keyField` value, repeats an earlier row's. The first row wins.

Skipped rows leave no mark and aren't announced. A chart with no valid rows, and no other series to draw, shows its no-data state.

### Axes

- The X axis can be a category, time (or `utc`) or numeric axis. With `type="auto"` it becomes a time axis for `Date` values and ISO date strings, and a category axis for other strings. A category axis puts the marks side by side and leaves out the gaps between trading days; a time axis keeps them.
- On a time or numeric X axis the domain is widened by half a step at each end, so the first and last marks aren't cut in half. An explicit `min` or `max` turns that off for its end.
- The Y axis spans the lowest low to the highest high. It doesn't stretch to zero, unless a bar or area series shares it.

### One financial series per chart

A chart draws one candlestick or OHLC series. Any other financial series in the same chart is ignored, with a development warning. Line, area and other Cartesian series can share the chart with it.

### Value formatting

`valueFormatter` formats the open, high, low, close and change in the tooltip, the data labels and screen reader announcements. Without it they use the Y axis `formatter`, and without that the library locale. The change percentage always uses the locale's percent format.

### Data labels

`dataLabels` writes each mark's closing price beside it. Automatic placement tries ahead of the mark, behind it, above and below. `inside-*` positions don't apply to these marks and fall back to `right`. Labels suit a few dozen marks at most; on longer series, prefer the tooltip.

### Dense data

Candlestick and OHLC series are never downsampled, because merging periods would need to keep the first open, the highest high, the lowest low and the last close. The chart's `downsampling` still applies to the other series in it. On a long series, turn on `navigation` so the reader can zoom in, see [Chart Overview](/components/chart).

### Two-way binding

`[(visible)]` holds whether the series is shown. The legend sets it when the user toggles the series.

## Accessibility

The chart is the focusable element, and these series add no roles of their own. Each mark is announced with its series name, its X value, the open, high, low and close, whether it rose, fell or stayed unchanged, and the change. Give the series a `name`, and use `valueFormatter` to add the currency.

- **Don't rely on color alone.** Keep the candlestick's default `fillMode="hollow"`, so rising and falling candles differ in shape as well as color. On an OHLC bar, the open tick is always on the left and the close on the right.
- **Mind red and green.** The default colors are hard to tell apart for many readers. The tooltip names the direction in words, and `risingColor` and `fallingColor` can switch to a pair such as blue and orange.
- **Keep custom colors visible.** A rising or falling color needs a 3:1 contrast with the chart background to meet WCAG AA for graphics.
- **Offer a table for long series.** `dataTable` adds a visually hidden table of the chart's first 100 rows for screen readers.

### Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Move to the next or previous period. |
| `ArrowUp` / `ArrowDown` | Move to another series at the same X value, such as a moving average line. |
| `Home` / `End` | Move to the first or last period. |

The rest of the keys, including selection, brushing and navigation, are listed on [Chart Overview](/components/chart).
