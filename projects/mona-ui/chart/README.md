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

## High-Density Cartesian Data

Downsampling is a render-sample optimization for searchable continuous X axes. The public `algorithm` option is a preference constrained by each series family's semantics; it does not force every family to use a literal reducer with the same name.

| Series                     | Continuous-X reduction | Category-X reduction | Notes                                                                                                               |
| :------------------------- | :--------------------- | :------------------- | :------------------------------------------------------------------------------------------------------------------ |
| Line                       | Yes                    | No                   | Linear, smooth, `step`, and `step-after` curves use real source points.                                             |
| Area                       | Yes                    | No                   | Stacked areas use one shared X selection; step members use topology protection.                                     |
| Range Area                 | Yes                    | No                   | Uses a low/high envelope reducer, including step-safe adjacency.                                                    |
| Scatter / Bubble           | Yes                    | No                   | Uses spatial/pixel representatives; bubble size keeps its full source domain.                                       |
| Category-X connected paths | No                     | No                   | Discrete category membership and order use viewport culling; automatic point reduction is intentionally ineligible. |
| Bar / Range Bar            | No                     | No                   | Discrete marks are not automatically point-sampled.                                                                 |
| Candlestick / OHLC         | No                     | No                   | Financial marks require semantic OHLC aggregation, which is not implicit.                                           |
| Heatmap / non-Cartesian    | No                     | —                    | Outside the Cartesian point-density subsystem.                                                                      |

| Requested algorithm | Scalar line/area        | Step line/area     | Range area        | Stack area                     | Scatter/Bubble |
| :------------------ | :---------------------- | :----------------- | :---------------- | :----------------------------- | :------------- |
| `auto`              | Indexed scalar          | Step-safe          | Envelope          | Shared stack envelope          | Pixel          |
| `minmax`            | Min/max                 | Step-safe          | Envelope          | Shared stack envelope          | Pixel fallback |
| `lttb`              | LTTB                    | Step-safe fallback | Envelope fallback | Shared stack envelope fallback | Pixel fallback |
| `pixel`             | Connected auto fallback | Step-safe          | Envelope fallback | Shared stack envelope fallback | Pixel          |

Step and step-after series protect source adjacency around selected semantic anchors. Mandatory visible or crossing anchors are reserved before adjacency detail, while `maxPoints` remains a hard cap; when the cap cannot preserve every transition, detail degrades deterministically within that budget.

`maxPoints` has family-specific meaning: line, area, and range area count selected defined source marks; scatter and bubble count selected marker candidates; stacked area counts shared timeline X keys for the group. Minimal invalid gap sentinels may appear internally to preserve disconnected-path topology, but they are not selected data marks. Raw pointer, brush, selection, and tooltip interaction may still resolve an unsampled source datum through the retained interaction provider. Unsorted or unsearchable X data safely keeps source-order full layout because sorting it would change connected-path semantics. Keyboard navigation intentionally remains bounded to the rendered sample.

Eligibility and activation are separate. A source below the activation threshold uses ordinary full rendering; it is not a capability failure. An explicit `maxPoints` can activate reduction below that threshold for an eligible continuous-X family. Category X remains a discrete viewport-culling policy, while unsorted, unsearchable, or non-finite X remains intentionally ineligible so connected-path source order is preserved.

### Dense runtime ownership and stress workflow

The dense runtime has three ownership layers: source-semantic authority, viewport/sample membership, and projected scene geometry. Source authority is tied to a semantic data generation and is reused for viewport, resize, and projection-only updates. Samples and projections retain compact source indexes; they do not become a replacement identity authority. Duplicate-key occurrence metadata is allocated only when duplicate semantic keys require it.

When source semantics change, the previous dense runtime is invalidated before the replacement is prepared. Chart destruction releases source-dependent identity state and drops the retained scene. The million-row regression cases live in `*.stress.spec.ts` and run through the serial, non-coverage target:

```text
npm run test:lib
npm run test:lib:density-stress
npm run test:lib:density-bench
```

The one-worker stress policy is a resource boundary for those deliberately large cases; it is not a substitute for bounded source ownership or viewport cache reuse.

The benchmark is intentionally non-gating and emits one compact JSON record for each 10k, 100k, 250k, and 1M source size. It measures normalization/index construction, lazy identity setup, 50 viewport index queries, source replacement, teardown release, and process memory before/after the run.

---

## Basic Usage

### Scatter Chart

```html
<mona-chart [data]="experimentalData" xField="temperature" aria-label="Temperature vs Pressure" class="h-80 w-full">
    <mona-chart-x-axis type="linear" [nice]="true" />
    <mona-chart-y-axis [nice]="true" />

    <mona-scatter-series field="pressure" name="Sample A" [pointRadius]="6" color="#3b82f6" />
    <mona-scatter-series field="controlPressure" name="Control" [pointRadius]="4" color="#94a3b8" />

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
    <mona-line-series field="target" name="Target" curve="monotone-x" lineStyle="dashed" [showPoints]="true" />
    <mona-area-series field="forecast" name="Forecast" fillMode="gradient" lineStyle="dotted" />

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
    <mona-pie-series field="share" categoryField="browser" [showLabels]="true" labelContent="percentage" />

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip />
</mona-chart>
```

