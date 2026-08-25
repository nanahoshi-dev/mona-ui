import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartHeatmapColorMode } from "../../models/chart-heatmap.models";
import type { ChartField, ChartValueFormatter } from "../../models/chart.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-heatmap-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class HeatmapSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-heatmap-series-${++nextSeriesId}`;

    #registered = false;

    /**
     * @description Corner radius in pixels for each individual heat cell.
     * @default undefined
     */
    public readonly borderRadius = input<number | undefined>(undefined);

    /**
     * @description Spacing gap in pixels between adjacent cells.
     * @default 1
     */
    public readonly cellGap = input(1);

    /**
     * @description Explicit primary base color used to derive the heat palette.
     * @default ""
     */
    public readonly color = input("");

    /**
     * @description Color scale mapping mode: 'sequential' for continuous single-hue intensity or 'diverging' for dual-pole deviations.
     * @default "sequential"
     */
    public readonly colorMode = input<ChartHeatmapColorMode>("sequential");

    /**
     * @description Explicit array of color stops defining the gradient palette.
     * @default undefined
     */
    public readonly colors = input<readonly string[] | undefined>(undefined);

    /**
     * @description Series-specific dataset overriding root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the numeric heat value for each cell.
     */
    public readonly field = input.required<ChartField>();

    /**
     * @description Fill opacity applied to the heat cells (0 to 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Explicit upper bound for the numeric value color domain.
     * @default undefined
     */
    public readonly max = input<number | undefined>(undefined);

    /**
     * @description Explicit central midpoint for diverging color scales.
     * @default undefined
     */
    public readonly midpoint = input<number | undefined>(undefined);

    /**
     * @description Explicit lower bound for the numeric value color domain.
     * @default undefined
     */
    public readonly min = input<number | undefined>(undefined);

    /**
     * @description Name of the series displayed in legends, tooltips, and live region announcements.
     * @default "Heatmap"
     */
    public readonly name = input("Heatmap");

    /**
     * @description Whether to render numeric value labels inside individual heat cells on Canvas.
     * @default false
     */
    public readonly showValues = input(false);

    /**
     * @description Explicit border stroke color for individual heat cells.
     * @default ""
     */
    public readonly strokeColor = input("");

    /**
     * @description Stroke width in pixels for cell borders.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Additional CSS classes applied to the series host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Custom formatter for raw cell values in labels, tooltips, and live regions.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Whether the series is currently visible on the chart and in calculations.
     * @default true
     */
    public readonly visible = model(true);

    /**
     * @description Explicit category ordering for the X axis columns.
     * @default undefined
     */
    public readonly xCategories = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the X column category for each cell.
     * @default undefined
     */
    public readonly xField = input<ChartField | undefined>(undefined);

    /**
     * @description Explicit category ordering for the Y axis rows.
     * @default undefined
     */
    public readonly yCategories = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the Y row category for each cell.
     */
    public readonly yField = input.required<ChartField>();

    public constructor() {
        effect(() => {
            this.visible();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        effect(() => {
            this.data();
            this.field();
            this.keyField();
            this.xCategories();
            this.xField();
            this.yCategories();
            this.yField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.borderRadius();
            this.cellGap();
            this.name();
            this.showValues();
            this.strokeWidth();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
            this.colorMode();
            this.colors();
            this.fillOpacity();
            this.max();
            this.midpoint();
            this.min();
            this.strokeColor();
            this.userClass();
            this.valueFormatter();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        this.#registered = true;

        const unregister = this.#chartContext.registerSeries({
            borderRadius: this.borderRadius,
            cellGap: this.cellGap,
            color: this.color,
            colorMode: this.colorMode,
            colors: this.colors,
            data: this.data,
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            id: this.#id,
            keyField: this.keyField,
            max: this.max,
            midpoint: this.midpoint,
            min: this.min,
            name: this.name,
            showValues: this.showValues,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            type: "heatmap",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible,
            xCategories: this.xCategories,
            xField: this.xField,
            yCategories: this.yCategories,
            yField: this.yField
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
