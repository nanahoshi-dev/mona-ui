# Mona UI Charts

`<mona-chart>` (from `@nanahoshi/mona-ui/chart`) draws charts from child components: you add series, axes and overlays to the template, and the chart lays them out and renders them. This guide covers how to feed it data and make it fit an application. The [chart reference](../projects/mona-ui-tester/src/assets/docs/chart/api.md) lists every input, output and template.

---

## 1. Data

Give the chart its rows through `data`, and say which property holds what. A series can read another dataset through its own `data`.

```typescript
import { Component, signal } from "@angular/core";
import {
    BarSeriesComponent,
    ChartComponent,
    ChartLegendComponent,
    ChartTooltipComponent,
    LineSeriesComponent
} from "@nanahoshi/mona-ui/chart";

interface MonthlySales {
    month: string;
    orders: number;
    revenue: number;
}

@Component({
    selector: "app-sales-chart",
    imports: [BarSeriesComponent, ChartComponent, ChartLegendComponent, ChartTooltipComponent, LineSeriesComponent],
    template: `
        <mona-chart class="h-80 w-full" title="Sales" [data]="sales()" xField="month">
            <mona-bar-series field="revenue" keyField="month" name="Revenue" />
            <mona-line-series field="orders" keyField="month" name="Orders" />
            <mona-chart-legend />
            <mona-chart-tooltip [shared]="true" />
        </mona-chart>
    `
})
export class SalesChartComponent {
    protected readonly sales = signal<MonthlySales[]>([
        { month: "Jan", orders: 42, revenue: 12400 },
        { month: "Feb", orders: 51, revenue: 15100 }
    ]);
}
```

- **The chart needs a size.** It fills its host, so give the host a height (`h-80` above).
- **Fields** are a property name or an accessor: `field="revenue"` or `[field]="revenueOf"`, with `revenueOf = (row: MonthlySales) => row.revenue`. An accessor is typed for its row.
- **`field` has no default on bar, area and line series.** Object rows render nothing without it. Plain numbers don't need it.
- **Some fields are required.** `<mona-heatmap-series>` needs `field` and `yField`, range series need `fromField` and `toField`, and financial series need `openField`, `highField`, `lowField` and `closeField`. Most other series read `"value"` by default.
- **Use `keyField` when rows change.** It gives each row an identity, so animations, selection and focus follow the row rather than its position.
- **Replace the array to update.** A new array is picked up by the signal input. If you mutate an array in place, call `invalidate()` on the chart.
- **Missing values** leave a gap. `connectNulls` joins over it on line, area and range area series. `null` and `undefined` are quiet gaps; other values that aren't numbers leave one too, with a warning in dev mode.
- **Numeric strings count as numbers** on value fields, so `"10"` from a JSON decimal draws. X, category, key and label fields are read as they are.
- **A callback that throws costs only its own output.** An accessor that throws reads as a gap, and a formatter that throws shows the value as text. Each error reaches `ErrorHandler` once.
- **The X axis picks its scale from the data.** Dates get a time scale, numbers a linear one and strings categories. Set `type` on `<mona-chart-x-axis>` to choose. Bars and range bars are the exception: they get a category axis even when X holds numbers, and other series sharing that axis are placed by category too. A series its axis can't draw is named in a dev-mode warning.
- **No data** shows a built-in message. Replace it with `<ng-template monaChartNoDataTemplate>`.
- **Large datasets** are reduced for drawing, and interaction still reads the raw rows. See `downsampling` in the reference.

---

## 2. Locale

Charts follow the library locale, with no setup of their own. Axis ticks, data labels, tooltips and announcements format numbers, percentages and dates for `MonaI18nService.localeId()`, and changing the locale reformats charts in place.

```typescript
import { provideMonaI18n } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "@nanahoshi/mona-ui/locales";

export const appConfig = {
    providers: [provideMonaI18n({ locale: MONA_DE_DE_LOCALE })]
};
```

- Large ticks are compact (`1.2M` in English, `1,5 Mio.` in German).
- A series `valueFormatter` or axis `formatter` takes precedence over the built-in formats. Format with the locale yourself in those.
- Built-in text, such as "Series 1", the waterfall legend and every announcement, comes from the `chart` messages. The [i18n guide](i18n.md) shows how to override them.

---

## 3. Accessibility

Name every chart. Without a name it is announced as "Chart".

```html
<mona-chart aria-label="Monthly revenue and orders" [data]="sales()" xField="month">…</mona-chart>
```

