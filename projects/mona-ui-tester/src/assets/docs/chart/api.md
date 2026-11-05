## Overview & Component Selection

The chart component renders high-performance Canvas 2D visualizations composed of declarative child series and axis components. It supports Cartesian, Sector, Polar Axis, Polar Arc, and Hierarchical chart families, with specialized Cartesian layouts for Heatmap, Funnel, Waterfall, and Financial series.

**Series Types:**
- **Cartesian**: `<mona-line-series>`, `<mona-area-series>`, `<mona-bar-series>`, `<mona-range-bar-series>`, `<mona-range-area-series>`, `<mona-scatter-series>`, `<mona-bubble-series>`, `<mona-candlestick-series>`, `<mona-ohlc-series>`, `<mona-heatmap-series>`, `<mona-funnel-series>`, `<mona-waterfall-series>`
- **Sector**: `<mona-pie-series>`, `<mona-donut-series>`
- **Polar Axis**: `<mona-radar-series>`, `<mona-polar-series>`
- **Polar Arc**: `<mona-radial-bar-series>`, `<mona-rose-series>`, `<mona-gauge-series>`
- **Hierarchical**: `<mona-treemap-series>`

## Import & Quick Start

```typescript
import {
    ChartComponent,
    ChartAngularAxisComponent,
    ChartRadialAxisComponent,
    RadarSeriesComponent,
    PolarSeriesComponent,
    ChartLegendComponent,
    ChartTooltipComponent
} from "@nanahoshi/mona-ui/chart";
import type { ChartField, ChartValueFormatter, ChartViewportState } from "@nanahoshi/mona-ui/chart";
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
| `animation` | `ChartAnimationInput` | `true` | Animates the first render, data changes and visibility toggles. See [Animation](#animation). |
| `data` | `readonly unknown[]` | `[]` | Root dataset shared across child series. |
| `defaultViewport` | `ChartViewportState` | `undefined` | The starting viewport when the parent does not control `viewport`. `resetViewport()` returns to it. |
| `navigation` | `ChartNavigationInput` | `false` | Turns on pan and zoom for Cartesian charts. See [Viewport and navigation](#viewport-and-navigation). |
| `renderer` | `ChartRendererMode` | `"canvas"` | Render with `"canvas"` or `"svg"`. |
| `subtitle` | `string` | `""` | Subtitle shown beneath the title. |
| `synchronization` | `ChartSynchronizationInput` | `false` | Joins a named group that shares the viewport and crosshair across charts. See [Cross-chart synchronization](#cross-chart-synchronization). |
| `title` | `string` | `""` | Title shown above the plot. It also names the chart when `aria-label` is empty. |
| `xField` | `ChartField` | `""` | Default X/Category field identifier or accessor function. |
| `downsampling` | `ChartDownsamplingInput` | `true` | Chart-level render-sample policy for eligible dense continuous-X Cartesian series. Per-series values can disable reduction or provide a requested algorithm preference. |
| `class` | `string` | `""` | CSS classes applied to chart container. |
| `aria-label` | `string` | `""` | Accessible name; defaults to the title, then "Chart". |
| `aria-description` | `string` | `""` | Replaces the generated summary in the chart's description (`aria-describedby`); the keyboard help still follows. |
| `landmark` | `boolean` | `false` | Makes the host a `region` landmark instead of `role="application"`. Give each landmark chart a unique name. |
| `dataTable` | `boolean` | `false` | Adds a visually hidden table of the data (the first 100 rows) for screen readers. |
| `titleAlign` | `ChartHeaderAlignment` | `"start"` | Alignment of the title and subtitle. `"start"` and `"end"` follow the direction; `"left"` and `"right"` stay on that side; or `"center"`. |
| `viewport` | `ChartViewportState` | `undefined` | Active viewport window. Bind `[(viewport)]` for two-way binding. While it is defined the parent owns the viewport: a change applies once the parent writes it back. |
| `viewportChange` | `output<ChartViewportState>` | - | Emits the new viewport state on pan, zoom, fit, reset or keyboard navigation. |
| `viewportChangeDetails` | `output<ChartViewportChangeEvent>` | - | Emits with each change, along with the previous state, source, gesture phase and changed axes. |
| `pointClick` | `output<ChartPointEvent>` | - | Emitted when a data point, spoke, or slice is clicked. |
| `pointFocusChange` | `output<ChartPointFocusEvent>` | - | Emitted when keyboard navigation moves between data points or slices. |
| `seriesVisibilityChange` | `output<ChartSeriesVisibilityEvent>` | - | Emitted when series visibility is toggled via legend or API. |

#### High-density Cartesian downsampling

`downsampling` accepts `boolean | ChartDownsamplingOptions` at the chart and eligible Cartesian-series levels. The chart policy is inherited unless a series supplies its own value. The requested `algorithm` is a preference; the family-safe strategy resolves the actual reducer, so step curves, range areas, stacked areas, and marker families keep their required geometry. Category-X data and intentionally excluded families do not become eligible through this input.

| Option | Type | Meaning |
| :--- | :--- | :--- |
| `enabled` | `boolean` | Enables or disables reduction at the current chart or series scope. A chart-level disable wins over series settings. |
| `algorithm` | `"auto" \| "minmax" \| "lttb" \| "pixel"` | Requested reduction preference, constrained by family semantics. |
| `maxPoints` | `number` | Render-sample budget with family-specific meaning; it does not limit raw pointer, brush, selection, tooltip, or source-data interaction. |
| `samplesPerPixel` | `number` | Pixel-density multiplier used when deriving the render-sample budget. |
| `threshold` | `number` | Activation threshold for an eligible family; it does not make an otherwise ineligible axis or series family eligible. |

Resolution precedence is chart disable, series disable, series preference, then the family-safe strategy. A source below the threshold uses ordinary full rendering, while an explicit `maxPoints` may activate reduction below the threshold for an eligible continuous-X family.

### Methods

Get the chart with `viewChild(ChartComponent)`. The viewport methods act on Cartesian charts.

| Method | Description |
| :--- | :--- |
| `downloadChart(options)` | Exports the chart and starts a browser download. Returns a `Promise<ChartExportResult>`. |
| `exportChart(options)` | Exports the chart as SVG, PNG or PDF. Returns a `Promise<ChartExportResult>`. |
| `fitViewport(target?)` | Fits the target axes, or all axes, to the full data. |
| `getViewport()` | Returns the current `ChartViewportState`, or `null` when the chart is not Cartesian or has no layout yet. |
| `invalidate()` | Asks for a new layout, for changes the chart can't observe, such as a data array mutated in place. |
| `pan(delta, target?)` | Pans by a pixel delta `{ x, y }`. |
| `resetViewport(target?)` | Returns the target axes, or all axes, to `defaultViewport` or the full data. |
| `setViewport(viewport)` | Replaces the viewport. |
| `setViewportWindow(window)` | Sets the window of one axis or several. |
| `toggleLegendItem(item)` | Toggles the visibility of a legend item, as a click on it does. |
| `toggleSeriesVisibility(seriesId)` | Toggles the visibility of a series. |
| `zoom(factor, anchor?, target?)` | Zooms by a factor around a plot point, or the center of the plot. |

`fit()` is deprecated; use `setViewportWindow()`.

### `<mona-chart-x-axis>`

Configures an X axis in Cartesian charts. Add more than one with distinct `axisId` values for multiple axes.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisId` | `string` | `undefined` | Axis ID that series, overlays and viewport windows refer to. Omit it for the primary axis. |
| `axisLine` | `boolean` | `true` | Whether to draw the axis baseline. |
| `exponent` | `number` | `1` | Exponent of a `"pow"` scale. |
| `field` | `ChartField` | `undefined` | Property key or accessor extracting X for this axis, overriding the chart `xField`. |
| `formatter` | `ChartAxisFormatter` | `undefined` | Formats tick labels and the values read from this axis. |
| `gridLines` | `boolean` | `undefined` | Whether to draw grid lines across the plot. Omitted, the axis default applies. |
| `labelMaxWidth` | `number` | `undefined` | Maximum width in pixels of a tick label. |
| `labelPadding` | `number` | `undefined` | Space in pixels between the ticks and labels (effective default `4`). |
| `labelRotation` | `ChartAxisLabelRotation` | `0` | Label rotation in degrees, or `"auto"`. |
| `labels` | `boolean` | `true` | Whether to draw tick labels. |
| `logBase` | `number` | `10` | Base of a `"log"` scale. |
| `max` | `number \| Date` | `undefined` | Upper domain bound of a continuous scale. |
| `min` | `number \| Date` | `undefined` | Lower domain bound of a continuous scale. |
| `nice` | `boolean` | `true` | Rounds continuous domain bounds to clean tick values. |
| `position` | `ChartXAxisPosition` | `"bottom"` | `"bottom"` or `"top"`. |
| `symlogConstant` | `number` | `1` | Linear threshold of a `"symlog"` scale. |
| `tickCount` | `number` | `undefined` | Desired number of ticks (effective default `5`). |
| `tickMarks` | `boolean` | `false` | Whether to draw tick marks. |
| `tickSize` | `number` | `undefined` | Length in pixels of the tick marks (effective default `6`). |
| `title` | `string` | `""` | Axis title. |
| `titlePadding` | `number` | `undefined` | Space in pixels between the labels and the title (effective default `6`). |
| `type` | `ChartXAxisType` | `"auto"` | Scale type: `"auto"`, `"category"`, `"linear"`, `"log"`, `"symlog"`, `"pow"`, `"sqrt"`, `"time"` or `"utc"`. `"auto"` infers it from the data. |
| `visible` | `boolean` | `true` | Whether the axis is visible. |

