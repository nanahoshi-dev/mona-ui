import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { twMerge } from "tailwind-merge";
import { ChartLegendItemTemplateDirective } from "../../directives/chart-legend-item-template.directive";
import { CHART_DEFAULT_MESSAGES } from "../../i18n/chart.default-messages";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import type { ChartColorLegendScale, ChartLegendMode } from "../../models/chart-heatmap.models";
import type { ChartLegendItem, ChartLegendPosition } from "../../models/chart-series.models";
import { chartLegendBaseThemeVariants, chartLegendItemBaseThemeVariants } from "../../styles/chart.styles";
import { resolveLegendPlacement } from "../../internal/utils/chart-direction";

@Component({
    selector: "mona-chart-legend",
    templateUrl: "./chart-legend.component.html",
    imports: [NgTemplateOutlet],
    host: {
        "[class]": "hostClasses()",
        "[style.order]": "hostOrder()"
    }
})
export class ChartLegendComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #i18n = inject(MonaI18nService);
    protected readonly containerClasses = computed(() =>
        twMerge(chartLegendBaseThemeVariants({ position: this.placement() }), this.userClass())
    );
    protected readonly gradientCss = computed(() => {
        const scale = this.legendScale();
        if (!scale || !scale.stops || scale.stops.length === 0) return "";
        const dir = this.isVertical() ? "to top" : this.#direction() === "rtl" ? "to left" : "to right";
        const stopStrs = scale.stops.map(s => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ");
        return `linear-gradient(${dir}, ${stopStrs})`;
    });
    protected readonly hostClasses = computed(() =>
        this.isVertical() ? "flex flex-col justify-center flex-shrink-0" : "block w-full flex-shrink-0"
    );
    protected readonly hostOrder = computed(() => {
        const placement = this.placement();
        return placement === "top" || placement === "start" ? 0 : 1;
    });
    protected readonly isColorScaleMode = computed(() => {
        const m = this.mode();
        if (m === "color") return true;
        if (m === "series") return false;
        return Boolean(this.legendScale());
    });
    protected readonly isVertical = computed(() => {
        const placement = this.placement();
        return placement === "start" || placement === "end";
    });
    protected readonly itemTemplate = contentChild(ChartLegendItemTemplateDirective);
    protected readonly legendAriaLabel = computed(() => {
        const scale = this.legendScale();
        const msgs = this.messages();
        if (!scale) return msgs.chartLegend;
        const title = scale.title || msgs.colorScale;
        if (scale.mode === "diverging" && scale.formattedMidpoint) {
            return msgs.divergingRangeDescription(
                title,
                scale.formattedMin,
                scale.formattedMidpoint,
                scale.formattedMax
            );
        }
        return msgs.rangeDescription(title, scale.formattedMin, scale.formattedMax);
    });
    protected readonly legendItems = computed(() => this.#chartContext?.legendItems() ?? []);
    protected readonly legendScale = computed<ChartColorLegendScale | null>(
        () => this.#chartContext?.legendScale?.() ?? null
    );
    protected readonly messages = this.#i18n.componentMessages("chart", CHART_DEFAULT_MESSAGES);
    protected readonly placement = computed(() => resolveLegendPlacement(this.position(), this.#direction()));
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
     * @description Layout position of the legend (`"top"`, `"bottom"`, `"start"`, `"end"`, `"left"`, or `"right"`). `start` and `end` follow the direction; `left` and `right` stay on that side.
     * @default "bottom"
     */
    public readonly position = input<ChartLegendPosition>("bottom");

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
