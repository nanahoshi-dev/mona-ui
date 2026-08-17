## Overview & Component Selection

The chart component renders high-performance Canvas 2D visualizations composed of declarative child series and axis components. It supports Cartesian, Sector, and Polar Axis coordinates.

**Series Types:**
- **Cartesian**: `<mona-line-series>`, `<mona-area-series>`, `<mona-bar-series>`, `<mona-scatter-series>`, `<mona-bubble-series>`
- **Sector**: `<mona-pie-series>`, `<mona-donut-series>`
- **Polar Axis**: `<mona-radar-series>`, `<mona-polar-series>`

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
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation algorithm (`"linear"`, `"smooth"`, `"step"`, `"monotone-x"`). |
| `data` | `readonly unknown[]` | `undefined` | Series-specific dataset overriding root data. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y value. |
| `fillMode` | `ChartAreaFillMode` | `"gradient"` | Area fill style: `"gradient"`, `"solid"`, or `"none"`. |
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

## Template Directives

- `ng-template[monaChartTooltipTemplate]`: Customizes hover and keyboard tooltip contents with `{ $implicit, point, points, shared }`.
- `ng-template[monaChartAxisLabelTemplate]`: Customizes tick label markup with `{ $implicit, axis, index, value }`.
- `ng-template[monaChartLegendItemTemplate]`: Customizes legend item styling and contents with `{ $implicit, item, color, name, visible }`.
- `ng-template[monaChartNoDataTemplate]`: Customizes empty state placeholder when no renderable data is present.

## Keyboard Navigation

| Key | Action |
| :--- | :--- |
| `ArrowRight` / `ArrowLeft` | Navigate sequentially between angular spokes, buckets, or slices. |
| `ArrowUp` / `ArrowDown` | Switch between series at the currently focused spoke/coordinate. |
| `Home` / `End` | Jump to the first or last available spoke, bucket, or slice. |
| `Enter` / `Space` | Trigger point selection and emit `pointClick`. |
| `Escape` | Dismiss active crosshair, marker highlight, and tooltip. |
