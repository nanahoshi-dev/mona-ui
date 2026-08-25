import { NgTemplateOutlet } from "@angular/common";
import {
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    OnInit,
    signal,
    viewChild
} from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ChartTooltipTemplateDirective } from "../../directives/chart-tooltip-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";
import { chartTooltipBaseThemeVariants } from "../../styles/chart.styles";

export interface ChartTooltipPlacement {
    readonly left: number;
    readonly placement: "bottom" | "top";
    readonly top: number;
}

@Component({
    selector: "mona-chart-tooltip",
    templateUrl: "./chart-tooltip.component.html",
    imports: [NgTemplateOutlet],
    host: {
        class: "contents"
    }
})
export class ChartTooltipComponent implements OnInit {
    readonly #chartContext = inject(CHART_CONTEXT, { optional: true });
    readonly #destroyRef = inject(DestroyRef);
    readonly #measuredHeight = signal<number>(60);
    readonly #measuredWidth = signal<number>(180);
    #tooltipResizeObserver: ResizeObserver | null = null;

    protected readonly customTemplate = contentChild(ChartTooltipTemplateDirective);
    protected readonly placement = computed<ChartTooltipPlacement>(() => {
        const pos = this.tooltipPosition();
        if (!pos) {
            return { left: 0, placement: "top", top: 0 };
        }

        const scene = this.#chartContext?.scene();
        const containerWidth = scene?.width ?? 500;
        const containerHeight = scene?.height ?? 300;
        const tipWidth = this.#measuredWidth();
        const tipHeight = this.#measuredHeight();

        // Horizontal: center over anchor and clamp within container
        const margin = 8;
        const rawLeft = pos.x - tipWidth / 2;
        const maxLeft = Math.max(margin, containerWidth - tipWidth - margin);
        const left = Math.max(margin, Math.min(maxLeft, rawLeft));

        // Vertical: check space above vs below
        const gap = 10;
        const spaceAbove = pos.y - gap;
        const placeTop = spaceAbove >= tipHeight;

        let top: number;
        let placementDirection: "bottom" | "top";

        if (placeTop) {
            top = pos.y - tipHeight - gap;
            placementDirection = "top";
        } else {
            top = pos.y + 16;
            placementDirection = "bottom";
        }

        const maxTop = Math.max(margin, containerHeight - tipHeight - margin);
        const clampTop = Math.max(margin, Math.min(maxTop, top));

        return {
            left,
            placement: placementDirection,
            top: clampTop
        };
    });
    protected readonly tooltipClasses = computed(() => twMerge(chartTooltipBaseThemeVariants(), this.userClass()));
    protected readonly tooltipContainer = viewChild<ElementRef<HTMLElement>>("tooltipContainer");
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

        effect(onCleanup => {
            const containerRef = this.tooltipContainer();
            this.tooltipContext();

            if (containerRef) {
                const el = containerRef.nativeElement;
                const updateDimensions = (target: HTMLElement, inlineSize?: number, blockSize?: number) => {
                    const width = inlineSize ?? target.offsetWidth ?? target.getBoundingClientRect().width;
                    const height = blockSize ?? target.offsetHeight ?? target.getBoundingClientRect().height;
                    if (width > 0 && height > 0) {
                        if (Math.abs(this.#measuredWidth() - width) > 0.5) {
                            this.#measuredWidth.set(width);
                        }
                        if (Math.abs(this.#measuredHeight() - height) > 0.5) {
                            this.#measuredHeight.set(height);
                        }
                    }
                };

                if (!this.#tooltipResizeObserver && typeof ResizeObserver !== "undefined") {
                    this.#tooltipResizeObserver = new ResizeObserver(entries => {
                        for (const entry of entries) {
                            const target = entry.target as HTMLElement;
                            const boxSize = entry.borderBoxSize?.[0];
                            updateDimensions(target, boxSize?.inlineSize, boxSize?.blockSize);
                        }
                    });
                }

                this.#tooltipResizeObserver?.observe(el);
                updateDimensions(el);

                onCleanup(() => {
                    this.#tooltipResizeObserver?.unobserve(el);
                });
            }
        });

        this.#destroyRef.onDestroy(() => {
            if (this.#tooltipResizeObserver) {
                this.#tooltipResizeObserver.disconnect();
                this.#tooltipResizeObserver = null;
            }
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
