import { Component, DestroyRef, effect, ElementRef, inject, input, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartAreaFillMode, ChartCurve } from "../../models/chart-series.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-area-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true"
    }
})
export class MonaAreaSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-area-series-${++nextSeriesId}`;

    /**
     * @description Explicit stroke and fill color override for the area series.
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
     * @description Property key or accessor extracting the Y value for each data item.
     * @default ""
     */
    public readonly field = input("");

    /**
     * @description Area fill style (`"gradient"` fading to zero baseline, or uniform `"solid"`).
     * @default "gradient"
     */
    public readonly fillMode = input<ChartAreaFillMode>("gradient");

    /**
     * @description Maximum opacity applied to the area fill.
     * @default 0.15
     */
    public readonly fillOpacity = input(0.15);

    /**
     * @description Name of the series displayed in legends and tooltips.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description Radius in pixels for point markers.
     * @default 3
     */
    public readonly pointRadius = input(3);

    /**
     * @description Whether to draw point markers at each data coordinate along the top boundary line.
     * @default false
     */
    public readonly showPoints = input(false);

    /**
     * @description Stroke width in pixels for the area boundary line.
     * @default 2
     */
    public readonly strokeWidth = input(2);

    /**
     * @description Additional CSS classes applied to the series host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Whether the series is currently visible on the chart and in calculations.
     * @default true
     */
    public readonly visible = input(true);

    /**
     * @description Property key extracting the X value, overriding the root chart X field.
     * @default undefined
     */
    public readonly xField = input<string | undefined>(undefined);

    public constructor() {
        effect(() => {
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
            this.visible();
            this.xField();
            this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        const unregister = this.#chartContext.registerSeries({
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
            type: "area",
            visible: this.visible,
            xField: this.xField
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
