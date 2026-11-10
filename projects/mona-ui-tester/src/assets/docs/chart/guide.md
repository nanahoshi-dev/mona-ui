## Overview

A chart is a `mona-chart` with parts inside it: one or more series, the axes they're drawn on, and optional parts for the legend, the tooltip and interaction. Every part is a component, so a chart is written as markup and changes when its inputs do. Charts draw on a Canvas, so they stay fast with large data, and keep an accessible description, live announcements and keyboard navigation alongside.

This page covers what every chart shares. Each family of series has its own page, with a playground that covers all of its inputs:

| Page | Series | Draw |
| :--- | :--- | :--- |
| [Line & Area](/components/chart-line-area) | `mona-line-series`, `mona-area-series`, `mona-range-area-series` | Trends, volumes and bands along an X axis |
| [Bar & Waterfall](/components/chart-bar) | `mona-bar-series`, `mona-range-bar-series`, `mona-waterfall-series` | Comparisons, intervals and running totals |
| [Scatter & Bubble](/components/chart-scatter) | `mona-scatter-series`, `mona-bubble-series` | Relationships between two or three numbers |
| [Financial](/components/chart-financial) | `mona-candlestick-series`, `mona-ohlc-series` | Open, high, low and close prices |
| [Heatmap](/components/chart-heatmap) | `mona-heatmap-series` | A grid of cells colored by value |
| [Pie & Donut](/components/chart-pie) | `mona-pie-series`, `mona-donut-series` | Parts of a whole |
| [Funnel](/components/chart-funnel) | `mona-funnel-series` | Stages that narrow, with conversion between them |
| [Treemap](/components/chart-treemap) | `mona-treemap-series` | Hierarchies sized by value |
| [Radar & Polar](/components/chart-radar) | `mona-radar-series`, `mona-polar-series` | Metrics or directions around a circle |
| [Radial](/components/chart-radial) | `mona-radial-bar-series`, `mona-rose-series`, `mona-gauge-series` | Values as arcs around a center |

The X-Y series (line, area, range area, bar, range bar, scatter, bubble, candlestick and OHLC) can share one chart. Several radar series can share a chart, and so can several polar series, but not radar with polar. A chart takes one pie or donut, or one radial bar, rose or gauge, and a waterfall, funnel, heatmap or treemap series has its chart to itself. Cartesian and polar series never mix. A chart that breaks one of these rules logs a development warning.

## Import & Quick Start

Everything is imported from `@nanahoshi/mona-ui/chart`.

```typescript
import {
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    ChartXAxisComponent,
    ChartYAxisComponent,
    LineSeriesComponent
} from "@nanahoshi/mona-ui/chart";
```

```html
<mona-chart aria-label="Monthly visitors" class="h-72 w-full" xField="month" [data]="visitors">
    <mona-chart-x-axis />
    <mona-chart-y-axis title="Visitors" />
    <mona-line-series field="web" name="Web" />
    <mona-line-series field="mobile" name="Mobile" />
    <mona-chart-legend />
    <mona-chart-tooltip [shared]="true" />
</mona-chart>
```

The chart fills its host, so give the host a size. Series read their rows from the chart's `data` and their X value from its `xField`, unless they set their own.

## Anatomy

| Part | Selector | Role |
| :--- | :--- | :--- |
| Chart | `mona-chart` | Holds the data, title, animation, navigation and synchronization, and is the element that takes focus. |
| Cartesian axes | `mona-chart-x-axis`, `mona-chart-y-axis` | Scales, ticks, grid lines and titles. Add more than one with `axisId`, and bind series to them with `xAxisId` and `yAxisId`. |
| Polar axes | `mona-chart-angular-axis`, `mona-chart-radial-axis` | The axes of radar and polar series, described on [Radar & Polar](/components/chart-radar). |
| Series | `mona-*-series` | The data marks, described on each family's page. |
| Legend | `mona-chart-legend` | Lists the series, or the slices of a pie, and toggles them. |
| Tooltip | `mona-chart-tooltip` | Shows the values under the pointer or the keyboard focus. |
| Crosshair | `mona-chart-crosshair` | Guide lines and axis badges that follow the pointer on Cartesian charts. |
| Reference line and band | `mona-chart-reference-line`, `mona-chart-reference-band` | A fixed value or range on an axis, such as a target or a threshold. |
| Annotation | `mona-chart-annotation` | A marker and callout attached to a data point. |
| Selection | `mona-chart-selection` | Lets users select points by click or keyboard. |
| Brush | `mona-chart-brush` | Lets users select the points inside a dragged range. |

