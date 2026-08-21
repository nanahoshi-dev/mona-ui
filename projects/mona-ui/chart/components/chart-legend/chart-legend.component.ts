import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartColorLegendScale, ChartLegendMode } from "../../models/chart-heatmap.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import { chartLegendBaseThemeVariants, chartLegendItemBaseThemeVariants } from "../../styles/chart.styles";

@Component({
    selector: "mona-chart-legend",
    templateUrl: "./chart-legend.component.html",
    imports: [NgTemplateOutlet],
    host: {
        "[class]": "hostClasses()",
        "[style.order]": "hostOrder()",
        "[attr.data-mona-chart-export-role]": "'legend'"
    }
})
export class ChartLegendComponent implements OnInit {
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
    protected readonly legendScale = computed<ChartColorLegendScale | null>(
        () => this.#chartContext?.legendScale?.() ?? null
    );

    protected readonly isColorScaleMode = computed(() => {
        const m = this.mode();
        if (m === "color") return true;
        if (m === "series") return false;
        return Boolean(this.legendScale());
    });

    protected readonly gradientCss = computed(() => {
        const scale = this.legendScale();
        if (!scale || !scale.stops || scale.stops.length === 0) return "";
        const isVertical = this.position() === "left" || this.position() === "right";
        const dir = isVertical ? "to top" : "to right";
        const stopStrs = scale.stops.map(s => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ");
        return `linear-gradient(${dir}, ${stopStrs})`;
    });

    protected readonly legendAriaLabel = computed(() => {
        const scale = this.legendScale();
        if (!scale) return "Chart legend";
        const title = scale.title || "Color scale";
        if (scale.mode === "diverging" && scale.formattedMidpoint) {
            return `${title}, ${scale.formattedMin} to ${scale.formattedMidpoint} to ${scale.formattedMax}`;
        }
        return `${title}, ${scale.formattedMin} to ${scale.formattedMax}`;
    });

    /**
     * @description Whether clicking or pressing Enter/Space on legend items toggles series visibility.
     * @default true
     */
    public readonly interactive = input(true);

    /**
     * @description Legend display mode: 'auto' (series items for standard charts, color scale for heatmap), 'series' (always series items), or 'color' (color gradient scale).
     * @default "auto"
     */
    public readonly mode = input<ChartLegendMode>("auto");

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

    protected isItemInteractive(item: ChartLegendItem): boolean {
        return this.interactive() && item.interactive !== false && item.kind !== "semantic";
    }

    protected itemClasses(item: ChartLegendItem): string {
        return chartLegendItemBaseThemeVariants({
            interactive: this.isItemInteractive(item),
            visible: item.visible
        });
    }

    protected onItemClick(item: ChartLegendItem): void {
        if (!this.isItemInteractive(item) || !this.#chartContext) {
            return;
        }
        this.#chartContext.toggleLegendItem(item);
    }
}
