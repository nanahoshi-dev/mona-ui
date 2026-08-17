import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartCurve } from "../../models/chart-series.models";
import type { ChartField } from "../../models/chart.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-line-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class MonaLineSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-line-series-${++nextSeriesId}`;

    /**
     * @description Explicit stroke color override for the series line.
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
    public readonly field = input<ChartField>("");

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Name of the series displayed in legends and tooltips.
     * @default ""
     */
    public readonly name = input("");

    /**
     * @description Radius in pixels for point markers.
     * @default undefined
     */
    public readonly pointRadius = input<number | undefined>(undefined);

    /**
     * @description Whether to draw point markers at each data coordinate along the line.
     * @default false
     */
    public readonly showPoints = input(false);

    /**
     * @description Stroke width in pixels for the series line.
     * @default undefined
     */
    public readonly strokeWidth = input<number | undefined>(undefined);

    /**
     * @description Additional CSS classes applied to the series host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Whether the series is currently visible on the chart and in calculations.
     * @default true
     */
    public readonly visible = model(true);

    /**
     * @description Property key or accessor extracting the X value, overriding the root chart X field.
     * @default undefined
     */
    public readonly xField = input<ChartField | undefined>(undefined);

    public constructor() {
        effect(() => {
            this.visible();
            this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
        });

        effect(() => {
            this.data();
            this.field();
            this.keyField();
            this.xField();
            this.#chartContext?.invalidate(ChartInvalidationReason.Data);
        });

        effect(() => {
            this.connectNulls();
            this.curve();
            this.name();
            this.pointRadius();
            this.showPoints();
            this.strokeWidth();
            this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
        });

        effect(() => {
            this.color();
            this.userClass();
            this.#chartContext?.invalidate(ChartInvalidationReason.Style);
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
            id: this.#id,
            keyField: this.keyField,
            name: this.name,
            pointRadius: this.pointRadius,
            showPoints: this.showPoints,
            strokeWidth: this.strokeWidth,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "line",
            userClass: this.userClass,
            visible: this.visible,
            xField: this.xField
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