### Template Directives

- `ng-template[monaChartTitleTemplate]`: Customizes the title with `{ $implicit, title }`.
- `ng-template[monaChartSubtitleTemplate]`: Customizes the subtitle with `{ $implicit, subtitle }`.
- `ng-template[monaChartTooltipTemplate]`: Customizes hover and keyboard tooltip contents with `{ $implicit, point, points, series, shared }`.
- `ng-template[monaChartAxisLabelTemplate]`: Customizes tick label markup with `{ $implicit, axis, axisId, index, position, scaleType, value }`.
- `ng-template[monaChartLegendItemTemplate]`: Customizes legend items with `{ $implicit, color, dataIndex, datum, interactive, itemId, kind, name, percentage, secondaryColor, series, seriesId, seriesType, value, visible }`.
- `ng-template[monaChartNoDataTemplate]`: Customizes the empty state when no renderable data is present.
- `ng-template[monaChartCrosshairLabelTemplate]` (or `[monaChartCrosshairLabel]`): Customizes DOM crosshair coordinate badges with `{ $implicit, axis, axisId, coordinate, formattedValue, snapped, source, value }`.
- `ng-template[monaChartReferenceLabelTemplate]` (or `[monaChartReferenceLabel]`): Customizes DOM reference line or band labels with `{ $implicit, axis, axisId, bounds, coordinate, formattedFrom, formattedTo, formattedValue, from, kind, to, value }`.
- `ng-template[monaChartAnnotationLabelTemplate]` (or `[monaChartAnnotationLabel]`): Customizes DOM point annotation callout badges with `{ $implicit, data, formattedX, formattedY, point, x, xAxisId, y, yAxisId }`.
- `ng-template[monaChartDataLabelTemplate]` (or `[monaChartDataLabel]`): Customizes data labels with `{ $implicit, close, color, dataIndex, datum, formattedClose, formattedFrom, formattedHigh, formattedLow, formattedOpen, formattedSize, formattedStackPercentage, formattedStackTotal, formattedTo, formattedValue, formattedX, formattedY, fromValue, high, low, markId, open, rawValue, selected, seriesId, seriesName, seriesType, sizeValue, stackEnd, stackMode, stackPercentage, stackStart, stackTotal, toValue, value, xValue, yValue }`.
- `ng-template[monaChartWaterfallLabelTemplate]`: Customizes [waterfall](/components/chart-bar) step labels with `{ $implicit, barEnd, barStart, bounds, category, color, cumulativeAfter, cumulativeBefore, dataIndex, datum, deltaValue, formattedCategory, formattedCumulativeAfter, formattedCumulativeBefore, formattedDelta, formattedValue, kind, step, textColor, value, visualKind }`.
- `ng-template[monaChartSliceLabelTemplate]`: Customizes [pie and donut](/components/chart-pie) slice labels with `{ $implicit, category, color, dataIndex, datum, formattedCategory, formattedPercentage, formattedValue, percentage, seriesId, seriesName, seriesType, slice, value }`.
- `ng-template[monaChartCenterTemplate]`: Customizes the center of a [donut](/components/chart-pie) with `{ $implicit, formattedTotal, seriesId, seriesName, total, visibleSliceCount }`.
- `ng-template[monaChartFunnelLabelTemplate]`: Customizes [funnel](/components/chart-funnel) stage labels with `{ $implicit, bounds, category, color, conversionRate, dataIndex, datum, dropOff, formattedCategory, formattedConversionRate, formattedOverallConversionRate, formattedValue, overallConversionRate, previousValue, stage, stageId, stageIndex, textColor, value }`.
- `ng-template[monaChartTreemapLabelTemplate]`: Customizes [treemap](/components/chart-treemap) node labels with `{ $implicit, bounds, color, datum, depth, formattedLabel, formattedPath, formattedValue, isCollapsed, isLeaf, label, node, nodeId, path, percentageOfParent, percentageOfRoot, textColor, value }`.
- `ng-template[monaChartGaugeCenterTemplate]`: Customizes the readout in the middle of a [gauge](/components/chart-radial) with `{ $implicit, formattedMax, formattedMin, formattedValue, isClamped, max, min, ratio, seriesId, seriesName, value }`.

