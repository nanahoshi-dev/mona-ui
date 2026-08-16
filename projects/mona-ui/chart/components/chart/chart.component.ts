import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    inject,
    input,
    output,
    signal,
    viewChild,
    type Signal
} from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ChartNoDataTemplateDirective } from "../../directives/chart-no-data-template.directive";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    type ChartAxisRegistration,
    type ChartLegendRegistration,
    type ChartRegistrationContext,
    type ChartSeriesRegistration,
    type ChartTooltipRegistration
} from "../../internal/context/chart-registration-context";
import { ChartHitTestEngine } from "../../internal/interaction/chart-hit-test-engine";
import type { ChartInteractionState } from "../../internal/interaction/chart-interaction-state";
import { ChartLayoutEngine } from "../../internal/layout/chart-layout-engine";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";
import { ChartRenderScheduler } from "../../internal/render/chart-render-scheduler";
import type { ChartScene } from "../../internal/scene/chart-scene";
import type { SceneHitTarget } from "../../internal/scene/scene-geometry";
import { ChartStyleResolver } from "../../internal/style/chart-style-resolver";
import { formatCompactNumber } from "../../internal/utils/number-utils";
import type { ChartPoint } from "../../models/chart.models";
import type {
    ChartPointEvent,
    ChartPointFocusEvent,
    ChartSeriesVisibilityEvent
} from "../../models/chart-event.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartTooltipPointContext,
    ChartTooltipTemplateContext
} from "../../models/chart-tooltip.models";
import {
    chartAxisLabelBaseThemeVariants,
    chartBaseThemeVariants,
    chartNoDataBaseThemeVariants
} from "../../styles/chart.styles";

@Component({
    selector: "mona-chart",
    templateUrl: "./chart.component.html",
    imports: [NgTemplateOutlet],
    providers: [
        {
            provide: CHART_CONTEXT,
            useExisting: MonaChartComponent
        }
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.tabindex]": "0",
        role: "region",
        "[attr.aria-label]": "ariaLabel() || 'Chart'",
        "[attr.aria-description]": "ariaDescription() || null",
        "(keydown)": "onKeyDown($event)"
    }
})
export class MonaChartComponent implements ChartRegistrationContext {
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #legend = signal<ChartLegendRegistration | null>(null);
    readonly #registeredSeries = signal<ChartSeriesRegistration[]>([]);
    readonly #renderScheduler: ChartRenderScheduler;
    readonly #styleResolver: ChartStyleResolver;
    readonly #tooltip = signal<ChartTooltipRegistration | null>(null);
    readonly #xAxis = signal<ChartAxisRegistration | null>(null);
    readonly #yAxis = signal<ChartAxisRegistration | null>(null);

    #activeKeyboardIndex: number = -1;
    #activeKeyboardSeriesIndex: number = 0;
    #canvasContext: CanvasRenderingContext2D | null = null;
    #currentHeight: number = 300;
    #currentWidth: number = 500;
    #interactionState: ChartInteractionState | null = null;
    #resizeObserver: ResizeObserver | null = null;

