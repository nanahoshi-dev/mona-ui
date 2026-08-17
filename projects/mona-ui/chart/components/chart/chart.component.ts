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
    Signal,
    signal,
    viewChild
} from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ChartNoDataTemplateDirective } from "../../directives/chart-no-data-template.directive";
import { BrowserAnimationClock } from "../../internal/animation/chart-animation-clock";
import { ChartAnimationController } from "../../internal/animation/chart-animation-controller";
import { normalizeChartAnimationOptions } from "../../internal/animation/chart-animation-options";
import { ChartTransitionPlanner } from "../../internal/animation/chart-transition-planner";
import type { ChartAnimationRenderFrame, ChartAnimationTrigger } from "../../internal/animation/chart-transition-types";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import {
    ChartInvalidationReason,
    hasInvalidationReason,
    type ChartAngularAxisRegistration,
    type ChartAxisRegistration,
    type ChartDonutSeriesRegistration,
    type ChartLegendRegistration,
    type ChartPolarSeriesRegistration,
    type ChartRadialAxisRegistration,
    type ChartRegistrationContext,
    type ChartSectorSeriesRegistration,
    type ChartSeriesRegistration,
    type ChartTooltipRegistration
} from "../../internal/context/chart-registration-context";
import { ChartLabelMeasureDirective } from "../../internal/directives/chart-label-measure.directive";
import { ChartHitTestEngine } from "../../internal/interaction/chart-hit-test-engine";
import type { ChartInteractionState } from "../../internal/interaction/chart-interaction-state";
import { ChartKeyboardNavigation } from "../../internal/interaction/chart-keyboard-navigation";
import { ChartLayoutEngine } from "../../internal/layout/chart-layout-engine";
import { formatPolarLabelText } from "../../internal/layout/polar-label-layout";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";
import { ChartRenderScheduler } from "../../internal/render/chart-render-scheduler";
import type {
    CartesianChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarChartScene,
    PolarSectorChartScene
} from "../../internal/scene/chart-scene";
import type { ChartAngularAxisTick, ChartRadialAxisTick } from "../../internal/scene/polar-axis-scene";
import type { SceneSectorSlice } from "../../internal/scene/polar-scene";
import type { SceneHitTarget } from "../../internal/scene/scene-geometry";
import { ChartStyleResolver } from "../../internal/style/chart-style-resolver";
import { degreesToRadians } from "../../internal/utils/angle-utils";
import { formatXValue, formatYValue } from "../../internal/utils/chart-formatter";
import { clamp } from "../../internal/utils/number-utils";
import type { ChartAnimationInput } from "../../models/chart-animation.models";
import type {
    ChartPointEvent,
    ChartPointFocusEvent,
    ChartSeriesVisibilityEvent
} from "../../models/chart-event.models";
import type {
    ChartLabelMeasurement,
    ChartSliceContext,
    ChartSliceLabelTemplateContext
} from "../../models/chart-polar.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartTooltipPointContext, ChartTooltipTemplateContext } from "../../models/chart-tooltip.models";
import type { ChartField, ChartPoint } from "../../models/chart.models";
import {
    chartAxisLabelBaseThemeVariants,
    chartBaseThemeVariants,
    chartNoDataBaseThemeVariants
} from "../../styles/chart.styles";

function easingToCss(easing: string): string {
    switch (easing) {
        case "linear":
            return "linear";
        case "ease-in":
            return "cubic-bezier(0.4, 0, 1, 1)";
        case "easeInOut":
        case "ease-in-out":
            return "cubic-bezier(0.4, 0, 0.2, 1)";
        case "easeOut":
        case "ease-out":
        default:
            return "cubic-bezier(0, 0, 0.2, 1)";
    }
}

@Component({
    selector: "mona-chart",
    templateUrl: "./chart.component.html",
    imports: [NgTemplateOutlet, ChartLabelMeasureDirective],
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
        "[style.--mona-chart-animation-duration]": "animationDurationCss()",
        "[style.--mona-chart-animation-easing]": "animationEasingCss()",
        "(keydown)": "onKeyDown($event)",
        "(focusout)": "onFocusOut($event)"
    }
})
export class MonaChartComponent implements ChartRegistrationContext {
    readonly #angularAxis = signal<ChartAngularAxisRegistration | null>(null);
    readonly #animationController: ChartAnimationController;
    readonly #destroyRef = inject(DestroyRef);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #labelMeasurements = new Map<string, ChartLabelMeasurement>();
    readonly #legend = signal<ChartLegendRegistration | null>(null);
    readonly #observedLabelElements = new Map<Element, string>();
    readonly #radialAxis = signal<ChartRadialAxisRegistration | null>(null);
    readonly #registeredSeries = signal<ChartSeriesRegistration[]>([]);
    readonly #renderScheduler: ChartRenderScheduler;
    readonly #styleResolver: ChartStyleResolver;
    readonly #tooltip = signal<ChartTooltipRegistration | null>(null);
    readonly #xAxis = signal<ChartAxisRegistration | null>(null);
    readonly #yAxis = signal<ChartAxisRegistration | null>(null);

