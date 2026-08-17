import { Component, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartField } from "../../models/chart.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-bar-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class MonaBarSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-bar-series-${++nextSeriesId}`;

    /**
     * @description Corner radius in pixels for the bar caps.
     * @default undefined
     */
    public readonly borderRadius = input<number | undefined>(undefined);

    /**
     * @description Explicit fill color override for the series bars.
     * @default ""
     */
    public readonly color = input("");

    /**
     * @description Series-specific dataset overriding the root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the Y/value for each bar.
     * @default ""
     */
    public readonly field = input<ChartField>("");

    /**
     * @description Fill opacity applied to the bars.
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Maximum width in pixels for each individual bar.
     * @default undefined
     */
    public readonly maxBarWidth = input<number | undefined>(undefined);

    /**
     * @description Name of the series displayed in legends and tooltips.
     * @default ""
     */
    public readonly name = input("");

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
     * @description Property key or accessor extracting the X/category value, overriding the root chart X field.
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
            this.borderRadius();
            this.fillOpacity();
            this.maxBarWidth();
            this.name();
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
            borderRadius: this.borderRadius,
            color: this.color,
            data: this.data,
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            id: this.#id,
            keyField: this.keyField,
            maxBarWidth: this.maxBarWidth,
            name: this.name,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "bar",
            userClass: this.userClass,
            visible: this.visible,
            xField: this.xField
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
