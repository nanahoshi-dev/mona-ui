# @nanahoshi/mona-ui/chart

High-performance, accessible, and reactive 2D Canvas Cartesian and Polar chart visualizations designed for modern Angular applications.

## Overview

The Mona UI Chart library combines declarative Angular template composition with the rendering speed of HTML5 Canvas 2D. State and inputs are fully reactive with Angular Signals, supporting dynamic resizing, seamless light/dark theming via Tailwind CSS variables, rich tooltip placement, and full WCAG AA accessibility.

## Key Features

- **Declarative Composition:** Compose charts using intuitive child components for Cartesian axes (`<mona-chart-x-axis>`, `<mona-chart-y-axis>`), Radial axes (`<mona-chart-angular-axis>`, `<mona-chart-radial-axis>`), series, legends, tooltips, inside labels, and donut center templates.
- **Series Types:**
  - **Cartesian:** Line (with multiple interpolation curves), Area (gradient fade or solid fill), Grouped and Stacked Bar series, Range Bar series (floating min-max interval bars with 4-corner rounded rects), Range Area series (continuous min-max confidence bands and cross-over boundaries), Scatter (point distribution with customizable marker sizes), Bubble series (3-variable mapping with area-proportional square-root radius scaling), Candlestick & OHLC series (financial price action with rising/falling indicators), Heatmap (matrix cell visualization with color scales), Funnel series (conversion pipeline analytics with inscribed labels), and Waterfall series (cashflow and contribution movements with change, subtotal, and total steps).
  - **Sector:** Pie (full or partial circles) and Donut (configurable hole radius ratio and custom center templates).
  - **Polar Axis:** Radar charts (closed polygon series comparing categorical attributes across angular spokes) and Continuous Polar charts (directional signals and curves with continuous angular coordinates from 0° to 360°).
  - **Polar Arc:** Radial Bar series (concentric progress rings), Rose series (Nightingale coxcomb area/radius petals), and Gauge meters (tapered needle and value arc readout).
  - **Hierarchical:** Treemap series (nested squarify, binary, dice, and slice-dice rectangular tiling).
- **Dynamic & Responsive:** Built-in `ResizeObserver` support with automatic canvas backing store scaling for crisp rendering on HiDPI/Retina screens.
- **Layering & Composition:** Preserves exact declaration order for mixed series with accurate translucent alpha compositing.
- **Radial Fill Modes & Gradients:** Solid wash, radial gradient fading from center pole to outer radius, or outline only.
- **Full Keyboard & Screen Reader Accessibility:** 
  - `ArrowRight` / `ArrowLeft`: Navigate through X-axis interaction buckets, polar slices, funnel stages, waterfall steps, or angular spokes.
  - `ArrowUp` / `ArrowDown`: Cycle through visible series at the focused data point or duplicate X coordinates, or navigate slices/levels.
  - `Home` / `End`: Jump to first or last data point/slice/stage.
  - `Enter` / `Space`: Emit click events for the selected data point, spoke, stage, or slice.
  - `Escape`: Dismiss active interaction and announcements.
  - Live ARIA announcements and 100% AXE-compliant accessibility.
- **Interactive Legend:** Clickable legend items that toggle series or individual slice/stage/ring visibility with stable palette coloring (and semantic presentation legend markers for Waterfall steps).
- **Customizable Templates:** Custom Angular templates for tooltips (`monaChartTooltipTemplate`), axis tick labels (`monaChartAxisLabelTemplate`), legend items (`monaChartLegendItemTemplate`), slice data labels (`monaChartSliceLabelTemplate`), donut center content (`monaChartCenterTemplate`), gauge center content (`monaChartGaugeCenterTemplate`), treemap node labels (`monaChartTreemapLabelTemplate`), funnel stage labels (`monaChartFunnelLabelTemplate`), waterfall step labels (`monaChartWaterfallLabelTemplate`), and empty states (`monaChartNoDataTemplate`).

---

## Basic Usage

### Scatter Chart

