# @nanahoshi/mona-ui/chart

High-performance, accessible, and reactive 2D Canvas Cartesian and Polar chart visualizations designed for modern Angular applications.

## Overview

The Mona UI Chart library combines declarative Angular template composition with the rendering speed of HTML5 Canvas 2D. State and inputs are fully reactive with Angular Signals, supporting dynamic resizing, seamless light/dark theming via Tailwind CSS variables, rich tooltip placement, and full WCAG AA accessibility.

## Key Features

- **Declarative Composition:** Compose charts using intuitive child components for axes, series, legends, tooltips, inside labels, and donut center templates.
- **Series Types:**
  - **Cartesian:** Line (with multiple interpolation curves), Area (gradient fade or solid fill), and Grouped Bar series.
  - **Polar:** Pie (full or partial circles) and Donut (configurable hole radius ratio and custom center templates).
- **Dynamic & Responsive:** Built-in `ResizeObserver` support with automatic canvas backing store scaling for crisp rendering on HiDPI/Retina screens.
- **Full Keyboard & Screen Reader Accessibility:** 
  - `ArrowRight` / `ArrowLeft`: Navigate through X-axis interaction buckets or polar slices.
  - `ArrowUp` / `ArrowDown`: Cycle through visible Cartesian series at the focused data point, or navigate slices in polar mode.
  - `Home` / `End`: Jump to first or last data point/slice.
  - `Enter` / `Space`: Emit click events for the selected data point or slice.
  - `Escape`: Dismiss active interaction and announcements.
  - Live ARIA announcements and 100% AXE-compliant accessibility.
- **Interactive Legend:** Clickable legend items that toggle series or individual slice visibility with stable palette coloring.
- **Customizable Templates:** Custom Angular templates for tooltips (`monaChartTooltipTemplate`), axis tick labels (`monaChartAxisLabelTemplate`), legend items (`monaChartLegendItemTemplate`), slice data labels (`monaChartSliceLabelTemplate`), donut center content (`monaChartCenterTemplate`), and empty states (`monaChartNoDataTemplate`).

---

## Basic Usage

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

### Pie Chart

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

### Donut Chart with Center Template

```html
<mona-chart [data]="revenueByCategory" aria-label="Revenue by Category" class="h-80 w-full">
    <mona-donut-series
        field="revenue"
        categoryField="category"
        [innerRadiusRatio]="0.62">
        <ng-template monaChartCenterTemplate let-total let-formattedTotal="formattedTotal">
            <div class="flex flex-col items-center justify-center">
                <span class="text-xs text-muted-foreground">Total Revenue</span>
                <strong class="text-lg font-semibold">{{ formattedTotal }}</strong>
            </div>
        </ng-template>
    </mona-donut-series>

    <mona-chart-legend position="bottom" [interactive]="true" />
    <mona-chart-tooltip />
</mona-chart>
```

---

## Components & Directives

### `<mona-chart>`
The root container that coordinates layout measurement, data domains, rendering schedules, and interaction.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `data` | `readonly unknown[]` | `[]` | Primary dataset shared across child series. |
| `xField` | `ChartField` | `""` | Property key or accessor function extracting X coordinate. |
| `aria-label` | `string` | `"Chart"` | Accessible label for screen readers. |
| `aria-description` | `string` | `""` | Extended description for screen readers. |
| `class` | `string` | `""` | CSS classes applied to chart root container. |
| `pointClick` | `output<ChartPointEvent>` | — | Emits when a point, bar, or slice is clicked or activated with Enter/Space. |
| `pointFocusChange` | `output<ChartPointFocusEvent>` | — | Emits when keyboard focus moves to a point, series, or slice. |
| `seriesVisibilityChange` | `output<ChartSeriesVisibilityEvent>` | — | Emits when series visibility is toggled via legend. |

### `<mona-pie-series>`
Renders a pie chart with configurable start/end angle, pad angle, corner radius, and inside data labels.

| Input / Output | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `field` | `ChartField` | `"value"` | Property key or accessor extracting numeric slice value. |
| `categoryField` | `ChartField` | `"category"` | Property key or accessor extracting slice category. |
| `data` | `readonly unknown[]` | `undefined` | Series-specific data overriding root chart data. |
| `name` | `string` | `"Pie"` | Series name for tooltips and accessibility. |
| `outerRadiusRatio` | `number` | `0.9` | Outer radius ratio relative to plot bounds (0.1 to 1). |
| `startAngle` / `endAngle` | `number` | `0` / `360` | Angles in degrees (clockwise from 12 o'clock). |
| `padAngle` | `number` | `0` | Angular gap in degrees between adjacent slices. |
| `cornerRadius` | `number` | `undefined` | Pixel corner radius on arc boundaries. |
| `colors` | `readonly string[]` | `undefined` | Explicit array of slice colors. |
| `colorField` | `ChartField` | `undefined` | Accessor function or property key for datum color. |
| `valueFormatter` | `ChartValueFormatter` | `undefined` | Custom numeric formatter for values and totals. |
| `categoryFormatter` | `ChartValueFormatter` | `undefined` | Custom formatter for category labels. |
| `showLabels` | `boolean` | `false` | Whether slice data labels are displayed. |
| `labelPosition` | `ChartPolarLabelPosition` | `"outside"` | Placement of data labels: `"outside"` (with leader lines and collision resolution) or `"inside"` (slice centroid). |
| `labelContent` | `ChartPolarLabelContent` | `"percentage"` | Default data label format (`"percentage"`, `"value"`, `"category"`, `"category-percentage"`). |
| `minLabelAngle` | `number` | `12` | Minimum slice angle in degrees required to render label (applies to `inside` labels). |
| `sliceVisibilityChange` | `output<ChartSliceVisibilityEvent>` | — | Emits when an individual slice is hidden or shown. |

### `<mona-donut-series>`
Renders a donut chart with all `<mona-pie-series>` inputs plus:

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `innerRadiusRatio` | `number` | `0.6` | Ratio of inner hole radius relative to outer radius (0 to 0.95). |

### `<mona-line-series>`
Renders continuous line graphs with optional markers and curve smoothing.

### `<mona-area-series>`
Renders area fill charts with zero-baseline gradients or solid fills.

### `<mona-bar-series>`
Renders vertical grouped bars with configurable corner radii and widths.

### `<mona-chart-legend>`
Renders interactive series or slice legend indicators with visibility toggling.

### `<mona-chart-tooltip>`
Renders smart popover tooltips with automated boundary detection, clamping, and polar category/percentage presentation.
