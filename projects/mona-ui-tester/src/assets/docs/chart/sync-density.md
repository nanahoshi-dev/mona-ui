# Chart Synchronization & High-Density Downsampling

## Cross-chart synchronization

Independent `mona-chart` instances can join a named synchronization group to coordinate viewports and crosshair position. Charts synchronize **semantic state** (axis windows, axis values) — never pixels, DOM events, or renderer transforms.

### Basic group

```html
<mona-chart synchronization="dashboard" [navigation]="true">…</mona-chart>
<mona-chart synchronization="dashboard" [navigation]="true">…</mona-chart>
```

The string shorthand enables both viewport and crosshair channels with default options.

### Full configuration

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

### Controlled charts

Controlled charts publish to peers **only after** their parent accepts a viewport proposal via `[viewport]`. A rejected proposal never moves peers. A controlled recipient treats inbound synchronization as a proposal (`viewportChange` with `source="sync"`); hidden state is never mutated. The accepted controlled echo is consumed by the committed-viewport path and is not rebroadcast, so groups cannot ping-pong.

### Crosshair synchronization

Crosshair messages carry semantic axis values (numbers, instants, category keys). Recipients map values into their own coordinate space:

- Values outside the recipient's visible viewport hide the crosshair rather than clamping.
- `match: "nearest-point"` snaps to the nearest local datum — including raw unsampled datums on dense series. Distance is calculated authoritatively against exact geometry: point coordinates for line/scatter, vertical segments for range area and stacked area, and rectangle bounds for bars.
- Local pointer/keyboard interaction always outranks remote presentation; on local leave the latest remote state is restored.
- Remote crosshairs never move focus, emit `pointFocusChange`, or announce to live regions.
- `showTooltip: true` resolves tooltips from the **recipient's own data and formatters** — source tooltip content is never forwarded. When shared tooltip is enabled, recipient tooltips aggregate only matching marks sharing the single semantic interaction bucket of the globally nearest primary hit, including matching raw marks queried from active dense interaction providers.

### What synchronization does not cover

Selection, brush rectangles, legend visibility, ticks/layout chrome, and renderer choice are intentionally not synchronized. `navigation.linkGroups` links axes _inside_ one chart; `synchronization` links _independent chart instances_.

## High-density downsampling

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

### Eligible families

| Series                | Strategy                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| line / unstacked area | indexed min/max envelope (auto), segment-aware LTTB (explicit); `step` and `step-after` use protected adjacency groups                                                                                                               |
| rangeArea             | range envelope (first/last/lowest/highest per bucket, preserving same-segment clipping neighbors and null island endpoints when `connectNulls=true`) |
| stacked area          | coordinated shared-X selection across the whole group, strictly bounded by `maxPoints` and preserving sparse member data; any step member enables protected shared selection                                                                          |
| scatter / bubble      | normalized spatial hierarchy with adaptive quadtree subdivision and bounded representatives                                                          |

Bar, financial, heatmap, waterfall, funnel, pie/donut, polar/radar, treemap, and category-X connected paths intentionally remain outside automatic point reduction; they keep their discrete or family-specific viewport semantics. Financial marks require semantic OHLC aggregation rather than implicit point dropping. Step and step-after curves on eligible continuous-X line, area, range-area, and stacked-area series use protected adjacency selection.

### Semantics preserved

- Every rendered point is a **real source point** with its original datum, index, and full-source mark ID — duplicate explicit keys and natural keys receive stable full-source occurrence ranks, ensuring sample/bucket IDs never leak into events.
- X search is enabled only when the complete raw X sequence is finite and monotonic, including transitions across Y gaps. Unsorted, cross-gap-reordered, or non-finite X falls back safely to the ordinary full layout with one development warning; source path order is never silently changed.
- Null/gap topology is preserved (`connectNulls` respected); long invalid runs become minimal gap markers instead of thousands of invalid points, with defined bracketing points retained across long null islands.
- When `connectNulls = false`, LTTB allocates its budget across visible defined segments, reserves coverage for small segments, and retains same-segment clipping anchors without bridging across null gaps.
- Sparse family-valid-empty marker sources retain their compact spatial authority even when no positive bubble size survives validation; this keeps their downstream hit and interaction policy stable.
- `threshold` is wired through Stage C for every eligible line, area, rangeArea, stacked-area, scatter, and bubble family; it controls reduction activation without changing source-data authority.
- For eligible line/area/range series, `maxPoints` caps selected defined source data marks. Minimal invalid gap sentinels may additionally appear in the internal scene solely to preserve disconnected-path topology. For scatter/bubble it caps selected marker candidates; for stacked area it caps shared timeline X keys for the group.
- Bucket-first extrema queries preserve rare scalar spikes/troughs and range low/high envelope extremes across fragmented null-separated data; bubble radius scales still derive from all valid bubbles, including unsampled outliers.

### Interaction under downsampling

Pointer hover, crosshair nearest-point, click, and brush resolve **exact raw datums** through compact typed-array indexes — including points absent from the visual sample. Globally exact geometric indexes guarantee precision across point, segment, and box bounds without fixed bucket neighborhood approximations. Numeric semantic buckets use binary timeline lookup with shared relative equality; unsearchable raw X falls back to the ordinary interaction path. Brush discovery may use a compact normalized candidate window, but every returned match is accepted against the current pixel geometry, so brush results remain exact and never truncated (a brush covering 500k points returns 500k matches). Keyboard navigation traverses bounded rendered samples for accessibility; data labels project from reduced geometry.

Marker direct hits use the current visual marker geometry and source/painter order. Identical-coordinate bubble leaves answer the topmost qualifying visual (then forgiving) radius threshold without scanning the full raw cluster; dense nearest ties use the same painter-order authority. Nearest-point synchronization remains semantic and local to the recipient.

### Performance contract

For eligible finite-X monotonic sources that retain a density runtime, viewport projection uses indexed source-range/extrema queries and pixel-derived bounded candidate work rather than rescanning the complete source. There are no Stage A/B re-runs or per-frame density rebuilds, and scene/hit volume scales with the pixel budget instead of source size. Unsorted or non-finite X deliberately falls back to ordinary source-order layout. Marker activation and exact collection use the radius-aware render-candidate count; pointer leaves remain bounded even for tight clusters beside distant outliers, and if exact collection exceeds the target budget it transitions directly to the truthful sampled path. Viewport projections animate immediately (no morph lag). Export snapshots the exact committed sampled scene at its live resolution.
