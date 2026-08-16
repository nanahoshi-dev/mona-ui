import { NgTemplateOutlet } from "@angular/common";
import { Component, computed, contentChild, DestroyRef, effect, inject, input, OnInit } from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ChartTooltipTemplateDirective } from "../../directives/chart-tooltip-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import { chartTooltipBaseThemeVariants } from "../../styles/chart.styles";

@Component({
    selector: "mona-chart-tooltip",
    templateUrl: "./chart-tooltip.component.html",
    imports: [NgTemplateOutlet],
    host: {
        class: "contents"
    }
})
export class MonaChartTooltipComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);

    protected readonly customTemplate = contentChild(ChartTooltipTemplateDirective);
    protected readonly tooltipClasses = computed(() =>
        twMerge(chartTooltipBaseThemeVariants(), this.userClass())
    );
    protected readonly tooltipContext = computed(() => this.#chartContext?.tooltipContext() ?? null);
    protected readonly tooltipPosition = computed(() => this.#chartContext?.tooltipPosition() ?? null);

    /**
     * @description Whether the tooltip is enabled and will appear during interaction.
     * @default true
     */
    public readonly enabled = input(true);

    /**
     * @description In shared mode, displays values for all visible series matching the active X coordinate.
     * @default false
     */
    public readonly shared = input(false);

    /**
     * @description Additional CSS classes applied to the tooltip popup container.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public constructor() {
        effect(() => {
            this.enabled();
            this.shared();
            this.#chartContext?.invalidate(ChartInvalidationReason.Interaction);
        });
    }

    public ngOnInit(): void {
        if (!this.#chartContext) {
            return;
        }

        const unregister = this.#chartContext.registerTooltip({
            enabled: this.enabled,
            shared: this.shared,
            template: this.customTemplate
        });

        this.#destroyRef.onDestroy(unregister);
    }
}