    #activeKeyboardBucketIndex: number = -1;
    #activeKeyboardSeriesId: string | null = null;
    #canvasContext: CanvasRenderingContext2D | null = null;
    #canvasReady: boolean = false;
    #currentHeight: number = 300;
    #currentWidth: number = 500;
    #hasCommittedVisualScene: boolean = false;
    #interactionState: ChartInteractionState | null = null;
    #labelResizeObserver: ResizeObserver | null = null;
    #mediaQueryList: MediaQueryList | null = null;
    #mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
    #pendingPointerEvent: PointerEvent | null = null;
    #pointerFrameId: number | null = null;
    #renderScene: ChartScene | null = null;
    #resizeObserver: ResizeObserver | null = null;
    #themeObserver: MutationObserver | null = null;

    protected readonly activeAccessibilityText = signal<string>("");
    protected readonly axisLabelClasses = computed(() => chartAxisLabelBaseThemeVariants());
    protected readonly baseClasses = computed(() =>
        twMerge(chartBaseThemeVariants({ interactive: true }), this.userClass())
    );
    protected readonly canvasElement = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
    protected readonly cartesianScene = computed<CartesianChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "cartesian" ? (sc as CartesianChartScene) : null;
    });
    protected readonly polarSectorScene = computed<PolarSectorChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" && sc.polarKind === "sector" ? (sc as PolarSectorChartScene) : null;
    });
    protected readonly polarAxisScene = computed<PolarAxisChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" && sc.polarKind === "axis" ? (sc as PolarAxisChartScene) : null;
    });
    protected readonly polarScene = computed<PolarChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" ? (sc as PolarChartScene) : null;
    });
    protected readonly polarSeriesRegistration = computed<ChartSectorSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "pie" || s.type === "donut") as ChartSectorSeriesRegistration) ?? null;
    });
    protected readonly donutSeriesRegistration = computed<ChartDonutSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "donut") as ChartDonutSeriesRegistration) ?? null;
    });
    public readonly isAnimating = signal(false);
    public readonly isStructuralAnimation = signal(false);
    public readonly isExitingData = signal(false);
    protected readonly hasNoData = computed(() => {
        const sc = this.scene();
        if (!sc) return false;
        if (this.isExitingData()) return false;
        return !sc.hasRenderableData;
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
    public readonly scene = signal<ChartScene | null>(null);
    protected readonly styleRevision = signal(0);

    /**
     * @description Animation settings for initial render and subsequent data or visibility transitions.
     * @default true
     */
    public readonly animation = input<ChartAnimationInput>(true);
    protected readonly normalizedAnimationOptions = computed(() => normalizeChartAnimationOptions(this.animation()));
    protected readonly animationDurationCss = computed(() => `${this.normalizedAnimationOptions().duration}ms`);
    protected readonly animationEasingCss = computed(() => easingToCss(this.normalizedAnimationOptions().easing));

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

    public readonly rootData: Signal<readonly unknown[]> = this.data;

    public readonly legendItems = computed<readonly ChartLegendItem[]>(() => {
        this.styleRevision();
        return this.scene()?.legendItems ?? [];
    });

    /**
     * @description Emits when a data point, vertex, or bar in the chart is clicked.
     */
    public readonly pointClick = output<ChartPointEvent>();

    /**
     * @description Emits when the keyboard focus moves to a new data point, spoke, or series.
     */
    public readonly pointFocusChange = output<ChartPointFocusEvent>();

    /**
     * @description Emits when a series visibility state is toggled via legend interaction.
     */
    public readonly seriesVisibilityChange = output<ChartSeriesVisibilityEvent>();

    public readonly tooltipContext = signal<ChartTooltipTemplateContext | null>(null);
    public readonly tooltipPosition = signal<ChartPoint | null>(null);

    /**
     * @description Additional CSS classes applied to chart root container.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });

    /**
     * @description Property key or accessor extracting the X-axis coordinate for each data item.
     * @default ""
     */
    public readonly xField = input<ChartField>("");

    public readonly angularAxisRegistration: Signal<ChartAngularAxisRegistration | null> =
        this.#angularAxis.asReadonly();
    public readonly radialAxisRegistration: Signal<ChartRadialAxisRegistration | null> =
        this.#radialAxis.asReadonly();
    public readonly xAxisRegistration: Signal<ChartAxisRegistration | null> = this.#xAxis.asReadonly();
    public readonly yAxisRegistration: Signal<ChartAxisRegistration | null> = this.#yAxis.asReadonly();

    public constructor() {
        this.#styleResolver = new ChartStyleResolver(this.#elementRef.nativeElement);
        this.#animationController = new ChartAnimationController(new BrowserAnimationClock());
        this.#renderScheduler = new ChartRenderScheduler(reason => this.#recomputeAndPaint(reason));

        if (typeof window !== "undefined" && window.matchMedia) {
            this.#mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
            this.#mediaQueryListener = (e: MediaQueryListEvent) => {
                if (e.matches && this.#animationController.isRunning()) {
                    this.#animationController.cancel("finish-target");
                }
            };
            this.#mediaQueryList.addEventListener("change", this.#mediaQueryListener);
        }

        this.#destroyRef.onDestroy(() => {
            this.#renderScheduler.cancel();
            this.#animationController.destroy();
            if (this.#mediaQueryList && this.#mediaQueryListener) {
                this.#mediaQueryList.removeEventListener("change", this.#mediaQueryListener);
                this.#mediaQueryList = null;
                this.#mediaQueryListener = null;
            }
            if (this.#pointerFrameId !== null) {
                cancelAnimationFrame(this.#pointerFrameId);
                this.#pointerFrameId = null;
            }
            if (this.#resizeObserver) {
                this.#resizeObserver.disconnect();
                this.#resizeObserver = null;
            }
            if (this.#labelResizeObserver) {
                this.#labelResizeObserver.disconnect();
                this.#labelResizeObserver = null;
            }
            this.#observedLabelElements.clear();
            this.#labelMeasurements.clear();
            if (this.#themeObserver) {
                this.#themeObserver.disconnect();
                this.#themeObserver = null;
            }
        });

        // Invalidate when data inputs change
        effect(() => {
            this.data();
            this.xField();
            this.invalidate(ChartInvalidationReason.Data);
        });

        // Invalidate when userClass changes
        effect(() => {
            this.userClass();
            this.styleRevision.update(v => v + 1);
            this.invalidate(ChartInvalidationReason.Style);
        });

        afterNextRender(() => {
            this.#initCanvasAndObserver();
            this.#canvasReady = true;
            if (!this.#hasCommittedVisualScene && this.scene()) {
                this.#recomputeAndPaint(ChartInvalidationReason.Data);
            }
        });

        this.#recomputeAndPaint(ChartInvalidationReason.Data);
    }

    public invalidate(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#renderScheduler.schedule(reason);
    }

    public recomputeScene(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#recomputeAndPaint(reason);
    }

    public onCanvasClick(event: MouseEvent): void {
        const pointer = this.#normalizePointer(event);
        let currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.#renderScene ?? this.scene();
        }
        if (!pointer || !currentScene) {
            return;
        }

        const isSector = currentScene.coordinateSystem === "polar" && currentScene.polarKind === "sector";
        const shared = isSector ? false : (this.#tooltip()?.shared() ?? false);
        const hitState = ChartHitTestEngine.testHit(pointer, currentScene, shared);
        if (hitState.activeHitTarget) {
            const target = hitState.activeHitTarget;
            this.pointClick.emit({
                category: target.category,
                dataIndex: target.index,
                datum: target.datum,
                percentage: target.percentage,
                seriesId: target.seriesId,
                seriesName: target.seriesName,
                seriesType: target.seriesType,
                sliceId: target.sliceId,
                xValue: target.xValue,
                yValue: target.yValue
            });
        }
    }

    public onFocusOut(event: FocusEvent): void {
        const related = event.relatedTarget as Node | null;
        if (!related || !this.#elementRef.nativeElement.contains(related)) {
            this.#clearInteraction();
            this.activeAccessibilityText.set("");
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        let currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.#renderScene ?? this.scene();
        }
        if (!currentScene) {
            return;
        }

        const buckets = currentScene.interactionBuckets;
        if (!buckets || buckets.length === 0) {
            return;
        }

        const navResult = ChartKeyboardNavigation.handleKeyDown(
            event,
            currentScene,
            this.#activeKeyboardBucketIndex,
            this.#activeKeyboardSeriesId
        );

        if (navResult) {
            this.#setKeyboardSelection(navResult.bucketIndex, navResult.seriesId);
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (this.#activeKeyboardBucketIndex >= 0) {
                const bucket = buckets[this.#activeKeyboardBucketIndex];
                const hit = bucket?.hits.find(h => h.seriesId === this.#activeKeyboardSeriesId) ?? bucket?.hits[0];
                if (hit) {
                    this.pointClick.emit({
                        category: hit.category,
                        dataIndex: hit.index,
                        datum: hit.datum,
                        percentage: hit.percentage,
                        seriesId: hit.seriesId,
                        seriesName: hit.seriesName,
                        seriesType: hit.seriesType,
                        sliceId: hit.sliceId,
                        xValue: hit.xValue,
                        yValue: hit.yValue
                    });
                }
            }
        } else if (event.key === "Escape") {
            event.preventDefault();
            this.#clearInteraction();
            this.activeAccessibilityText.set("");
        }
    }

    public onPointerLeave(): void {
        this.#clearInteraction();
    }

    public onPointerMove(event: PointerEvent): void {
        const tooltip = this.#tooltip();
        const hoverEnabled = tooltip ? tooltip.enabled() !== false : false;
        if (!hoverEnabled) {
            if (this.#interactionState !== null) {
                this.#clearInteraction();
            }
            return;
        }

        this.#pendingPointerEvent = event;
        if (this.#pointerFrameId === null) {
            this.#pointerFrameId = requestAnimationFrame(() => {
                this.#pointerFrameId = null;
                if (this.#pendingPointerEvent) {
                    this.#processPointerMove(this.#pendingPointerEvent);
                }
            });
        }
    }

    #processPointerMove(event: PointerEvent): void {
        const pointer = this.#normalizePointer(event);
        let currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.#renderScene ?? this.scene();
        }
        if (!pointer || !currentScene) {
            this.#clearInteraction();
            return;
        }

        const isSector = currentScene.coordinateSystem === "polar" && currentScene.polarKind === "sector";
        const shared = isSector ? false : (this.#tooltip()?.shared() ?? false);
        const hitState = ChartHitTestEngine.testHit(pointer, currentScene, shared);

        if (hitState.activeHitTarget || hitState.activeHits.length > 0) {
            this.#interactionState = {
                ...hitState,
                source: "pointer"
            };
            const primaryHit = hitState.activeHitTarget ?? hitState.activeHits[0];
            if (primaryHit) {
                const rawX =
                    primaryHit.point?.x ??
                    (primaryHit.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : pointer.x);
                const rawY = primaryHit.point?.y ?? (primaryHit.bounds ? primaryHit.bounds.y : pointer.y);
                const clampedX = Math.max(10, Math.min(this.#currentWidth - 10, rawX));
                const clampedY = Math.max(10, Math.min(this.#currentHeight - 10, rawY));
                const tooltipPos: ChartPoint = {
                    x: clampedX,
                    y: clampedY
                };
                this.tooltipPosition.set(tooltipPos);
                this.tooltipContext.set(
                    this.#buildTooltipContext(hitState.activeHits.length > 0 ? hitState.activeHits : [primaryHit], shared)
                );
            }
            this.#paint();
        } else {
            this.#clearInteraction();
        }
    }

    public registerAngularAxis(registration: ChartAngularAxisRegistration): () => void {
        this.#angularAxis.set(registration);
        this.#recomputeAndPaint(ChartInvalidationReason.Layout);
        return () => {
            if (this.#angularAxis() === registration) {
                this.#angularAxis.set(null);
                this.#recomputeAndPaint(ChartInvalidationReason.Layout);
            }
        };
    }

    public registerRadialAxis(registration: ChartRadialAxisRegistration): () => void {
        this.#radialAxis.set(registration);
        this.#recomputeAndPaint(ChartInvalidationReason.Layout);
        return () => {
            if (this.#radialAxis() === registration) {
                this.#radialAxis.set(null);
                this.#recomputeAndPaint(ChartInvalidationReason.Layout);
            }
        };
    }

    public registerLegend(registration: ChartLegendRegistration): () => void {
        this.#legend.set(registration);
        this.#recomputeAndPaint(ChartInvalidationReason.Layout);
        return () => {
            if (this.#legend() === registration) {
                this.#legend.set(null);
                this.#recomputeAndPaint(ChartInvalidationReason.Layout);
            }
        };
    }

    public registerSeries(registration: ChartSeriesRegistration): () => void {
        this.#registeredSeries.update(list => [...list, registration]);
        this.#recomputeAndPaint(ChartInvalidationReason.Data);

        return () => {
            this.#registeredSeries.update(list => list.filter(s => s.id !== registration.id));
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
        this.#recomputeAndPaint(ChartInvalidationReason.Layout);
        return () => {
            if (this.#xAxis() === registration) {
                this.#xAxis.set(null);
                this.#recomputeAndPaint(ChartInvalidationReason.Layout);
            }
        };
    }

    public registerYAxis(registration: ChartAxisRegistration): () => void {
        this.#yAxis.set(registration);
        this.#recomputeAndPaint(ChartInvalidationReason.Layout);
        return () => {
            if (this.#yAxis() === registration) {
                this.#yAxis.set(null);
                this.#recomputeAndPaint(ChartInvalidationReason.Layout);
            }
        };
    }

    public toggleLegendItem(item: ChartLegendItem): void {
        if (item.kind === "datum" && item.dataIndex !== undefined) {
            const polarSeries = this.polarSeriesRegistration();
            if (polarSeries) {
                polarSeries.toggleSliceVisibility(item.dataIndex);
                this.invalidate(ChartInvalidationReason.Layout);
            }
        } else {
            this.toggleSeriesVisibility(item.seriesId);
        }
    }

    public toggleSeriesVisibility(seriesId: string): void {
        const s = this.#registeredSeries().find(item => item.id === seriesId);
        if (s) {
            let nextVisibility: boolean;
            if ("toggleVisibility" in s && typeof s.toggleVisibility === "function") {
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

            if (this.#interactionState) {
                const activeHits = this.#interactionState.activeHits.filter((h: SceneHitTarget) => h.seriesId !== seriesId);
                if (activeHits.length === 0) {
                    this.#clearInteraction();
                } else {
                    const primary =
                        activeHits.find(
                            (h: SceneHitTarget) => h.seriesId === this.#interactionState?.activeHitTarget?.seriesId
                        ) ?? activeHits[0];
                    this.#interactionState = {
                        activeHitTarget: primary,
                        activeHits,
                        pointerPosition: this.#interactionState.pointerPosition,
                        source: this.#interactionState.source
                    };
                    this.tooltipContext.set(this.#buildTooltipContext(activeHits, this.#tooltip()?.shared() ?? false));
                }
            }

            this.invalidate(ChartInvalidationReason.Layout);
        }
    }

    #buildTooltipContext(hits: readonly SceneHitTarget[], shared: boolean): ChartTooltipTemplateContext {
        const seriesItems = this.legendItems();
        const xAxis = this.#xAxis();
        const yAxis = this.#yAxis();
        const xFormatter = xAxis?.formatter();
        const yFormatter = yAxis?.formatter();
        const xAxisType = xAxis?.type();

        const pointContexts: ChartTooltipPointContext[] = hits.map(hit => {
            const seriesItem = seriesItems.find(s => s.itemId === hit.sliceId || s.seriesId === hit.seriesId);
            const color = hit.color ?? seriesItem?.color ?? "#3b82f6";
            const xStr = hit.formattedCategory ?? formatXValue(hit.xValue, hit.index, xFormatter, xAxisType);
            const yStr = hit.formattedValue ?? formatYValue(hit.yValue, hit.index, yFormatter);

            return {
                category: hit.category,
                color,
                dataIndex: hit.index,
                datum: hit.datum,
                formattedCategory: hit.formattedCategory,
                formattedPercentage: hit.formattedPercentage,
                formattedX: xStr,
                formattedY: yStr,
                percentage: hit.percentage,
                seriesId: hit.seriesId,
                seriesName: hit.seriesName,
                seriesType: hit.seriesType,
                sliceId: hit.sliceId,
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

    #clearInteractionState(): void {
        this.#activeKeyboardBucketIndex = -1;
        this.#activeKeyboardSeriesId = null;
        this.#interactionState = null;
        this.tooltipContext.set(null);
        this.tooltipPosition.set(null);
    }

    #clearInteraction(): void {
        if (this.#interactionState !== null || this.tooltipPosition() !== null || this.tooltipContext() !== null) {
            this.#clearInteractionState();
            this.#paint();
        }
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

        if (typeof MutationObserver !== "undefined") {
            this.#themeObserver = new MutationObserver(() => {
                this.styleRevision.update(v => v + 1);
                this.invalidate(ChartInvalidationReason.Style);
            });
            if (typeof document !== "undefined" && document.documentElement) {
                this.#themeObserver.observe(document.documentElement, {
                    attributeFilter: ["class", "style", "data-theme"],
                    attributes: true
                });
                if (document.body) {
                    this.#themeObserver.observe(document.body, {
                        attributeFilter: ["class", "style", "data-theme"],
                        attributes: true
                    });
                }
            }
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
        const currentScene = this.#renderScene ?? this.scene();
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

        const isStructural =
            hasInvalidationReason(reason, ChartInvalidationReason.Data) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Layout) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Size) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Visibility);

        if (isStructural) {
            this.#clearInteractionState();
            this.activeAccessibilityText.set("");
        }

        const newScene = ChartLayoutEngine.computeScene({
            angularAxis: this.#angularAxis() ?? undefined,
            containerHeight: this.#currentHeight,
            containerWidth: this.#currentWidth,
            measurements: this.#labelMeasurements,
            radialAxis: this.#radialAxis() ?? undefined,
            rootData: this.data(),
            rootXField: this.xField(),
            series: this.#registeredSeries(),
            styleResolver: this.#styleResolver,
            xAxis: this.#xAxis() ?? undefined,
            yAxis: this.#yAxis() ?? undefined
        });

        // Prune measurements
        if (newScene.coordinateSystem === "polar") {
            if (newScene.polarKind === "sector") {
                const sectorScene = newScene as PolarSectorChartScene;
                const validSliceIds = new Set<string>();
                for (const s of sectorScene.series) {
                    for (const sl of s.slices) {
                        validSliceIds.add(`sector:${sl.sliceId}`);
                        validSliceIds.add(sl.sliceId);
                    }
                }
                for (const key of Array.from(this.#labelMeasurements.keys())) {
                    if ((key.startsWith("sector:") || key.startsWith("slice:")) && !validSliceIds.has(key)) {
                        this.#labelMeasurements.delete(key);
                    }
                }
            } else if (newScene.polarKind === "axis") {
                const axisScene = newScene as PolarAxisChartScene;
                const validKeys = new Set<string>();
                for (const tick of axisScene.angularAxis.ticks) {
                    validKeys.add(`angular:${tick.tickKey}`);
                    validKeys.add(`angular:${tick.value}`);
                }
                for (const tick of axisScene.radialAxis.ticks) {
                    validKeys.add(`radial:${tick.tickKey}`);
                    validKeys.add(`radial:${tick.value}`);
                }
                for (const key of Array.from(this.#labelMeasurements.keys())) {
                    if ((key.startsWith("angular:") || key.startsWith("radial:")) && !validKeys.has(key)) {
                        this.#labelMeasurements.delete(key);
                    }
                }
            }
        }

        // Commit semantic target scene immediately
        this.scene.set(newScene);

        const isInitial = !this.#hasCommittedVisualScene;
        const isVisibility = hasInvalidationReason(reason, ChartInvalidationReason.Visibility);
        const isData = hasInvalidationReason(reason, ChartInvalidationReason.Data);
        const trigger: ChartAnimationTrigger = isInitial
            ? "initial"
            : isVisibility
              ? "visibility"
              : isData
                ? "data"
                : "layout";

        const animOptions = this.normalizedAnimationOptions();
        const prefersReducedMotion =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
                : false;

        const effectiveOptions = prefersReducedMotion ? { ...animOptions, duration: 0 } : animOptions;

        if (!this.#canvasReady || trigger === "layout" || effectiveOptions.duration === 0) {
            this.#animationController.cancel("finish-target");
            this.#renderScene = newScene;
            this.#hasCommittedVisualScene = true;
            this.isAnimating.set(false);
            this.isStructuralAnimation.set(false);
            this.isExitingData.set(false);
            this.#paint();
            return;
        }

        const fromVisual = this.#renderScene;
        const plan = ChartTransitionPlanner.plan(fromVisual, newScene, trigger, effectiveOptions);

        if (plan.mode === "immediate" || plan.duration === 0) {
            this.#animationController.cancel("finish-target");
            this.#renderScene = newScene;
            this.#hasCommittedVisualScene = true;
            this.isAnimating.set(false);
            this.isStructuralAnimation.set(false);
            this.isExitingData.set(false);
            this.#paint();
        } else {
            const isExitingDataTransition =
                trigger === "data" && fromVisual && fromVisual.hasRenderableData && !newScene.hasRenderableData;
            if (isExitingDataTransition) {
                this.isExitingData.set(true);
            }
            this.isAnimating.set(true);
            this.isStructuralAnimation.set(plan.mode !== "crossfade");

            this.#animationController.start(plan, {
                onComplete: () => {
                    this.#renderScene = newScene;
                    this.#hasCommittedVisualScene = true;
                    this.isAnimating.set(false);
                    this.isStructuralAnimation.set(false);
                    this.isExitingData.set(false);
                    this.#paint();
                },
                onFrame: (frame: ChartAnimationRenderFrame) => {
                    this.#renderScene = frame.scene;
                    if (frame.mode === "crossfade" && this.#canvasContext) {
                        CanvasChartRenderer.renderCrossfade(
                            this.#canvasContext,
                            frame.fromScene ?? null,
                            frame.toScene ?? newScene,
                            frame.progress,
                            this.#interactionState,
                            this.#styleResolver
                        );
                    } else {
                        this.#paint();
                    }
                }
            });
        }
    }

    #setKeyboardSelection(bucketIndex: number, preferredSeriesId: string | null): void {
        const currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) return;

        const buckets = currentScene.interactionBuckets;
        if (!buckets || buckets.length === 0) return;

        this.#activeKeyboardBucketIndex = clamp(bucketIndex, 0, buckets.length - 1);
        const bucket = buckets[this.#activeKeyboardBucketIndex];
        if (!bucket || bucket.hits.length === 0) return;

        const matchingHit = bucket.hits.find(h => h.seriesId === preferredSeriesId) ?? bucket.hits[0];
        this.#activeKeyboardSeriesId = matchingHit.seriesId;

        const pointPos: ChartPoint = {
            x:
                matchingHit.point?.x ??
                (matchingHit.bounds ? matchingHit.bounds.x + matchingHit.bounds.width / 2 : bucket.anchor?.x ?? 0),
            y: matchingHit.point?.y ?? (matchingHit.bounds ? matchingHit.bounds.y : bucket.anchor?.y ?? 0)
        };

        const isSector = currentScene.coordinateSystem === "polar" && currentScene.polarKind === "sector";
        const shared = isSector ? false : (this.#tooltip()?.shared() ?? false);
        const activeHits = shared ? bucket.hits : [matchingHit];

        this.#interactionState = {
            activeHitTarget: matchingHit,
            activeHits,
            pointerPosition: pointPos,
            source: "keyboard"
        };

        this.tooltipPosition.set(pointPos);
        this.tooltipContext.set(this.#buildTooltipContext(activeHits, shared));

        this.pointFocusChange.emit({
            category: matchingHit.category,
            dataIndex: matchingHit.index,
            datum: matchingHit.datum,
            percentage: matchingHit.percentage,
            seriesId: matchingHit.seriesId,
            seriesName: matchingHit.seriesName,
            seriesType: matchingHit.seriesType,
            sliceId: matchingHit.sliceId,
            xValue: matchingHit.xValue,
            yValue: matchingHit.yValue
        });

        if (currentScene.coordinateSystem === "polar") {
            const pctStr = matchingHit.formattedPercentage ? `, ${matchingHit.formattedPercentage}` : "";
            const valStr = matchingHit.formattedValue ?? String(matchingHit.yValue);
            this.activeAccessibilityText.set(
                `${matchingHit.seriesName}, ${matchingHit.formattedCategory ?? matchingHit.category}: ${valStr}${pctStr}`
            );
        } else {
            const xAxis = this.#xAxis();
            const yAxis = this.#yAxis();
            const xStr = formatXValue(matchingHit.xValue, matchingHit.index, xAxis?.formatter(), xAxis?.type());
            const yStr = formatYValue(matchingHit.yValue, matchingHit.index, yAxis?.formatter());
            this.activeAccessibilityText.set(`${matchingHit.seriesName}: ${xStr}, ${yStr}`);
        }

        this.#paint();
    }

    protected angularLabelTransform(tick: ChartAngularAxisTick): string {
        const sin = Math.sin(tick.angle);
        const cos = Math.cos(tick.angle);
        if (Math.abs(sin) < 0.15) {
            return cos > 0 ? "translate(-50%, -100%)" : "translate(-50%, 0%)";
        }
        return sin > 0 ? "translate(0, -50%)" : "translate(-100%, -50%)";
    }

    protected radialLabelTransform(tick: ChartRadialAxisTick, labelAngle: number): string {
        const rad = degreesToRadians(labelAngle);
        const sin = Math.sin(rad);
        const cos = Math.cos(rad);
        if (Math.abs(sin) < 0.15) {
            return cos > 0 ? "translate(-50%, -100%)" : "translate(-50%, 0%)";
        }
        return sin > 0 ? "translate(0, -50%)" : "translate(-100%, -50%)";
    }

    protected sliceLabelContext(slice: SceneSectorSlice): ChartSliceLabelTemplateContext {
        const polarSeries = this.polarSeriesRegistration();
        const sliceContext: ChartSliceContext = {
            category: slice.category,
            color: slice.color,
            dataIndex: slice.dataIndex,
            datum: slice.datum,
            formattedCategory: slice.formattedCategory,
            formattedPercentage: slice.formattedPercentage,
            formattedValue: slice.formattedValue,
            percentage: slice.percentage,
            seriesId: polarSeries?.id ?? "",
            seriesName: polarSeries?.name() ?? "",
            seriesType: polarSeries?.type ?? "pie",
            value: slice.value
        };

        return {
            $implicit: sliceContext,
            category: slice.category,
            color: slice.color,
            dataIndex: slice.dataIndex,
            datum: slice.datum,
            formattedCategory: slice.formattedCategory,
            formattedPercentage: slice.formattedPercentage,
            formattedValue: slice.formattedValue,
            percentage: slice.percentage,
            seriesId: polarSeries?.id ?? "",
            seriesName: polarSeries?.name() ?? "",
            seriesType: polarSeries?.type ?? "pie",
            slice: sliceContext,
            value: slice.value
        };
    }

    public observeLabelElement(element: HTMLElement, labelId: string): void {
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        if (!this.#labelResizeObserver) {
            this.#labelResizeObserver = new ResizeObserver(entries => {
                let hasChanged = false;
                for (const entry of entries) {
                    const targetId = this.#observedLabelElements.get(entry.target);
                    if (targetId) {
                        const { width, height } = entry.contentRect;
                        const prev = this.#labelMeasurements.get(targetId);
                        const widthDiff = prev ? Math.abs(prev.width - width) : width;
                        const heightDiff = prev ? Math.abs(prev.height - height) : height;
                        if (widthDiff > 1 || heightDiff > 1) {
                            this.#labelMeasurements.set(targetId, { width, height });
                            hasChanged = true;
                        }
                    }
                }
                if (hasChanged) {
                    this.invalidate(ChartInvalidationReason.Layout);
                }
            });
        }

        this.#observedLabelElements.set(element, labelId);
        this.#labelResizeObserver.observe(element);
    }

    public unobserveLabelElement(element: HTMLElement, _labelId: string): void {
        if (this.#labelResizeObserver) {
            this.#labelResizeObserver.unobserve(element);
        }
        this.#observedLabelElements.delete(element);
    }

    protected sliceLabelText(slice: SceneSectorSlice): string {
        const polarSeries = this.polarSeriesRegistration();
        const content = polarSeries?.labelContent() ?? "percentage";
        return formatPolarLabelText(slice, content);
    }

    protected shouldShowSliceLabel(slice: SceneSectorSlice): boolean {
        const polarSeries = this.polarSeriesRegistration();
        if (!polarSeries || !polarSeries.showLabels()) {
            return false;
        }
        const position = polarSeries.labelPosition ? polarSeries.labelPosition() : "outside";
        if (position === "outside") {
            return slice.label?.visible ?? false;
        }
        const minAngle = polarSeries.minLabelAngle();
        const sliceSpanDeg = ((slice.endAngle - slice.startAngle) * 180) / Math.PI;
        return sliceSpanDeg >= minAngle;
    }

    protected isOutsideLabel(): boolean {
        const polarSeries = this.polarSeriesRegistration();
        const position = polarSeries?.labelPosition ? polarSeries.labelPosition() : "outside";
        return position === "outside";
    }

    protected sliceContrastColor(slice: SceneSectorSlice): string {
        return this.#styleResolver.getReadableForeground(slice.insideLabelBackgroundColor || slice.color);
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