The series templates, for slice, donut center, gauge center, treemap, funnel and waterfall labels, are described on their family's page.

Every directive types its `let-` variables under `strictTemplates`. `let-value` is the context's `$implicit`, which is the tick, line or annotation value, not the whole context: read other members by name, as in `let-axis="axis"`. Annotation data is `unknown`, so use `$any(data).note` or a typed method to read it.

## Examples

### Custom tooltip

A shared tooltip shows every visible series at the active category. `ng-template[monaChartTooltipTemplate]` replaces its content.

```example
chart/tooltip
```

### Reference lines, bands and annotations

A reference line marks one value on an axis and a reference band marks a range, such as a budget or busy hours. Values are on the axis's own scale: a category name on a category axis, a number or `Date` on a continuous one. Bands draw under the series by default (`layer="underlay"`) and lines over them. An annotation pins a marker and a label to one point, and the crosshair follows the pointer.

```example
chart/overlays
```

### Selection and brushing

`mona-chart-selection` lets users select points by click, `Enter` or `Space`, and `[(selectedMarkIds)]` holds the ids of the selected marks. `mona-chart-brush` selects every point in a dragged range (by default with `Shift` held), and `selectionBehavior` decides whether that replaces, adds to, removes from or toggles the selection.

```example
chart/selection
```

## Behavior

### Cross-chart synchronization

Independent `mona-chart` instances can join a named synchronization group to coordinate viewports and crosshair position. Charts synchronize **semantic state** (axis windows, axis values) — never pixels, DOM events, or renderer transforms.

#### Basic group

```html
<mona-chart synchronization="dashboard" [navigation]="true">…</mona-chart>
<mona-chart synchronization="dashboard" [navigation]="true">…</mona-chart>
```

The string shorthand enables both viewport and crosshair channels with default options.

#### Full configuration

```ts
type ChartSynchronizationInput =
    | false
    | string
    | {
          group: string;
          viewport?:
              | boolean
              | {
                    enabled?: boolean; // default true
                    mode?: "domain" | "relative"; // default "domain"
                    axes?: ChartNavigationAxisTarget; // default "auto"
                    phase?: "continuous" | "end"; // default "continuous"
                };
          crosshair?:
              | boolean
              | {
                    enabled?: boolean; // default true
                    mode?: "domain" | "relative";
                    axes?: "auto" | "x" | "xy" | "y";
                    match?: "axis-value" | "nearest-point"; // default "axis-value"
                    showTooltip?: boolean; // default false (opt-in)
                    clearOnLeave?: boolean; // default true
                };
          axisMappings?: { source: ChartViewportAxisRef; target: ChartViewportAxisRef }[];
      };
```

- **`viewport.phase: "end"`** keeps the source fully interactive locally and synchronizes only the final committed state of an operation — useful for expensive dashboards.
- **Domain mode** preserves the source's semantic window when the target axis type is compatible (`numeric → numeric`, `time/utc → time/utc`, identical category keys). Incompatible axes are ignored with one development warning.
- **Relative mode** maps normalized base-scale positions through each chart's own authority, supporting different ranges, nonlinear scales (log/symlog/pow/sqrt), and overview/detail dashboards. The base extent maps to `[0,1]`; valid radius halos and panned windows may extend beyond that interval and are not clipped by the density index.
- **Axis identity** is always `{ axis: "x" | "y", axisId }`; explicit `axisMappings` remap differently-named axes.

#### Controlled charts