### `<mona-chart-y-axis>`

Configures a Y axis in Cartesian charts. Add more than one with distinct `axisId` values for multiple axes.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisId` | `string` | `undefined` | Axis ID that series, overlays and viewport windows refer to. Omit it for the primary axis. |
| `axisLine` | `boolean` | `true` | Whether to draw the axis baseline. |
| `exponent` | `number` | `1` | Exponent of a `"pow"` scale. |
| `formatter` | `ChartAxisFormatter` | `undefined` | Formats tick labels and the values read from this axis. |
| `gridLines` | `boolean` | `undefined` | Whether to draw grid lines across the plot. Omitted, the axis default applies. |
| `labelMaxWidth` | `number` | `undefined` | Maximum width in pixels of a tick label. |
| `labelPadding` | `number` | `undefined` | Space in pixels between the ticks and labels (effective default `4`). |
| `labelRotation` | `ChartAxisLabelRotation` | `0` | Label rotation in degrees, or `"auto"`. |
| `labels` | `boolean` | `true` | Whether to draw tick labels. |
| `logBase` | `number` | `10` | Base of a `"log"` scale. |
| `max` | `number` | `undefined` | Upper domain bound of a continuous scale. |
| `min` | `number` | `undefined` | Lower domain bound of a continuous scale. |
| `nice` | `boolean` | `true` | Rounds continuous domain bounds to clean tick values. |
| `position` | `ChartYAxisPosition` | `"start"` | `"start"` and `"end"` follow the direction; `"left"` and `"right"` stay on that side. |
| `symlogConstant` | `number` | `1` | Linear threshold of a `"symlog"` scale. |
| `tickCount` | `number` | `undefined` | Desired number of ticks (effective default `5`). |
| `tickMarks` | `boolean` | `false` | Whether to draw tick marks. |
| `tickSize` | `number` | `undefined` | Length in pixels of the tick marks (effective default `6`). |
| `title` | `string` | `""` | Axis title. |
| `titlePadding` | `number` | `undefined` | Space in pixels between the labels and the title (effective default `6`). |
| `type` | `ChartYAxisType` | `"auto"` | Scale type: `"auto"`, `"category"`, `"linear"`, `"log"`, `"symlog"`, `"pow"` or `"sqrt"`. `"auto"` infers it from the data. |
| `visible` | `boolean` | `true` | Whether the axis is visible. |

### `<mona-chart-angular-axis>`

Configures the angular dimension (spokes and continuous degrees) in Polar Axis charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisLine` | `boolean` | `true` | Whether to draw the outer boundary ring. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `formatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for spoke/degree labels. |
| `gridLines` | `boolean` | `true` | Whether to draw radiating spoke grid lines from center to boundary. |
| `labelOffset` | `number` | `10` | Offset in pixels for outer label placement. |
| `labels` | `boolean` | `true` | Whether to render DOM angular labels. |
| `rotation` | `number` | `0` | Clockwise angular rotation offset in degrees. |
| `tickCount` | `number` | `undefined` | Desired number of angular ticks for continuous polar charts (effective default `12`). |
| `visible` | `boolean` | `true` | Whether the angular axis is visible. |

### `<mona-chart-radial-axis>`

Configures the radial numeric dimension (distance from pole) in Polar Axis charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisLine` | `boolean` | `true` | Whether to render the reference spoke line along `labelAngle`. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
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

### `<mona-pie-series>`