```html
<mona-chart [data]="experimentalData" xField="temperature" aria-label="Temperature vs Pressure" class="h-80 w-full">
    <mona-chart-x-axis type="linear" [nice]="true" />
    <mona-chart-y-axis [nice]="true" />

    <mona-scatter-series
        field="pressure"
        name="Sample A"
        [pointRadius]="6"
        color="#3b82f6" />
    <mona-scatter-series
        field="controlPressure"
        name="Control"
        [pointRadius]="4"
        color="#94a3b8" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="false" />
</mona-chart>
```

### Bubble Chart

```html
<mona-chart [data]="marketData" xField="growthRate" aria-label="Market Capitalization vs Growth" class="h-80 w-full">
    <mona-chart-x-axis type="linear" [nice]="true" />
    <mona-chart-y-axis [nice]="true" />

    <mona-bubble-series
        field="revenue"
        sizeField="marketCap"
        name="Tech Enterprises"
        [minRadius]="4"
        [maxRadius]="28"
        color="#10b981"
        [fillOpacity]="0.5" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="false" />
</mona-chart>
```

### Radar Chart

```html
<mona-chart [data]="characterStats" aria-label="Character Skill Matrix" class="h-80 w-full">
    <mona-chart-angular-axis />
    <mona-chart-radial-axis gridShape="polygon" [nice]="true" />

    <mona-radar-series
        field="warrior"
        categoryField="metric"
        name="Warrior"
        fillMode="gradient"
        curve="linear"
        [showPoints]="true" />
    <mona-radar-series
        field="mage"
        categoryField="metric"
        name="Mage"
        fillMode="gradient"
        curve="linear"
        [showPoints]="true" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

### Continuous Polar Chart

```html
<mona-chart [data]="radiationData" aria-label="Antenna Radiation Pattern" class="h-80 w-full">
    <mona-chart-angular-axis [tickCount]="12" />
    <mona-chart-radial-axis gridShape="circle" [nice]="true" />

    <mona-polar-series
        field="gain"
        angleField="angle"
        name="Gain (dBi)"
        fillMode="gradient"
        curve="smooth"
        [showPoints]="true" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

### Cartesian Mixed Chart (Bar, Line, Area, Scatter)

```html
<mona-chart [data]="salesData" xField="month" aria-label="Monthly Sales Performance" class="h-80 w-full">
    <mona-chart-x-axis type="category" />
    <mona-chart-y-axis [nice]="true" />

    <mona-bar-series field="revenue" name="Revenue" [borderRadius]="4" />
    <mona-line-series field="target" name="Target" curve="monotone-x" [showPoints]="true" />
    <mona-area-series field="forecast" name="Forecast" fillMode="gradient" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

### Stacked Bar Chart & 100% Stacked Bar Chart

```html
<mona-chart [data]="salesData" xField="quarter" aria-label="Quarterly Revenue by Region" class="h-80 w-full">
    <mona-chart-x-axis type="category" />
    <mona-chart-y-axis [nice]="true" />

    <!-- Grouped or 100% Stacked: assign the same stack group identifier -->
    <mona-bar-series field="north" name="North America" stack="sales" [borderRadius]="4" />
    <mona-bar-series field="europe" name="Europe" stack="sales" [borderRadius]="4" />
    <mona-bar-series field="asia" name="Asia Pacific" stack="sales" [borderRadius]="4" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

### Stacked Area Chart & 100% Stacked Area Chart

```html
<mona-chart [data]="trafficData" xField="year" aria-label="Web Traffic Composition" class="h-80 w-full">
    <mona-chart-x-axis type="linear" />
    <mona-chart-y-axis [nice]="true" />

    <mona-area-series field="organic" name="Organic Search" stack="traffic" fillMode="gradient" />
    <mona-area-series field="referral" name="Referral" stack="traffic" fillMode="gradient" />
    <mona-area-series field="direct" name="Direct" stack="traffic" fillMode="gradient" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

### Pie & Donut Charts

```html
<mona-chart [data]="browserShare" aria-label="Browser Usage Share" class="h-80 w-full">
    <mona-pie-series
        field="share"
        categoryField="browser"
        [showLabels]="true"
        labelContent="percentage" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip />
</mona-chart>
```

---

## Components & Directives

### `<mona-chart>`
The root container that coordinates layout measurement, data domains, rendering schedules, animation transitions, and interaction.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `data` | `readonly unknown[]` | `[]` | Primary dataset shared across all child series. |
| `xField` | `ChartField` | `""` | Property key or accessor extracting the X-axis coordinate for each data item. |
| `title` | `string` | `""` | Title text rendered at the top of the chart above the plot area. |
| `subtitle` | `string` | `""` | Subtitle text rendered beneath the title. |
| `titleAlign` | `ChartHeaderAlignment` | `"left"` | Alignment of the chart title and subtitle (`"center"`, `"left"`, or `"right"`). |
| `animation` | `ChartAnimationInput` | `true` | Animation settings (`boolean` or `Partial<ChartAnimationOptions>`) for initial render, data transitions, and series visibility toggles. |
| `ariaLabel` | `string` | `"Chart"` | Accessible name for the chart container (falls back to `title`). |
| `ariaDescription` | `string` | `""` | Detailed accessible description explaining the chart's purpose and trends (falls back to `subtitle`). |
| `pointClick` | `output<ChartPointEvent>` | — | Emits when a data point, vertex, bar, marker, or sector slice is clicked. |
| `pointFocusChange` | `output<ChartPointFocusEvent>` | — | Emits when keyboard focus moves to a new data point, marker, spoke, or slice. |
| `seriesVisibilityChange` | `output<ChartSeriesVisibilityEvent>` | — | Emits when a series visibility state is toggled via legend interaction. |

### Cartesian Axes (`<mona-chart-x-axis>`, `<mona-chart-y-axis>`)

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisLine` | `boolean` | `true` | Whether to draw the baseline border axis line. |
| `gridLines` | `boolean` | `auto` | Whether to render orthogonal grid lines across the plot area (default `false` on X, `true` on Y in vertical charts). |
| `labels` | `boolean` | `true` | Whether to render tick labels. |
| `labelRotation` | `ChartAxisLabelRotation` | `0` | Axis label rotation in degrees (`-90` to `90`) or `"auto"` (auto-rotates to -45° when labels collide on physical X category axis). |
| `labelPadding` | `number` | `4` | Spacing in pixels between the baseline/tick marks and the label bounds. |
| `labelMaxWidth` | `number` | `undefined` | Optional maximum width in pixels applied to label spans with text truncation. |
| `tickMarks` | `boolean` | `false` | Whether to render outward tick marks along the axis baseline. |
| `tickSize` | `number` | `6` | Length in pixels of outward tick marks. |
| `titlePadding` | `number` | `8` | Spacing in pixels between the outer label edge and the axis title. |
| `position` | `string` | `"bottom"` / `"left"` | Axis placement (`"bottom"` or `"top"` for X; `"left"` or `"right"` for Y). |
| `min` / `max` | `number \| Date` | `undefined` | Explicit domain bounds for continuous scales. |
| `nice` | `boolean` | `true` | Rounds continuous domain bounds to clean tick increments. |
| `tickCount` | `number` | `5` | Desired tick mark frequency for continuous scales or preferred maximum tick cap for category axes. |
| `visible` | `boolean` | `true` | Whether the axis is visible. |

### Animation & Transitions

Mona UI Charts feature a high-performance, renderer-agnostic animation system:
- **Geometry Morphing:** Smoothly interpolates Cartesian bars from baselines, line/area paths, sector arcs, radial polygons, and markers (interpolating positions, radii, and opacities).
- **Stable Identity:** Use the `keyField` input on series components to track items across reorders, additions, and deletions.
- **CSS Custom Properties:** Exposes `--mona-chart-animation-duration` and `--mona-chart-animation-easing` on the chart host element for synchronized CSS transitions.
- **Reduced Motion:** Automatically respects `prefers-reduced-motion: reduce` by completing transitions immediately without motion.