    protected readonly activeAccessibilityText = signal<string>("");
    protected readonly axisLabelClasses = computed(() => chartAxisLabelBaseThemeVariants());
    protected readonly baseClasses = computed(() =>
        twMerge(chartBaseThemeVariants({ interactive: true }), this.userClass())
    );
    protected readonly canvasElement = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
    protected readonly hasNoData = computed(() => {
        const rootHasData = this.data().length > 0;
        const seriesList = this.#registeredSeries();
        const anySeriesHasData = seriesList.some(s => (s.data()?.length ?? 0) > 0);
        return !rootHasData && !anySeriesHasData;
    });
    protected readonly layoutClasses = computed(() => {
        const pos = this.legendPosition();
        if (pos === "top") return "relative flex flex-col h-full w-full overflow-hidden";
        if (pos === "bottom") return "relative flex flex-col h-full w-full overflow-hidden";
        if (pos === "left") return "relative flex flex-row items-center h-full w-full overflow-hidden";
        if (pos === "right") return "relative flex flex-row items-center h-full w-full overflow-hidden";
        return "relative flex flex-col h-full w-full overflow-hidden";
    });
    protected readonly legendPosition = computed(() => this.#legend()?.position() ?? "bottom");
    protected readonly noDataClasses = computed(() => chartNoDataBaseThemeVariants());
    protected readonly noDataTemplate = contentChild(ChartNoDataTemplateDirective);
    protected readonly plotOrder = computed(() => {
        const pos = this.legendPosition();
        return pos === "top" || pos === "left" ? 1 : 0;
    });
    protected readonly scene = signal<ChartScene | null>(null);

    /**
     * @description Detailed accessible description explaining the chart's purpose and trends.
     * @default ""
     */
    public readonly ariaDescription = input("", { alias: "aria-description" });

    /**
     * @description Accessible name for the chart container.
     * @default "Chart"
     */
    public readonly ariaLabel = input("Chart", { alias: "aria-label" });

    /**
     * @description Primary dataset shared across all child series.
     * @default []
     */
    public readonly data = input<readonly unknown[]>([]);

    public readonly legendItems = computed<readonly ChartLegendItem[]>(() => {
        const seriesList = this.#registeredSeries();
        return seriesList.map((s, idx) => {
            const style = this.#styleResolver.resolveSeriesStyle(s, idx);
            return {
                color: style.color,
                name: s.name(),
                seriesId: s.id,
                seriesType: s.type,
                visible: s.visible()
            };
        });
    });

    /**
     * @description Emits when a data point or bar in the chart is clicked.
     */
    public readonly pointClick = output<ChartPointEvent>();

    /**
     * @description Emits when the keyboard focus moves to a new data point or series.
     */
    public readonly pointFocusChange = output<ChartPointFocusEvent>();

    /**
     * @description Emits when a series visibility state is toggled via legend interaction.
     */
    public readonly seriesVisibilityChange = output<ChartSeriesVisibilityEvent>();

    public readonly tooltipContext = signal<ChartTooltipTemplateContext | null>(null);
    public readonly tooltipPosition = signal<ChartPoint | null>(null);

    /**
     * @description Additional CSS classes merged onto the chart container via `tailwind-merge`.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    public readonly xAxisRegistration: Signal<ChartAxisRegistration | null> = this.#xAxis.asReadonly();

    /**
     * @description Property key or accessor extracting the X-axis coordinate for each data item.
     * @default ""
     */
    public readonly xField = input<string>("");

    public readonly yAxisRegistration: Signal<ChartAxisRegistration | null> = this.#yAxis.asReadonly();

    public constructor() {
        this.#styleResolver = new ChartStyleResolver(this.#elementRef.nativeElement);
        this.#renderScheduler = new ChartRenderScheduler(reason => this.#recomputeAndPaint(reason));

        this.#destroyRef.onDestroy(() => {
            this.#renderScheduler.cancel();
            if (this.#resizeObserver) {
                this.#resizeObserver.disconnect();
                this.#resizeObserver = null;
            }
        });

        // Invalidate when inputs change
        effect(() => {
            this.data();
            this.xField();
            this.invalidate(ChartInvalidationReason.Data);
        });

        afterNextRender(() => {
            this.#initCanvasAndObserver();
        });

