import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import type { ChartBarOrientation } from "../../models/chart-bar.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-range-bar-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class RangeBarSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-range-bar-series-${++nextSeriesId}`;

    /**
     * @description Corner radius in pixels for the floating bar caps.
     * @default undefined
     */
    public readonly borderRadius = input<number | undefined>(undefined);

    /**
     * @description Explicit fill color override for the range bars.
     * @default ""
     */
    public readonly color = input("");

    /**
     * @description Series-specific dataset overriding the root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Fill opacity applied to the range bars.
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the starting range value for each bar.
     */
    public readonly fromField = input.required<ChartField>();

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Maximum width in pixels for each individual range bar.
     * @default undefined
     */
    public readonly maxBarWidth = input<number | undefined>(undefined);

    /**
     * @description Name of the series displayed in legends, tooltips, and live region announcements.
     * @default "Range Bar"
     */
    public readonly name = input("Range Bar");

    /**
     * @description Orientation of the range bars ('vertical' for vertical spans, 'horizontal' for horizontal intervals).
     * @default "vertical"
     */
    public readonly orientation = input<ChartBarOrientation>("vertical");

    /**
     * @description Property key or accessor extracting the ending range value for each bar.
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
     * @description Optional ID of the Cartesian X axis this series binds to. When omitted, the primary X axis is used.
     * @default undefined
     */
    public readonly xAxisId = input<string | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the X/category value, overriding the root chart X field.
     * @default undefined
     */
    public readonly xField = input<ChartField | undefined>(undefined);

    /**
     * @description Optional ID of the Cartesian Y axis this series binds to. When omitted, the primary Y axis is used.
     * @default undefined
     */
    public readonly yAxisId = input<string | undefined>(undefined);

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
            this.keyField();
            this.orientation();
            this.toField();
            this.xField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.borderRadius();
            this.maxBarWidth();
            this.name();
            this.valueFormatter();
            this.xAxisId();
            this.yAxisId();
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
            borderRadius: this.borderRadius,
            color: this.color,
            data: this.data,
            element: this.#elementRef,
            fillOpacity: this.fillOpacity,
            fromField: this.fromField,
            id: this.#id,
            keyField: this.keyField,
            maxBarWidth: this.maxBarWidth,
            name: this.name,
            orientation: this.orientation,
            toField: this.toField,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "rangeBar",
            userClass: this.userClass,
            valueFormatter: this.valueFormatter,
            visible: this.visible,
            xAxisId: this.xAxisId,
            xField: this.xField,
            yAxisId: this.yAxisId
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
