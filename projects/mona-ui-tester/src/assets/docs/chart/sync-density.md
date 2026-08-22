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
          viewport?: boolean | {
              enabled?: boolean;   // default true
              mode?: "domain" | "relative";  // default "domain"
              axes?: ChartNavigationAxisTarget; // default "auto"
              phase?: "continuous" | "end";     // default "continuous"
          };
          crosshair?: boolean | {
              enabled?: boolean;      // default true
              mode?: "domain" | "relative";
              axes?: "auto" | "x" | "xy" | "y";
              match?: "axis-value" | "nearest-point"; // default "axis-value"
              showTooltip?: boolean;  // default false (opt-in)
              clearOnLeave?: boolean; // default true
          };
          axisMappings?: { source: ChartViewportAxisRef; target: ChartViewportAxisRef }[];
      };
```

- **`viewport.phase: "end"`** keeps the source fully interactive locally and synchronizes only the final committed state of an operation — useful for expensive dashboards.
- **Domain mode** preserves the source's semantic window when the target axis type is compatible (`numeric → numeric`, `time/utc → time/utc`, identical category keys). Incompatible axes are ignored with one development warning.
- **Relative mode** maps normalized base-scale positions through each chart's own authority, supporting different ranges, nonlinear scales (log/symlog/pow/sqrt), and overview/detail dashboards.
- **Axis identity** is always `{ axis: "x" | "y", axisId }`; explicit `axisMappings` remap differently-named axes.

### Controlled charts

Controlled charts publish to peers **only after** their parent accepts a viewport proposal via `[viewport]`. A rejected proposal never moves peers. A controlled recipient treats inbound synchronization as a proposal (`viewportChange` with `source="sync"`); hidden state is never mutated. Accepted inbound echoes are not rebroadcast, so groups cannot ping-pong.

### Crosshair synchronization

Crosshair messages carry semantic axis values (numbers, instants, category keys). Recipients map values into their own coordinate space:

- Values outside the recipient's visible viewport hide the crosshair rather than clamping.
- `match: "nearest-point"` snaps to the nearest local datum — including raw unsampled datums on dense series.
- Local pointer/keyboard interaction always outranks remote presentation; on local leave the latest remote state is restored.
- Remote crosshairs never move focus, emit `pointFocusChange`, or announce to live regions.
- `showTooltip: true` resolves tooltips from the **recipient's own data and formatters** — source tooltip content is never forwarded.

### What synchronization does not cover

Selection, brush rectangles, legend visibility, ticks/layout chrome, and renderer choice are intentionally not synchronized. `navigation.linkGroups` links axes *inside* one chart; `synchronization` links *independent chart instances*.

## High-density downsampling

Dense Cartesian series reduce **rendered geometry** while preserving full-data semantics. Base domains, stack totals, bubble size domains, datum identity, and mark IDs always derive from complete source data.

```html
<mona-chart [downsampling]="true">…</mona-chart>           <!-- default -->
<mona-chart [downsampling]="false">…</mona-chart>          <!-- disable globally -->
<mona-line-series field="y" [downsampling]="{ algorithm: 'lttb' }" /> <!-- per series -->
```

```ts
interface ChartDownsamplingOptions {
    algorithm?: "auto" | "minmax" | "lttb" | "pixel";
    enabled?: boolean;       // default true
    maxPoints?: number;
    samplesPerPixel?: number; // default 1
    threshold?: number;        // default max(2000, plotSpanPx × 4)
}
```

### Eligible families

| Series | Strategy |
|---|---|
| line / unstacked area | indexed min/max envelope (auto), LTTB (explicit) |
| rangeArea | range envelope (first/last/lowest/highest per bucket) |
| stacked area | coordinated shared-X selection across the whole group |
| scatter / bubble | normalized spatial hierarchy with bounded representatives |

Bar, financial, heatmap, waterfall, funnel, pie/donut, polar/radar, treemap, and category-X connected paths are **not** downsampled in this phase; they keep viewport culling semantics. Step curves require a dedicated reducer and are disabled until certified.

### Semantics preserved

- Every rendered point is a **real source point** with its original datum, index, and mark ID — sample/bucket IDs never leak into events.
- Unsorted X falls back safely to the ordinary full layout with one development warning; source path order is never silently changed.
- Null/gap topology is preserved (`connectNulls` respected); long invalid runs become minimal gap markers instead of thousands of invalid points.
- Rare extrema survive min/max sampling; bubble radius scales still derive from all valid bubbles, including unsampled outliers.

### Interaction under downsampling

Pointer hover, crosshair nearest-point, click, and brush resolve **exact raw datums** through compact typed-array indexes — including points absent from the visual sample. Brush results are exact and never truncated (a brush covering 500k points returns 500k matches). Keyboard navigation traverses bounded rendered samples for accessibility; data labels project from reduced geometry.

### Performance contract

Viewport pan/zoom over dense monotonic data costs roughly `O(log N + buckets)` per frame — no full source scans, no Stage A/B re-runs, no per-frame density rebuilds, and scene/hit volume scales with the pixel budget instead of source size. Viewport projections animate immediately (no morph lag). Export snapshots the exact committed sampled scene at its live resolution.
