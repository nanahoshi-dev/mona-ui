import { Component, DestroyRef, effect, ElementRef, inject, input, OnInit } from "@angular/core";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";

let nextSeriesId = 0;

@Component({
    selector: "mona-bar-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true"
    }
})
export class MonaBarSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-bar-series-${++nextSeriesId}`;

    /**
     * @description Corner radius in pixels for the bar caps.
     * @default 4
     */
    public readonly borderRadius = input(4);

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
    public readonly field = input("");

    /**
     * @description Fill opacity applied to the bars.
     * @default 1
     */
    public readonly fillOpacity = input(1);

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
    public readonly visible = input(true);

    /**
     * @description Property key extracting the X/category value, overriding the root chart X field.
     * @default undefined
     */
    public readonly xField = input<string | undefined>(undefined);

    public constructor() {
        effect(() => {
            this.borderRadius();
            this.color();
            this.data();
            this.field();
            this.fillOpacity();
            this.maxBarWidth();
            this.name();
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
            borderRadius: this.borderRadius,
            color: this.color,
            data: this.data,
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            id: this.#id,
            maxBarWidth: this.maxBarWidth,
            name: this.name,
            type: "bar",
            visible: this.visible,
            xField: this.xField
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
