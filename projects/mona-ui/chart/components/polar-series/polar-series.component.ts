import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartRadialCurve, ChartRadialFillMode, ChartValueFormatter } from "../../models/chart-polar.models";
import type { ChartField } from "../../models/chart.models";

let nextPolarSeriesId = 0;

@Component({
    selector: "mona-polar-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class MonaPolarSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-polar-series-${++nextPolarSeriesId}`;

    /**
     * @description Property key or accessor function extracting the degree angle (0° to 360°) for each data item.
     * @default "angle"
     */
    public readonly angleField = input<ChartField>("angle");

    /**
     * @description Explicit stroke and marker color override for the series.
     * @default ""
     */
    public readonly color = input("");

    /**
     * @description Whether to connect points across null or invalid values without gaps.
     * @default false
     */
    public readonly connectNulls = input(false);

    /**
     * @description Radial curve interpolation style (`"linear"` or `"smooth"`).
     * @default "linear"
     */
    public readonly curve = input<ChartRadialCurve>("linear");

    /**
     * @description Series-specific dataset overriding the root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Property key or accessor function extracting the numeric radial distance/value for each data item.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

    /**
     * @description Fill mode applied to the area between the data curve and the chart center pole (`"none"`, `"solid"`, or `"gradient"`).
     * @default "none"
     */
    public readonly fillMode = input<ChartRadialFillMode>("none");

    /**
     * @description Opacity ratio for polar area fills (0 to 1).
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Series name displayed in legends, tooltips, and accessibility regions.
     * @default "Polar"
     */
    public readonly name = input("Polar");

    /**
     * @description Radius in pixels for point markers.
     * @default undefined
     */
    public readonly pointRadius = input<number | undefined>(undefined);

    /**
     * @description Whether to draw point markers at each valid angular coordinate.
     * @default false
     */
    public readonly showPoints = input(false);

    /**
     * @description Stroke width in pixels for the outer data line.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Additional CSS classes applied to the series host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Custom formatter function for numeric values in tooltips and live region announcements.
     * @default undefined
     */
    public readonly valueFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Whether the polar series is visible on the chart.
     * @default true
     */
    public readonly visible = model(true);

    public constructor() {
        effect(() => {
            this.angleField();
            this.color();
            this.connectNulls();
            this.curve();
            this.data();
            this.field();
            this.fillMode();
            this.fillOpacity();
            this.name();
            this.pointRadius();
            this.showPoints();
            this.strokeWidth();
            this.userClass();
            this.valueFormatter();
            this.visible();
            this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        const unregister = this.#chartContext.registerSeries({
            angleField: this.angleField,
            color: this.color,
            connectNulls: this.connectNulls,
            curve: this.curve,
            data: this.data,
            element: this.#elementRef,
            field: this.field,
            fillMode: this.fillMode,
            fillOpacity: this.fillOpacity,
            id: this.#id,
            name: this.name,
            pointRadius: this.pointRadius,
            showPoints: this.showPoints,
            strokeWidth: this.strokeWidth,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "polar",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
