import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartAreaFillMode, ChartCurve } from "../../models/chart-series.models";
import type { ChartField } from "../../models/chart.models";
import type { ChartStackMode } from "../../models/chart-stack.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-area-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
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
    public readonly field = input<ChartField>("");

    /**
     * @description Area fill style (`"gradient"` fading to zero baseline, or uniform `"solid"`).
     * @default "gradient"
     */
    public readonly fillMode = input<ChartAreaFillMode>("gradient");

    /**
     * @description Maximum opacity applied to the area fill.
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

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
     * @description Whether to draw point markers at each data coordinate along the top boundary line.
     * @default false
     */
    public readonly showPoints = input(false);

    /**
     * @description Named stack group to participate in. Series with matching trimmed stack names stack together.
     * @default undefined
     */
    public readonly stack = input<string | undefined>(undefined);

    /**
     * @description Stacking mode used when stack is specified: 'normal' for raw cumulative values, or 'percent' for 100% normalized segments.
     * @default "normal"
     */
    public readonly stackMode = input<ChartStackMode>("normal");

    /**
     * @description Stroke width in pixels for the area boundary line.
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
            this.field();
            this.keyField();
            this.stack();
            this.stackMode();
            this.xField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.connectNulls();
            this.curve();
            this.fillOpacity();
            this.name();
            this.pointRadius();
            this.showPoints();
            this.strokeWidth();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
            this.fillMode();
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
            field: this.field,
            fillMode: this.fillMode,
            fillOpacity: this.fillOpacity,
            id: this.#id,
            keyField: this.keyField,
            name: this.name,
            pointRadius: this.pointRadius,
            showPoints: this.showPoints,
            stack: this.stack,
            stackMode: this.stackMode,
            strokeWidth: this.strokeWidth,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "area",
            userClass: this.userClass,
            visible: this.visible,
            xField: this.xField
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
