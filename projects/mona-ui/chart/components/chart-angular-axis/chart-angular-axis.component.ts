import { Component, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartAxisFormatter } from "../../models/chart-axis.models";

@Component({
    selector: "mona-chart-angular-axis",
    template: "",
    host: {
        "[class]": "userClass()",
        "aria-hidden": "true",
        style: "display: none !important;"
    }
})
export class ChartAngularAxisComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);

    protected readonly labelTemplate = contentChild(ChartAxisLabelTemplateDirective);

    /**
     * @description Whether the outer circular or polygonal baseline axis boundary line is rendered.
     * @default true
     */
    public readonly axisLine = input(true);

    /**
     * @description Custom formatter function for angular tick and spoke labels.
     * @default undefined
     */
    public readonly formatter = input<ChartAxisFormatter | undefined>(undefined);

    /**
     * @description Whether radial angular spokes connecting the pole to outer categories/ticks are visible.
     * @default true
     */
    public readonly gridLines = input(true);

    /**
     * @description Radial offset in pixels between the outer chart boundary and the angular labels.
     * @default 10
     */
    public readonly labelOffset = input(10);

    /**
     * @description Whether angular category or degree labels are rendered.
     * @default true
     */
    public readonly labels = input(true);

    /**
     * @description Angular rotation offset in degrees applied clockwise to all spoke positions.
     * @default 0
     */
    public readonly rotation = input(0);

    /**
     * @description Suggested number of degree ticks for polar charts (defaults to 12). Radar tick count is derived from categories.
     * @default undefined
     */
    public readonly tickCount = input<number | undefined>(undefined);

    /**
     * @description Additional CSS classes applied to the axis host element.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Whether the angular axis, spokes, and labels are visible.
     * @default true
     */
    public readonly visible = input(true);

    #registered = false;

    public constructor() {
        effect(() => {
            this.axisLine();
            this.formatter();
            this.gridLines();
            this.labelOffset();
            this.labels();
            this.rotation();
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

        const unregister = this.#chartContext.registerAngularAxis({
            axisLine: this.axisLine,
            formatter: this.formatter,
            gridLines: this.gridLines,
            labelOffset: this.labelOffset,
            labels: this.labels,
            labelTemplate: this.labelTemplate,
            rotation: this.rotation,
            tickCount: this.tickCount,
            userClass: this.userClass,
            visible: this.visible
        });

        this.#registered = true;
        this.#destroyRef.onDestroy(unregister);
    }
}