---

## Components & Directives

### `<mona-chart>`

The root container that coordinates layout measurement, data domains, rendering schedules, animation transitions, and interaction.

| Input / Output           | Type                                 | Default   | Description                                                                                                                             |
| :----------------------- | :----------------------------------- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                   | `readonly unknown[]`                 | `[]`      | Primary dataset shared across all child series.                                                                                         |
| `xField`                 | `ChartField`                         | `""`      | Property key or accessor extracting the X-axis coordinate for each data item.                                                           |
| `title`                  | `string`                             | `""`      | Title text rendered at the top of the chart above the plot area.                                                                        |
| `subtitle`               | `string`                             | `""`      | Subtitle text rendered beneath the title.                                                                                               |
| `titleAlign`             | `ChartHeaderAlignment`               | `"left"`  | Alignment of the chart title and subtitle (`"center"`, `"left"`, or `"right"`).                                                         |
| `animation`              | `ChartAnimationInput`                | `true`    | Animation settings (`boolean` or `Partial<ChartAnimationOptions>`) for initial render, data transitions, and series visibility toggles. |
| `ariaLabel`              | `string`                             | `"Chart"` | Accessible name for the chart container (falls back to `title`).                                                                        |
| `ariaDescription`        | `string`                             | `""`      | Detailed accessible description explaining the chart's purpose and trends (falls back to `subtitle`).                                   |
| `pointClick`             | `output<ChartPointEvent>`            | —         | Emits when a data point, vertex, bar, marker, or sector slice is clicked.                                                               |
| `pointFocusChange`       | `output<ChartPointFocusEvent>`       | —         | Emits when keyboard focus moves to a new data point, marker, spoke, or slice.                                                           |
| `seriesVisibilityChange` | `output<ChartSeriesVisibilityEvent>` | —         | Emits when a series visibility state is toggled via legend interaction.                                                                 |

### Cartesian Axes (`<mona-chart-x-axis>`, `<mona-chart-y-axis>`)

| Input           | Type                     | Default               | Description                                                                                                                        |
| :-------------- | :----------------------- | :-------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `axisLine`      | `boolean`                | `true`                | Whether to draw the baseline border axis line.                                                                                     |
| `gridLines`     | `boolean`                | `auto`                | Whether to render orthogonal grid lines across the plot area (default `false` on X, `true` on Y in vertical charts).               |
| `labels`        | `boolean`                | `true`                | Whether to render tick labels.                                                                                                     |
| `labelRotation` | `ChartAxisLabelRotation` | `0`                   | Axis label rotation in degrees (`-90` to `90`) or `"auto"` (auto-rotates to -45° when labels collide on physical X category axis). |
| `labelPadding`  | `number`                 | `4`                   | Spacing in pixels between the baseline/tick marks and the label bounds.                                                            |
| `labelMaxWidth` | `number`                 | `undefined`           | Optional maximum width in pixels applied to label spans with text truncation.                                                      |
| `tickMarks`     | `boolean`                | `false`               | Whether to render outward tick marks along the axis baseline.                                                                      |
| `tickSize`      | `number`                 | `6`                   | Length in pixels of outward tick marks.                                                                                            |
| `titlePadding`  | `number`                 | `8`                   | Spacing in pixels between the outer label edge and the axis title.                                                                 |
| `position`      | `string`                 | `"bottom"` / `"left"` | Axis placement (`"bottom"` or `"top"` for X; `"left"` or `"right"` for Y).                                                         |
| `min` / `max`   | `number \| Date`         | `undefined`           | Explicit domain bounds for continuous scales.                                                                                      |
| `nice`          | `boolean`                | `true`                | Rounds continuous domain bounds to clean tick increments.                                                                          |
| `tickCount`     | `number`                 | `5`                   | Desired tick mark frequency for continuous scales or preferred maximum tick cap for category axes.                                 |
| `visible`       | `boolean`                | `true`                | Whether the axis is visible.                                                                                                       |

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

