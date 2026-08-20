import { Component, contentChild, DestroyRef, effect, ElementRef, inject, input, model, OnInit } from "@angular/core";
import { ChartDataLabelTemplateDirective } from "../../directives/chart-data-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartDataLabelsInput } from "../../models/chart-data-label.models";
import type { ChartField, ChartValueFormatter } from "../../models/chart.models";
import type { ChartBarOrientation } from "../../models/chart-bar.models";
import type { ChartStackMode } from "../../models/chart-stack.models";

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
export class BarSeriesComponent implements OnInit {
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
     * @description Data label display options or boolean flag enabling default labels.
     * @default false
     */
    public readonly dataLabels = input<ChartDataLabelsInput>(false);

    public readonly dataLabelTemplate = contentChild(ChartDataLabelTemplateDirective);

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
     * @description Orientation of the bars ('vertical' for column bars, 'horizontal' for row bars).
     * @default "vertical"
     */
    public readonly orientation = input<ChartBarOrientation>("vertical");

    /**
     * @description Optional stable key identifying this series for mark identity and selection across updates.
     * @default undefined
     */
    public readonly seriesKey = input<string | undefined>(undefined);

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
     * @description Additional CSS classes applied to the series host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Custom formatter for raw Y/data values in tooltips and live region announcements.
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
        let initialVisible = true;
        effect(() => {
            this.visible();
            if (initialVisible) {
                initialVisible = false;
                return;
            }
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Visibility);
            }
        });

        let initialData = true;
        effect(() => {
            this.data();
            this.field();
            this.keyField();
            this.orientation();
            this.seriesKey();
            this.stack();
            this.stackMode();
            this.xField();
            if (initialData) {
                initialData = false;
                return;
            }
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Data);
            }
        });

        let initialLayout = true;
        effect(() => {
            this.borderRadius();
            this.fillOpacity();
            this.maxBarWidth();
            this.name();
            this.valueFormatter();
            this.xAxisId();
            this.yAxisId();
            if (initialLayout) {
                initialLayout = false;
                return;
            }
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });

        effect(() => {
            this.color();
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
            borderRadius: this.borderRadius,
            color: this.color,
            data: this.data,
            dataLabels: this.dataLabels,
            dataLabelTemplate: this.dataLabelTemplate,
            element: this.#elementRef,
            field: this.field,
            fillOpacity: this.fillOpacity,
            id: this.#id,
            keyField: this.keyField,
            maxBarWidth: this.maxBarWidth,
            name: this.name,
            orientation: this.orientation,
            seriesKey: this.seriesKey,
            stack: this.stack,
            stackMode: this.stackMode,
            toggleVisibility: () => {
                const next = !this.visible();
                this.visible.set(next);
                return next;
            },
            type: "bar",
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