Controlled charts publish to peers **only after** their parent accepts a viewport proposal via `[viewport]`. A rejected proposal never moves peers. A controlled recipient treats inbound synchronization as a proposal (`viewportChangeDetails` with `source="sync"`); hidden state is never mutated. The accepted controlled echo is consumed by the committed-viewport path and is not rebroadcast, so groups cannot ping-pong.

#### Crosshair synchronization

Crosshair messages carry semantic axis values (numbers, instants, category keys). Recipients map values into their own coordinate space:

- Values outside the recipient's visible viewport hide the crosshair rather than clamping.
- `match: "nearest-point"` snaps to the nearest local datum — including raw unsampled datums on dense series. Distance is calculated authoritatively against exact geometry: point coordinates for line/scatter, vertical segments for range area and stacked area, and rectangle bounds for bars.
- Local pointer/keyboard interaction always outranks remote presentation; on local leave the latest remote state is restored.
- Remote crosshairs never move focus, emit `pointFocusChange`, or announce to live regions.
- `showTooltip: true` resolves tooltips from the **recipient's own data and formatters** — source tooltip content is never forwarded. When shared tooltip is enabled, recipient tooltips aggregate only matching marks sharing the single semantic interaction bucket of the globally nearest primary hit, including matching raw marks queried from active dense interaction providers.

#### What synchronization does not cover

Selection, brush rectangles, legend visibility, ticks/layout chrome, and renderer choice are intentionally not synchronized. `navigation.linkGroups` links axes _inside_ one chart; `synchronization` links _independent chart instances_.

### High-density downsampling

Dense Cartesian series reduce **rendered geometry** while preserving full-data semantics. Base domains, stack totals, bubble size domains, datum identity, and mark IDs always derive from complete source data.

```html
<mona-chart [downsampling]="true">…</mona-chart>
<!-- default -->
<mona-chart [downsampling]="false">…</mona-chart>
<!-- disable globally -->
<mona-line-series field="y" [downsampling]="{ algorithm: 'lttb' }" />
<!-- per series -->
```

```ts
interface ChartDownsamplingOptions {
    algorithm?: "auto" | "minmax" | "lttb" | "pixel";
    enabled?: boolean; // default true
    maxPoints?: number; // explicit hard cap, triggers reduction even below threshold
    samplesPerPixel?: number; // default 1
    threshold?: number; // default max(2000, plotSpanPx × 4)
}
```

#### Eligible families

| Series                | Strategy                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| line / unstacked area | indexed min/max envelope (auto), segment-aware LTTB (explicit); `step` and `step-after` use protected adjacency groups                                                                                                               |
| rangeArea             | range envelope (first/last/lowest/highest per bucket, preserving same-segment clipping neighbors and null island endpoints when `connectNulls=true`) |
| stacked area          | coordinated shared-X selection across the whole group, strictly bounded by `maxPoints` and preserving sparse member data; any step member enables protected shared selection                                                                          |
| scatter / bubble      | normalized spatial hierarchy with adaptive quadtree subdivision and bounded representatives                                                          |

Category-X connected paths use discrete membership and viewport culling, so automatic point reduction is intentionally ineligible. A future aggregation or virtualization treatment for category data would be a separate product feature rather than an implicit density fallback.

Bar and range-bar series keep discrete rectangle and interval geometry and do not use automatic point dropping. Candlestick and OHLC series keep financial marks; semantic aggregation would need to preserve open-first, high-maximum, low-minimum, and close-last values, so it is not implicit in density reduction. Heatmap series use matrix-cell semantics outside this point-density subsystem. Funnel, pie/donut, polar/radar, and treemap series retain their family-specific layout policies. Step and step-after curves on eligible continuous-X line, area, range-area, and stacked-area series use protected adjacency selection.

#### Semantics preserved