| Input / Output   | Type                  | Default      | Description                                                                                                 |
| :--------------- | :-------------------- | :----------- | :---------------------------------------------------------------------------------------------------------- |
| `field`          | `ChartField`          | `"value"`    | Property key or accessor extracting numeric bar height/value.                                               |
| `xField`         | `ChartField`          | `undefined`  | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`).                     |
| `keyField`       | `ChartField`          | `undefined`  | Unique identifier field for stable mark tracking across animation transitions.                              |
| `name`           | `string`              | `"Bar"`      | Series name for tooltips, legend, and accessibility.                                                        |
| `orientation`    | `ChartBarOrientation` | `"vertical"` | Bar orientation: `"vertical"` (category on X, value on Y) or `"horizontal"` (category on Y, value on X).    |
| `stack`          | `string`              | `undefined`  | Stack group name. Series sharing the same stack identifier are stacked cumulatively into a single bar slot. |
| `stackMode`      | `ChartStackMode`      | `"normal"`   | Stacking calculation mode: `"normal"` (raw cumulative sum) or `"percent"` (normalized to 100%).             |
| `borderRadius`   | `number`              | `0`          | Corner radius for the outer cap of the bar/stack.                                                           |
| `maxBarWidth`    | `number`              | `undefined`  | Maximum width/height of the bar in pixels.                                                                  |
| `color`          | `string`              | `undefined`  | Bar fill color. Defaults to palette token.                                                                  |
| `fillOpacity`    | `number`              | `1.0`        | Bar fill opacity between 0.0 and 1.0.                                                                       |
| `valueFormatter` | `ChartValueFormatter` | `undefined`  | Custom formatter callback for bar raw values and stack totals in tooltips and live region.                  |
| `visible`        | `model(boolean)`      | `true`       | Two-way bindable series visibility.                                                                         |

### `<mona-range-bar-series>`

Renders a Cartesian floating range bar series plotting discrete min-max intervals with 4-corner rounded rects and zero-length hairlines.

| Input / Output   | Type                  | Default       | Description                                                                             |
| :--------------- | :-------------------- | :------------ | :-------------------------------------------------------------------------------------- |
| `fromField`      | `ChartField`          | (required)    | Property key or accessor extracting the range starting/lower value.                     |
| `toField`        | `ChartField`          | (required)    | Property key or accessor extracting the range ending/upper value.                       |
| `xField`         | `ChartField`          | `undefined`   | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `orientation`    | `ChartBarOrientation` | `"vertical"`  | Bar orientation: `"vertical"` or `"horizontal"`.                                        |
| `keyField`       | `ChartField`          | `undefined`   | Unique identifier field for stable mark tracking across animation transitions.          |
| `name`           | `string`              | `"Range Bar"` | Series name for tooltips, legend, and accessibility.                                    |
| `borderRadius`   | `number`              | `4`           | Corner radius applied to all 4 corners of floating bars.                                |
| `maxBarWidth`    | `number`              | `undefined`   | Maximum width/height of the bar in pixels.                                              |
| `color`          | `string`              | `undefined`   | Bar fill color. Defaults to palette token.                                              |
| `fillOpacity`    | `number`              | `1.0`         | Bar fill opacity between 0.0 and 1.0.                                                   |
| `valueFormatter` | `ChartValueFormatter` | `undefined`   | Custom formatter callback for formatting range bounds in tooltips and live region.      |
| `visible`        | `model(boolean)`      | `true`        | Two-way bindable series visibility.                                                     |

### `<mona-line-series>`

Renders a continuous Cartesian line series connecting data points with configurable curve interpolation and stroke pattern.

| Input / Output   | Type                     | Default      | Description                                                                                          |
| :--------------- | :----------------------- | :----------- | :--------------------------------------------------------------------------------------------------- |
| `field`          | `ChartField`             | `""`         | Property key or accessor extracting numeric Y value.                                                 |
| `xField`         | `ChartField | undefined` | `undefined`  | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`).              |
| `keyField`       | `ChartField | undefined` | `undefined`  | Unique identifier field for stable mark tracking across animation transitions.                       |
| `name`           | `string`                 | `""`         | Series name for tooltips, legend, and accessibility.                                                 |
| `lineStyle`      | `ChartLineStyle`         | `"solid"`    | Stroke pattern used to render the series line (`"solid"`, `"dashed"`, or `"dotted"`).               |
| `curve`          | `ChartCurve`             | `"linear"`   | Curve interpolation algorithm (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`).   |
| `connectNulls`   | `boolean`                | `false`      | Whether to interpolate across null/missing data points without gaps.                                 |
| `showPoints`     | `boolean`                | `false`      | Whether to render point markers at data coordinates.                                                 |
| `pointRadius`    | `number | undefined`     | `undefined`  | Radius in pixels for point markers. Defaults to `--mona-chart-point-radius` (3px).                    |
| `strokeWidth`    | `number | undefined`     | `undefined`  | Stroke width in pixels for the series line. Defaults to 2px.                                         |
| `color`          | `string`                 | `""`         | Explicit stroke color override for the series line. Defaults to palette token.                       |
| `visible`        | `model(boolean)`         | `true`       | Two-way bindable series visibility.                                                                  |

### `<mona-area-series>`

Renders a continuous Cartesian area series supporting gradient fades, solid fills, cumulative stacking, and 100% normalized area bands.

| Input / Output   | Type                     | Default      | Description                                                                                          |
| :--------------- | :----------------------- | :----------- | :--------------------------------------------------------------------------------------------------- |
| `field`          | `ChartField`             | `""`         | Property key or accessor extracting numeric Y value.                                                 |
| `xField`         | `ChartField | undefined` | `undefined`  | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`).              |
| `keyField`       | `ChartField | undefined` | `undefined`  | Unique identifier field for stable mark tracking across animation transitions.                       |
| `name`           | `string`                 | `""`         | Series name for tooltips, legend, and accessibility.                                                 |
| `stack`          | `string | undefined`     | `undefined`  | Stack group name. Series sharing the same stack identifier are stacked into cumulative bands.        |
| `stackMode`      | `ChartStackMode`         | `"normal"`   | Stacking calculation mode: `"normal"` (raw cumulative sum) or `"percent"` (normalized to 100%).      |
| `fillMode`       | `ChartAreaFillMode`      | `"gradient"` | Area fill style: `"gradient"` fading to zero baseline, or uniform `"solid"`.                        |
| `lineStyle`      | `ChartLineStyle`         | `"solid"`    | Stroke pattern used for the area's boundary line (`"solid"`, `"dashed"`, or `"dotted"`). Fill is unaffected. |
| `fillOpacity`    | `number | undefined`     | `undefined`  | Maximum opacity applied to the area fill. Defaults to 0.18.                                          |
| `curve`          | `ChartCurve`             | `"linear"`   | Curve interpolation algorithm (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`).   |
| `connectNulls`   | `boolean`                | `false`      | Whether to interpolate across null/missing data points without gaps.                                 |
| `showPoints`     | `boolean`                | `false`      | Whether to render point markers at data coordinates.                                                 |
| `pointRadius`    | `number | undefined`     | `undefined`  | Radius in pixels for point markers. Defaults to `--mona-chart-point-radius` (4px).                    |
| `strokeWidth`    | `number | undefined`     | `undefined`  | Stroke width in pixels for the area boundary line. Defaults to 2px.                                  |
| `color`          | `string`                 | `""`         | Explicit stroke and fill color override for the area series. Defaults to palette token.              |
| `valueFormatter` | `ChartValueFormatter | undefined` | `undefined` | Custom formatter callback for area raw values and stack totals in tooltips and live region.       |
| `visible`        | `model(boolean)`         | `true`       | Two-way bindable series visibility.                                                                  |



### `<mona-range-area-series>`

Renders a continuous Cartesian range area series enclosing a confidence or variance band between two continuous boundary lines.

| Input / Output   | Type                  | Default        | Description                                                                                        |
| :--------------- | :-------------------- | :------------- | :------------------------------------------------------------------------------------------------- |
| `fromField`      | `ChartField`          | (required)     | Property key or accessor extracting the range starting boundary value.                             |
| `toField`        | `ChartField`          | (required)     | Property key or accessor extracting the range ending boundary value.                               |
| `xField`         | `ChartField`          | `undefined`    | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`).            |
| `keyField`       | `ChartField`          | `undefined`    | Unique identifier field for stable mark tracking across animation transitions.                     |
| `name`           | `string`              | `"Range Area"` | Series name for tooltips, legend, and accessibility.                                               |
| `fillOpacity`    | `number`              | `0.18`         | Range band fill opacity between 0.0 and 1.0.                                                       |
| `curve`          | `ChartCurve`          | `"linear"`     | Curve interpolation algorithm (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, `"step-after"`). |
| `connectNulls`   | `boolean`             | `false`        | Whether to interpolate across null/missing data points.                                            |
| `showPoints`     | `boolean`             | `false`        | Whether to render point markers at boundary coordinates.                                           |
| `pointRadius`    | `number`              | `4`            | Boundary marker radius in pixels when `showPoints` is true.                                        |
| `strokeWidth`    | `number`              | `2`            | Boundary outline stroke width in pixels.                                                           |
| `color`          | `string`              | `undefined`    | Range band line and fill color. Defaults to palette token.                                         |
| `valueFormatter` | `ChartValueFormatter` | `undefined`    | Custom formatter callback for formatting range bounds in tooltips and live region.                 |
| `visible`        | `model(boolean)`      | `true`         | Two-way bindable series visibility.                                                                |