### Range Bar Chart

```html
<mona-chart [data]="temperatureRanges" xField="day" aria-label="Daily Temperature Ranges" class="h-80 w-full">
    <mona-chart-x-axis type="category" />
    <mona-chart-y-axis [nice]="true" />

    <mona-range-bar-series
        fromField="minTemp"
        toField="maxTemp"
        name="Daily Range"
        [borderRadius]="4"
        color="#3b82f6" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="false" />
</mona-chart>
```

### Range Area Chart

```html
<mona-chart [data]="sensorConfidence" xField="timestamp" aria-label="Sensor Confidence Interval" class="h-80 w-full">
    <mona-chart-x-axis type="time" />
    <mona-chart-y-axis [nice]="true" />

    <mona-range-area-series
        fromField="lowerBound"
        toField="upperBound"
        name="95% Confidence Band"
        curve="monotone-x"
        [showPoints]="true"
        color="#10b981"
        [fillOpacity]="0.25" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

### `<mona-bar-series>`
Renders a Cartesian bar series supporting standalone bars, grouped slots, stacked segments, and 100% normalized stacks.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric bar height/value. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Bar"` | Series name for tooltips, legend, and accessibility. |
| `orientation` | `ChartBarOrientation` | `"vertical"` | Bar orientation: `"vertical"` (category on X, value on Y) or `"horizontal"` (category on Y, value on X). |
| `stack` | `string` | `undefined` | Stack group name. Series sharing the same stack identifier are stacked cumulatively into a single bar slot. |
| `stackMode` | `ChartStackMode` | `"normal"` | Stacking calculation mode: `"normal"` (raw cumulative sum) or `"percent"` (normalized to 100%). |
| `borderRadius` | `number` | `0` | Corner radius for the outer cap of the bar/stack. |
| `maxBarWidth` | `number` | `undefined` | Maximum width/height of the bar in pixels. |
| `color` | `string` | `undefined` | Bar fill color. Defaults to palette token. |
| `fillOpacity` | `number` | `1.0` | Bar fill opacity between 0.0 and 1.0. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter callback for bar raw values and stack totals in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-range-bar-series>`
Renders a Cartesian floating range bar series plotting discrete min-max intervals with 4-corner rounded rects and zero-length hairlines.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fromField` | `ChartField` | (required) | Property key or accessor extracting the range starting/lower value. |
| `toField` | `ChartField` | (required) | Property key or accessor extracting the range ending/upper value. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `orientation` | `ChartBarOrientation` | `"vertical"` | Bar orientation: `"vertical"` or `"horizontal"`. |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Range Bar"` | Series name for tooltips, legend, and accessibility. |
| `borderRadius` | `number` | `4` | Corner radius applied to all 4 corners of floating bars. |
| `maxBarWidth` | `number` | `undefined` | Maximum width/height of the bar in pixels. |
| `color` | `string` | `undefined` | Bar fill color. Defaults to palette token. |
| `fillOpacity` | `number` | `1.0` | Bar fill opacity between 0.0 and 1.0. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter callback for formatting range bounds in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-area-series>`
Renders a continuous Cartesian area series supporting gradient fades, solid fills, cumulative stacking, and 100% normalized area bands.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y value. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Area"` | Series name for tooltips, legend, and accessibility. |
| `stack` | `string` | `undefined` | Stack group name. Series sharing the same stack identifier are stacked into cumulative bands. |
| `stackMode` | `ChartStackMode` | `"normal"` | Stacking calculation mode: `"normal"` (raw cumulative sum) or `"percent"` (normalized to 100%). |
| `fillMode` | `ChartAreaFillMode` | `"gradient"` | Area fill style: `"gradient"`, `"solid"`, or `"none"`. |
| `fillOpacity` | `number` | `0.2` | Area fill opacity between 0.0 and 1.0. |
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation algorithm (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`). |
| `connectNulls` | `boolean` | `false` | Whether to interpolate across null/missing data points. |
| `showPoints` | `boolean` | `false` | Whether to render point markers at data coordinates. |
| `color` | `string` | `undefined` | Area line and fill color. Defaults to palette token. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter callback for area raw values and stack totals in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-range-area-series>`
Renders a continuous Cartesian range area series enclosing a confidence or variance band between two continuous boundary lines.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fromField` | `ChartField` | (required) | Property key or accessor extracting the range starting boundary value. |
| `toField` | `ChartField` | (required) | Property key or accessor extracting the range ending boundary value. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Range Area"` | Series name for tooltips, legend, and accessibility. |
| `fillOpacity` | `number` | `0.18` | Range band fill opacity between 0.0 and 1.0. |
| `curve` | `ChartCurve` | `"linear"` | Curve interpolation algorithm (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`). |
| `connectNulls` | `boolean` | `false` | Whether to interpolate across null/missing data points. |
| `showPoints` | `boolean` | `false` | Whether to render point markers at boundary coordinates. |
| `pointRadius` | `number` | `4` | Boundary marker radius in pixels when `showPoints` is true. |
| `strokeWidth` | `number` | `2` | Boundary outline stroke width in pixels. |
| `color` | `string` | `undefined` | Range band line and fill color. Defaults to palette token. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter callback for formatting range bounds in tooltips and live region. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-scatter-series>`
Renders a Cartesian scatter series representing individual points along continuous linear or temporal X and Y dimensions.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y-axis coordinate. |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Scatter"` | Series name for tooltips, legend, and accessibility. |
| `color` | `string` | `undefined` | Series mark color. Defaults to palette token. |
| `pointRadius` | `number` | `undefined` | Marker circle radius in pixels. Defaults to `--mona-chart-point-radius` (4px). |
| `fillOpacity` | `number` | `0.9` | Fill opacity between 0.0 and 1.0. |
| `strokeColor` | `string` | `"#ffffff"` | Border stroke color. |
| `strokeWidth` | `number` | `1.5` | Border stroke width in pixels. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-bubble-series>`
Renders a Cartesian bubble series encoding a 3rd quantitative dimension into mark area using area-proportional square-root radius mapping.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric Y-axis coordinate. |
| `sizeField` | `ChartField` | `"size"` | Property key or accessor extracting quantitative magnitude for bubble area. |
| `sizeFormatter` | `ChartValueFormatter<number>` | `undefined` | Formatter callback generating formatted size strings for tooltips and accessibility announcements. |
| `minRadius` | `number` | `undefined` | Minimum bubble radius in pixels for the minimum size value. Defaults to `--mona-chart-bubble-min-radius` (4px). |
| `maxRadius` | `number` | `undefined` | Maximum bubble radius in pixels for the maximum size value. Defaults to `--mona-chart-bubble-max-radius` (24px). |
| `xField` | `ChartField` | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Bubble"` | Series name for tooltips, legend, and accessibility. |
| `color` | `string` | `undefined` | Series mark color. Defaults to palette token. |
| `fillOpacity` | `number` | `0.55` | Fill opacity between 0.0 and 1.0. |
| `strokeColor` | `string` | `"#ffffff"` | Border stroke color. |
| `strokeWidth` | `number` | `1.5` | Border stroke width in pixels. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### CSS Variables for Styling

Mona UI Charts support theme customization via standard CSS custom properties:

```css
:root {
    --mona-chart-point-radius: 5px;
    --mona-chart-bubble-min-radius: 4px;
    --mona-chart-bubble-max-radius: 28px;
    --mona-chart-focus-indicator-color: #3b82f6;
    --mona-chart-focus-indicator-width: 2px;
}
```

### `<mona-chart-angular-axis>`
Configures the angular (spoke / degree) dimension in Polar and Radar charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisLine` | `boolean` | `true` | Whether to render the outer circular/polygonal border axis line. |
| `gridLines` | `boolean` | `true` | Whether to render radiating spoke lines from the pole to the outer boundary. |
| `labels` | `boolean` | `true` | Whether to render angular category/degree labels. |
| `rotation` | `number` | `0` | Angle rotation in degrees (clockwise) of the 0° reference position. |
| `tickCount` | `number` | `12` | Desired number of angular ticks for continuous polar charts. |
| `visible` | `boolean` | `true` | Whether the angular axis is visible. |

### `<mona-chart-radial-axis>`
Configures the radial (distance from center pole) dimension in Polar and Radar charts.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `axisLine` | `boolean` | `true` | Whether to render the zero center tick indicator. |
| `gridLines` | `boolean` | `true` | Whether to render concentric radial grid rings. |
| `gridShape` | `ChartRadialGridShape` | `"auto"` | Concentric grid ring geometry: `"auto"` (polygon for radar, circle for polar), `"polygon"`, or `"circle"`. |
| `labels` | `boolean` | `true` | Whether to render numeric radial tick labels along the primary reference spoke. |
| `min` / `max` | `number` | `undefined` | Explicit radial domain bounds. |
| `nice` | `boolean` | `true` | Rounds radial min/max bounds to human-friendly tick increments. |
| `visible` | `boolean` | `true` | Whether the radial axis is visible. |

### `<mona-radar-series>`
Renders a closed polygonal series comparing categorical metrics across angular spokes.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric metric value. |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting spoke category. |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Radar"` | Series name for tooltips, legend, and accessibility. |
| `fillMode` | `ChartRadialFillMode` | `"solid"` | Fill styling: `"solid"` wash, radial `"gradient"`, or `"none"`. |
| `curve` | `ChartRadialCurve` | `"linear"` | Curve interpolation: `"linear"` or `"smooth"` (closed Catmull-Rom spline). |
| `showPoints` | `boolean` | `true` | Whether vertex point markers are rendered. |
| `pointRadius` | `number` | `undefined` | Vertex marker radius in pixels. |
| `strokeWidth` | `number` | `undefined` | Polygon outline stroke width in pixels. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-polar-series>`
Renders a continuous polar series plotting values over continuous angular degrees (0° to 360°).

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric radial magnitude. |
| `angleField` | `ChartField` | `"angle"` | Property key or accessor extracting angle in degrees. |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name` | `string` | `"Polar"` | Series name for tooltips, legend, and accessibility. |
| `fillMode` | `ChartRadialFillMode` | `"none"` | Fill styling: `"solid"` wash, radial `"gradient"` (to pole), or `"none"`. |
| `curve` | `ChartRadialCurve` | `"linear"` | Curve interpolation: `"linear"` or `"smooth"`. |
| `connectNulls` | `boolean` | `false` | Whether to interpolate across null/undefined values. |
| `showPoints` | `boolean` | `false` | Whether data point markers are rendered. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |

### `<mona-heatmap-series>`
Renders a 2D matrix heatmap visualization with perceptual Culori color scale interpolation and keyboard navigation.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `data` | `readonly unknown[]` | `undefined` | Matrix cell dataset or sparse records. |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric heat value. |
| `xField` | `ChartField` | `"x"` | Property key or accessor extracting X category column. |
| `yField` | `ChartField` | `"y"` | Property key or accessor extracting Y category row. |
| `keyField` | `ChartField` | `undefined` | Unique identifier field for stable cell mark tracking across animation transitions. |
| `color` | `string` | `undefined` | Custom single base color for sequential ramp generation. |
| `colors` | `readonly string[]` | `undefined` | Custom palette stops for color interpolation. |
| `colorMode` | `ChartHeatmapColorMode` | `"sequential"` | Color scale mode: `"sequential"` or `"diverging"`. |
| `min` | `number` | `undefined` | Explicit minimum domain value for color scale. |
| `max` | `number` | `undefined` | Explicit maximum domain value for color scale. |
| `midpoint` | `number` | `undefined` | Explicit midpoint value for diverging color scales (defaults to `(min + max) / 2`). |
| `cellGap` | `number` | `1` | Pixel gap between matrix cells. |
| `borderRadius` | `number` | `0` | Corner border radius in pixels for each cell rectangle. |
| `strokeColor` | `string` | `undefined` | Optional cell border outline color. |
| `strokeWidth` | `number` | `0` | Optional cell border outline width in pixels. |
| `showValues` | `boolean` | `false` | Whether to render numeric text labels inside cells with high-contrast text color calculation. |
| `xCategories` | `readonly unknown[]` | `undefined` | Explicit X-axis category order. |
| `yCategories` | `readonly unknown[]` | `undefined` | Explicit Y-axis category order. |
| `name` | `string` | `"Heatmap"` | Series name for tooltips, legends, and accessibility. |
| `visible` | `model(boolean)` | `true` | Two-way bindable series visibility. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Formatter function for cell numeric values. |

---

## Export & Download API

The chart component provides programmatic methods to export charts into high-fidelity standalone SVG vector documents, crisp PNG raster images, and formatted PDF documents.

### Public Component Methods

```typescript
// Export as a binary Blob
const result: ChartExportResult = await chart.exportChart(options);

// Export and trigger a browser file download
const result: ChartExportResult = await chart.downloadChart(options);
```

### Export Formats & Options

#### Standalone SVG Vector (`format: "svg"`)

Generates a clean standalone SVG document with resolved styling, vector typography, and full WCAG accessibility metadata.

```typescript
const result = await chart.exportChart({
    format: "svg",
    accessibility: true,
    background: "auto"
});
```

#### High-Resolution PNG (`format: "png"`)

Rasterizes the chart graphics and DOM overlays to a PNG blob at the desired pixel density.

```typescript
await chart.downloadChart({
    format: "png",
    fileName: "revenue-report",
    pixelRatio: 2,
    background: "#ffffff"
});
```

#### Document PDF (`format: "pdf"`)

Generates a PDF document with automatic vector conversion and high-res raster fallback.

```typescript
await chart.downloadChart({
    format: "pdf",
    fileName: "quarterly-presentation",
    mode: "auto",
    page: {
        size: "a4",
        orientation: "landscape",
        margin: 24
    }
});
```

### Export Options Reference

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `format` | `"svg" \| "png" \| "pdf"` | *Required* | Target export format. |
| `fileName` | `string` | `chart.title` or `"chart"` | Filename for `downloadChart()` (sanitized automatically). |
| `width` | `number` | Chart width | Output logical width in CSS pixels. |
| `height` | `number` | Chart height | Output logical height in CSS pixels. |
| `background` | `"auto" \| "transparent" \| string` | `"auto"` | Background fill policy or custom CSS color. |
| `pixelRatio` | `number` | `2` | Raster scaling ratio (clamped 1 to 8) for PNG export. |
| `accessibility` | `boolean` | `true` | Embeds `<title>`, `<desc>`, and ARIA attributes in SVG. |
| `mode` | `"auto" \| "vector" \| "raster"` | `"auto"` | PDF rendering path (vector with raster fallback). |
| `page.size` | `"chart" \| "a4" \| "letter" \| { width, height }` | `"chart"` | PDF page sizing in points (1 CSS px = 0.75 pt). |
| `page.orientation` | `"auto" \| "portrait" \| "landscape"` | `"auto"` | PDF page orientation. |
| `page.margin` | `number \| { top, right, bottom, left }` | `0` (chart) / `24` (A4/Letter) | PDF page margins in points. |
| `presentation.selection` | `boolean` | `true` | Include persistent selection mark styling. |
| `presentation.crosshair` | `boolean` | `false` | Include active crosshair lines and axis badges. |
| `presentation.brush` | `boolean` | `false` | Include active brush marquee rectangle. |
| `signal` | `AbortSignal` | `undefined` | AbortSignal to cancel in-flight export transactions. |


