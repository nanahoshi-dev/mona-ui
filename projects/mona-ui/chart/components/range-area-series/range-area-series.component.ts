import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartCurve } from "../../models/chart-series.models";
import type { ChartField, ChartValueFormatter } from "../../models/chart.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-range-area-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class RangeAreaSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-range-area-series-${++nextSeriesId}`;

    /**
     * @description Explicit stroke and fill color override for the range area series.
     * @default ""
     */
    public readonly color = input("");

    /**
     * @description Whether to connect points across null or invalid values without gaps.
     * @default false
     */
    public readonly connectNulls = input(false);

    /**
     * @description Curve interpolation style (`"linear"`, `"monotone-x"`, `"natural"`, `"step"`, or `"step-after"`).
     * @default "linear"
     */
    public readonly curve = input<ChartCurve>("linear");

    /**
     * @description Series-specific dataset overriding the root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Maximum opacity applied to the range area fill.
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the starting range value for each data item.
     */
    public readonly fromField = input.required<ChartField>();

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Name of the series displayed in legends, tooltips, and live region announcements.
     * @default "Range Area"
     */
    public readonly name = input("Range Area");

    /**
     * @description Radius in pixels for point markers drawn along the boundary curves.
     * @default undefined
     */
    public readonly pointRadius = input<number | undefined>(undefined);

    /**
     * @description Whether to draw point markers at each data coordinate along both boundary curves.
     * @default false
     */
    public readonly showPoints = input(false);

    /**
     * @description Stroke width in pixels for the boundary lines.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the ending range value for each data item.
     */
    public readonly toField = input.required<ChartField>();

    /**
     * @description Additional CSS classes applied to the series host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Custom formatter for raw range values in tooltips and live region announcements.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Whether the series is currently visible on the chart and in calculations.
     * @default true
     */
    public readonly visible = model(true);

    /**
     * @description Property key or accessor extracting the X coordinate, overriding the root chart X field.
     * @default undefined
     */
    public readonly xField = input<ChartField | undefined>(undefined);

    #registered = false;

    public constructor() {
        effect(() => {
            this.visible();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        effect(() => {
            this.data();
            this.fromField();
            this.toField();
            this.keyField();
            this.xField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.connectNulls();
            this.curve();
            this.name();
            this.pointRadius();
            this.showPoints();
            this.strokeWidth();
            this.valueFormatter();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
            this.fillOpacity();
            this.userClass();
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
            color: this.color,
            connectNulls: this.connectNulls,
            curve: this.curve,
            data: this.data,
            element: this.#elementRef,
            fillOpacity: this.fillOpacity,
            fromField: this.fromField,
            id: this.#id,
            keyField: this.keyField,
            name: this.name,
            pointRadius: this.pointRadius,
            showPoints: this.showPoints,
            strokeWidth: this.strokeWidth,
            toField: this.toField,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "rangeArea",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible,
            xField: this.xField
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
