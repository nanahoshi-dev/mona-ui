import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartLegendItem } from "../../models/chart-series.models";
import {
    chartLegendBaseThemeVariants,
    chartLegendItemBaseThemeVariants
} from "../../styles/chart.styles";

@Component({
    selector: "mona-chart-legend",
    templateUrl: "./chart-legend.component.html",
    imports: [NgTemplateOutlet],
    host: {
        "[class]": "hostClasses()",
        "[style.order]": "hostOrder()"
    }
})
export class MonaChartLegendComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);

    protected readonly containerClasses = computed(() =>
        twMerge(chartLegendBaseThemeVariants({ position: this.position() }), this.userClass())
    );
    protected readonly hostClasses = computed(() => {
        const pos = this.position();
        if (pos === "top" || pos === "bottom") return "block w-full flex-shrink-0";
        if (pos === "left" || pos === "right") return "flex flex-col justify-center flex-shrink-0";
        return "block w-full flex-shrink-0";
    });
    protected readonly hostOrder = computed(() => {
        const pos = this.position();
        return pos === "top" || pos === "left" ? 0 : 1;
    });
    protected readonly itemTemplate = contentChild(ChartLegendItemTemplateDirective);
    protected readonly legendItems = computed(() => this.#chartContext?.legendItems() ?? []);

    /**
     * @description Whether clicking or pressing Enter/Space on legend items toggles series visibility.
     * @default true
     */
    public readonly interactive = input(true);

    /**
     * @description Layout position of the legend (`"top"`, `"bottom"`, `"left"`, or `"right"`).
     * @default "bottom"
     */
    public readonly position = input<"bottom" | "left" | "right" | "top">("bottom");

    /**
     * @description Additional CSS classes applied to the legend container.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        effect(() => {
            this.interactive();
            this.position();
            this.#chartContext?.invalidate(ChartInvalidationReason.Layout);
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        const unregister = this.#chartContext.registerLegend({
            interactive: this.interactive,
            itemTemplate: this.itemTemplate,
            position: this.position
        });

        this.#destroyRef.onDestroy(unregister);
    }

    protected itemClasses(item: ChartLegendItem): string {
        return chartLegendItemBaseThemeVariants({
            interactive: this.interactive(),
            visible: item.visible
        });
    }

    protected onItemClick(item: ChartLegendItem): void {
        if (!this.interactive() || !this.#chartContext) {
            return;
        }
        this.#chartContext.toggleLegendItem(item);
    }
}
