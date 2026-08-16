# @nanahoshi/mona-ui/chart

High-performance, accessible, and reactive 2D Canvas Cartesian chart visualizations designed for modern Angular applications.

## Overview

The Mona UI Chart library combines declarative Angular template composition with the rendering speed of HTML5 Canvas 2D. State and inputs are fully reactive with Angular Signals, supporting dynamic resizing, seamless light/dark theming via Tailwind CSS variables, rich tooltip placement, and full WCAG AA accessibility.

## Key Features

- **Declarative Composition:** Compose charts using intuitive child components for axes, series, legends, and tooltips.
- **Series Types:** Line (with multiple interpolation curves), Area (gradient fade or solid fill), and Grouped Bar series.
- **Dynamic & Responsive:** Built-in `ResizeObserver` support with automatic canvas backing store scaling for crisp rendering on HiDPI/Retina screens.
- **Full Keyboard & Screen Reader Accessibility:** 
  - `ArrowRight` / `ArrowLeft`: Navigate through X-axis interaction buckets.
  - `ArrowUp` / `ArrowDown`: Cycle through visible series at the focused data point.
  - `Home` / `End`: Jump to first or last data point.
  - `Enter` / `Space`: Emit click events for the selected data point.
  - `Escape`: Dismiss active interaction and announcements.
  - Live ARIA announcements and 100% AXE-compliant accessibility.
- **Interactive Legend:** Clickable legend items that toggle series visibility with automatic chart rescaling.
- **Customizable Templates:** Custom Angular templates for tooltips (`monaChartTooltipTemplate`), axis tick labels (`monaChartAxisLabelTemplate`), legend items (`monaChartLegendItemTemplate`), and empty states (`monaChartNoDataTemplate`).

---

## Basic Usage

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
| `pointClick` | `output<ChartPointEvent>` | — | Emits when a point or bar is clicked or activated with Enter/Space. |
| `pointFocusChange` | `output<ChartPointFocusEvent>` | — | Emits when keyboard focus moves to a point or series. |
| `seriesVisibilityChange` | `output<ChartSeriesVisibilityEvent>` | — | Emits when series visibility is toggled via legend. |

### `<mona-chart-x-axis>` / `<mona-chart-y-axis>`
Configures axis scale types, ticks, grid lines, and formatters.

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `type` (X axis only) | `"auto" \| "category" \| "linear" \| "time" \| "utc"` | `"auto"` | Scale type for the X axis. |
| `position` | `ChartXAxisPosition` / `ChartYAxisPosition` | `"bottom"` / `"left"` | Axis placement relative to the plot area. |
| `nice` | `boolean` | `true` | Extends axis range to round, pleasant intervals. |
| `gridLines` | `boolean` | `false` (X) / `true` (Y) | Whether grid lines are visible across the plot. |
| `axisLine` | `boolean` | `true` | Whether the solid baseline border line is visible. |
| `formatter` | `ChartAxisFormatter` | `undefined` | Custom label formatting function `(value, index) => string`. |
| `min` / `max` | `number \| Date` | `undefined` | Explicit domain bounds. |
| `tickCount` | `number` | `undefined` | Suggested tick count. |
| `title` | `string` | `""` | Axis title text. |

### `<mona-line-series>`
Renders continuous line graphs with optional markers and curve smoothing.

### `<mona-area-series>`
Renders area fill charts with zero-baseline gradients or solid fills.

### `<mona-bar-series>`
Renders vertical grouped bars with configurable corner radii and widths.

### `<mona-chart-legend>`
Renders series indicators with visibility toggling.

### `<mona-chart-tooltip>`
Renders smart popover tooltips with automated boundary detection and clamping.

---

## Custom Templates

```html
<mona-chart [data]="data" xField="date">
    <mona-chart-x-axis>
        <ng-template monaChartAxisLabelTemplate let-value>
            <span class="font-bold text-xs">{{ value }}</span>
        </ng-template>
    </mona-chart-x-axis>

    <mona-line-series field="val" name="Metric" />

    <mona-chart-tooltip>
        <ng-template monaChartTooltipTemplate let-point>
            <div class="p-2 text-xs">
                <strong>{{ point.seriesName }}</strong>: {{ point.formattedY }}
            </div>
        </ng-template>
    </mona-chart-tooltip>

    <ng-template monaChartNoDataTemplate>
        <div class="p-4 text-center text-muted-foreground">No records to display.</div>
    </ng-template>
</mona-chart>
```
