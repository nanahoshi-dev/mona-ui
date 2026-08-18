import { Component, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartAxisFormatter, ChartXAxisPosition, ChartXAxisType } from "../../models/chart-axis.models";

@Component({
    selector: "mona-chart-x-axis",
    template: "",
    host: {
        class: "hidden",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class MonaChartXAxisComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);

    protected readonly labelTemplate = contentChild(ChartAxisLabelTemplateDirective);

    /**
     * @description Whether the solid baseline axis border line is rendered.
     * @default true
     */
    public readonly axisLine = input(true);

    /**
     * @description Custom formatter function for axis tick labels.
     * @default undefined
     */
    public readonly formatter = input<ChartAxisFormatter | undefined>(undefined);

    /**
     * @description Whether vertical grid lines aligned with X-axis ticks are visible.
     * @default false
     */
    public readonly gridLines = input(false);

    /**
     * @description Explicit upper bound for the axis range.
     * @default undefined
     */
    public readonly max = input<number | Date | undefined>(undefined);

    /**
     * @description Explicit lower bound for the axis range.
     * @default undefined
     */
    public readonly min = input<number | Date | undefined>(undefined);

    /**
     * @description Automatically extends the axis domain to round, pleasant values.
     * @default true
     */
    public readonly nice = input(true);

    /**
     * @description Position of the X axis relative to the plot area.
     * @default "bottom"
     */
    public readonly position = input<ChartXAxisPosition>("bottom");

    /**
     * @description Suggested number of ticks to display along the axis.
     * @default undefined
     */
    public readonly tickCount = input<number | undefined>(undefined);

    /**
     * @description Title text rendered alongside the axis.
     * @default ""
     */
    public readonly title = input("");

    /**
     * @description Scale type for the X axis (`"auto"`, `"category"`, `"linear"`, `"time"`, or `"utc"`).
     * @default "auto"
     */
    public readonly type = input<ChartXAxisType>("auto");

    /**
     * @description Whether the axis and its labels are visible.
     * @default true
     */
    public readonly visible = input(true);

    #registered = false;

    public constructor() {
        effect(() => {
            this.axisLine();
            this.formatter();
            this.gridLines();
            this.max();
            this.min();
            this.nice();
            this.position();
            this.tickCount();
            this.title();
            this.type();
            this.visible();
            if (this.#registered) {
                this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
            }
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        const unregister = this.#chartContext.registerXAxis({
            axisLine: this.axisLine,
            formatter: this.formatter,
            gridLines: this.gridLines,
            labelTemplate: this.labelTemplate,
            max: this.max,
            min: this.min,
            nice: this.nice,
            position: this.position,
            tickCount: this.tickCount,
            title: this.title,
            type: this.type,
            visible: this.visible
        });

        this.#registered = true;
        this.#destroyRef.onDestroy(unregister);
    }
}
