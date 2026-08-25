import { Component, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";
import type { ChartRadialGridShape } from "../../models/chart-polar.models";

@Component({
    selector: "mona-chart-radial-axis",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartRadialAxisComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);

    protected readonly labelTemplate = contentChild(ChartAxisLabelTemplateDirective);

    /**
     * @description Whether the pole-to-boundary axis line along the label angle is rendered.
     * @default true
     */
    public readonly axisLine = input(true);

    /**
     * @description Custom formatter function for radial tick labels.
     * @default undefined
     */
    public readonly formatter = input<ChartAxisFormatter | undefined>(undefined);

    /**
     * @description Whether concentric radial grid rings or polygons are visible.
     * @default true
     */
    public readonly gridLines = input(true);

    /**
     * @description Geometry of radial grid lines (`"auto"`, `"circle"`, or `"polygon"`).
     * @default "auto"
     */
    public readonly gridShape = input<ChartRadialGridShape>("auto");

    /**
     * @description Angle in degrees at which radial tick labels are positioned (0 = 12 o'clock).
     * @default 0
     */
    public readonly labelAngle = input(0);

    /**
     * @description Pixel offset between radial tick markers and their labels.
     * @default 6
     */
    public readonly labelOffset = input(6);

    /**
     * @description Whether radial tick numeric labels are rendered.
     * @default true
     */
    public readonly labels = input(true);

    /**
     * @description Explicit upper bound for the radial scale range.
     * @default undefined
     */
    public readonly max = input<number | undefined>(undefined);

    /**
     * @description Explicit lower bound for the radial scale range.
     * @default undefined
     */
    public readonly min = input<number | undefined>(undefined);

    /**
     * @description Automatically extends the radial domain to round, pleasant intervals.
     * @default true
     */
    public readonly nice = input(true);

    /**
     * @description Suggested number of concentric radial intervals.
     * @default 5
     */
    public readonly tickCount = input<number | undefined>(5);

    /**
     * @description Additional CSS classes applied to the axis host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Whether the radial axis, grid rings, and tick labels are visible.
     * @default true
     */
    public readonly visible = input(true);

    #registered = false;

    public constructor() {
        effect(() => {
            this.axisLine();
            this.formatter();
            this.gridLines();
            this.gridShape();
            this.labelAngle();
            this.labelOffset();
            this.labels();
            this.max();
            this.min();
            this.nice();
            this.tickCount();
            this.userClass();
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

        const unregister = this.#chartContext.registerRadialAxis({
            axisLine: this.axisLine,
            formatter: this.formatter,
            gridLines: this.gridLines,
            gridShape: this.gridShape,
            labelAngle: this.labelAngle,
            labelOffset: this.labelOffset,
            labels: this.labels,
            labelTemplate: this.labelTemplate,
            max: this.max,
            min: this.min,
            nice: this.nice,
            tickCount: this.tickCount,
            userClass: this.userClass,
            visible: this.visible
        });

        this.#registered = true;
        this.#destroyRef.onDestroy(unregister);
    }
}
