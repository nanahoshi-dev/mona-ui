# @nanahoshi/mona-ui/chart

High-performance, accessible, and reactive 2D Canvas Cartesian and Polar chart visualizations designed for modern Angular applications.

## Overview

The Mona UI Chart library combines declarative Angular template composition with the rendering speed of HTML5 Canvas 2D. State and inputs are fully reactive with Angular Signals, supporting dynamic resizing, seamless light/dark theming via Tailwind CSS variables, rich tooltip placement, and full WCAG AA accessibility.

## Key Features

- **Declarative Composition:** Compose charts using intuitive child components for Cartesian axes (`<mona-chart-x-axis>`, `<mona-chart-y-axis>`), Radial axes (`<mona-chart-angular-axis>`, `<mona-chart-radial-axis>`), series, legends, tooltips, inside labels, and donut center templates.
- **Series Types:**
  - **Cartesian:** Line (with multiple interpolation curves), Area (gradient fade or solid fill), and Grouped Bar series.
  - **Polar Sector:** Pie (full or partial circles) and Donut (configurable hole radius ratio and custom center templates).
  - **Polar Axis:** Radar charts (closed polygon series comparing categorical attributes across angular spokes) and Continuous Polar charts (directional signals and curves with continuous angular coordinates from 0° to 360°).
- **Dynamic & Responsive:** Built-in `ResizeObserver` support with automatic canvas backing store scaling for crisp rendering on HiDPI/Retina screens.
- **Radial Fill Modes & Gradients:** Solid wash, radial gradient fading from center pole to outer radius, or outline only.
- **Full Keyboard & Screen Reader Accessibility:** 
  - `ArrowRight` / `ArrowLeft`: Navigate through X-axis interaction buckets, polar slices, or angular spokes.
  - `ArrowUp` / `ArrowDown`: Cycle through visible series at the focused data point, or navigate slices in sector mode.
  - `Home` / `End`: Jump to first or last data point/slice.
  - `Enter` / `Space`: Emit click events for the selected data point, spoke, or slice.
  - `Escape`: Dismiss active interaction and announcements.
  - Live ARIA announcements and 100% AXE-compliant accessibility.
- **Interactive Legend:** Clickable legend items that toggle series or individual slice visibility with stable palette coloring.
- **Customizable Templates:** Custom Angular templates for tooltips (`monaChartTooltipTemplate`), axis tick labels (`monaChartAxisLabelTemplate`), legend items (`monaChartLegendItemTemplate`), slice data labels (`monaChartSliceLabelTemplate`), donut center content (`monaChartCenterTemplate`), and empty states (`monaChartNoDataTemplate`).

---

## Basic Usage

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

### Cartesian Chart

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
| `animation` | `ChartAnimationInput` | `true` | Animation settings (`boolean` or `Partial<ChartAnimationOptions>`) for initial render, data transitions, and series visibility toggles. |
| `ariaLabel` | `string` | `"Chart"` | Accessible name for the chart container. |
| `ariaDescription` | `string` | `""` | Detailed accessible description explaining the chart's purpose and trends. |
| `pointClick` | `output<ChartPointEvent>` | — | Emits when a data point, vertex, bar, or sector slice is clicked. |
| `pointFocusChange` | `output<ChartPointFocusEvent>` | — | Emits when keyboard focus moves to a new data point, spoke, or slice. |
| `seriesVisibilityChange` | `output<ChartSeriesVisibilityEvent>` | — | Emits when a series visibility state is toggled via legend interaction. |

### Animation & Transitions

Mona UI Charts feature a high-performance, renderer-agnostic animation system:
- **Geometry Morphing:** Smoothly interpolates Cartesian bars from baselines, line/area paths, sector arcs, and radial polygons.
- **Stable Identity:** Use the `keyField` input on series components to track items across reorders, additions, and deletions.
- **CSS Custom Properties:** Exposes `--mona-chart-animation-duration` and `--mona-chart-animation-easing` on the chart host element for synchronized CSS transitions.
- **Reduced Motion:** Automatically respects `prefers-reduced-motion: reduce` by completing transitions immediately without motion.

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