### `<mona-scatter-series>`

Renders a Cartesian scatter series representing individual points along continuous linear or temporal X and Y dimensions.

| Input / Output | Type             | Default     | Description                                                                             |
| :------------- | :--------------- | :---------- | :-------------------------------------------------------------------------------------- |
| `field`        | `ChartField`     | `"value"`   | Property key or accessor extracting numeric Y-axis coordinate.                          |
| `xField`       | `ChartField`     | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`). |
| `keyField`     | `ChartField`     | `undefined` | Unique identifier field for stable mark tracking across animation transitions.          |
| `name`         | `string`         | `"Scatter"` | Series name for tooltips, legend, and accessibility.                                    |
| `color`        | `string`         | `undefined` | Series mark color. Defaults to palette token.                                           |
| `pointRadius`  | `number`         | `undefined` | Marker circle radius in pixels. Defaults to `--mona-chart-point-radius` (4px).          |
| `fillOpacity`  | `number`         | `0.9`       | Fill opacity between 0.0 and 1.0.                                                       |
| `strokeColor`  | `string`         | `"#ffffff"` | Border stroke color.                                                                    |
| `strokeWidth`  | `number`         | `1.5`       | Border stroke width in pixels.                                                          |
| `visible`      | `model(boolean)` | `true`      | Two-way bindable series visibility.                                                     |

### `<mona-bubble-series>`

Renders a Cartesian bubble series encoding a 3rd quantitative dimension into mark area using area-proportional square-root radius mapping.

| Input / Output  | Type                          | Default     | Description                                                                                                      |
| :-------------- | :---------------------------- | :---------- | :--------------------------------------------------------------------------------------------------------------- |
| `field`         | `ChartField`                  | `"value"`   | Property key or accessor extracting numeric Y-axis coordinate.                                                   |
| `sizeField`     | `ChartField`                  | `"size"`    | Property key or accessor extracting quantitative magnitude for bubble area.                                      |
| `sizeFormatter` | `ChartValueFormatter<number>` | `undefined` | Formatter callback generating formatted size strings for tooltips and accessibility announcements.               |
| `minRadius`     | `number`                      | `undefined` | Minimum bubble radius in pixels for the minimum size value. Defaults to `--mona-chart-bubble-min-radius` (4px).  |
| `maxRadius`     | `number`                      | `undefined` | Maximum bubble radius in pixels for the maximum size value. Defaults to `--mona-chart-bubble-max-radius` (24px). |
| `xField`        | `ChartField`                  | `undefined` | Property key or accessor extracting X-axis coordinate (overrides chart-level `xField`).                          |
| `keyField`      | `ChartField`                  | `undefined` | Unique identifier field for stable mark tracking across animation transitions.                                   |
| `name`          | `string`                      | `"Bubble"`  | Series name for tooltips, legend, and accessibility.                                                             |
| `color`         | `string`                      | `undefined` | Series mark color. Defaults to palette token.                                                                    |
| `fillOpacity`   | `number`                      | `0.55`      | Fill opacity between 0.0 and 1.0.                                                                                |
| `strokeColor`   | `string`                      | `"#ffffff"` | Border stroke color.                                                                                             |
| `strokeWidth`   | `number`                      | `1.5`       | Border stroke width in pixels.                                                                                   |
| `visible`       | `model(boolean)`              | `true`      | Two-way bindable series visibility.                                                                              |

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

| Input       | Type      | Default | Description                                                                  |
| :---------- | :-------- | :------ | :--------------------------------------------------------------------------- |
| `axisLine`  | `boolean` | `true`  | Whether to render the outer circular/polygonal border axis line.             |
| `gridLines` | `boolean` | `true`  | Whether to render radiating spoke lines from the pole to the outer boundary. |
| `labels`    | `boolean` | `true`  | Whether to render angular category/degree labels.                            |
| `rotation`  | `number`  | `0`     | Angle rotation in degrees (clockwise) of the 0° reference position.          |
| `tickCount` | `number`  | `12`    | Desired number of angular ticks for continuous polar charts.                 |
| `visible`   | `boolean` | `true`  | Whether the angular axis is visible.                                         |

### `<mona-chart-radial-axis>`

Configures the radial (distance from center pole) dimension in Polar and Radar charts.

| Input         | Type                   | Default     | Description                                                                                                |
| :------------ | :--------------------- | :---------- | :--------------------------------------------------------------------------------------------------------- |
| `axisLine`    | `boolean`              | `true`      | Whether to render the zero center tick indicator.                                                          |
| `gridLines`   | `boolean`              | `true`      | Whether to render concentric radial grid rings.                                                            |
| `gridShape`   | `ChartRadialGridShape` | `"auto"`    | Concentric grid ring geometry: `"auto"` (polygon for radar, circle for polar), `"polygon"`, or `"circle"`. |
| `labels`      | `boolean`              | `true`      | Whether to render numeric radial tick labels along the primary reference spoke.                            |
| `min` / `max` | `number`               | `undefined` | Explicit radial domain bounds.                                                                             |
| `nice`        | `boolean`              | `true`      | Rounds radial min/max bounds to human-friendly tick increments.                                            |
| `visible`     | `boolean`              | `true`      | Whether the radial axis is visible.                                                                        |

### `<mona-radar-series>`

Renders a closed polygonal series comparing categorical metrics across angular spokes.

| Input / Output  | Type                  | Default      | Description                                                                    |
| :-------------- | :-------------------- | :----------- | :----------------------------------------------------------------------------- |
| `field`         | `ChartField`          | `"value"`    | Property key or accessor extracting numeric metric value.                      |
| `categoryField` | `ChartField`          | `"category"` | Property key or accessor extracting spoke category.                            |
| `keyField`      | `ChartField`          | `undefined`  | Unique identifier field for stable mark tracking across animation transitions. |
| `name`          | `string`              | `"Radar"`    | Series name for tooltips, legend, and accessibility.                           |
| `fillMode`      | `ChartRadialFillMode` | `"solid"`    | Fill styling: `"solid"` wash, radial `"gradient"`, or `"none"`.                |
| `curve`         | `ChartRadialCurve`    | `"linear"`   | Curve interpolation: `"linear"` or `"smooth"` (closed Catmull-Rom spline).     |
| `showPoints`    | `boolean`             | `true`       | Whether vertex point markers are rendered.                                     |
| `pointRadius`   | `number`              | `undefined`  | Vertex marker radius in pixels.                                                |
| `strokeWidth`   | `number`              | `undefined`  | Polygon outline stroke width in pixels.                                        |
| `visible`       | `model(boolean)`      | `true`       | Two-way bindable series visibility.                                            |

### `<mona-polar-series>`

Renders a continuous polar series plotting values over continuous angular degrees (0° to 360°).

| Input / Output | Type                  | Default     | Description                                                                    |
| :------------- | :-------------------- | :---------- | :----------------------------------------------------------------------------- |
| `field`        | `ChartField`          | `"value"`   | Property key or accessor extracting numeric radial magnitude.                  |
| `angleField`   | `ChartField`          | `"angle"`   | Property key or accessor extracting angle in degrees.                          |
| `keyField`     | `ChartField`          | `undefined` | Unique identifier field for stable mark tracking across animation transitions. |
| `name`         | `string`              | `"Polar"`   | Series name for tooltips, legend, and accessibility.                           |
| `fillMode`     | `ChartRadialFillMode` | `"none"`    | Fill styling: `"solid"` wash, radial `"gradient"` (to pole), or `"none"`.      |
| `curve`        | `ChartRadialCurve`    | `"linear"`  | Curve interpolation: `"linear"` or `"smooth"`.                                 |
| `connectNulls` | `boolean`             | `false`     | Whether to interpolate across null/undefined values.                           |
| `showPoints`   | `boolean`             | `false`     | Whether data point markers are rendered.                                       |
| `visible`      | `model(boolean)`      | `true`      | Two-way bindable series visibility.                                            |

### `<mona-heatmap-series>`

Renders a 2D matrix heatmap visualization with perceptual Culori color scale interpolation and keyboard navigation.

| Input / Output   | Type                    | Default        | Description                                                                                   |
| :--------------- | :---------------------- | :------------- | :-------------------------------------------------------------------------------------------- |
| `data`           | `readonly unknown[]`    | `undefined`    | Matrix cell dataset or sparse records.                                                        |
| `field`          | `ChartField`            | `"value"`      | Property key or accessor extracting numeric heat value.                                       |
| `xField`         | `ChartField`            | `"x"`          | Property key or accessor extracting X category column.                                        |
| `yField`         | `ChartField`            | `"y"`          | Property key or accessor extracting Y category row.                                           |
| `keyField`       | `ChartField`            | `undefined`    | Unique identifier field for stable cell mark tracking across animation transitions.           |
| `color`          | `string`                | `undefined`    | Custom single base color for sequential ramp generation.                                      |
| `colors`         | `readonly string[]`     | `undefined`    | Custom palette stops for color interpolation.                                                 |
| `colorMode`      | `ChartHeatmapColorMode` | `"sequential"` | Color scale mode: `"sequential"` or `"diverging"`.                                            |
| `min`            | `number`                | `undefined`    | Explicit minimum domain value for color scale.                                                |
| `max`            | `number`                | `undefined`    | Explicit maximum domain value for color scale.                                                |
| `midpoint`       | `number`                | `undefined`    | Explicit midpoint value for diverging color scales (defaults to `(min + max) / 2`).           |
| `cellGap`        | `number`                | `1`            | Pixel gap between matrix cells.                                                               |
| `borderRadius`   | `number`                | `0`            | Corner border radius in pixels for each cell rectangle.                                       |
| `strokeColor`    | `string`                | `undefined`    | Optional cell border outline color.                                                           |
| `strokeWidth`    | `number`                | `0`            | Optional cell border outline width in pixels.                                                 |
| `showValues`     | `boolean`               | `false`        | Whether to render numeric text labels inside cells with high-contrast text color calculation. |
| `xCategories`    | `readonly unknown[]`    | `undefined`    | Explicit X-axis category order.                                                               |
| `yCategories`    | `readonly unknown[]`    | `undefined`    | Explicit Y-axis category order.                                                               |
| `name`           | `string`                | `"Heatmap"`    | Series name for tooltips, legends, and accessibility.                                         |
| `visible`        | `model(boolean)`        | `true`         | Two-way bindable series visibility.                                                           |
| `valueFormatter` | `ChartValueFormatter`   | `undefined`    | Formatter function for cell numeric values.                                                   |

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

### Export Formats & Behavior

#### Standalone SVG Vector (`format: "svg"`)

Generates a standalone, self-contained SVG document with resolved styling, embedded raster islands for custom templates and complex transformed DOM labels, accessible SVG `<title>` and `<desc>` metadata with ARIA attributes, and zero external resource dependencies.

```typescript
const result = await chart.exportChart({
    format: "svg",
    accessibility: true,
    background: "auto"
});
```

#### High-Resolution PNG (`format: "png"`)

Rasterizes chart graphics and DOM overlay layers to a PNG blob at the desired pixel density. Supports `pixelRatio` between `0.25` and `8.0` (defaults to `2`). Values outside this range throw `ChartExportError("invalid-size")`.

```typescript
await chart.downloadChart({
    format: "png",
    fileName: "revenue-report",
    pixelRatio: 2,
    background: "#ffffff"
});
```

#### Document PDF (`format: "pdf"`)

Generates a PDF document fitted to standard paper sizes (`"a4"`, `"letter"`), custom dimensions, or exact chart boundaries (`"chart"`).

- **Standard 14 Vector Fonts:** Vector conversion supports built-in PDF standard font families (`Helvetica`, `Times`, `Courier`) with standard ASCII characters (`0x20..0x7E`). Font safety is resolved from the _effective_ font of each text node, including fonts inherited from ancestor SVG elements and inline `font`/`font-family` declarations; uncertified inherited fonts trigger raster fallback exactly like direct ones. Text with no font declaration anywhere is treated as the converter default (Helvetica).
- **Auto Mode (`mode: "auto"`):** Automatically converts certified standard vector graphics and fonts to vector PDF; safely falls back to high-resolution raster PDF when custom web fonts, non-ASCII Unicode glyphs, or complex SVG constructs are detected.
- **Strict Vector Mode (`mode: "vector"`):** Enforces direct vector conversion; throws `ChartExportError("pdf-vector-unsupported")` if custom fonts, uncertified glyphs, or unsupported SVG features are present.
- **Raster Mode (`mode: "raster"`):** Directly generates a raster PDF without attempting vector conversion.

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

| Option                   | Type                                               | Default                        | Description                                                                                                                 |
| :----------------------- | :------------------------------------------------- | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `format`                 | `"svg" \| "png" \| "pdf"`                          | _Required_                     | Target export format.                                                                                                       |
| `fileName`               | `string`                                           | `chart.title` or `"chart"`     | Filename for `downloadChart()` (sanitized automatically).                                                                   |
| `width`                  | `number`                                           | Chart width                    | Output logical width in CSS pixels. When aspect ratio differs from source, chart content is centered using contain scaling. |
| `height`                 | `number`                                           | Chart height                   | Output logical height in CSS pixels.                                                                                        |
| `background`             | `"auto" \| "transparent" \| string`                | `"auto"`                       | Background fill policy or concrete CSS color. CSS-wide keywords (`inherit`, `initial`, `unset`) are rejected.               |
| `pixelRatio`             | `number`                                           | `2`                            | Raster scaling density (accepted range `0.25` to `8.0`) for PNG export.                                                     |
| `accessibility`          | `boolean`                                          | `true`                         | Embeds accessible `<title>`, `<desc>`, and ARIA attributes in SVG.                                                          |
| `mode`                   | `"auto" \| "vector" \| "raster"`                   | `"auto"`                       | PDF rendering path (auto vector with raster fallback, strict vector, or raster).                                            |
| `page.size`              | `"chart" \| "a4" \| "letter" \| { width, height }` | `"chart"`                      | PDF page sizing in points (1 CSS px = 0.75 pt).                                                                             |
| `page.orientation`       | `"auto" \| "portrait" \| "landscape"`              | `"auto"`                       | PDF page orientation.                                                                                                       |
| `page.margin`            | `number \| { top, right, bottom, left }`           | `0` (chart) / `24` (A4/Letter) | PDF page margins in points.                                                                                                 |
| `presentation.selection` | `boolean`                                          | `true`                         | Include persistent selection mark styling.                                                                                  |
| `presentation.crosshair` | `boolean`                                          | `false`                        | Include active crosshair lines and axis badges.                                                                             |
| `presentation.brush`     | `boolean`                                          | `false`                        | Include active brush marquee rectangle.                                                                                     |
| `signal`                 | `AbortSignal`                                      | `undefined`                    | AbortSignal to cancel in-flight export operations.                                                                          |

### Technical Considerations & Limitations

- **Browser-only:** Export operations run entirely in the browser and require `document`, `fetch`, canvas, and image decoding support. Server-side invocation throws `ChartExportError("unsupported-environment")`.
- **Snapshot Semantics:** Export captures a frozen semantic and visual snapshot synchronously at the `exportChart()` call boundary. After that boundary, live chart data, theme, and signal changes do not affect an in-flight export. Supported external resources referenced by the snapshot are then captured into export-owned embedded representations before rasterization begins. Export uses the committed scene; output dimensions and pixel ratio do not trigger a different semantic sample or a new density projection.
- **Custom Templates & Transformed DOM:** Custom Angular template content (e.g. `monaChartLegendItemTemplate`, `monaChartCenterTemplate`) and complex CSS transformed DOM labels (e.g. rotated axis labels) are captured as isolated raster islands and embedded as data URIs within SVG and hybrid PDF artifacts.
- **Resource Capture & CORS:** External template images (`<img>`, `input[type="image"]`, SVG `<image>`, CSS `background`/`background-image`/`border-image(-source)`/`list-style(-image)`) are fetched with bounded streaming reads, validated as decodable PNG/JPEG/WebP bytes, and rewritten to embedded data URLs before rasterization. Cross-origin images must be CORS-accessible. A response that is empty, non-image, oversized, or undecodable fails the export explicitly instead of silently producing missing content.
- **True Decode Guarantee:** Every accepted raster payload passes a real browser image decode (`createImageBitmap`, or an event-driven object-URL `HTMLImageElement` decode when unavailable). Header/magic-byte checks are only a fast pre-gate; malformed JPEG/WebP/PNG bodies that carry plausible headers are still rejected. Environments without any image decoding capability fail explicitly.
- **Embedded Data URI Policy:** Raster data URIs must be base64-encoded PNG/JPEG/WebP with magic bytes matching their declared media type; percent-encoded binary payloads are rejected.
- **Responsive Images:** For `<img srcset>` and `<picture><source>` structures, the currently displayed image (`currentSrc`) is captured and responsive reselection is disabled in the exported copy; the artifact always shows the image selected at export time.
- **Embedded SVG Images:** SVG resources embedded via data URI are rejected for export because nested SVG documents can reference additional external resources.
- **Template Font Readiness:** After the document font-loading barrier, a custom template whose entire font stack consists of registered web fonts that failed to load fails the export explicitly rather than silently substituting fallback typography. Stacks that resolve to any loaded web font or system font export exactly what the live chart displays.
- **Resource & Raster Safety Limits:** Export work is subject to internal safety limits covering per-resource and transaction-wide byte budgets, decoded image/canvas bitmap dimensions, and aggregate raster-island pixel work per transaction. Decoded dimensions are validated against these limits before any raster backing-store allocation, on every resource capture path. Exceeding any limit fails explicitly with `ChartExportError("too-large")`; quality is never silently reduced to fit.
- **Concurrent Export Isolation:** Multiple `exportChart()` invocations may overlap freely. Each invocation owns its own snapshot, resource capture, temporary fragment namespace, staging DOM, and abort controller; completing or aborting one export never affects another in-flight export.

### Custom Template Support Contract

Custom templates must be fully freezable: every visual feature is either supported or explicitly rejected with `ChartExportError("unsupported-template")`. An export never succeeds with silently omitted visual content.

**Supported:**

- Light DOM elements, plain text, inline styles, and element/class-scoped CSS that resolves to computed styles
- `<img>` (including `srcset`/`<picture>`, frozen to the selected source), `<input type="image">` sources, CSS background/border/list images, SVG `<image>` with external/data raster sources
- Canvas elements (must not be cross-origin tainted; backing stores are subject to internal bitmap budgets)
- Inset-only box shadows contained within the template bounds
- 2D affine CSS transforms (rotation, scale, skew, 2D matrix) via raster islands
- Contained light-DOM descendants
- Island-local SVG fragment references after automatic ID isolation: `<use href="#id">`, `textPath[href="#id"]`, gradient/pattern inheritance `href="#id"`, and presentation-attribute/CSS `url(#id)` references are all namespaced per export transaction and island before staging so they cannot resolve to same-ID elements in the live page or in another concurrently staged export. Referenced targets must exist inside the same frozen island and be recursively resource-safe.

**Rejected:**

- Visible `::before` / `::after` pseudo-element content or painted pseudo styling (borders, outlines, shadows)
- `<style>` elements, external stylesheet `<link rel="stylesheet">`, and `<script>` elements inside the template
- Active SVG timing content (`<animate>`, `<animateTransform>`, `<animateMotion>`, `<set>`, animation `<mpath>`): SMIL is an independent animation system the CSS-animation freezer cannot stop, so its presence fails the template instead of risking nondeterministic snapshots
- CSS `mask-image`, `mask`, `backdrop-filter`, CSS `filter`, and non-inset `box-shadow`
- CSS `outline` and `text-shadow`
- Open/detectable Shadow DOM in custom templates. Closed Shadow-DOM-backed custom elements cannot be detected from outside the element and are outside the first-release template export contract; they must not be relied on for export fidelity.
- 3D CSS transforms (`matrix3d`, `perspective`, `rotate3d`, etc.) and unparseable/unknown transform syntax
- Descendants with layout overflow outside the template bounds
- `video`, `audio`, `iframe`, `object`, `embed`, SVG `<feImage>`
- External/unresolvable SVG fragment references: external `<use>` documents, external gradient/pattern inheritance targets, `textPath` targets outside the frozen island, and any unrecognized visual `href`/`src`/`url()` surface. Ordinary navigation links (`<a href>`) are inert for rasterization and neither captured nor followed.

Clipping applied by ancestors _outside_ the captured template node is intentionally represented by the plot-area clip rectangle; arbitrary nested consumer clipping cannot be reproduced and should wrap the chart accordingly.

### PDF Raster Fidelity

Raster PDF output (both explicit `mode: "raster"` and automatic fallback) chooses its internal pixel density from the final PDF page occupancy, including paper-page fitting and upscaling, so enlarged pages do not blur a low-density bitmap. Outputs whose required pixel dimensions exceed browser allocation safety limits throw `ChartExportError("too-large")` instead of silently reducing fidelity.