Renders a full or partial pie.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the slice category. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Formats category text. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `colorField` | `ChartField` | `undefined` | Property key or accessor extracting a color per slice. |
| `colors` | `readonly string[]` | `undefined` | Colors for successive slices. |
| `cornerRadius` | `number` | `undefined` | Corner radius of each slice in pixels. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `endAngle` | `number` | `360` | Ending angle in degrees (clockwise from 12 o'clock). |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting the numeric value. |
| `fillMode` | `ChartPolarFillMode` | `"solid"` | Fill style: `"solid"` or `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Fill opacity, 0 to 1. |
| `hiddenIndices` | `model(readonly number[])` | `[]` | The hidden data indices. Bindable with `[(hiddenIndices)]`; legend toggles write to it. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `labelContent` | `ChartPolarLabelContent` | `"percentage"` | Label text: `"percentage"`, `"value"`, `"category"` or `"category-percentage"`. |
| `labelPosition` | `ChartPolarLabelPosition` | `"outside"` | Label placement: `"outside"` or `"inside"`. |
| `minLabelAngle` | `number` | `12` | Smallest slice angle in degrees that gets a label. |
| `name` | `string` | `"Pie"` | Series name for tooltips, legend and accessibility. |
| `outerRadiusRatio` | `number` | `0.9` | Outer radius relative to the plot, 0.1 to 1. |
| `padAngle` | `number` | `0` | Gap between slices in degrees. |
| `showLabels` | `boolean` | `false` | Whether to draw slice labels. |
| `startAngle` | `number` | `0` | Starting angle in degrees (0 is 12 o'clock, clockwise). |
| `strokeColor` | `string` | `""` | Color of the slice outlines. |
| `strokeWidth` | `number` | `undefined` | Width of the slice outlines in pixels. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats values in tooltips, labels and announcements. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `sliceVisibilityChange` | `output<ChartSliceVisibilityEvent>` | - | Emitted when a slice is toggled through the legend or API. |

### `<mona-donut-series>`

Renders a full or partial donut. Use `ng-template[monaChartCenterTemplate]` for the center.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the slice category. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Formats category text. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `colorField` | `ChartField` | `undefined` | Property key or accessor extracting a color per slice. |
| `colors` | `readonly string[]` | `undefined` | Colors for successive slices. |
| `cornerRadius` | `number` | `undefined` | Corner radius of each slice in pixels. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `endAngle` | `number` | `360` | Ending angle in degrees (clockwise from 12 o'clock). |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting the numeric value. |
| `fillMode` | `ChartPolarFillMode` | `"solid"` | Fill style: `"solid"` or `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Fill opacity, 0 to 1. |
| `hiddenIndices` | `model(readonly number[])` | `[]` | The hidden data indices. Bindable with `[(hiddenIndices)]`; legend toggles write to it. |
| `innerRadiusRatio` | `number` | `0.6` | Hole radius relative to the outer radius, 0 to 1. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `labelContent` | `ChartPolarLabelContent` | `"percentage"` | Label text: `"percentage"`, `"value"`, `"category"` or `"category-percentage"`. |
| `labelPosition` | `ChartPolarLabelPosition` | `"outside"` | Label placement: `"outside"` or `"inside"`. |
| `minLabelAngle` | `number` | `12` | Smallest slice angle in degrees that gets a label. |
| `name` | `string` | `"Donut"` | Series name for tooltips, legend and accessibility. |
| `outerRadiusRatio` | `number` | `0.9` | Outer radius relative to the plot, 0.1 to 1. |
| `padAngle` | `number` | `0` | Gap between slices in degrees. |
| `showLabels` | `boolean` | `false` | Whether to draw slice labels. |
| `startAngle` | `number` | `0` | Starting angle in degrees (0 is 12 o'clock, clockwise). |
| `strokeColor` | `string` | `""` | Color of the slice outlines. |
| `strokeWidth` | `number` | `undefined` | Width of the slice outlines in pixels. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats values in tooltips, labels and announcements. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `sliceVisibilityChange` | `output<ChartSliceVisibilityEvent>` | - | Emitted when a slice is toggled through the legend or API. |

### `<mona-radar-series>`

Renders closed polygonal radar series comparing categorical metrics across angular spokes.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the category for each data item. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Explicit stroke/marker color override. |
| `connectNulls` | `boolean` | `false` | Whether to connect valid points across missing/null categories. |
| `curve` | `ChartRadialCurve` | `"linear"` | Curve interpolation: `"linear"` or `"smooth"`. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric radial value. |
| `fillMode` | `ChartRadialFillMode` | `"none"` | Interior fill mode: `"none"`, `"solid"`, or `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity ratio for polygon fills (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
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
| `angleField` | `ChartField` | `"angle"` | **Deprecated.** Use `categoryField`. |
| `categoryField` | `ChartField` | `undefined` | Property key or accessor extracting angle in degrees (0 to 360). Takes precedence over `angleField`. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Explicit stroke/marker color override. |
| `connectNulls` | `boolean` | `false` | Whether to connect points across null values without gaps. |
| `curve` | `ChartRadialCurve` | `"linear"` | Curve interpolation: `"linear"` or `"smooth"`. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric radial magnitude. |
| `fillMode` | `ChartRadialFillMode` | `"none"` | Area fill mode from pole: `"none"`, `"solid"`, or `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity ratio for area fill (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `name` | `string` | `"Polar"` | Series name for tooltips, legend, and accessibility. |
| `pointRadius` | `number` | `undefined` | Point marker radius in pixels. |
| `showPoints` | `boolean` | `false` | Whether to render markers at valid points. |
| `strokeWidth` | `number` | `undefined` | Outer data line stroke width in pixels. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter for numeric values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-line-series>`

Renders a continuous Cartesian line series with configurable interpolation, optional null-gap joining, point markers, data labels, and multi-axis binding.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `color` | `string` | `""` | Explicit stroke color override for the series line. |
| `connectNulls` | `boolean` | `false` | Whether to connect points across null or invalid values without gaps. |
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation: `"linear"`, `"monotone-x"`, `"natural"`, `"step"`, or `"step-after"`. Step variants preserve source adjacency under density reduction. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root chart data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options or a boolean flag enabling default labels. |
| `downsampling` | `ChartDownsamplingInput` | `undefined` | Per-series high-density policy; inherits the chart policy when omitted. Eligible continuous-X line series use a family-safe scalar strategy, while `step` and `step-after` protect source adjacency. |
| `field` | `ChartField` | `""` | Property key or accessor extracting the Y value for each data item. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity across updates. |
| `lineStyle` | `ChartLineStyle` | `"solid"` | Line pattern: `"solid"`, `"dashed"` or `"dotted"`. |
| `name` | `string` | `""` | Series name displayed in legends and tooltips. |
| `pointRadius` | `number` | `undefined` | Radius in pixels for optional point markers. |
| `seriesKey` | `string` | `undefined` | Optional stable series identity for mark identity and selection across updates. |
| `showPoints` | `boolean` | `false` | Whether to draw point markers at each data coordinate along the line. |
| `strokeWidth` | `number` | `undefined` | Stroke width in pixels for the series line. |
| `class` | `string` | `""` | Additional CSS classes applied to the series host element. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats this series' values in tooltips, data labels and announcements, without changing the axis ticks. Takes precedence over the axis formatter. |
| `visible` | `model(boolean)` | `true` | Two-way bindable visibility for the series. |
| `xAxisId` | `string` | `undefined` | Optional Cartesian X-axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X, overriding the root chart X field. |
| `yAxisId` | `string` | `undefined` | Optional Cartesian Y-axis ID; omitted uses the primary Y axis. |

### `<mona-bar-series>`

Renders a Cartesian bar series supporting standalone bars, grouped slots, stacked segments, and 100% normalized stacks.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `borderRadius` | `number` | `undefined` | Corner radius for the outer cap of the bar or stack. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Bar fill color override. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `field` | `ChartField` | `""` | Property key or accessor extracting the numeric value. Object rows render nothing without it; rows that are plain numbers do not need it. |
| `fillOpacity` | `number` | `undefined` | Bar fill opacity (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `maxBarWidth` | `number` | `undefined` | Maximum width of the bar in pixels. |
| `name` | `string` | `""` | Series name for tooltips, legend and accessibility. Falls back to the field name when it is a string, then to "Series N". |
| `orientation` | `ChartBarOrientation` | `"vertical"` | Bar direction: `"vertical"` or `"horizontal"`. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `stack` | `string` | `undefined` | Stack group name. Series sharing the same stack identifier are stacked cumulatively. |
| `stackMode` | `ChartStackMode` | `"normal"` | Stacking calculation mode: `"normal"` or `"percent"`. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats this series' values in tooltips, data labels and announcements, without changing the axis ticks. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-area-series>`

Renders a continuous Cartesian area series supporting gradient fades, solid fills, cumulative stacking, and 100% normalized bands.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Line and area fill color override. |
| `connectNulls` | `boolean` | `false` | Whether to interpolate across null/missing data points. |
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation algorithm (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`). |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `downsampling` | `ChartDownsamplingInput` | `undefined` | Series density policy; inherits the chart policy when omitted and keeps step/stack geometry family-safe. |
| `field` | `ChartField` | `""` | Property key or accessor extracting the numeric Y value. Object rows render nothing without it; rows that are plain numbers do not need it. |
| `fillMode` | `ChartAreaFillMode` | `"gradient"` | Area fill style: `"gradient"` or `"solid"`. |
| `fillOpacity` | `number` | `undefined` | Opacity ratio for area fill (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `lineStyle` | `ChartLineStyle` | `"solid"` | Line pattern: `"solid"`, `"dashed"` or `"dotted"`. |
| `name` | `string` | `""` | Series name for tooltips, legend and accessibility. Falls back to the field name when it is a string, then to "Series N". |
| `pointRadius` | `number` | `undefined` | Radius in pixels of the point markers. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `showPoints` | `boolean` | `false` | Whether to render point markers at data coordinates. |
| `stack` | `string` | `undefined` | Stack group name. Series sharing the same stack identifier are stacked into bands. |
| `stackMode` | `ChartStackMode` | `"normal"` | Stacking calculation mode: `"normal"` or `"percent"`. |
| `strokeWidth` | `number` | `undefined` | Top line stroke width in pixels. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats this series' values in tooltips, data labels and announcements, without changing the axis ticks. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-scatter-series>`

Renders individual point markers across continuous numeric (linear) or temporal (time/utc) Cartesian coordinates.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Explicit fill color for scatter point markers. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `downsampling` | `ChartDownsamplingInput` | `undefined` | Series density policy; continuous-X scatter uses pixel-safe marker representatives and category-X data remains ineligible. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y value. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for scatter markers, 0 to 1 (effective default `0.9`). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `name` | `string` | `"Scatter"` | Series name for tooltips, legend, and accessibility. |
| `pointRadius` | `number` | `undefined` | Radius in pixels for scatter point markers. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `strokeColor` | `string` | `""` | Outline stroke color for markers. |
| `strokeWidth` | `number` | `undefined` | Outline stroke width in pixels (effective default `1.5`). |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats this series' values in tooltips, data labels and announcements, without changing the axis ticks. Takes precedence over the axis formatter. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-bubble-series>`

Renders 3-dimensional data points with position (X, Y) and proportionally-scaled circle areas (Size).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Explicit fill color for bubble markers. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `downsampling` | `ChartDownsamplingInput` | `undefined` | Series density policy; continuous-X bubble uses pixel-safe marker representatives while its size domain remains source-authoritative. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y value. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for bubble markers, 0 to 1 (effective default `0.55`). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `maxRadius` | `number` | `24` | Maximum bubble radius in pixels for the largest observed size. |
| `minRadius` | `number` | `4` | Minimum bubble radius in pixels for the smallest observed size. |
| `name` | `string` | `"Bubble"` | Series name for tooltips, legend, and accessibility. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `sizeField` | `ChartField` | `"size"` | Property key or accessor extracting positive numeric size value. |
| `sizeFormatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for bubble size in tooltips and live region. |
| `strokeColor` | `string` | `""` | Outline stroke color for bubble circles. |
| `strokeWidth` | `number` | `undefined` | Outline stroke width in pixels (effective default `1.5`). |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats this series' values in tooltips, data labels and announcements, without changing the axis ticks. Takes precedence over the axis formatter. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate value. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-range-bar-series>`

Renders floating Cartesian range bars spanning between a lower value and an upper value (e.g. min/max temperatures, price spans, or SLA tolerances).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `borderRadius` | `number` | `undefined` | Uniform corner radius in pixels applied to all 4 bar corners. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Explicit fill color override for the range bars. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `fillOpacity` | `number` | `undefined` | Fill opacity for the range bars (0 to 1). |
| `fromField` | `ChartField` | required | Property key or accessor extracting the starting numeric value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `maxBarWidth` | `number` | `undefined` | Maximum width constraint in pixels for range bars. |
| `name` | `string` | `"Range Bar"` | Series name for tooltips, legend, and accessibility. |
| `orientation` | `ChartBarOrientation` | `"vertical"` | Bar direction: `"vertical"` or `"horizontal"`. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `toField` | `ChartField` | required | Property key or accessor extracting the ending numeric value. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter function for range values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate/category value. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-range-area-series>`

Renders continuous Cartesian vertical range bands/areas bounded between lower and upper values (e.g. confidence intervals, forecast envelopes, or high/low bands).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Explicit fill color for the range band and point markers. |
| `connectNulls` | `boolean` | `false` | Whether to interpolate across non-finite or missing data points. |
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation algorithm applied to boundary paths (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`). |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `downsampling` | `ChartDownsamplingInput` | `undefined` | Series density policy; continuous-X range areas use low/high envelope selection with step-safe adjacency. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for the range area band, 0 to 1 (effective default `0.18`). |
| `fromField` | `ChartField` | required | Property key or accessor extracting the starting boundary numeric value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `name` | `string` | `"Range Area"` | Series name for tooltips, legend, and accessibility. |
| `pointRadius` | `number` | `undefined` | Radius in pixels for dual boundary point markers when enabled. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `showPoints` | `boolean` | `false` | Whether to render point markers at low and high boundaries. |
| `strokeWidth` | `number` | `undefined` | Boundary stroke outline width in pixels. |
| `toField` | `ChartField` | required | Property key or accessor extracting the ending boundary numeric value. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter function for range values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate/category value. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-heatmap-series>`

Renders a matrix of cells colored by value, with a color scale in the legend.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `borderRadius` | `number` | `undefined` | Corner radius of each cell in pixels. |
| `cellGap` | `number` | `1` | Gap between cells in pixels. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Base color for a generated sequential ramp. |
| `colorMode` | `ChartHeatmapColorMode` | `"sequential"` | Color scale: `"sequential"` or `"diverging"`. |
| `colors` | `readonly string[]` | `undefined` | Color stops for the scale. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | required | Property key or accessor extracting the cell value. |
| `fillOpacity` | `number` | `undefined` | Cell fill opacity, 0 to 1. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `max` | `number` | `undefined` | Upper bound of the color scale. |
| `midpoint` | `number` | `undefined` | Midpoint of a diverging scale. |
| `min` | `number` | `undefined` | Lower bound of the color scale. |
| `name` | `string` | `"Heatmap"` | Series name for tooltips, legend and accessibility. |
| `showValues` | `boolean` | `false` | Whether to draw values inside the cells. |
| `strokeColor` | `string` | `""` | Color of the cell outlines. |
| `strokeWidth` | `number` | `undefined` | Width of the cell outlines in pixels. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formats values in tooltips, cells, the scale and announcements. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `xCategories` | `readonly unknown[]` | `undefined` | Explicit column order. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting the column, overriding the chart `xField`. |
| `yCategories` | `readonly unknown[]` | `undefined` | Explicit row order. |
| `yField` | `ChartField` | required | Property key or accessor extracting the row. |

### `<mona-candlestick-series>`

Renders financial Japanese candlestick series with central high/low wicks, rectangular open/close bodies, rising/falling/neutral color coding, and solid or hollow rising bodies.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `bodyWidth` | `number` | `undefined` | Explicit body width in pixels. |
| `bodyWidthRatio` | `number` | `0.7` | Relative body width ratio (0 to 1) applied to available slot bandwidth. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `closeField` | `ChartField` | required | Property key or accessor extracting closing price/value. |
| `color` | `string` | `undefined` | Explicit unified color override for all candlesticks. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `fallingColor` | `string` | `""` | Color for falling candles (Close < Open). Falls back to `--mona-chart-financial-falling-color`, then `#ef4444`. |
| `fillMode` | `ChartFinancialFillMode` | `"hollow"` | Body fill styling. `"hollow"` draws rising candles as outlines, so they differ from falling ones by more than color; `"filled"` draws solid bodies. |
| `fillOpacity` | `number` | `undefined` | Fill and stroke opacity ratio (0 to 1). |
| `highField` | `ChartField` | required | Property key or accessor extracting highest price/value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `lowField` | `ChartField` | required | Property key or accessor extracting lowest price/value. |
| `maxBodyWidth` | `number` | `32` | Maximum width constraint in pixels for candle bodies. |
| `name` | `string` | `"Candlestick"` | Series name for tooltips, legend, and accessibility. |
| `neutralColor` | `string` | `""` | Color for neutral candles (Close == Open). Falls back to `--mona-chart-financial-neutral-color`, then `#6b7280`. |
| `opacity` | `number` | `undefined` | **Deprecated.** Use `fillOpacity`. |
| `openField` | `ChartField` | required | Property key or accessor extracting opening price/value. |
| `risingColor` | `string` | `""` | Color for rising candles (Close > Open). Falls back to `--mona-chart-financial-rising-color`, then `#16a34a`. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for prices/values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `wickColor` | `string` | `""` | Explicit color override for vertical wicks. Defaults to body color. |
| `wickWidth` | `number` | `1` | Stroke width in pixels for central high/low wick lines. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate or timestamp. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-ohlc-series>`

Renders traditional financial OHLC (Open-High-Low-Close) bar series with vertical high/low price spans, left-facing open ticks, right-facing close ticks, and directional color coding.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `bodyWidth` | `number` | `undefined` | Explicit total width in pixels encompassing both left and right ticks. |
| `bodyWidthRatio` | `number` | `0.7` | Relative width ratio (0 to 1) applied to available slot bandwidth. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `closeField` | `ChartField` | required | Property key or accessor extracting closing price/value. |
| `color` | `string` | `undefined` | Explicit unified color override for all OHLC bars. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `dataLabels` | `ChartDataLabelsInput` | `false` | Data-label display options, or `true` for the defaults. See [Data labels](#data-labels). |
| `fallingColor` | `string` | `""` | Color for falling bars (Close < Open). Falls back to `--mona-chart-financial-falling-color`, then `#ef4444`. |
| `fillOpacity` | `number` | `undefined` | Stroke opacity ratio (0 to 1). |
| `highField` | `ChartField` | required | Property key or accessor extracting highest price/value. |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity for animations. |
| `lowField` | `ChartField` | required | Property key or accessor extracting lowest price/value. |
| `maxBodyWidth` | `number` | `32` | Maximum total width constraint in pixels for OHLC bars. |
| `name` | `string` | `"OHLC"` | Series name for tooltips, legend, and accessibility. |
| `neutralColor` | `string` | `""` | Color for neutral bars (Close == Open). Falls back to `--mona-chart-financial-neutral-color`, then `#6b7280`. |
| `opacity` | `number` | `undefined` | **Deprecated.** Use `fillOpacity`. |
| `openField` | `ChartField` | required | Property key or accessor extracting opening price/value. |
| `risingColor` | `string` | `""` | Color for rising bars (Close > Open). Falls back to `--mona-chart-financial-rising-color`, then `#16a34a`. |
| `tickLength` | `number` | `undefined` | Length in pixels of the open and close tick arms. |
| `tickWidth` | `number` | `undefined` | Stroke width in pixels of the open and close tick arms. |
| `seriesKey` | `string` | `undefined` | Stable series identity for mark identity and selection across updates. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatting function for prices/values in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `wickColor` | `string` | `""` | Explicit color override for vertical spine and ticks. |
| `wickWidth` | `number` | `1` | Stroke width in pixels for vertical spine and horizontal tick lines. |
| `xAxisId` | `string` | `undefined` | Cartesian X axis ID; omitted uses the primary X axis. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X coordinate or timestamp. |
| `yAxisId` | `string` | `undefined` | Cartesian Y axis ID; omitted uses the primary Y axis. |

### `<mona-radial-bar-series>`

Renders concentric circular progress rings with customizable bar gap, thickness, rounded corners, and background tracks.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `barGap` | `number` | `4` | Spacing in pixels between concentric radial rings. |
| `barThickness` | `number` | `undefined` | Explicit radial thickness in pixels for each bar ring. |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the category label for each radial ring. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for ring category labels. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
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
| `hiddenItemIds` | `model(readonly string[])` | `[]` | The hidden item IDs. Bindable with `[(hiddenItemIds)]`; legend toggles write to it. |
| `datumVisibilityChange` | `output<ChartRadialDatumVisibilityEvent>` | - | Emitted when an individual ring's visibility is toggled via the legend. |

### `<mona-rose-series>`

Renders Nightingale rose (coxcomb) charts with angular category petals whose radial extent scales by area or radius.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting the category label for each petal. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for category labels. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
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
| `hiddenItemIds` | `model(readonly string[])` | `[]` | The hidden item IDs. Bindable with `[(hiddenItemIds)]`; legend toggles write to it. |
| `datumVisibilityChange` | `output<ChartRadialDatumVisibilityEvent>` | - | Emitted when an individual petal's visibility is toggled via the legend. |

### `<mona-gauge-series>`

Renders circular or semi-circular gauge meters with value progress arcs, tapered needles, central hubs, and centered value projection.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Color of the value arc. Falls back to `--mona-chart-gauge-color`. |
| `cornerRadius` | `number` | `undefined` | Corner radius in pixels applied to value arc endpoints. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root chart data. |
| `endAngle` | `number` | `120` | Ending angle in degrees (clockwise from 12 o'clock). |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting the gauge numeric value from data. |
| `fillMode` | `ChartRadialArcFillMode` | `"solid"` | Fill style of value arc: `"solid"` or radial `"gradient"`. |
| `fillOpacity` | `number` | `undefined` | Opacity of value arc fill (0 to 1). |
| `hubRadius` | `number` | `5` | Radius in pixels of central needle pivot hub. |
| `indicator` | `ChartGaugeIndicator` | `"arc"` | Visual indicator style: `"arc"`, `"needle"`, or `"both"`. |
| `innerRadiusRatio` | `number` | `0.72` | Inner radius ratio relative to available plot bounds (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting stable datum identity. |
| `max` | `number` | `100` | Maximum domain boundary value. |
| `min` | `number` | `0` | Minimum domain boundary value. |
| `name` | `string` | `"Gauge"` | Series name for tooltips, legend, and accessibility. |
| `needleColor` | `string` | `""` | Color of pointer needle. Defaults to primary color. |
| `needleLengthRatio` | `number` | `0.78` | Length of needle as a ratio of gauge outer radius (0.1 to 1). |
| `needleWidth` | `number` | `2` | Base width in pixels of tapered needle pointer. |
| `outerRadiusRatio` | `number` | `0.9` | Outer radius ratio relative to available plot bounds (0.1 to 1). |
| `showValue` | `boolean` | `true` | Whether to display default centered value text when no custom template is provided. |
| `startAngle` | `number` | `-120` | Starting angle in degrees (0 is 12 o'clock, clockwise). |
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
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for node text labels. |
| `childrenField` | `ChartField` | `"children"` | Property key or accessor extracting child node array. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Explicit unified fill color for all nodes. |
| `colorField` | `ChartField` | `undefined` | Property key or accessor extracting explicit color per item. |
| `colors` | `readonly string[]` | `undefined` | Array of colors assigned to top-level branches and inherited down subtrees. |
| `data` | `readonly unknown[]` | `undefined` | Hierarchical dataset overriding root chart data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric node value. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for terminal leaf cells (0 to 1). |
| `keyField` | `ChartField` | `undefined` | Property key or accessor extracting unique node identifier. |
| `labelField` | `ChartField` | `"name"` | Property key or accessor extracting node text label. |
| `labelFormatter` | `ChartValueFormatter` | `undefined` | **Deprecated.** Use `categoryFormatter`. |
| `maxDepth` | `number` | `undefined` | Maximum hierarchy depth to render; deeper subtrees are aggregated into solid terminal nodes. |
| `maxLabels` | `number` | `100` | Maximum number of DOM overlay labels to render concurrently. |
| `minLabelHeight` | `number` | `undefined` | Minimum node height in pixels required to render a DOM label (effective default `16`, or `24` with `showValues`). |
| `minLabelWidth` | `number` | `undefined` | Minimum node width in pixels required to render a DOM label (effective default `30`). |
| `name` | `string` | `"Treemap"` | Series name for tooltips, legend, and accessibility. |
| `paddingInner` | `number` | `2` | Inner gap in pixels between sibling node rectangles. |
| `paddingOuter` | `number` | `4` | Outer padding in pixels between parent boundary and child nodes. |
| `parentFillOpacity` | `number` | `undefined` | Fill opacity for parent container backgrounds (0 to 1). |
| `parentHeaderHeight` | `number` | `undefined` | Reserved height in pixels for parent category header bars (effective default `20`). |
| `showLabels` | `boolean` | `true` | Whether to display DOM overlay text labels on nodes. |
| `showParentLabels` | `boolean` | `true` | Whether to display header labels on parent nodes. |
| `showValues` | `boolean` | `false` | Whether to append formatted numeric values to node labels. |
| `sort` | `ChartTreemapSort` | `"descending"` | Sibling sorting order: `"descending"`, `"ascending"`, or `"none"`. |
| `strokeColor` | `string` | `""` | Cell boundary border stroke color. |
| `strokeWidth` | `number` | `undefined` | Cell boundary border stroke width in pixels. |
| `tile` | `ChartTreemapTile` | `"squarify"` | Tiling algorithm: `"squarify"`, `"binary"`, `"dice"`, `"slice"`, or `"slice-dice"`. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter callback for numeric values. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `hiddenNodeIds` | `model(readonly string[])` | `[]` | The hidden top-level node IDs. Bindable with `[(hiddenNodeIds)]`; legend toggles write to it. |
| `nodeVisibilityChange` | `output<ChartTreemapNodeVisibilityEvent>` | - | Emitted when a top-level branch visibility is toggled via legend or API. |

### `<mona-funnel-series>`

Renders conversion pipeline and sales funnel visualizations using connected trapezoidal stages. Supports vertical and horizontal layouts, custom stage colors, inscribed DOM labels, widening stages (>100% conversion), and dynamic stage visibility toggling.

*Stage order is preserved from source data order. Values need not decrease monotonically; later stages can exceed preceding stages (resulting in conversion rates > 100%). The default tooltip and live region accessibility announcements describe positive stage loss as "Drop-off". Hiding a Funnel stage via the legend removes it from the visible sequence; previous-stage conversion and overall conversion are recalculated across the visible stages, with the first visible stage becoming the overall-conversion baseline.*
*Providing `keyField` is strongly recommended for stable datum identity across data insertions, deletions, and animations.*
*In custom label templates (`monaChartFunnelLabelTemplate`), `color` exposes the stage trapezoid fill color and `textColor` exposes the resolved label foreground (respecting `--mona-chart-funnel-label-color` or readable high contrast).*

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting stage names. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter function for category labels. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `""` | Uniform fill color for all funnel stages. |
| `colorField` | `ChartField` | `undefined` | Property key extracting discrete colors per datum. |
| `colors` | `readonly string[]` | `undefined` | Palette array of colors cycled across stages. |
| `data` | `readonly unknown[]` | `undefined` | Array of stage data items overriding chart-level root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor function extracting numeric values. |
| `fillOpacity` | `number` | `undefined` | Fill opacity applied to stage trapezoids (0 to 1). |
| `gap` | `number` | `2` | Spacing in pixels between consecutive funnel stages. |
| `keyField` | `ChartField` | `undefined` | Unique identifier key field for datums. |
| `labelContent` | `ChartFunnelLabelContent` | `"category-value"` | Content format for automatic stage labels (`"category"`, `"value"`, `"category-value"`, `"category-value-conversion"`). |
| `maxLabels` | `number` | `100` | Maximum number of visible stage labels rendered simultaneously. |
| `minLabelHeight` | `number` | `undefined` | Minimum stage height in pixels required to render a label (effective default `20`). |
| `minLabelWidth` | `number` | `undefined` | Minimum stage width in pixels required to render a label (effective default `48`). |
| `name` | `string` | `"Funnel"` | Descriptive series name displayed in chart legend and tooltips. |
| `orientation` | `ChartFunnelOrientation` | `"vertical"` | Layout orientation of the funnel (`"vertical"` or `"horizontal"`). |
| `showLabels` | `boolean` | `true` | Controls whether built-in stage text labels are rendered. |
| `strokeColor` | `string` | `""` | Stroke outline color for stage trapezoids. |
| `strokeWidth` | `number` | `undefined` | Stroke width in pixels for stage trapezoids. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter function for numeric values. |
| `visible` | `model(boolean)` | `true` | Controls overall visibility of the funnel series. |
| `widthRatio` | `number` | `0.9` | Maximum width ratio (0.1 to 1) for the funnel's widest stage relative to plot area. |
| `hiddenStageIds` | `model(readonly string[])` | `[]` | The hidden stage IDs. Bindable with `[(hiddenStageIds)]`; legend toggles write to it. |
| `stageVisibilityChange` | `output<ChartFunnelStageVisibilityEvent>` | - | Emits when a stage's visibility is toggled via legend or API. |

### `<mona-waterfall-series>`

Renders financial cash-flow and contribution movements with positive delta increases, negative delta decreases, zero-change neutral bars, intermediate subtotals, and cumulative grand totals.

*Datum kinds: Supported step kinds are `"change"`, `"subtotal"`, and `"total"`. A `change` step requires a finite numeric value; invalid change rows with non-numeric values are omitted from calculation and rendering rather than treated as zero. Subtotal and total rows do not require a numeric field value and reflect the current running balance against the baseline without resetting the cumulative count.*
*Zero change: Zero-change delta steps are treated as real neutral datums styled with `neutralColor`.*
*X-axis resolution & duplicates: Duplicate category names remain distinct ordered steps. X-axis category labels fall back to series `xField`, then to the chart root `xField`, then to canonical `Step N` display labels. The X category formatter receives the original source `dataIndex`.*
*Baseline: `startValue` defines the cumulative baseline value before the first step; automatic Y-domain geometry scales to the actual rendered bars.*
*Legend semantics: Legend entries for visual kinds (Increase, Decrease, No Change, Subtotal, Total) are presentation-only semantic markers (`kind: "semantic"`, `interactive: false`, `visible: true`). Semantic-kind hiding is intentionally unsupported to preserve cumulative arithmetic consistency. The entire series visibility is toggled via `[(visible)]`.*
*Identity & Animations: Providing `keyField` is strongly recommended for stable datum identity across data insertions, deletions, and animations.*
*In custom label templates (`monaChartWaterfallLabelTemplate`), `color` exposes the matching bar fill color and `textColor` exposes the resolved label foreground (respecting `--mona-chart-waterfall-label-color` or applying readable contrast when placed inside bars).*

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `borderRadius` | `number` | `undefined` | Corner radius in pixels applied to waterfall bar rectangles. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `connectorColor` | `string` | `""` | Color of the horizontal connector lines joining consecutive bars. |
| `connectorWidth` | `number` | `undefined` | Line width in pixels of the connector lines between steps. |
| `data` | `readonly unknown[]` | `undefined` | Array of step data items overriding chart-level root data. |
| `decreaseColor` | `string` | `""` | Fill color for negative change steps (decreases). |
| `field` | `ChartField` | `"value"` | Property key or accessor function extracting the numeric delta/total value. |
| `fillOpacity` | `number` | `undefined` | Fill opacity applied to waterfall bar rectangles (0 to 1). |
| `increaseColor` | `string` | `""` | Fill color for positive change steps (increases). |
| `keyField` | `ChartField` | `undefined` | Unique identifier key field for datums. |
| `kindField` | `ChartField` | `"kind"` | Property key identifying step classification (`"change"`, `"subtotal"`, or `"total"`). |
| `maxBarWidth` | `number` | `undefined` | Maximum width in pixels for waterfall bars. |
| `maxLabels` | `number` | `100` | Maximum number of visible step labels rendered concurrently. |
| `minLabelWidth` | `number` | `undefined` | Minimum bar width in pixels required to render a value label (effective default `24`). |
| `name` | `string` | `"Waterfall"` | Descriptive series name displayed in chart legend and tooltips. |
| `neutralColor` | `string` | `""` | Fill color for zero-change steps. |
| `showConnectors` | `boolean` | `true` | Controls whether horizontal connector lines between consecutive bars are rendered. |
| `showLabels` | `boolean` | `false` | Controls whether step value labels are rendered above/inside bars. |
| `startValue` | `number` | `0` | Base starting value before the first step. |
| `strokeColor` | `string` | `""` | Border stroke color for bar rectangles. |
| `strokeWidth` | `number` | `undefined` | Border stroke width in pixels for bar rectangles. |
| `subtotalColor` | `string` | `""` | Fill color for intermediate subtotal bars. |
| `totalColor` | `string` | `""` | Fill color for cumulative grand total bars. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter function for step values. |
| `visible` | `model(boolean)` | `true` | Controls overall visibility of the waterfall series. |
| `xField` | `ChartField` | `undefined` | Property key or accessor function extracting the category name for each step. |

### `<mona-chart-crosshair>`

Renders dynamic crosshair guide lines and axis label badges for pointer and keyboard navigation in Cartesian XY charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `undefined` | Color of the crosshair guide lines. |
| `enabled` | `boolean` | `true` | Whether the crosshair is active. |
| `labelOffset` | `number` | `4` | Offset in pixels between plot boundary and axis label badge. |
| `lineStyle` | `ChartCrosshairLineStyle` | `"dashed"` | Stroke dash style (`"solid"`, `"dashed"`, or `"dotted"`). |
| `lineWidth` | `number` | `undefined` | Line stroke width in pixels (effective default `1`). |
| `maxSnapDistance` | `number` | `32` | Maximum distance in pixels for snapping to nearest data mark in `nearest` snap mode. |
| `mode` | `ChartCrosshairMode` | `"auto"` | Crosshair orientation (`"auto"`, `"x"`, `"y"`, or `"xy"`). |
| `opacity` | `number` | `undefined` | Opacity of the crosshair lines, 0 to 1 (effective default `1`). |
| `showAxisLabels` | `boolean` | `true` | Controls overall rendering of axis coordinate badges. |
| `showXLabel` | `boolean` | `undefined` | Per-axis override for X axis label badge visibility. |
| `showYLabel` | `boolean` | `undefined` | Per-axis override for Y axis label badge visibility. |
| `snap` | `ChartCrosshairSnapMode` | `"nearest"` | Snapping strategy (`"nearest"` or `"pointer"`). |
| `xAxisId` | `string` | `undefined` | Explicit target X axis ID for multi-axis configurations. |
| `yAxisId` | `string` | `undefined` | Explicit target Y axis ID for multi-axis configurations. |

### `<mona-chart-reference-line>`

Renders static horizontal or vertical benchmark lines in Cartesian XY charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axis` | `"x" \| "y"` | required | Axis dimension the line is perpendicular to. |
| `axisId` | `string` | `undefined` | Target axis ID for multi-axis charts. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `undefined` | Line stroke color. |
| `label` | `string` | `""` | Text label displayed on the reference line. |
| `labelClass` | `string` | `""` | CSS classes applied to the label badge. |
| `labelOffset` | `number` | `6` | Offset in pixels for label anchor. |
| `labelPosition` | `ChartReferenceLabelPosition` | `"end"` | Placement along the line (`"start"`, `"center"`, or `"end"`). |
| `layer` | `ChartOverlayLayer` | `"overlay"` | Rendering layer (`"underlay"` or `"overlay"`). |
| `lineStyle` | `ChartReferenceLineStyle` | `"dashed"` | Line pattern (`"solid"`, `"dashed"`, or `"dotted"`). |
| `opacity` | `number` | `undefined` | Stroke opacity (0 to 1). |
| `value` | `number \| string` | required | Target coordinate value on the specified axis. |
| `visible` | `boolean` | `true` | Controls visibility of the reference line. |
| `width` | `number` | `undefined` | Stroke width in pixels (effective default `1`). |

### `<mona-chart-reference-band>`

Renders highlighted threshold intervals and target regions in Cartesian XY charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axis` | `"x" \| "y"` | required | Axis dimension the band spans across. |
| `axisId` | `string` | `undefined` | Target axis ID for multi-axis charts. |
| `borderColor` | `string` | `undefined` | Optional border stroke color around the band rectangle. |
| `borderWidth` | `number` | `undefined` | Border stroke width in pixels. |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `fillColor` | `string` | `undefined` | Background fill color for the band region. |
| `fillOpacity` | `number` | `undefined` | Fill opacity for the band area (0 to 1). |
| `from` | `number \| string` | required | Lower bound value of the band interval. |
| `label` | `string` | `""` | Text label displayed in the band. |
| `labelClass` | `string` | `""` | CSS classes applied to the label badge. |
| `labelOffset` | `number` | `6` | Offset in pixels for label anchor. |
| `labelPosition` | `ChartReferenceLabelPosition` | `"center"` | Placement anchor (`"start"`, `"center"`, or `"end"`). |
| `layer` | `ChartOverlayLayer` | `"underlay"` | Rendering layer (`"underlay"` or `"overlay"`). |
| `to` | `number \| string` | required | Upper bound value of the band interval. |
| `visible` | `boolean` | `true` | Controls visibility of the reference band. |

### `<mona-chart-annotation>`

Renders callouts, milestone badges, and outlier markers anchored to specific (X, Y) coordinates.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `color` | `string` | `undefined` | Marker and connector color override. |
| `connector` | `boolean` | `true` | Whether to draw a connector leader line between the data point and label badge. |
| `connectorWidth` | `number` | `1` | Width in pixels of the connector leader line. |
| `data` | `unknown` | `undefined` | Custom arbitrary payload passed to the annotation template context. |
| `label` | `string` | `""` | Text content of the annotation badge. |
| `labelClass` | `string` | `""` | CSS classes applied to the annotation badge. |
| `labelPlacement` | `ChartAnnotationLabelPlacement` | `"top"` | Badge placement relative to the data point (`"top"`, `"bottom"`, `"left"`, `"right"`). |
| `marker` | `ChartAnnotationMarker` | `"circle"` | Marker symbol shape (`"circle"`, `"diamond"`, or `"none"`). |
| `markerRadius` | `number` | `4` | Marker radius in pixels. |
| `markerStrokeWidth` | `number` | `1.5` | Marker outline stroke width in pixels. |
| `offsetX` | `number` | `0` | Additional X pixel offset for label positioning. |
| `offsetY` | `number` | `0` | Additional Y pixel offset for label positioning. |
| `visible` | `boolean` | `true` | Controls visibility of the annotation. |
| `x` | `number \| string` | required | Target X coordinate or category key. |
| `xAxisId` | `string` | `undefined` | Target X axis ID for multi-axis charts. |
| `y` | `number \| string` | required | Target Y coordinate or category key. |
| `yAxisId` | `string` | `undefined` | Target Y axis ID for multi-axis charts. |

### `<mona-chart-legend>`

Adds a legend. Items toggle what they represent unless `interactive` is off.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the host element. |
| `interactive` | `boolean` | `true` | Whether clicking or pressing an item toggles it. |
| `mode` | `ChartLegendMode` | `"auto"` | What the legend shows: `"series"`, a heatmap `"color"` scale, or `"auto"` to choose by series. |
| `position` | `ChartLegendPosition` | `"bottom"` | `"top"`, `"bottom"`, `"start"` or `"end"`, or the physical `"left"` or `"right"`. `"start"` and `"end"` follow the direction. |

### `<mona-chart-tooltip>`

Adds a tooltip for pointer and keyboard interaction. Use `ng-template[monaChartTooltipTemplate]` for custom content.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `class` | `string` | `""` | CSS classes applied to the tooltip. |
| `enabled` | `boolean` | `true` | Whether the tooltip shows. |
| `shared` | `boolean` | `false` | Whether the tooltip lists every series at the X coordinate instead of the nearest point. |

### `<mona-chart-brush>`

Selects a region of a Cartesian plot by dragging, or from the keyboard with `Shift` + arrows from a focused point.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `activation` | `ChartBrushActivation` | `"shift-drag"` | What starts a brush: `"shift-drag"` or `"drag"`. |
| `borderColor` | `string` | `undefined` | Border color of the brush rectangle. |
| `borderWidth` | `number` | `undefined` | Border width of the brush rectangle in pixels. |
| `enabled` | `boolean` | `true` | Whether brushing is on. |
| `fillColor` | `string` | `undefined` | Fill color of the brush rectangle. |
| `fillOpacity` | `number` | `undefined` | Fill opacity of the brush rectangle, 0 to 1. |
| `hitPolicy` | `ChartBrushHitPolicy` | `"intersect"` | What counts as inside: `"intersect"` or the mark's `"center"`. |
| `lineStyle` | `ChartBrushLineStyle` | `undefined` | Border pattern: `"solid"`, `"dashed"` or `"dotted"`. |
| `minDragDistance` | `number` | `4` | Drag distance in pixels before a brush starts. |
| `mode` | `ChartBrushMode` | `"xy"` | Brushed dimensions: `"x"`, `"y"` or `"xy"`. |
| `selectionBehavior` | `ChartBrushSelectionBehavior` | `"none"` | What a finished brush does to `<mona-chart-selection>`: `"none"`, `"replace"`, `"add"`, `"remove"` or `"toggle"`. |
| `xAxisId` | `string` | `undefined` | Target X axis for multi-axis charts. |
| `yAxisId` | `string` | `undefined` | Target Y axis for multi-axis charts. |
| `brushChange` | `output<ChartBrushChangeEvent>` | - | Emits at `phase` `"start"`, `"update"`, `"end"` and `"cancel"` with the ranges and matched points. |

### `<mona-chart-selection>`

Lets users select marks with the pointer and keyboard, and holds the selected mark IDs.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `clearOnBackgroundClick` | `boolean` | `true` | Whether clicking the empty plot clears the selection. |
| `clickSelection` | `boolean` | `true` | Whether a click selects. |
| `color` | `string` | `undefined` | Highlight color of selected marks. |
| `defaultSelectedMarkIds` | `readonly string[]` | `[]` | The starting selection when the parent does not control `selectedMarkIds`. |
| `enabled` | `boolean` | `true` | Whether selection is on. |
| `fillOpacity` | `number` | `undefined` | Highlight fill opacity, 0 to 1. |
| `keyboardSelection` | `boolean` | `true` | Whether `Enter` and `Space` select. |
| `mode` | `ChartSelectionMode` | `"single"` | `"single"` or `"multiple"`. |
| `retainOnDataChange` | `boolean` | `true` | Whether selected marks stay selected across data changes. Use `keyField` so marks keep their identity. |
| `selectedMarkIds` | `readonly string[]` | `undefined` | The selected mark IDs. Bindable with `[(selectedMarkIds)]`. While it is defined the parent owns the selection. |
| `strokeWidth` | `number` | `undefined` | Highlight stroke width in pixels. |
| `selectedMarkIdsChange` | `output<readonly string[]>` | - | Emits the selected mark IDs when they change. |
| `selectionChange` | `output<ChartSelectionChangeEvent>` | - | Emits with the added and removed IDs, the changed points and the source. |

## Shared Options

### Data labels

`dataLabels` on Cartesian series takes `true`, `false` or `ChartDataLabelOptions`.

| Option | Type | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `allowOverlap` | `boolean` | `false` | Whether labels may overlap each other. |
| `collisionPadding` | `number` | `2` | Padding around a label when checking collisions. |
| `color` | `string` | `undefined` | Text color. |
| `formatter` | `ChartDataLabelFormatter` | `undefined` | Returns the label text; `null`, `undefined` or `""` hides that label. |
| `maxLabels` | `number` | `200` | Most labels the series shows. |
| `offset` | `number` | `6` | Distance in pixels from the mark. |
| `overflow` | `"clip" \| "hide"` | `"hide"` | What happens to a label at the plot edge. |
| `position` | `ChartDataLabelPosition` | `"auto"` | Placement. `"auto"` picks a free candidate and follows the direction. |

### Viewport and navigation

`navigation` takes `true`, `false` or `ChartNavigationOptions`. All are on when `navigation` is `true`.

| Option | Type | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `clampToData` | `boolean` | `true` | Keeps the viewport inside the data. |
| `constraints` | `readonly ChartViewportConstraint[]` | `[]` | Per-axis limits on span, zoom and visible categories. |
| `dragPan` | `boolean` | `true` | Drag to pan. |
| `keyboard` | `boolean` | `true` | `Shift` + arrows pan, `+` and `-` zoom, `0` resets. |
| `keyboardPanRatio` | `number` | `0.1` | Share of the plot one key press pans. |
| `keyboardZoomFactor` | `number` | `1.2` | Zoom factor of one key press. |
| `linkGroups` | `readonly ChartViewportLinkGroup[]` | `[]` | Axes in this chart that move together. |
| `minVisibleCategories` | `number` | `1` | Fewest categories a zoom can leave visible. |
| `pan` | `boolean` | `true` | Allows panning at all. |
| `panAxes` | `ChartNavigationAxisTarget` | `"auto"` | Axes that pan. |
| `pinchZoom` | `boolean` | `true` | Pinch to zoom. |
| `wheelSensitivity` | `number` | `0.002` | Zoom per wheel unit. |
| `wheelZoom` | `boolean` | `true` | Wheel to zoom. |
| `zoom` | `boolean` | `true` | Allows zooming at all. |
| `zoomAxes` | `ChartNavigationAxisTarget` | `"auto"` | Axes that zoom. |

The viewport is a `ChartViewportState`: `{ axes: ChartViewportWindow[] }`. A window is `{ kind: "continuous", axis, axisId, min, max }` or `{ kind: "category", axis, axisId, startIndex, endIndexExclusive }`.

`viewportChangeDetails` gives the `source` of a change (`"drag"`, `"wheel"`, `"pinch"`, `"keyboard"`, `"fit"`, `"reset"`, `"sync"`, `"programmatic"` or `"data-reconcile"`) and its `phase` (`"start"`, `"update"` or `"end"`).

### Cross-chart synchronization

`synchronization` takes a group name or `ChartSynchronizationOptions`: `group`, `viewport` (`boolean` or `{ axes, enabled, mode, phase }`), `crosshair` (`boolean` or `{ axes, clearOnLeave, enabled, match, mode, showTooltip }`) and `axisMappings`. See "Cross-chart synchronization" above for what is shared.

### Animation

`animation` takes `true`, `false` or `ChartAnimationOptions`. Animation is skipped when the user prefers reduced motion.

| Option | Type | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `data` | `boolean` | `true` | Animate data changes. |
| `duration` | `number` | `300` | Duration in milliseconds. |
| `easing` | `ChartAnimationEasing` | `"ease-out"` | `"linear"`, `"ease-in"`, `"ease-out"` or `"ease-in-out"`. |
| `enabled` | `boolean` | `true` | Animate at all. |
| `initial` | `boolean` | `true` | Animate the first render. |
| `visibility` | `boolean` | `true` | Animate visibility toggles. |

## Two-Way Binding

| Binding | On | Holds |
| :--- | :--- | :--- |
| `[(viewport)]` | `<mona-chart>` | The viewport state. |
| `[(selectedMarkIds)]` | `<mona-chart-selection>` | The selected mark IDs. |
| `[(visible)]` | Every series | Whether the series is visible. |
| `[(hiddenIndices)]` | `<mona-pie-series>`, `<mona-donut-series>` | The hidden data indices. They refer to positions, so they follow the position, not the item, when rows are reordered. |
| `[(hiddenItemIds)]` | `<mona-radial-bar-series>`, `<mona-rose-series>` | The hidden item IDs. |
| `[(hiddenNodeIds)]` | `<mona-treemap-series>` | The hidden top-level node IDs. |
| `[(hiddenStageIds)]` | `<mona-funnel-series>` | The hidden stage IDs. |

Hidden items the data no longer has are dropped from the binding when the data changes. A chart with no data keeps them, so a value set before the data loads still applies.

## Template Directives

- `ng-template[monaChartTitleTemplate]`: Customizes the title with `{ $implicit, title }`.
- `ng-template[monaChartSubtitleTemplate]`: Customizes the subtitle with `{ $implicit, subtitle }`.
- `ng-template[monaChartTooltipTemplate]`: Customizes hover and keyboard tooltip contents with `{ $implicit, point, points, series, shared }`.
- `ng-template[monaChartAxisLabelTemplate]`: Customizes tick label markup with `{ $implicit, axis, axisId, index, position, scaleType, value }`.
- `ng-template[monaChartLegendItemTemplate]`: Customizes legend items with `{ $implicit, color, dataIndex, datum, interactive, itemId, kind, name, percentage, secondaryColor, series, seriesId, seriesType, value, visible }`.
- `ng-template[monaChartNoDataTemplate]`: Customizes the empty state when no renderable data is present.
- `ng-template[monaChartSliceLabelTemplate]`: Customizes pie and donut slice labels with `{ $implicit, category, color, dataIndex, datum, formattedCategory, formattedPercentage, formattedValue, percentage, seriesId, seriesName, seriesType, slice, value }`.
- `ng-template[monaChartCenterTemplate]`: Customizes the center of a donut with `{ $implicit, formattedTotal, seriesId, seriesName, total, visibleSliceCount }`.
- `ng-template[monaChartGaugeCenterTemplate]`: Customizes central gauge readout template with `{ $implicit, formattedMax, formattedMin, formattedValue, isClamped, max, min, ratio, seriesId, seriesName, value }`.
- `ng-template[monaChartTreemapLabelTemplate]`: Customizes DOM treemap node labels with `{ $implicit, bounds, color, datum, depth, formattedLabel, formattedPath, formattedValue, isCollapsed, isLeaf, label, node, nodeId, path, percentageOfParent, percentageOfRoot, textColor, value }`.
- `ng-template[monaChartFunnelLabelTemplate]`: Customizes DOM funnel stage labels with `{ $implicit, bounds, category, color, conversionRate, dataIndex, datum, dropOff, formattedCategory, formattedConversionRate, formattedOverallConversionRate, formattedValue, overallConversionRate, previousValue, stage, stageId, stageIndex, textColor, value }`.
- `ng-template[monaChartWaterfallLabelTemplate]`: Customizes DOM waterfall step labels with `{ $implicit, barEnd, barStart, bounds, category, color, cumulativeAfter, cumulativeBefore, dataIndex, datum, deltaValue, formattedCategory, formattedCumulativeAfter, formattedCumulativeBefore, formattedDelta, formattedValue, kind, step, textColor, value, visualKind }`.
- `ng-template[monaChartCrosshairLabelTemplate]` (or `[monaChartCrosshairLabel]`): Customizes DOM crosshair coordinate badges with `{ $implicit, axis, axisId, coordinate, formattedValue, snapped, source, value }`.
- `ng-template[monaChartReferenceLabelTemplate]` (or `[monaChartReferenceLabel]`): Customizes DOM reference line or band labels with `{ $implicit, axis, axisId, bounds, coordinate, formattedFrom, formattedTo, formattedValue, from, kind, to, value }`.
- `ng-template[monaChartAnnotationLabelTemplate]` (or `[monaChartAnnotationLabel]`): Customizes DOM point annotation callout badges with `{ $implicit, data, formattedX, formattedY, point, x, xAxisId, y, yAxisId }`.
- `ng-template[monaChartDataLabelTemplate]` (or `[monaChartDataLabel]`): Customizes data labels with `{ $implicit, close, color, dataIndex, datum, formattedClose, formattedFrom, formattedHigh, formattedLow, formattedOpen, formattedSize, formattedStackPercentage, formattedStackTotal, formattedTo, formattedValue, formattedX, formattedY, fromValue, high, low, markId, open, rawValue, selected, seriesId, seriesName, seriesType, sizeValue, stackEnd, stackMode, stackPercentage, stackStart, stackTotal, toValue, value, xValue, yValue }`.

Every directive types its `let-` variables under `strictTemplates`. `let-value` is the context's `$implicit`, which is the tick, line or annotation value, not the whole context: read other members by name, as in `let-axis="axis"`. Annotation data is `unknown`, so use `$any(data).note` or a typed method to read it.

## Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Navigate sequentially between angular spokes, buckets, or slices. |
| `ArrowUp` / `ArrowDown` | Switch between series at the currently focused spoke/coordinate. |
| `Home` / `End` | Jump to the first or last available spoke, bucket, or slice. |
| `Enter` | Emit `pointClick` for the focused point (and toggle its selection with `mona-chart-selection`). |
| `Space` | Toggle the focused point's selection with `mona-chart-selection`; otherwise emit `pointClick`. |
| `Escape` | Dismiss the crosshair, marker highlight and tooltip. With nothing to dismiss the key reaches the page. Escape anywhere hides a tooltip the pointer opened. |
| `Shift` + arrows | With `navigation`: pan along the arrow's direction (`+`/`-` zoom, `0` resets). With `mona-chart-brush` and a focused point: extend a brush from it; `Enter` commits, `Escape` cancels. |

Keys pressed inside the legend or other projected content are left to that content.

### Locale

Axis ticks, data labels, tooltips and announcements format numbers, percentages and dates for the library locale (`MonaI18nService.localeId()`), and a locale change reformats the chart in place. A series `valueFormatter` or axis `formatter` takes precedence. Built-in text comes from the `chart` messages.

### Right-to-left

The chart follows the direction of its host (`dir`, inherited, or CDK `Directionality`) and lays out again when it changes.

| Part | In RTL |
| :--- | :--- |
| Y axis | The default `position="start"` is on the right. `"end"` is on the left. `"left"` and `"right"` stay on that side. |
| Legend | Items run right to left. `position="start"` is on the right, `"end"` on the left; `"left"` and `"right"` stay on that side. |
| Title | The default `titleAlign="start"` is on the right. |
| Automatic data labels | A label beside a point prefers the left. Explicit positions stay as set. |
| X axis | Stays left to right, so categories and time read the same in both directions. |

### Screen readers

The host is `role="application"` with `aria-roledescription="chart"`, so screen readers switch to focus mode and pass the arrow keys to the chart. Its description summarizes the series, the category range of a Cartesian chart and each series' lowest and highest value, then lists the keys. Announcements give the point's position ("2 of 12"), read the point again when a key doesn't move it, and report legend toggles. With `dataTable`, the table sits in a `role="document"` region that screen readers can browse.