- Every rendered point is a **real source point** with its original datum, index, and full-source mark ID — duplicate explicit keys and natural keys receive stable full-source occurrence ranks, ensuring sample/bucket IDs never leak into events.
- X search is enabled only when the complete raw X sequence is finite and monotonic, including transitions across Y gaps. Unsorted, cross-gap-reordered, or non-finite X falls back safely to the ordinary full layout with one development warning; source path order is never silently changed.
- Null/gap topology is preserved (`connectNulls` respected); long invalid runs become minimal gap markers instead of thousands of invalid points, with defined bracketing points retained across long null islands.
- When `connectNulls = false`, LTTB allocates its budget across visible defined segments, reserves coverage for small segments, and retains same-segment clipping anchors without bridging across null gaps.
- Sparse family-valid-empty marker sources retain their compact spatial authority even when no positive bubble size survives validation; this keeps their downstream hit and interaction policy stable.
- `threshold` is wired through Stage C for every eligible line, area, rangeArea, stacked-area, scatter, and bubble family; it controls reduction activation without changing source-data authority.
- For eligible line/area/range series, `maxPoints` caps selected defined source data marks. Minimal invalid gap sentinels may additionally appear in the internal scene solely to preserve disconnected-path topology. For scatter/bubble it caps selected marker candidates; for stacked area it caps shared timeline X keys for the group.
- Step and step-after series reserve mandatory visible and crossing anchors before adjacency detail. The hard cap still wins, so any transition detail that cannot fit degrades deterministically within the configured budget.
- Bucket-first extrema queries preserve rare scalar spikes/troughs and range low/high envelope extremes across fragmented null-separated data; bubble radius scales still derive from all valid bubbles, including unsampled outliers.

#### Interaction under downsampling

Pointer hover, crosshair nearest-point, click, and brush resolve **exact raw datums** through compact typed-array indexes — including points absent from the visual sample. Globally exact geometric indexes guarantee precision across point, segment, and box bounds without fixed bucket neighborhood approximations. Numeric semantic buckets use binary timeline lookup with shared relative equality; unsearchable raw X falls back to the ordinary interaction path. Brush discovery may use a compact normalized candidate window, but every returned match is accepted against the current pixel geometry, so brush results remain exact and never truncated (a brush covering 500k points returns 500k matches). Keyboard navigation traverses bounded rendered samples for accessibility; data labels project from reduced geometry.

Marker direct hits use the current visual marker geometry and source/painter order. Identical-coordinate bubble leaves answer the topmost qualifying visual (then forgiving) radius threshold without scanning the full raw cluster; dense nearest ties use the same painter-order authority. Nearest-point synchronization remains semantic and local to the recipient.

#### Performance contract

For eligible finite-X monotonic sources that retain a density runtime, viewport projection uses indexed source-range/extrema queries and pixel-derived bounded candidate work rather than rescanning the complete source. There are no Stage A/B re-runs or per-frame density rebuilds, and scene/hit volume scales with the pixel budget instead of source size. Unsorted or non-finite X deliberately falls back to ordinary source-order layout. Marker activation and exact collection use the radius-aware render-candidate count; pointer leaves remain bounded even for tight clusters beside distant outliers, and if exact collection exceeds the target budget it transitions directly to the truthful sampled path. Viewport projections animate immediately (no morph lag). Export snapshots the exact committed sampled scene at its live resolution; changing output dimensions or pixel ratio changes rasterization only and never selects a different semantic sample.

### Shared Options

#### Data labels

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

#### Viewport and navigation

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

The viewport is a `ChartViewportState`: `{ axes: ChartViewportWindow[] }`. A window is `{ kind: "continuous", axis, axisId, min, max }` or `{ kind: "category", axis, axisId, startIndex, endIndexExclusive }`. To keep the viewport in your own state, for example to restore it later, bind it both ways:

```typescript
import type { ChartViewportState } from "@nanahoshi/mona-ui/chart";

protected readonly viewport = signal<ChartViewportState | undefined>(undefined);
```

```html
<mona-chart [data]="data" [navigation]="true" [viewport]="viewport()" (viewportChange)="viewport.set($event)">
    <mona-chart-x-axis />
    <mona-chart-y-axis />
    <mona-line-series field="value" />
</mona-chart>
```

`viewportChangeDetails` gives the `source` of a change (`"drag"`, `"wheel"`, `"pinch"`, `"keyboard"`, `"fit"`, `"reset"`, `"sync"`, `"programmatic"` or `"data-reconcile"`) and its `phase` (`"start"`, `"update"` or `"end"`).