        this.#recomputeAndPaint(ChartInvalidationReason.Data);
    }

    public invalidate(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#renderScheduler.schedule(reason);
    }

    public onCanvasClick(event: MouseEvent): void {
        const pointer = this.#normalizePointer(event);
        let currentScene = this.scene();
        if (!currentScene || currentScene.hitTargets.length === 0) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.scene();
        }
        if (!pointer || !currentScene) {
            return;
        }

        const shared = this.#tooltip()?.shared() ?? false;
        const hitState = ChartHitTestEngine.testHit(pointer, currentScene, shared);
        if (hitState.activeHitTarget) {
            const target = hitState.activeHitTarget;
            this.pointClick.emit({
                dataIndex: target.index,
                datum: target.datum,
                seriesId: target.seriesId,
                seriesName: target.seriesName,
                seriesType: target.seriesType,
                xValue: target.xValue,
                yValue: target.yValue
            });
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        let currentScene = this.scene();
        if (!currentScene || currentScene.hitTargets.length === 0) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.scene();
        }
        if (!currentScene || currentScene.hitTargets.length === 0) {
            return;
        }

        const visibleSeries = this.#registeredSeries().filter(s => s.visible());
        if (visibleSeries.length === 0) {
            return;
        }

        const uniqueIndices: number[] = Array.from(new Set(currentScene.hitTargets.map(t => t.index))).sort((a, b) => a - b);
        if (uniqueIndices.length === 0) {
            return;
        }

        switch (event.key) {
            case "ArrowRight": {
                event.preventDefault();
                const currentIdx = uniqueIndices.indexOf(this.#activeKeyboardIndex);
                const nextIdx = currentIdx < uniqueIndices.length - 1 ? uniqueIndices[currentIdx + 1] : uniqueIndices[0];
                this.#setActiveKeyboardPoint(nextIdx, this.#activeKeyboardSeriesIndex);
                break;
            }
            case "ArrowLeft": {
                event.preventDefault();
                const currentIdx = uniqueIndices.indexOf(this.#activeKeyboardIndex);
                const prevIdx = currentIdx > 0 ? uniqueIndices[currentIdx - 1] : uniqueIndices[uniqueIndices.length - 1];
                this.#setActiveKeyboardPoint(prevIdx, this.#activeKeyboardSeriesIndex);
                break;
            }
            case "ArrowUp": {
                event.preventDefault();
                if (this.#activeKeyboardIndex < 0) {
                    this.#activeKeyboardIndex = uniqueIndices[0];
                }
                this.#activeKeyboardSeriesIndex =
                    (this.#activeKeyboardSeriesIndex + 1) % visibleSeries.length;
                this.#setActiveKeyboardPoint(this.#activeKeyboardIndex, this.#activeKeyboardSeriesIndex);
                break;
            }
            case "ArrowDown": {
                event.preventDefault();
                if (this.#activeKeyboardIndex < 0) {
                    this.#activeKeyboardIndex = uniqueIndices[0];
                }
                this.#activeKeyboardSeriesIndex =
                    (this.#activeKeyboardSeriesIndex - 1 + visibleSeries.length) % visibleSeries.length;
                this.#setActiveKeyboardPoint(this.#activeKeyboardIndex, this.#activeKeyboardSeriesIndex);
                break;
            }
            case "Home": {
                event.preventDefault();
                this.#setActiveKeyboardPoint(uniqueIndices[0], this.#activeKeyboardSeriesIndex);
                break;
            }
            case "End": {
                event.preventDefault();
                this.#setActiveKeyboardPoint(uniqueIndices[uniqueIndices.length - 1], this.#activeKeyboardSeriesIndex);
                break;
            }
            case "Enter":
            case " ": {
                event.preventDefault();
                if (this.#activeKeyboardIndex >= 0) {
                    const activeSeries = visibleSeries[this.#activeKeyboardSeriesIndex % visibleSeries.length];
                    const hit = currentScene.hitTargets.find(
                        t => t.seriesId === activeSeries?.id && t.index === this.#activeKeyboardIndex
                    );
                    if (hit) {
                        this.pointClick.emit({
                            dataIndex: hit.index,
                            datum: hit.datum,
                            seriesId: hit.seriesId,
                            seriesName: hit.seriesName,
                            seriesType: hit.seriesType,
                            xValue: hit.xValue,
                            yValue: hit.yValue
                        });
                    }
                }
                break;
            }
        }
    }

    public onPointerLeave(): void {
        this.#clearInteraction();
    }

    public onPointerMove(event: PointerEvent): void {
        const pointer = this.#normalizePointer(event);
        let currentScene = this.scene();
        if (!currentScene || currentScene.hitTargets.length === 0) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.scene();
        }
        if (!pointer || !currentScene) {
            this.#clearInteraction();
            return;
        }

        const shared = this.#tooltip()?.shared() ?? false;
        const hitState = ChartHitTestEngine.testHit(pointer, currentScene, shared);

        if (hitState.activeHitTarget || hitState.activeHits.length > 0) {
            this.#interactionState = hitState;
            const primaryHit = hitState.activeHits[0] ?? hitState.activeHitTarget;
            if (primaryHit) {
                const tooltipPos: ChartPoint = {
                    x: primaryHit.point?.x ?? (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : pointer.x),
                    y: primaryHit.point?.y ?? (primaryHit.bounds ? primaryHit.bounds.y : pointer.y)
                };
                this.tooltipPosition.set(tooltipPos);
                this.tooltipContext.set(this.#buildTooltipContext(hitState.activeHits.length > 0 ? hitState.activeHits : [primaryHit], shared));
            }
        } else {
            this.#clearInteraction();
        }

        this.#paint();
    }

    public registerLegend(registration: ChartLegendRegistration): () => void {
        this.#legend.set(registration);
        this.invalidate(ChartInvalidationReason.Layout);
        return () => {
            if (this.#legend() === registration) {
                this.#legend.set(null);
                this.invalidate(ChartInvalidationReason.Layout);
            }
        };
    }

    public registerSeries(registration: ChartSeriesRegistration): () => void {
        this.#registeredSeries.update(list => [...list, registration]);
        this.invalidate(ChartInvalidationReason.Data);
        this.#recomputeAndPaint(ChartInvalidationReason.Data);

        return () => {
            this.#registeredSeries.update(list => list.filter(s => s.id !== registration.id));
            this.invalidate(ChartInvalidationReason.Data);
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
        };
    }

    public registerTooltip(registration: ChartTooltipRegistration): () => void {
        this.#tooltip.set(registration);
        return () => {
            if (this.#tooltip() === registration) {
                this.#tooltip.set(null);
            }
        };
    }

    public registerXAxis(registration: ChartAxisRegistration): () => void {
        this.#xAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Layout);
        return () => {
            if (this.#xAxis() === registration) {
                this.#xAxis.set(null);
                this.invalidate(ChartInvalidationReason.Layout);
            }
        };
    }

    public registerYAxis(registration: ChartAxisRegistration): () => void {
        this.#yAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Layout);
        return () => {
            if (this.#yAxis() === registration) {
                this.#yAxis.set(null);
                this.invalidate(ChartInvalidationReason.Layout);
            }
        };
    }

    public toggleSeriesVisibility(seriesId: string): void {
        const s = this.#registeredSeries().find(item => item.id === seriesId);
        if (s) {
            let nextVisibility: boolean;
            if (s.toggleVisibility) {
                nextVisibility = s.toggleVisibility();
            } else if ("set" in s.visible && typeof (s.visible as { set: (v: boolean) => void }).set === "function") {
                nextVisibility = !s.visible();
                (s.visible as { set: (v: boolean) => void }).set(nextVisibility);
            } else {
                nextVisibility = !s.visible();
            }
            this.seriesVisibilityChange.emit({
                seriesId,
                seriesName: s.name(),
                visible: nextVisibility
            });
            this.invalidate(ChartInvalidationReason.Layout);
            this.#recomputeAndPaint(ChartInvalidationReason.Layout);
        }
    }

    #buildTooltipContext(hits: readonly SceneHitTarget[], shared: boolean): ChartTooltipTemplateContext {
        const seriesItems = this.legendItems();
        const pointContexts: ChartTooltipPointContext[] = hits.map(hit => {
            const seriesItem = seriesItems.find(s => s.seriesId === hit.seriesId);
            const color = seriesItem?.color ?? "#3b82f6";
            const xStr = hit.xValue instanceof Date ? hit.xValue.toLocaleDateString() : String(hit.xValue ?? "");
            const yStr = typeof hit.yValue === "number" ? formatCompactNumber(hit.yValue) : String(hit.yValue ?? "");

            return {
                color,
                dataIndex: hit.index,
                datum: hit.datum,
                formattedX: xStr,
                formattedY: yStr,
                seriesId: hit.seriesId,
                seriesName: hit.seriesName,
                seriesType: hit.seriesType,
                xValue: hit.xValue,
                yValue: hit.yValue
            };
        });

        const primaryContext = pointContexts[0];
        return {
            $implicit: primaryContext,
            point: primaryContext,
            points: pointContexts,
            series: pointContexts.map(p => p.seriesName),
            shared
        };
    }

    #clearInteraction(): void {
        this.#activeKeyboardIndex = -1;
        this.#interactionState = null;
        this.tooltipContext.set(null);
        this.tooltipPosition.set(null);
        this.#paint();
    }

    #initCanvasAndObserver(): void {
        const canvasRef = this.canvasElement();
        if (!canvasRef) {
            return;
        }

        const canvas = canvasRef.nativeElement;
        this.#canvasContext = canvas.getContext("2d");

        const plotEl = canvas.parentElement || this.#elementRef.nativeElement;

        if (typeof ResizeObserver !== "undefined") {
            this.#resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const { height, width } = entry.contentRect;
                    if (width > 0 && height > 0) {
                        this.#currentWidth = width;
                        this.#currentHeight = height;
                        this.#updateCanvasBackingStore(width, height);
                        this.invalidate(ChartInvalidationReason.Size);
                    }
                }
            });
            this.#resizeObserver.observe(plotEl);
        }

        // Initial layout pass
        const rect = plotEl.getBoundingClientRect();
        const initialWidth = rect.width > 0 ? rect.width : plotEl.offsetWidth || 500;
        const initialHeight = rect.height > 0 ? rect.height : plotEl.offsetHeight || 300;
        this.#currentWidth = initialWidth;
        this.#currentHeight = initialHeight;
        this.#updateCanvasBackingStore(initialWidth, initialHeight);
        this.invalidate(ChartInvalidationReason.Size);
    }

    #normalizePointer(event: MouseEvent | PointerEvent): ChartPoint | null {
        const canvasRef = this.canvasElement();
        if (!canvasRef) {
            return null;
        }
        const rect = canvasRef.nativeElement.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    #paint(): void {
        const context = this.#canvasContext;
        const currentScene = this.scene();
        if (!context || !currentScene) {
            return;
        }

        CanvasChartRenderer.render(context, currentScene, this.#interactionState, this.#styleResolver);
    }

    #recomputeAndPaint(reason: ChartInvalidationReason): void {
        if (this.#currentWidth <= 0 || this.#currentHeight <= 0) {
            const canvasRef = this.canvasElement();
            const plotEl = canvasRef?.nativeElement.parentElement || this.#elementRef.nativeElement;
            const rect = plotEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.#currentWidth = rect.width;
                this.#currentHeight = rect.height;
                this.#updateCanvasBackingStore(rect.width, rect.height);
            }
        }

        const newScene = ChartLayoutEngine.computeScene({
            containerHeight: this.#currentHeight,
            containerWidth: this.#currentWidth,
            rootData: this.data(),
            rootXField: this.xField(),
            series: this.#registeredSeries(),
            styleResolver: this.#styleResolver,
            xAxis: this.#xAxis() ?? undefined,
            yAxis: this.#yAxis() ?? undefined
        });

        this.scene.set(newScene);
        this.#paint();
    }

    #setActiveKeyboardPoint(index: number, seriesIndex: number): void {
        const currentScene = this.scene();
        if (!currentScene) return;

        const visibleSeries = this.#registeredSeries().filter(s => s.visible());
        if (visibleSeries.length === 0) return;

        this.#activeKeyboardIndex = index;
        this.#activeKeyboardSeriesIndex = seriesIndex % visibleSeries.length;

        const activeSeries = visibleSeries[this.#activeKeyboardSeriesIndex];
        const hits = currentScene.hitTargets.filter(t => t.index === index);
        const primaryHit = hits.find(t => t.seriesId === activeSeries?.id) ?? hits[0];

        if (primaryHit) {
            const pointPos: ChartPoint = {
                x: primaryHit.point?.x ?? (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : 0),
                y: primaryHit.point?.y ?? (primaryHit.bounds ? primaryHit.bounds.y : 0)
            };

            this.#interactionState = {
                activeHits: hits,
                activeHitTarget: primaryHit,
                pointerPosition: pointPos
            };

            this.tooltipPosition.set(pointPos);
            this.tooltipContext.set(this.#buildTooltipContext(hits, true));

            this.pointFocusChange.emit({
                dataIndex: primaryHit.index,
                datum: primaryHit.datum,
                seriesId: primaryHit.seriesId,
                seriesName: primaryHit.seriesName,
                seriesType: primaryHit.seriesType,
                xValue: primaryHit.xValue,
                yValue: primaryHit.yValue
            });

            const xVal = primaryHit.xValue instanceof Date ? primaryHit.xValue.toLocaleDateString() : String(primaryHit.xValue);
            this.activeAccessibilityText.set(
                `${primaryHit.seriesName}: ${xVal} is ${formatCompactNumber(primaryHit.yValue)}`
            );
        }

        this.#paint();
    }

    #updateCanvasBackingStore(width: number, height: number): void {
        const canvasRef = this.canvasElement();
        if (!canvasRef) {
            return;
        }

        const canvas = canvasRef.nativeElement;
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this.#canvasContext = ctx;
        }
    }
}
