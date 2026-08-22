import { Component, contentChild, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartDataLabelsInput } from "../../models/chart-data-label.models";
import type { ChartDownsamplingInput } from "../../models/chart-downsampling.models";
import type { ChartField, ChartValueFormatter } from "../../models/chart.models";

let nextSeriesId = 0;

@Component({
    selector: "mona-bubble-series",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class BubbleSeriesComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #id = `mona-bubble-series-${++nextSeriesId}`;

    /**
     * @description Explicit fill color for the bubbles.
     * @default ""
     */
    public readonly color = input("");

    /**
     * @description Series-specific dataset overriding the root chart data.
     * @default undefined
     */
    public readonly data = input<readonly unknown[] | undefined>(undefined);

    /**
     * @description Data label display options or boolean flag enabling default labels.
     * @default false
     */
    public readonly dataLabels = input<ChartDataLabelsInput>(false);

    public readonly dataLabelTemplate = contentChild(ChartDataLabelTemplateDirective);

    /**
     * @description Per-series high-density downsampling override. Undefined inherits the chart policy.
     * @default undefined
     */
    public readonly downsampling = input<ChartDownsamplingInput | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the Y value for each data item.
     * @default "value"
     */
    public readonly field = input<ChartField>("value");

    /**
     * @description Fill opacity for bubbles between 0 and 1.
     * @default undefined
     */
    public readonly fillOpacity = input<number | undefined>(undefined);

    /**
     * @description Property key or accessor extracting a stable datum identity across updates.
     * @default undefined
     */
    public readonly keyField = input<ChartField | undefined>(undefined);

    /**
     * @description Maximum rendered pixel radius for the largest data size value.
     * @default 24
     */
    public readonly maxRadius = input(24);

    /**
     * @description Minimum rendered pixel radius for the smallest data size value.
     * @default 4
     */
    public readonly minRadius = input(4);

    /**
     * @description Name of the series displayed in legends and tooltips.
     * @default "Bubble"
     */
    public readonly name = input("Bubble");

    /**
     * @description Optional stable key identifying this series for mark identity and selection across updates.
     * @default undefined
     */
    public readonly seriesKey = input<string | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the size magnitude for each bubble.
     * @default "size"
     */
    public readonly sizeField = input<ChartField>("size");

    /**
     * @description Optional custom formatter for displaying bubble size values in tooltips.
     * @default undefined
     */
    public readonly sizeFormatter = input<ChartValueFormatter | undefined>(undefined);

    /**
     * @description Stroke outline color for bubble markers.
     * @default ""
     */
    public readonly strokeColor = input("");

    /**
     * @description Stroke width in pixels for bubble marker outlines.
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
     * @description Optional ID of the Cartesian X axis this series binds to. When omitted, the primary X axis is used.
     * @default undefined
     */
    public readonly xAxisId = input<string | undefined>(undefined);

    /**
     * @description Property key or accessor extracting the X value, overriding the root chart X field.
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
            this.downsampling();
            this.field();
            this.keyField();
            this.seriesKey();
            this.sizeField();
            this.xField();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        effect(() => {
            this.maxRadius();
            this.minRadius();
            this.name();
            this.sizeFormatter();
            this.xAxisId();
            this.yAxisId();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
            this.fillOpacity();
            this.strokeColor();
            this.strokeWidth();
            this.userClass();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Style);
            }
        });

        effect(() => {
            this.dataLabels();
            this.dataLabelTemplate();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Interaction);
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
            data: this.data,
            dataLabels: this.dataLabels,
            dataLabelTemplate: this.dataLabelTemplate,
            downsampling: this.downsampling,
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            id: this.#id,
            keyField: this.keyField,
            maxRadius: this.maxRadius,
            minRadius: this.minRadius,
            name: this.name,
            seriesKey: this.seriesKey,
            sizeField: this.sizeField,
            sizeFormatter: this.sizeFormatter,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "bubble",
            userClass: this.userClass,
            visible: this.visible,
            xAxisId: this.xAxisId,
            xField: this.xField,
            yAxisId: this.yAxisId
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
