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

### High-density Cartesian downsampling

`downsampling` accepts `boolean | ChartDownsamplingOptions` at the chart and eligible Cartesian-series levels. The chart policy is inherited unless a series supplies its own value. The requested `algorithm` is a preference; the family-safe strategy resolves the actual reducer, so step curves, range areas, stacked areas, and marker families keep their required geometry. Category-X data and intentionally excluded families do not become eligible through this input.

| Option | Type | Meaning |
| :--- | :--- | :--- |
| `enabled` | `boolean` | Enables or disables reduction at the current chart or series scope. A chart-level disable wins over series settings. |
| `algorithm` | `"auto" \| "minmax" \| "lttb" \| "pixel"` | Requested reduction preference, constrained by family semantics. |
| `maxPoints` | `number` | Render-sample budget with family-specific meaning; it does not limit raw pointer, brush, selection, tooltip, or source-data interaction. |
| `samplesPerPixel` | `number` | Pixel-density multiplier used when deriving the render-sample budget. |
| `threshold` | `number` | Activation threshold for an eligible family; it does not make an otherwise ineligible axis or series family eligible. |

Resolution precedence is chart disable, series disable, series preference, then the family-safe strategy. A source below the threshold uses ordinary full rendering, while an explicit `maxPoints` may activate reduction below the threshold for an eligible continuous-X family.

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