- The name comes from `aria-label`, then `title`, then the translated "Chart".
- **The description is generated.** It summarizes the series, the category range and each series' lowest and highest value, then lists the keys. `aria-description` replaces the summary; the keys stay.
- **The host has `role="application"`,** so screen readers pass the arrow keys to the chart. Set `landmark` to make it a `region` landmark instead, and give each landmark chart a unique name.
- **`dataTable` adds a visually hidden table** of the first 100 rows, in a region screen readers can browse. Use it when the numbers matter, not only the shape.
- **Moving through points is announced** with the point's position ("2 of 12"), and legend toggles are announced too.
- **Color isn't the only signal.** Hidden legend items are struck through, and rising candlesticks are hollow by default so they differ from falling ones by shape. Keep that default if you override the financial colors.
- **Contrast is yours when you set colors.** Marks need 3:1 against the chart's background. The fallback palette and financial colors reach it; check your own `--color-chart-N` values.
- **Canvas is opaque to assistive technology and browser find.** Everything above is what makes the chart readable, so don't hide the chart from assistive technology with `aria-hidden`.

---

## 4. Keyboard

The chart is one Tab stop. Keys pressed in the legend or other projected content are left to that content.

| Key                        | Action                                                                                                                                   |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| `ArrowRight` / `ArrowLeft` | Move between points, buckets, spokes or slices.                                                                                          |
| `ArrowUp` / `ArrowDown`    | Switch between series at the focused coordinate.                                                                                         |
| `Home` / `End`             | Jump to the first or last point.                                                                                                         |
| `Enter`                    | Emit `pointClick` for the focused point, and toggle its selection with `<mona-chart-selection>`.                                         |
| `Space`                    | Toggle the focused point's selection with `<mona-chart-selection>`; otherwise emit `pointClick`.                                         |
| `Escape`                   | Dismiss the crosshair, highlight and tooltip. With nothing to dismiss, the key reaches the page, so a chart in a dialog doesn't trap it. |
| `Shift` + arrows           | With `navigation`, pan. With `<mona-chart-brush>` and a focused point, extend a brush; `Enter` commits and `Escape` cancels.             |
| `+` / `-` / `0`            | With `navigation`, zoom in, zoom out and reset.                                                                                          |

---

## 5. Right-to-Left

A chart follows the direction of its host: `dir` on it or an ancestor, or the CDK `Directionality`. It lays out again when that changes.

- **The default Y axis, title and legend order** follow the direction.
- **`start` and `end` are logical; `left` and `right` are physical.** Prefer `start` and `end` for `<mona-chart-y-axis position>`, `<mona-chart-legend position>` and `titleAlign`.
- **The X axis stays left to right,** so categories and time read the same in both directions. There is no input to mirror it.
- **Automatic data labels** beside a point prefer the left in RTL. Explicit positions stay as set.

Selecting a locale doesn't set the direction. Set `dir` on your page or a container, as the [i18n guide](i18n.md) describes.

---

## 6. Theming

Colors come from the theme, so charts follow light and dark mode. Series take `--color-chart-1` to `--color-chart-5` from `@nanahoshi/mona-ui/theme` in order.

An input wins over a CSS variable, and a CSS variable wins over the built-in default. Set variables on the chart, a container or `:root`:

```css
.finance-dashboard {
    --mona-chart-financial-rising-color: #15803d;
    --mona-chart-financial-falling-color: #b91c1c;
    --mona-chart-grid-color: #e2e8f0;
}
```

