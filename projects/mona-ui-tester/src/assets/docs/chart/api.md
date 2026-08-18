## Overview & Component Selection

The chart component renders high-performance Canvas 2D visualizations composed of declarative child series and axis components. It supports Cartesian, Sector, and Polar Axis coordinates.

**Series Types:**
- **Cartesian**: `<mona-line-series>`, `<mona-area-series>`, `<mona-bar-series>`, `<mona-range-bar-series>`, `<mona-range-area-series>`, `<mona-scatter-series>`, `<mona-bubble-series>`, `<mona-candlestick-series>`, `<mona-ohlc-series>`, `<mona-heatmap-series>`
- **Sector**: `<mona-pie-series>`, `<mona-donut-series>`
- **Polar Axis**: `<mona-radar-series>`, `<mona-polar-series>`
- **Polar Arc**: `<mona-radial-bar-series>`, `<mona-rose-series>`, `<mona-gauge-series>`
- **Hierarchical**: `<mona-treemap-series>`

## Import & Quick Start

```typescript
import {
    MonaChartComponent,
    MonaChartAngularAxisComponent,
    MonaChartRadialAxisComponent,
    MonaRadarSeriesComponent,
    MonaPolarSeriesComponent,
    MonaChartLegendComponent,
    MonaChartTooltipComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart [data]="data" class="h-80 w-full">
    <mona-chart-angular-axis />
    <mona-chart-radial-axis gridShape="polygon" />
    <mona-radar-series field="score" categoryField="metric" name="Attributes" fillMode="gradient" />
    <mona-chart-legend position="bottom" />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

## Components Reference

### `<mona-chart>`

Root visualization container coordinating coordinate layouts, canvas rendering, theme styles, and interactions.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `data` | `readonly unknown[]` | `[]` | Root dataset shared across child series. |
| `xField` | `ChartField` | `undefined` | Default X/Category field identifier or accessor function. |
| `class` | `string` | `""` | CSS classes applied to chart container. |
| `pointClick` | `output<ChartPointEvent>` | - | Emitted when a data point, spoke, or slice is clicked. |
| `pointFocusChange` | `output<ChartPointFocusEvent>` | - | Emitted when keyboard navigation moves between data points or slices. |
| `seriesVisibilityChange` | `output<ChartSeriesVisibilityEvent>` | - | Emitted when series visibility is toggled via legend or API. |

### `<mona-chart-angular-axis>`

Configures the angular dimension (spokes and continuous degrees) in Polar Axis charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisLine` | `boolean` | `true` | Whether to draw the outer boundary ring. |
| `formatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for spoke/degree labels. |
| `gridLines` | `boolean` | `true` | Whether to draw radiating spoke grid lines from center to boundary. |
| `labelOffset` | `number` | `10` | Offset in pixels for outer label placement. |
| `labels` | `boolean` | `true` | Whether to render DOM angular labels. |
| `rotation` | `number` | `0` | Clockwise angular rotation offset in degrees. |
| `tickCount` | `number` | `12` | Desired number of angular ticks for continuous polar charts. |
| `visible` | `boolean` | `true` | Whether the angular axis is visible. |

### `<mona-chart-radial-axis>`

Configures the radial numeric dimension (distance from pole) in Polar Axis charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisLine` | `boolean` | `true` | Whether to render the reference spoke line along `labelAngle`. |
| `formatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for numeric radial tick labels. |
| `gridLines` | `boolean` | `true` | Whether to draw concentric radial grid rings. |
| `gridShape` | `ChartRadialGridShape` | `"auto"` | Concentric ring geometry: `"auto"` (polygon for radar, circle for polar), `"polygon"`, or `"circle"`. |
| `labelAngle` | `number` | `0` | Angular position in degrees along which numeric tick labels and reference spoke are placed. |
| `labelOffset` | `number` | `6` | Radial offset in pixels for numeric tick labels. |
| `labels` | `boolean` | `true` | Whether to render DOM radial numeric tick labels. |
| `max` | `number` | `undefined` | Explicit upper bound for radial domain. |
| `min` | `number` | `undefined` | Explicit lower bound for radial domain. |
| `nice` | `boolean` | `true` | Whether to round radial min/max bounds to friendly tick intervals. |
| `tickCount` | `number` | `5` | Desired number of concentric radial intervals. |
| `visible` | `boolean` | `true` | Whether the radial axis is visible. |

### `<mona-radar-series>`

Renders closed polygonal radar series comparing categorical metrics across angular spokes.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the category for each data item. |
| `color` | `string` | `""` | Explicit stroke/marker color override. |
| `connectNulls` | `boolean` | `false` | Whether to connect valid points across missing/null categories. |
| `curve` | `ChartRadialCurve` | `"linear"` | Curve interpolation: `"linear"` or `"smooth"`. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric radial value. |
| `fillMode` | `ChartRadialFillMode` | `"none"` | Interior fill mode: `"none"`, `"solid"`, or `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity ratio for polygon fills (0 to 1). |
| `name` | `string` | `"Radar"` | Series name for tooltips, legend, and accessibility. |
| `pointRadius` | `number` | `undefined` | Vertex point marker radius in pixels. |
| `showPoints` | `boolean` | `true` | Whether to render point markers at category vertices. |
| `strokeWidth` | `number` | `undefined` | Outer boundary stroke width in pixels. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter for numeric values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-polar-series>`

Renders continuous polar series mapping magnitude over continuous degree angles (0° to 360°).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `angleField` | `ChartField` | `"angle"` | Property key or accessor extracting angle in degrees (0 to 360). |
| `color` | `string` | `""` | Explicit stroke/marker color override. |
| `connectNulls` | `boolean` | `false` | Whether to connect points across null values without gaps. |
| `curve` | `ChartRadialCurve` | `"linear"` | Curve interpolation: `"linear"` or `"smooth"`. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric radial magnitude. |
| `fillMode` | `ChartRadialFillMode` | `"none"` | Area fill mode from pole: `"none"`, `"solid"`, or `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity ratio for area fill (0 to 1). |
| `name` | `string` | `"Polar"` | Series name for tooltips, legend, and accessibility. |
| `pointRadius` | `number` | `undefined` | Point marker radius in pixels. |
| `showPoints` | `boolean` | `false` | Whether to render markers at valid points. |
| `strokeWidth` | `number` | `undefined` | Outer data line stroke width in pixels. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter for numeric values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-bar-series>`

Renders a Cartesian bar series supporting standalone bars, grouped slots, stacked segments, and 100% normalized stacks.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `borderRadius` | `number` | `0` | Corner radius for the outer cap of the bar or stack. |
| `color` | `string` | `""` | Bar fill color override. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric bar height. |
| `fillOpacity` | `number` | `undefined` | Bar fill opacity (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `maxBarWidth` | `number` | `undefined` | Maximum width of the bar in pixels. |
| `name` | `string` | `"Bar"` | Series name for tooltips, legend, and accessibility. |
| `stack` | `string` | `undefined` | Stack group name. Series sharing the same stack identifier are stacked cumulatively. |
| `stackMode` | `ChartStackMode` | `"normal"` | Stacking calculation mode: `"normal"` or `"percent"`. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |

### `<mona-area-series>`

Renders a continuous Cartesian area series supporting gradient fades, solid fills, cumulative stacking, and 100% normalized bands.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `color` | `string` | `""` | Line and area fill color override. |
| `connectNulls` | `boolean` | `false` | Whether to interpolate across null/missing data points. |
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation algorithm (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`). |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y value. |
| `fillMode` | `ChartAreaFillMode` | `"gradient"` | Area fill style: `"gradient"` or `"solid"`. |
| `fillOpacity` | `number` | `undefined` | Opacity ratio for area fill (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `name` | `string` | `"Area"` | Series name for tooltips, legend, and accessibility. |
| `showPoints` | `boolean` | `false` | Whether to render point markers at data coordinates. |
| `stack` | `string` | `undefined` | Stack group name. Series sharing the same stack identifier are stacked into bands. |
| `stackMode` | `ChartStackMode` | `"normal"` | Stacking calculation mode: `"normal"` or `"percent"`. |
| `strokeWidth` | `number` | `undefined` | Top line stroke width in pixels. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |

### `<mona-scatter-series>`

Renders individual point markers across continuous numeric (linear) or temporal (time/utc) Cartesian coordinates.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `color` | `string` | `""` | Explicit fill color for scatter point markers. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y value. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for scatter markers (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `name` | `string` | `"Scatter"` | Series name for tooltips, legend, and accessibility. |
| `pointRadius` | `number` | `undefined` | Radius in pixels for scatter point markers. |
| `strokeColor` | `string` | `""` | Outline stroke color for markers. |
| `strokeWidth` | `number` | `undefined` | Outline stroke width in pixels. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |

### `<mona-bubble-series>`

Renders 3-dimensional data points with position (X, Y) and proportionally-scaled circle areas (Size).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `color` | `string` | `""` | Explicit fill color for bubble markers. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y value. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for bubble markers (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `maxRadius` | `number` | `24` | Maximum bubble radius in pixels for the largest observed size. |
| `minRadius` | `number` | `4` | Minimum bubble radius in pixels for the smallest observed size. |
| `name` | `string` | `"Bubble"` | Series name for tooltips, legend, and accessibility. |
| `sizeField` | `ChartField` | `"size"` | Property key or accessor extracting positive numeric size value. |
| `sizeFormatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for bubble size in tooltips and live region. |
| `strokeColor` | `string` | `""` | Outline stroke color for bubble circles. |
| `strokeWidth` | `number` | `undefined` | Outline stroke width in pixels. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |

### `<mona-range-bar-series>`

Renders floating Cartesian range bars spanning between a lower value and an upper value (e.g. min/max temperatures, price spans, or SLA tolerances).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `borderRadius` | `number` | `4` | Uniform corner radius in pixels applied to all 4 bar corners. |
| `color` | `string` | `undefined` | Explicit fill color override for the range bars. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `fillOpacity` | `number` | `1.0` | Fill opacity for the range bars (0 to 1). |
| `fromField` | `ChartField` | (required) | Property key or accessor extracting the starting numeric value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `maxBarWidth` | `number` | `undefined` | Maximum width constraint in pixels for range bars. |
| `name` | `string` | `"Range Bar"` | Series name for tooltips, legend, and accessibility. |
| `toField` | `ChartField` | (required) | Property key or accessor extracting the ending numeric value. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter function for range values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate/category value. |

### `<mona-range-area-series>`

Renders continuous Cartesian vertical range bands/areas bounded between lower and upper values (e.g. confidence intervals, forecast envelopes, or high/low bands).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `color` | `string` | `undefined` | Explicit fill color for the range band and point markers. |
| `connectNulls` | `boolean` | `false` | Whether to interpolate across non-finite or missing data points. |
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation algorithm applied to boundary paths (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`). |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `fillOpacity` | `number` | `0.18` | Fill opacity for the range area band (0 to 1). |
| `fromField` | `ChartField` | (required) | Property key or accessor extracting the starting boundary numeric value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `name` | `string` | `"Range Area"` | Series name for tooltips, legend, and accessibility. |
| `pointRadius` | `number` | `4` | Radius in pixels for dual boundary point markers when enabled. |
| `showPoints` | `boolean` | `false` | Whether to render point markers at low and high boundaries. |
| `strokeWidth` | `number` | `2` | Boundary stroke outline width in pixels. |
| `toField` | `ChartField` | (required) | Property key or accessor extracting the ending boundary numeric value. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter function for range values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate/category value. |

### `<mona-candlestick-series>`

Renders financial Japanese candlestick series with central high/low wicks, rectangular open/close bodies, rising/falling/neutral color coding, and solid or hollow rising bodies.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `bodyWidth` | `number` | `undefined` | Explicit body width in pixels. |
| `bodyWidthRatio` | `number` | `0.7` | Relative body width ratio (0 to 1) applied to available slot bandwidth. |
| `closeField` | `ChartField` | `"close"` | Property key or accessor extracting closing price/value. |
| `color` | `string` | `undefined` | Explicit unified color override for all candlesticks. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `fallingColor` | `string` | `"#ef4444"` | Color override for falling candles (Close < Open). |
| `fillMode` | `ChartFinancialFillMode` | `"filled"` | Body fill styling: `"filled"` or `"hollow"`. |
| `highField` | `ChartField` | `"high"` | Property key or accessor extracting highest price/value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `lowField` | `ChartField` | `"low"` | Property key or accessor extracting lowest price/value. |
| `maxBodyWidth` | `number` | `32` | Maximum width constraint in pixels for candle bodies. |
| `name` | `string` | `"Candlestick"` | Series name for tooltips, legend, and accessibility. |
| `neutralColor` | `string` | `"#6b7280"` | Color override for neutral candles (Close == Open). |
| `opacity` | `number` | `undefined` | Fill and stroke opacity ratio (0 to 1). |
| `openField` | `ChartField` | `"open"` | Property key or accessor extracting opening price/value. |
| `risingColor` | `string` | `"#22c55e"` | Color override for rising candles (Close > Open). |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for prices/values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `wickColor` | `string` | `undefined` | Explicit color override for vertical wicks. Defaults to body color. |
| `wickWidth` | `number` | `1` | Stroke width in pixels for central high/low wick lines. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate or timestamp. |

### `<mona-ohlc-series>`

Renders traditional financial OHLC (Open-High-Low-Close) bar series with vertical high/low price spans, left-facing open ticks, right-facing close ticks, and directional color coding.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `bodyWidth` | `number` | `undefined` | Explicit total width in pixels encompassing both left and right ticks. |
| `bodyWidthRatio` | `number` | `0.7` | Relative width ratio (0 to 1) applied to available slot bandwidth. |
| `closeField` | `ChartField` | `"close"` | Property key or accessor extracting closing price/value. |
| `color` | `string` | `undefined` | Explicit unified color override for all OHLC bars. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `fallingColor` | `string` | `"#ef4444"` | Color override for falling bars (Close < Open). |
| `highField` | `ChartField` | `"high"` | Property key or accessor extracting highest price/value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `lowField` | `ChartField` | `"low"` | Property key or accessor extracting lowest price/value. |
| `maxBodyWidth` | `number` | `32` | Maximum total width constraint in pixels for OHLC bars. |
| `name` | `string` | `"OHLC"` | Series name for tooltips, legend, and accessibility. |
| `neutralColor` | `string` | `"#6b7280"` | Color override for neutral bars (Close == Open). |
| `opacity` | `number` | `undefined` | Stroke opacity ratio (0 to 1). |
| `openField` | `ChartField` | `"open"` | Property key or accessor extracting opening price/value. |
| `risingColor` | `string` | `"#22c55e"` | Color override for rising bars (Close > Open). |
| `tickLength` / `tickWidth` | `number` | `undefined` | Explicit length in pixels for left open and right close tick arms. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for prices/values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `wickColor` | `string` | `undefined` | Explicit color override for vertical spine and ticks. |
| `wickWidth` | `number` | `1` | Stroke width in pixels for vertical spine and horizontal tick lines. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate or timestamp. |

### `<mona-radial-bar-series>`

Renders concentric circular progress rings with customizable bar gap, thickness, rounded corners, and background tracks.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `barGap` | `number` | `4` | Spacing in pixels between concentric radial rings. |
| `barThickness` | `number` | `undefined` | Explicit radial thickness in pixels for each bar ring. |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the category label for each radial ring. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for ring category labels. |
| `colorField` | `ChartField` | `undefined` | Property key or accessor extracting explicit color per item. |
| `colors` | `readonly string[]` | `undefined` | Array of colors used to fill successive radial rings. |
| `cornerRadius` | `number` | `undefined` | Corner radius in pixels applied to arc endpoints. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root chart data. |
| `endAngle` | `number` | `360` | Ending angle in degrees (clockwise from 12 o'clock). |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting the numeric value for each ring. |
| `fillMode` | `ChartRadialArcFillMode` | `"solid"` | Fill style: `"solid"` or radial `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity of bar fills (0 to 1). |
| `innerRadiusRatio` | `number` | `0.2` | Inner radius ratio relative to available plot bounds (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `max` | `number` | `undefined` | Explicit maximum value for the progress scale. |
| `min` | `number` | `undefined` | Explicit minimum value for the progress scale. |
| `name` | `string` | `"Radial Bar"` | Series name for tooltips, legend, and accessibility. |
| `outerRadiusRatio` | `number` | `0.9` | Outer radius ratio relative to available plot bounds (0.1 to 1). |
| `showTrack` | `boolean` | `true` | Whether to display background circular track rings. |
| `startAngle` | `number` | `0` | Starting angle in degrees (0 is 12 o'clock, clockwise). |
| `strokeColor` | `string` | `""` | Color of bar stroke boundary. |
| `strokeWidth` | `number` | `undefined` | Stroke width in pixels for bar boundaries. |
| `trackColor` | `string` | `""` | Color of background track rings. |
| `trackOpacity` | `number` | `undefined` | Opacity of background track rings. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for bar numeric values. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `datumVisibilityChange` | `output<ChartRadialDatumVisibilityEvent>` | - | Emitted when an individual ring's visibility is toggled via the legend. |

### `<mona-rose-series>`

Renders Nightingale rose (coxcomb) charts with angular category petals whose radial extent scales by area or radius.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the category label for each petal. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for category labels. |
| `colorField` | `ChartField` | `undefined` | Property key or accessor extracting explicit color per petal. |
| `colors` | `readonly string[]` | `undefined` | Array of colors used to fill successive petals. |
| `cornerRadius` | `number` | `undefined` | Corner radius in pixels applied to outer petal corners. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root chart data. |
| `endAngle` | `number` | `360` | Ending angle in degrees (clockwise from 12 o'clock). |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric petal value. |
| `fillMode` | `ChartRadialArcFillMode` | `"solid"` | Fill style: `"solid"` or radial `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity of petal fills (0 to 1). |
| `innerRadiusRatio` | `number` | `0` | Inner radius ratio relative to available plot bounds (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `name` | `string` | `"Rose"` | Series name for tooltips, legend, and accessibility. |
| `outerRadiusRatio` | `number` | `0.9` | Outer radius ratio relative to available plot bounds (0.1 to 1). |
| `padAngle` | `number` | `2` | Angular padding in degrees between adjacent rose petals. |
| `scaleMode` | `ChartRoseScaleMode` | `"area"` | Petal scale mode: `"area"` (annular area proportional to value) or `"radius"` (linear radial distance). |
| `startAngle` | `number` | `0` | Starting angle in degrees (0 is 12 o'clock, clockwise). |
| `strokeColor` | `string` | `""` | Color of petal separator strokes. |
| `strokeWidth` | `number` | `undefined` | Stroke width in pixels for petal boundaries. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for petal numeric values. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `datumVisibilityChange` | `output<ChartRadialDatumVisibilityEvent>` | - | Emitted when an individual petal's visibility is toggled via the legend. |

### `<mona-gauge-series>`

Renders circular or semi-circular gauge meters with value progress arcs, tapered needles, central hubs, and centered value projection.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `cornerRadius` | `number` | `undefined` | Corner radius in pixels applied to value arc endpoints. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root chart data. |
| `endAngle` | `number` | `135` | Ending angle in degrees (clockwise from 12 o'clock). |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting the gauge numeric value from data. |
| `fillMode` | `ChartRadialArcFillMode` | `"solid"` | Fill style of value arc: `"solid"` or radial `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity of value arc fill (0 to 1). |
| `hubColor` | `string` | `""` | Color of center hub circle. Defaults to control border color. |
| `hubRadius` | `number` | `8` | Radius in pixels of central needle pivot hub. |
| `indicator` | `ChartGaugeIndicator` | `"both"` | Visual indicator style: `"arc"`, `"needle"`, or `"both"`. |
| `innerRadiusRatio` | `number` | `0.72` | Inner radius ratio relative to available plot bounds (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `max` | `number` | `100` | Maximum domain boundary value. |
| `min` | `number` | `0` | Minimum domain boundary value. |
| `name` | `string` | `"Gauge"` | Series name for tooltips, legend, and accessibility. |
| `needleColor` | `string` | `""` | Color of pointer needle. Defaults to primary color. |
| `needleLengthRatio` | `number` | `0.78` | Length of needle as a ratio of gauge outer radius (0.1 to 1). |
| `needleWidth` | `number` | `6` | Base width in pixels of tapered needle pointer. |
| `outerRadiusRatio` | `number` | `0.9` | Outer radius ratio relative to available plot bounds (0.1 to 1). |
| `showTrack` | `boolean` | `true` | Whether to display background circular track arc. |
| `showValue` | `boolean` | `true` | Whether to display default centered value text when no custom template is provided. |
| `startAngle` | `number` | `-135` | Starting angle in degrees (-135 is bottom-left, clockwise). |
| `strokeColor` | `string` | `""` | Color of value arc boundary stroke. |
| `strokeWidth` | `number` | `undefined` | Stroke width in pixels for value arc boundary. |
| `trackColor` | `string` | `""` | Color of background track arc. |
| `trackOpacity` | `number` | `undefined` | Opacity of background track arc. |
| `value` | `number` | `undefined` | Direct numeric scalar value for gauge position (takes precedence over `data`). |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for gauge numeric values. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-treemap-series>`

Renders hierarchical treemap visualizations using nested squarified, binary, dice, or slice-dice rectangles.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `borderRadius` | `number` | `undefined` | Uniform corner radius in pixels applied to cell boundaries. |
| `childrenField` | `ChartField` | `"children"` | Property key or accessor extracting child node array. |
| `color` | `string` | `undefined` | Explicit unified fill color for all nodes. |
| `colorField` | `ChartField` | `undefined` | Property key or accessor extracting explicit color per item. |
| `colors` | `readonly string[]` | `undefined` | Array of colors assigned to top-level branches and inherited down subtrees. |
| `data` | `readonly unknown[]` | `undefined` | Hierarchical dataset overriding root chart data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric node value. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for terminal leaf cells (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting unique node identifier. |
| `labelField` | `ChartField` | `"name"` | Property key or accessor extracting node text label. |
| `labelFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for node text labels. |
| `maxDepth` | `number` | `undefined` | Maximum hierarchy depth to render; deeper subtrees are aggregated into solid terminal nodes. |
| `maxLabels` | `number` | `100` | Maximum number of DOM overlay labels to render concurrently. |
| `minLabelHeight` | `number` | `18` | Minimum node height in pixels required to render a DOM label. |
| `minLabelWidth` | `number` | `32` | Minimum node width in pixels required to render a DOM label. |
| `name` | `string` | `"Treemap"` | Series name for tooltips, legend, and accessibility. |
| `paddingInner` | `number` | `2` | Inner gap in pixels between sibling node rectangles. |
| `paddingOuter` | `number` | `4` | Outer padding in pixels between parent boundary and child nodes. |
| `parentFillOpacity` | `number` | `undefined` | Fill opacity for parent container backgrounds (0 to 1). |
| `parentHeaderHeight` | `number` | `20` | Reserved height in pixels for parent category header bars. |
| `showLabels` | `boolean` | `true` | Whether to display DOM overlay text labels on nodes. |
| `showParentLabels` | `boolean` | `true` | Whether to display header labels on parent nodes. |
| `showValues` | `boolean` | `true` | Whether to append formatted numeric values to node labels. |
| `sort` | `ChartTreemapSort` | `"descending"` | Sibling sorting order: `"descending"`, `"ascending"`, or `"none"`. |
| `strokeColor` | `string` | `undefined` | Cell boundary border stroke color. |
| `strokeWidth` | `number` | `undefined` | Cell boundary border stroke width in pixels. |
| `tile` | `ChartTreemapTile` | `"squarify"` | Tiling algorithm: `"squarify"`, `"binary"`, `"dice"`, `"slice"`, or `"slice-dice"`. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for numeric values. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `nodeVisibilityChange` | `output<ChartTreemapNodeVisibilityEvent>` | - | Emitted when a top-level branch visibility is toggled via legend or API. |

## Template Directives

- `ng-template[monaChartTooltipTemplate]`: Customizes hover and keyboard tooltip contents with `{ $implicit, point, points, shared }`.
- `ng-template[monaChartAxisLabelTemplate]`: Customizes tick label markup with `{ $implicit, axis, index, value }`.
- `ng-template[monaChartLegendItemTemplate]`: Customizes legend item styling and contents with `{ $implicit, item, color, name, visible }`.
- `ng-template[monaChartNoDataTemplate]`: Customizes empty state placeholder when no renderable data is present.
- `ng-template[monaChartCenterTemplate]`: Customizes central donut cutout template with `{ $implicit, total, visibleCount }`.
- `ng-template[monaChartGaugeCenterTemplate]`: Customizes central gauge readout template with `{ $implicit, formattedMax, formattedMin, formattedValue, isClamped, max, min, ratio, seriesId, seriesName, value }`.
- `ng-template[monaChartTreemapLabelTemplate]`: Customizes DOM treemap node labels with `{ $implicit, aggregateValue, dataIndex, depth, descendantCount, formattedLabel, formattedPath, formattedValue, isCollapsed, isLeaf, kind, label, nodeId, percentageOfParent, percentageOfRoot, rawValue, seriesId, seriesName, value }`.

## Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Navigate sequentially between angular spokes, buckets, or slices. |
| `ArrowUp` / `ArrowDown` | Switch between series at the currently focused spoke/coordinate. |
| `Home` / `End` | Jump to the first or last available spoke, bucket, or slice. |
| `Enter` / `Space` | Trigger point selection and emit `pointClick`. |
| `Escape` | Dismiss active crosshair, marker highlight, and tooltip. |
