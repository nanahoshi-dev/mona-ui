import { Component, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type {
    ChartAxisFormatter,
    ChartAxisLabelRotation,
    ChartYAxisPosition,
    ChartYAxisType
} from "../../models/chart-axis.models";

@Component({
    selector: "mona-chart-y-axis",
    template: "",
    host: {
        class: "hidden",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartYAxisComponent implements OnInit {
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
     * @description Whether horizontal grid lines aligned with Y-axis ticks are visible. Defaults to true in standard Cartesian and false for horizontal value axes.
     * @default undefined
     */
    public readonly gridLines = input<boolean | undefined>(undefined);

    /**
     * @description Maximum unrotated width in pixels for tick labels before truncation.
     * @default undefined
     */
    public readonly labelMaxWidth = input<number | undefined>(undefined);

    /**
     * @description Spacing in pixels between the axis baseline / tick marks and tick labels.
     * @default undefined
     */
    public readonly labelPadding = input<number | undefined>(undefined);

    /**
     * @description Explicit rotation angle in degrees for tick labels (-90 to 90), or 'auto' for responsive automatic angling.
     * @default 0
     */
    public readonly labelRotation = input<ChartAxisLabelRotation>(0);

    /**
     * @description Whether the axis tick labels are rendered in the DOM.
     * @default true
     */
    public readonly labels = input(true);

    /**
     * @description Explicit upper bound for the numeric value range.
     * @default undefined
     */
    public readonly max = input<number | undefined>(undefined);

    /**
     * @description Explicit lower bound for the numeric value range.
     * @default undefined
     */
    public readonly min = input<number | undefined>(undefined);

    /**
     * @description Automatically extends the axis domain to round, pleasant values.
     * @default true
     */
    public readonly nice = input(true);

    /**
     * @description Position of the Y axis relative to the plot area.
     * @default "left"
     */
    public readonly position = input<ChartYAxisPosition>("left");

    /**
     * @description Suggested number of ticks to display along the axis (acts as preferred label count for category axes).
     * @default undefined
     */
    public readonly tickCount = input<number | undefined>(undefined);

    /**
     * @description Whether tick mark lines extending outward from the baseline are drawn.
     * @default false
     */
    public readonly tickMarks = input(false);

    /**
     * @description Length in pixels of outward tick mark lines.
     * @default undefined
     */
    public readonly tickSize = input<number | undefined>(undefined);

    /**
     * @description Title text rendered alongside the axis.
     * @default ""
     */
    public readonly title = input("");

    /**
     * @description Spacing in pixels between the outward extent of tick labels and the axis title.
     * @default undefined
     */
    public readonly titlePadding = input<number | undefined>(undefined);

    /**
     * @description Scale type for the Y axis (`"auto"`, `"category"`, or `"linear"`).
     * @default "auto"
     */
    public readonly type = input<ChartYAxisType>("auto");

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
            this.labelMaxWidth();
            this.labelPadding();
            this.labelRotation();
            this.labels();
            this.max();
            this.min();
            this.nice();
            this.position();
            this.tickCount();
            this.tickMarks();
            this.tickSize();
            this.title();
            this.titlePadding();
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

        const unregister = this.#chartContext.registerYAxis({
            axisLine: this.axisLine,
            formatter: this.formatter,
            gridLines: this.gridLines,
            labelMaxWidth: this.labelMaxWidth,
            labelPadding: this.labelPadding,
            labelRotation: this.labelRotation,
            labels: this.labels,
            labelTemplate: this.labelTemplate,
            max: this.max,
            min: this.min,
            nice: this.nice,
            position: this.position,
            tickCount: this.tickCount,
            tickMarks: this.tickMarks,
            tickSize: this.tickSize,
            title: this.title,
            titlePadding: this.titlePadding,
            type: this.type,
            visible: this.visible
        });

        this.#registered = true;
        this.#destroyRef.onDestroy(unregister);
    }
}