| Part                       | CSS variables                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame                      | `--mona-chart-surface`, `--mona-chart-grid-color`, `--mona-chart-axis-color`, `--mona-chart-label-color`                                                                                                                                                                                                                                                                                                                                                                                       |
| Lines and markers          | `--mona-chart-line-width`, `--mona-chart-point-radius`, `--mona-chart-fill-opacity`, `--mona-chart-marker-fill-opacity`, `--mona-chart-marker-stroke-color`, `--mona-chart-marker-stroke-width`                                                                                                                                                                                                                                                                                                |
| Areas                      | `--mona-chart-area-fill-color`, `--mona-chart-area-fill-opacity`                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Bubbles                    | `--mona-chart-bubble-min-radius`, `--mona-chart-bubble-max-radius`                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Data labels                | `--mona-chart-data-label-color`, `--mona-chart-data-label-font`, `--mona-chart-data-label-halo-color`, `--mona-chart-data-label-halo-width`                                                                                                                                                                                                                                                                                                                                                    |
| Pie and donut              | `--mona-chart-slice-fill-opacity`, `--mona-chart-slice-stroke-color`, `--mona-chart-slice-stroke-width`                                                                                                                                                                                                                                                                                                                                                                                        |
| Radar and polar            | `--mona-chart-radial-fill-opacity`, `--mona-chart-radial-point-radius`, `--mona-chart-radial-stroke-width`                                                                                                                                                                                                                                                                                                                                                                                     |
| Radial bar, rose and gauge | `--mona-chart-radial-arc-fill-opacity`, `--mona-chart-radial-arc-stroke-color`, `--mona-chart-radial-arc-stroke-width`, `--mona-chart-radial-track-color`, `--mona-chart-radial-track-opacity`, `--mona-chart-gauge-color`, `--mona-chart-gauge-hub-color`, `--mona-chart-gauge-needle-color`                                                                                                                                                                                                  |
| Financial                  | `--mona-chart-financial-rising-color`, `--mona-chart-financial-falling-color`, `--mona-chart-financial-neutral-color`, `--mona-chart-financial-hollow-fill`, `--mona-chart-financial-wick-color`, `--mona-chart-financial-wick-width`                                                                                                                                                                                                                                                          |
| Heatmap                    | `--mona-chart-heatmap-low-color`, `--mona-chart-heatmap-mid-color`, `--mona-chart-heatmap-high-color`, `--mona-chart-heatmap-cell-border-color`, `--mona-chart-heatmap-cell-border-width`, `--mona-chart-heatmap-cell-radius`, `--mona-chart-heatmap-fill-opacity`                                                                                                                                                                                                                             |
| Treemap                    | `--mona-chart-treemap-border-radius`, `--mona-chart-treemap-fill-opacity`, `--mona-chart-treemap-parent-fill-opacity`, `--mona-chart-treemap-label-color`, `--mona-chart-treemap-stroke-color`, `--mona-chart-treemap-stroke-width`                                                                                                                                                                                                                                                            |
| Funnel                     | `--mona-chart-funnel-fill-opacity`, `--mona-chart-funnel-label-color`, `--mona-chart-funnel-stroke-color`, `--mona-chart-funnel-stroke-width`                                                                                                                                                                                                                                                                                                                                                  |
| Waterfall                  | `--mona-chart-waterfall-increase-color`, `--mona-chart-waterfall-decrease-color`, `--mona-chart-waterfall-neutral-color`, `--mona-chart-waterfall-subtotal-color`, `--mona-chart-waterfall-total-color`, `--mona-chart-waterfall-connector-color`, `--mona-chart-waterfall-connector-width`, `--mona-chart-waterfall-border-radius`, `--mona-chart-waterfall-fill-opacity`, `--mona-chart-waterfall-label-color`, `--mona-chart-waterfall-stroke-color`, `--mona-chart-waterfall-stroke-width` |
| Crosshair                  | `--mona-chart-crosshair-color`, `--mona-chart-crosshair-opacity`, `--mona-chart-crosshair-width`                                                                                                                                                                                                                                                                                                                                                                                               |
| Reference lines and bands  | `--mona-chart-reference-line-color`, `--mona-chart-reference-line-opacity`, `--mona-chart-reference-line-width`, `--mona-chart-reference-band-color`, `--mona-chart-reference-band-opacity`, `--mona-chart-reference-band-border-color`, `--mona-chart-reference-band-border-width`                                                                                                                                                                                                            |
| Annotations                | `--mona-chart-annotation-color`, `--mona-chart-annotation-marker-radius`                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Brush and selection        | `--mona-chart-brush-fill-color`, `--mona-chart-brush-fill-opacity`, `--mona-chart-brush-border-color`, `--mona-chart-brush-border-width`, `--mona-chart-selection-color`, `--mona-chart-selection-fill-opacity`, `--mona-chart-selection-stroke-width`                                                                                                                                                                                                                                         |
| Tooltip                    | `--mona-chart-tooltip-background`, `--mona-chart-tooltip-text`                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Animation                  | `--mona-chart-animation-duration`, `--mona-chart-animation-easing`                                                                                                                                                                                                                                                                                                                                                                                                                             |

A chart reads these variables when it lays out and when the theme changes. A variable changed by a page class that doesn't change the theme, such as a hover style on an ancestor, isn't picked up until the next layout. Call `invalidate()` on the chart after such a change.