#### Synchronization options

`synchronization` takes a group name or `ChartSynchronizationOptions`: `group`, `viewport` (`boolean` or `{ axes, enabled, mode, phase }`), `crosshair` (`boolean` or `{ axes, clearOnLeave, enabled, match, mode, showTooltip }`) and `axisMappings`. See "Cross-chart synchronization" above for what is shared.

#### Animation

`animation` takes `true`, `false` or `ChartAnimationOptions`. Animation is skipped when the user prefers reduced motion.

| Option | Type | Default | Meaning |
| :--- | :--- | :--- | :--- |
| `data` | `boolean` | `true` | Animate data changes. |
| `duration` | `number` | `300` | Duration in milliseconds. |
| `easing` | `ChartAnimationEasing` | `"ease-out"` | `"linear"`, `"ease-in"`, `"ease-out"` or `"ease-in-out"`. |
| `enabled` | `boolean` | `true` | Animate at all. |
| `initial` | `boolean` | `true` | Animate the first render. |
| `visibility` | `boolean` | `true` | Animate visibility toggles. |

#### Downsampling options

`downsampling` accepts `boolean | ChartDownsamplingOptions` at the chart and eligible Cartesian-series levels. The chart policy is inherited unless a series supplies its own value. The requested `algorithm` is a preference; the family-safe strategy resolves the actual reducer, so step curves, range areas, stacked areas, and marker families keep their required geometry. Category-X data and intentionally excluded families do not become eligible through this input.

| Option | Type | Meaning |
| :--- | :--- | :--- |
| `enabled` | `boolean` | Enables or disables reduction at the current chart or series scope. A chart-level disable wins over series settings. |
| `algorithm` | `"auto" \| "minmax" \| "lttb" \| "pixel"` | Requested reduction preference, constrained by family semantics. |
| `maxPoints` | `number` | Render-sample budget with family-specific meaning; it does not limit raw pointer, brush, selection, tooltip, or source-data interaction. |
| `samplesPerPixel` | `number` | Pixel-density multiplier used when deriving the render-sample budget. |
| `threshold` | `number` | Activation threshold for an eligible family; it does not make an otherwise ineligible axis or series family eligible. |

Resolution precedence is chart disable, series disable, series preference, then the family-safe strategy. A source below the threshold uses ordinary full rendering, while an explicit `maxPoints` may activate reduction below the threshold for an eligible continuous-X family.

### Two-Way Binding

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

## Accessibility

The host is `role="application"` with `aria-roledescription="chart"`, so screen readers switch to focus mode and pass the arrow keys to the chart. Its description summarizes the series, the category range of a Cartesian chart and each series' lowest and highest value, then lists the keys. Announcements give the point's position ("2 of 12"), read the point again when a key doesn't move it, and report legend toggles. With `dataTable`, the table sits in a `role="document"` region that screen readers can browse.

Set `landmark` to make the host a `role="region"` landmark instead. Screen readers then stay in browse mode and read the arrow keys themselves, and the data table loses its `role="document"` wrapper.

| Attribute | Where | Value |
| :--- | :--- | :--- |
| `role` | Host | `"application"`, or `"region"` with `landmark` |
| `aria-roledescription` | Host | The `chartRoleDescription` message, absent with `landmark` |
| `aria-label` | Host | The `aria-label` input, else `title`, else the `chart` message |
| `aria-describedby` | Host | A hidden description: the `aria-description` input, or else the subtitle and a summary of the data, followed by the keys |
| `tabindex` | Host | `0` |
| `aria-live` | A hidden announcer inside the chart | `"polite"`, with `aria-atomic="true"` |

Axis labels, axis titles and the label overlays (slices, treemap, funnel, waterfall, reference lines, annotations, data labels and crosshair badges) are `aria-hidden`. Content from `monaChartCenterTemplate` and `monaChartGaugeCenterTemplate` is not hidden, so screen readers can reach it.

**Consumer responsibilities**

- Give each chart a name with `title` or `aria-label`. Without one, every chart is announced with the same generic name.
- Give each `landmark` chart a unique name.

### Keyboard Navigation

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
