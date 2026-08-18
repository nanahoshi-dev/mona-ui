import { NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    AfterContentChecked,
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
    untracked,
    viewChild
} from "@angular/core";
import { twMerge } from "tailwind-merge";
import { ChartNoDataTemplateDirective } from "../../directives/chart-no-data-template.directive";
import { ChartSubtitleTemplateDirective } from "../../directives/chart-subtitle-template.directive";
import { ChartTitleTemplateDirective } from "../../directives/chart-title-template.directive";
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
    type ChartDonutSeriesRegistration,
    type ChartFunnelSeriesRegistration,
    type ChartGaugeSeriesRegistration,
    type ChartHeatmapSeriesRegistration,
    type ChartLegendRegistration,
    type ChartPolarSeriesRegistration,
    type ChartRadialAxisRegistration,
    type ChartRadialBarSeriesRegistration,
    type ChartRegistrationContext,
    type ChartRoseSeriesRegistration,
    type ChartSectorSeriesRegistration,
    type ChartSeriesRegistration,
    type ChartTooltipRegistration,
    type ChartTreemapSeriesRegistration,
    type ChartWaterfallSeriesRegistration,
    type ChartXAxisRegistration,
    type ChartYAxisRegistration
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
    CartesianFunnelChartScene,
    CartesianHeatmapChartScene,
    CartesianWaterfallChartScene,
    CartesianXYChartScene,
    ChartScene,
    PolarAxisChartScene,
    PolarChartScene,
    PolarSectorChartScene,
    TreemapChartScene
} from "../../internal/scene/chart-scene";
import type { ChartTreemapSeriesScene, SceneTreemapLabel } from "../../internal/scene/hierarchical-scene";
import type { ChartFunnelSeriesScene, SceneFunnelLabel } from "../../internal/scene/funnel-scene";
import type { ChartWaterfallSeriesScene, SceneWaterfallLabel } from "../../internal/scene/waterfall-scene";
import type { ChartHierarchyNodeContext } from "../../models/chart-hierarchy.models";
import type { ChartTreemapLabelTemplateContext } from "../../models/chart-treemap.models";
import type { ChartFunnelLabelTemplateContext, ChartFunnelStageContext } from "../../models/chart-funnel.models";
import type { ChartWaterfallLabelTemplateContext, ChartWaterfallPointContext } from "../../models/chart-waterfall.models";
import type { ChartGaugeSeriesScene, PolarArcChartScene } from "../../internal/scene/polar-arc-scene";
import type { ChartGaugeCenterTemplateContext } from "../../models/chart-radial-arc.models";
import type { ChartColorLegendScale } from "../../models/chart-heatmap.models";
import type {
    ChartAngularAxisScene,
    ChartAngularAxisTick,
    ChartRadialAxisScene,
    ChartRadialAxisTick
} from "../../internal/scene/polar-axis-scene";
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
import type { ChartHeaderAlignment } from "../../models/chart-axis.models";
import {
    chartAxisLabelBaseThemeVariants,
    chartBaseThemeVariants,
    chartHeaderBaseThemeVariants,
    chartNoDataBaseThemeVariants,
    chartSubtitleBaseThemeVariants,
    chartTitleBaseThemeVariants
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
            useExisting: ChartComponent
        }
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.tabindex]": "0",
        role: "region",
        "[attr.aria-label]": "effectiveAriaLabel()",
        "[attr.aria-description]": "effectiveAriaDescription()",
        "[style.--mona-chart-animation-duration]": "animationDurationCss()",
        "[style.--mona-chart-animation-easing]": "animationEasingCss()",
        "(keydown)": "onKeyDown($event)",
        "(focusout)": "onFocusOut($event)"
    }
})
export class ChartComponent implements ChartRegistrationContext, AfterContentChecked {
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
    readonly #xAxis = signal<ChartXAxisRegistration | null>(null);
    readonly #yAxis = signal<ChartYAxisRegistration | null>(null);

    public ngAfterContentChecked(): void {
        this.#renderScheduler.flush();
    }

    #activeKeyboardBucketIndex: number = -1;
    #activeKeyboardHitKey: string | null = null;
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
    protected readonly cartesianXYScene = computed<CartesianXYChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "cartesian" && sc.cartesianKind === "xy" ? (sc as CartesianXYChartScene) : null;
    });
    protected readonly heatmapScene = computed<CartesianHeatmapChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "cartesian" && sc.cartesianKind === "heatmap"
            ? (sc as CartesianHeatmapChartScene)
            : null;
    });
    protected readonly heatmapSeriesRegistration = computed<ChartHeatmapSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "heatmap") as ChartHeatmapSeriesRegistration) ?? null;
    });
    public readonly legendScale = computed<ChartColorLegendScale | null>(() => {
        const s = this.scene();
        if (!s || !s.hasRenderableData || s.coordinateSystem !== "cartesian" || s.cartesianKind !== "heatmap") {
            return null;
        }
        const hm = s as CartesianHeatmapChartScene;
        return (hm.colorScale as unknown as ChartColorLegendScale) ?? null;
    });
    protected readonly polarSectorScene = computed<PolarSectorChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" && sc.polarKind === "sector" ? (sc as PolarSectorChartScene) : null;
    });
    protected readonly polarAxisScene = computed<{
        angularAxis?: ChartAngularAxisScene;
        radialAxis?: ChartRadialAxisScene;
    } | null>(() => {
        const sc = this.scene();
        if (sc?.coordinateSystem === "polar") {
            if (sc.polarKind === "axis") {
                return sc as PolarAxisChartScene;
            }
            if (sc.polarKind === "arc" && sc.arcMode === "rose") {
                const arcSc = sc as PolarArcChartScene;
                if (arcSc.angularAxis || arcSc.radialAxis) {
                    return {
                        angularAxis: arcSc.angularAxis,
                        radialAxis: arcSc.radialAxis
                    };
                }
            }
        }
        return null;
    });
    protected readonly polarScene = computed<PolarChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" ? (sc as PolarChartScene) : null;
    });
    protected readonly polarArcScene = computed<PolarArcChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" && sc.polarKind === "arc" ? (sc as PolarArcChartScene) : null;
    });
    protected readonly polarSeriesRegistration = computed<ChartSectorSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "pie" || s.type === "donut") as ChartSectorSeriesRegistration) ?? null;
    });
    protected readonly donutSeriesRegistration = computed<ChartDonutSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "donut") as ChartDonutSeriesRegistration) ?? null;
    });
    protected readonly gaugeSeriesRegistration = computed<ChartGaugeSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "gauge") as ChartGaugeSeriesRegistration) ?? null;
    });
    protected readonly gaugeScene = computed<ChartGaugeSeriesScene | null>(() => {
        const sc = this.polarArcScene();
        if (sc && sc.arcMode === "gauge" && sc.series[0]?.type === "gauge") {
            return sc.series[0] as ChartGaugeSeriesScene;
        }
        return null;
    });
    protected readonly treemapScene = computed<TreemapChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "hierarchical" && sc.hierarchicalKind === "treemap"
            ? (sc as TreemapChartScene)
            : null;
    });
    protected readonly treemapSeriesRegistration = computed<ChartTreemapSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "treemap") as ChartTreemapSeriesRegistration) ?? null;
    });
    protected readonly funnelScene = computed<CartesianFunnelChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "cartesian" && sc.cartesianKind === "funnel"
            ? (sc as CartesianFunnelChartScene)
            : null;
    });
    protected readonly funnelSeriesRegistration = computed<ChartFunnelSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "funnel") as ChartFunnelSeriesRegistration) ?? null;
    });
    protected readonly waterfallScene = computed<CartesianWaterfallChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "cartesian" && sc.cartesianKind === "waterfall"
            ? (sc as CartesianWaterfallChartScene)
            : null;
    });
    protected readonly waterfallSeriesRegistration = computed<ChartWaterfallSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "waterfall") as ChartWaterfallSeriesRegistration) ?? null;
    });
    readonly #isAnimating = signal(false);
    readonly #isStructuralAnimation = signal(false);
    readonly #animationMode = signal<"crossfade" | "morph" | null>(null);
    readonly #isExitingData = signal(false);
    readonly #warnedDiagnosticSignatures = new Set<string>();
    #hasPendingLabelMeasurementLayout: boolean = false;
    #hasPendingSizeReflow: boolean = false;

    public readonly isAnimating = this.#isAnimating.asReadonly();
    public readonly isStructuralAnimation = this.#isStructuralAnimation.asReadonly();
    public readonly animationMode = this.#animationMode.asReadonly();
    public readonly isExitingData = this.#isExitingData.asReadonly();

    protected readonly hasNoData = computed(() => {
        const sc = this.scene();
        if (!sc) return false;
        if (this.#isExitingData()) return false;
        return !sc.hasRenderableData;
    });
    protected readonly layoutClasses = computed(() => {
        const pos = this.legendPosition();
        if (pos === "top" || pos === "bottom") {
            return "relative flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-hidden";
        }
        if (pos === "left" || pos === "right") {
            return "relative flex flex-row items-center flex-1 min-h-0 min-w-0 w-full overflow-hidden";
        }
        return "relative flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-hidden";
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

    protected readonly effectiveAriaLabel = computed<string>(() => {
        const raw = this.ariaLabel();
        if (raw && raw !== "Chart") {
            return raw;
        }
        return this.title() || raw || "Chart";
    });

    protected readonly effectiveAriaDescription = computed<string | null>(() => {
        const raw = this.ariaDescription();
        return raw || this.subtitle() || null;
    });

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
     * @description Title text rendered above the plot area.
     * @default ""
     */
    public readonly title = input("");

    /**
     * @description Subtitle text rendered beneath the title.
     * @default ""
     */
    public readonly subtitle = input("");

    /**
     * @description Horizontal alignment of the title and subtitle ('center', 'left', or 'right').
     * @default "left"
     */
    public readonly titleAlign = input<ChartHeaderAlignment>("left");

    protected readonly titleTemplate = contentChild(ChartTitleTemplateDirective);
    protected readonly subtitleTemplate = contentChild(ChartSubtitleTemplateDirective);

    protected readonly hasHeader = computed(() =>
        Boolean(this.title().trim() || this.subtitle().trim() || this.titleTemplate() || this.subtitleTemplate())
    );
    protected readonly headerClasses = computed(() =>
        twMerge(chartHeaderBaseThemeVariants({ align: this.titleAlign() }))
    );
    protected readonly titleClasses = computed(() =>
        twMerge(chartTitleBaseThemeVariants())
    );
    protected readonly subtitleClasses = computed(() =>
        twMerge(chartSubtitleBaseThemeVariants())
    );

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
    public readonly radialAxisRegistration: Signal<ChartRadialAxisRegistration | null> = this.#radialAxis.asReadonly();
    public readonly xAxisRegistration: Signal<ChartXAxisRegistration | null> = this.#xAxis.asReadonly();
    public readonly yAxisRegistration: Signal<ChartYAxisRegistration | null> = this.#yAxis.asReadonly();

    protected axisLabelTransform(axisScene: import("../../internal/scene/cartesian-scene").ChartAxisScene, tick: import("../../internal/scene/cartesian-scene").ChartAxisSceneTick): string {
        const rot = axisScene.labelRotation ?? 0;
        if (axisScene.axis === "x") {
            if (axisScene.position === "top") {
                if (rot === 0) {
                    return "translate(-50%, -100%)";
                }
                return `translate(${rot > 0 ? "0" : "-100%"}, -100%) rotate(${rot}deg)`;
            }
            if (rot === 0) {
                return "translateX(-50%)";
            }
            return rot > 0 ? `rotate(${rot}deg)` : `translate(-100%, 0) rotate(${rot}deg)`;
        }
        if (axisScene.position === "right") {
            if (rot === 0) {
                return "translate(0, -50%)";
            }
            return `translate(0, -50%) rotate(${rot}deg)`;
        }
        if (rot === 0) {
            return "translate(-100%, -50%)";
        }
        return `translate(-100%, -50%) rotate(${rot}deg)`;
    }

    protected axisLabelTransformOrigin(axisScene: import("../../internal/scene/cartesian-scene").ChartAxisScene): string {
        const rot = axisScene.labelRotation ?? 0;
        if (axisScene.axis === "x") {
            if (axisScene.position === "top") {
                return rot > 0 ? "bottom left" : rot < 0 ? "bottom right" : "center center";
            }
            return rot > 0 ? "top left" : rot < 0 ? "top right" : "center center";
        }
        if (axisScene.position === "right") {
            return rot === 0 ? "center center" : "left center";
        }
        return rot === 0 ? "center center" : "right center";
    }

    protected axisLabelLeft(cart: CartesianChartScene, axisScene: import("../../internal/scene/cartesian-scene").ChartAxisScene, tick: import("../../internal/scene/cartesian-scene").ChartAxisSceneTick): number {
        if (axisScene.axis === "x") {
            return tick.coordinate;
        }
        const tickMarksOffset = axisScene.tickMarks ? (axisScene.tickSize ?? 6) : 0;
        const labelPadding = axisScene.labelPadding ?? 4;
        return axisScene.position === "right"
            ? cart.plotRect.x + cart.plotRect.width + tickMarksOffset + labelPadding
            : cart.plotRect.x - tickMarksOffset - labelPadding;
    }

    protected axisLabelTop(cart: CartesianChartScene, axisScene: import("../../internal/scene/cartesian-scene").ChartAxisScene, tick: import("../../internal/scene/cartesian-scene").ChartAxisSceneTick): number {
        if (axisScene.axis === "y") {
            return tick.coordinate;
        }
        const tickMarksOffset = axisScene.tickMarks ? (axisScene.tickSize ?? 6) : 0;
        const labelPadding = axisScene.labelPadding ?? 4;
        return axisScene.position === "top"
            ? cart.plotRect.y - tickMarksOffset - labelPadding
            : cart.plotRect.y + cart.plotRect.height + tickMarksOffset + labelPadding;
    }

    protected axisTitleLeft(cart: CartesianChartScene, axisScene: import("../../internal/scene/cartesian-scene").ChartAxisScene): number {
        if (axisScene.axis === "x") {
            return cart.plotRect.x + cart.plotRect.width / 2;
        }
        const gutter = axisScene.gutter ?? 48;
        return axisScene.position === "right"
            ? cart.plotRect.x + cart.plotRect.width + gutter - 14
            : cart.plotRect.x - gutter + 14;
    }

    protected axisTitleTop(cart: CartesianChartScene, axisScene: import("../../internal/scene/cartesian-scene").ChartAxisScene): number {
        if (axisScene.axis === "y") {
            return cart.plotRect.y + cart.plotRect.height / 2;
        }
        const gutter = axisScene.gutter ?? 32;
        return axisScene.position === "top"
            ? cart.plotRect.y - gutter + 6
            : cart.plotRect.y + cart.plotRect.height + gutter - 6;
    }

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
        let initialData = true;
        effect(() => {
            this.data();
            this.xField();
            if (initialData) {
                initialData = false;
                return;
            }
            this.invalidate(ChartInvalidationReason.Data);
        });

        // Invalidate when userClass changes
        let initialClass = true;
        effect(() => {
            this.userClass();
            if (initialClass) {
                initialClass = false;
                return;
            }
            this.styleRevision.update(v => v + 1);
            this.invalidate(ChartInvalidationReason.Style);
        });

        // Cancel running animation if animation is dynamically disabled
        effect(() => {
            const animOptions = this.normalizedAnimationOptions();
            if (animOptions.duration === 0 && this.#animationController.isRunning()) {
                this.#animationController.cancel("finish-target");
                this.#renderScene = this.scene();
                this.#isAnimating.set(false);
                this.#isStructuralAnimation.set(false);
                this.#animationMode.set(null);
                this.#isExitingData.set(false);
                if (this.#hasPendingLabelMeasurementLayout) {
                    this.#hasPendingLabelMeasurementLayout = false;
                    this.invalidate(ChartInvalidationReason.Layout);
                }
                this.#paint();
            }
        });

        afterNextRender(() => {
            this.#initCanvasAndObserver();
            this.#canvasReady = true;
            this.#recomputeAndPaint(ChartInvalidationReason.Size);
        });

        this.#recomputeAndPaint(ChartInvalidationReason.Data);
    }

    public invalidate(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#renderScheduler.schedule(reason);
    }

    public recomputeScene(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        this.#renderScheduler.cancel();
        if (!this.#canvasReady) {
            const canvasRef = this.canvasElement();
            if (canvasRef?.nativeElement) {
                this.#initCanvasAndObserver();
                this.#canvasReady = true;
            }
        }
        this.#recomputeAndPaint(reason);
    }

    public onCanvasClick(event: MouseEvent): void {
        if (this.#isAnimating() && !this.#isStructuralAnimation()) {
            return;
        }

        const pointer = this.#normalizePointer(event);
        let currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.#renderScene ?? this.scene();
        }
        if (!pointer || !currentScene) {
            return;
        }

        const shared = this.#resolveSharedTooltip(currentScene);
        const hitState = ChartHitTestEngine.testHit(pointer, currentScene, shared);
        if (hitState.activeHitTarget) {
            this.pointClick.emit(this.#toPointEvent(hitState.activeHitTarget));
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
        if (this.#isAnimating() && !this.#isStructuralAnimation()) {
            return;
        }

        let currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.#renderScene ?? this.scene();
        }
        if (!currentScene) {
            return;
        }

        const isHierarchical = currentScene.coordinateSystem === "hierarchical";
        const isHeatmap = currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "heatmap";
        const buckets = currentScene.interactionBuckets;
        if (!isHierarchical && !isHeatmap && (!buckets || buckets.length === 0)) {
            return;
        }

        const navResult = ChartKeyboardNavigation.handleKeyDown(
            event,
            currentScene,
            this.#activeKeyboardBucketIndex,
            this.#activeKeyboardSeriesId,
            this.#activeKeyboardHitKey
        );

        if (navResult) {
            this.#setKeyboardSelection(navResult.bucketIndex, navResult.seriesId, navResult.hitKey);
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const activeHit = this.#interactionState?.activeHitTarget;
            if (activeHit) {
                this.pointClick.emit(this.#toPointEvent(activeHit));
            } else if (this.#activeKeyboardBucketIndex >= 0 && buckets && buckets.length > 0) {
                const bucket = buckets[this.#activeKeyboardBucketIndex];
                const hit =
                    (this.#activeKeyboardHitKey
                        ? bucket?.hits.find(
                              h =>
                                  (h.animationKey ?? h.sliceId ?? `${h.seriesId}:${h.index}`) ===
                                  this.#activeKeyboardHitKey
                          )
                        : undefined) ??
                    bucket?.hits.find(h => h.seriesId === this.#activeKeyboardSeriesId) ??
                    bucket?.hits[0];
                if (hit) {
                    this.pointClick.emit(this.#toPointEvent(hit));
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
        if (!hoverEnabled || (this.#isAnimating() && !this.#isStructuralAnimation())) {
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

    #resolveSharedTooltip(scene: ChartScene): boolean {
        if (scene.coordinateSystem === "hierarchical") {
            return false;
        }
        if (scene.coordinateSystem === "polar" && (scene.polarKind === "sector" || scene.polarKind === "arc")) {
            return false;
        }
        if (
            scene.coordinateSystem === "cartesian" &&
            (scene.cartesianKind === "heatmap" ||
                scene.cartesianKind === "funnel" ||
                scene.cartesianKind === "waterfall")
        ) {
            return false;
        }
        return this.#tooltip()?.shared() ?? false;
    }

    #processPointerMove(event: PointerEvent): void {
        if (this.#isAnimating() && !this.#isStructuralAnimation()) {
            this.#clearInteraction();
            return;
        }

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

        const shared = this.#resolveSharedTooltip(currentScene);
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
                    this.#buildTooltipContext(
                        hitState.activeHits.length > 0 ? hitState.activeHits : [primaryHit],
                        shared,
                        primaryHit
                    )
                );
            }
            this.#paint();
        } else {
            this.#clearInteraction();
        }
    }

    public registerAngularAxis(registration: ChartAngularAxisRegistration): () => void {
        this.#angularAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Data);
        return () => {
            if (this.#angularAxis() === registration) {
                this.#angularAxis.set(null);
                this.invalidate(ChartInvalidationReason.Data);
            }
        };
    }

    public registerRadialAxis(registration: ChartRadialAxisRegistration): () => void {
        this.#radialAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Data);
        return () => {
            if (this.#radialAxis() === registration) {
                this.#radialAxis.set(null);
                this.invalidate(ChartInvalidationReason.Data);
            }
        };
    }

    public registerLegend(registration: ChartLegendRegistration): () => void {
        this.#legend.set(registration);
        this.invalidate(ChartInvalidationReason.Data);
        return () => {
            if (this.#legend() === registration) {
                this.#legend.set(null);
                this.invalidate(ChartInvalidationReason.Data);
            }
        };
    }

    public registerSeries(registration: ChartSeriesRegistration): () => void {
        this.#registeredSeries.update(list => [...list, registration]);
        this.invalidate(ChartInvalidationReason.Data);

        return () => {
            this.#registeredSeries.update(list => list.filter(s => s.id !== registration.id));
            this.invalidate(ChartInvalidationReason.Data);
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

    public registerXAxis(registration: ChartXAxisRegistration): () => void {
        this.#xAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Data);
        return () => {
            if (this.#xAxis() === registration) {
                this.#xAxis.set(null);
                this.invalidate(ChartInvalidationReason.Data);
            }
        };
    }

    public registerYAxis(registration: ChartYAxisRegistration): () => void {
        this.#yAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Data);
        return () => {
            if (this.#yAxis() === registration) {
                this.#yAxis.set(null);
                this.invalidate(ChartInvalidationReason.Data);
            }
        };
    }

    public toggleLegendItem(item: ChartLegendItem): void {
        if (item.kind === "semantic" || item.interactive === false) {
            return;
        }
        if (item.kind === "datum") {
            const series = this.#registeredSeries().find(s => s.id === item.seriesId);
            if (series) {
                if (series.type === "pie" || series.type === "donut") {
                    const sec = series as ChartSectorSeriesRegistration;
                    if (item.dataIndex !== undefined) {
                        sec.toggleSliceVisibility(item.dataIndex);
                    }
                } else if (
                    series.type === "radialBar" ||
                    series.type === "rose" ||
                    series.type === "treemap" ||
                    series.type === "funnel"
                ) {
                    const rad = series as
                        | ChartRadialBarSeriesRegistration
                        | ChartRoseSeriesRegistration
                        | ChartTreemapSeriesRegistration
                        | ChartFunnelSeriesRegistration;
                    rad.toggleDatumVisibility?.(item.itemId);
                }
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
                const activeHits = this.#interactionState.activeHits.filter(
                    (h: SceneHitTarget) => h.seriesId !== seriesId
                );
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
                    const currentScene = this.#renderScene ?? this.scene();
                    const shared = currentScene ? this.#resolveSharedTooltip(currentScene) : false;
                    this.tooltipContext.set(this.#buildTooltipContext(activeHits, shared, primary));
                }
            }
        }
    }

    #buildTooltipContext(
        hits: readonly SceneHitTarget[],
        shared: boolean,
        primaryHit?: SceneHitTarget
    ): ChartTooltipTemplateContext {
        const seriesItems = this.legendItems();
        const xAxis = this.#xAxis();
        const yAxis = this.#yAxis();
        const xFormatter = xAxis?.formatter();
        const yFormatter = yAxis?.formatter();
        const xAxisType = xAxis?.type();

        const pointContexts: ChartTooltipPointContext[] = hits.map(hit => {
            const seriesItem = seriesItems.find(
                s => s.itemId === hit.sliceId || s.itemId === hit.itemId || s.seriesId === hit.seriesId
            );
            const color = hit.color ?? seriesItem?.color ?? "#3b82f6";
            const xStr =
                hit.formattedCategory ??
                formatXValue(hit.xValue ?? hit.category, hit.dataIndex ?? hit.index ?? 0, xFormatter, xAxisType);
            const isRange = hit.valueKind === "range" || hit.range !== undefined;
            const fromValue = hit.fromValue ?? hit.range?.fromValue;
            const toValue = hit.toValue ?? hit.range?.toValue;
            const formattedFrom = hit.formattedFrom ?? hit.range?.formattedFrom;
            const formattedTo = hit.formattedTo ?? hit.range?.formattedTo;
            const yStr =
                hit.formattedValue ??
                (isRange && formattedFrom && formattedTo
                    ? `${formattedFrom} – ${formattedTo}`
                    : formatYValue(hit.yValue ?? hit.value, hit.dataIndex ?? hit.index ?? 0, yFormatter));
            const markId =
                hit.animationKey ?? hit.itemId ?? hit.sliceId ?? `${hit.seriesId}:${hit.dataIndex ?? hit.index ?? 0}`;

            return {
                category: hit.category ?? hit.xValue,
                categoryX: hit.categoryX,
                categoryY: hit.categoryY,
                change: hit.financial?.change,
                changePercentage: hit.financial?.changePercentage,
                close: hit.close ?? hit.financial?.close,
                color,
                dataIndex: hit.dataIndex ?? hit.index ?? 0,
                datum: hit.datum,
                financial: hit.financial,
                financialDirection: hit.financialDirection ?? hit.financial?.direction,
                formattedCategory: hit.formattedCategory,
                formattedChange: hit.financial?.formattedChange,
                formattedChangePercentage: hit.financial?.formattedChangePercentage,
                formattedClose: hit.formattedClose ?? hit.financial?.formattedClose,
                formattedFrom,
                formattedHigh: hit.formattedHigh ?? hit.financial?.formattedHigh,
                formattedLow: hit.formattedLow ?? hit.financial?.formattedLow,
                formattedOpen: hit.formattedOpen ?? hit.financial?.formattedOpen,
                formattedPercentage: hit.formattedPercentage,
                formattedRadialMax: hit.formattedRadialMax,
                formattedRadialMin: hit.formattedRadialMin,
                formattedSize: hit.formattedSize,
                formattedStackPercentage: hit.formattedStackPercentage,
                formattedStackTotal: hit.formattedStackTotal,
                formattedTo,
                formattedX: xStr,
                formattedXValue: hit.formattedXValue ?? hit.formattedCategory,
                formattedY: yStr,
                formattedYCategory: hit.formattedYCategory,
                fromValue,
                funnel: hit.funnel,
                hierarchy: hit.hierarchy,
                high: hit.high ?? hit.financial?.high,
                isClamped: hit.isClamped,
                low: hit.low ?? hit.financial?.low,
                markId,
                open: hit.open ?? hit.financial?.open,
                percentage: hit.percentage,
                radialMax: hit.radialMax,
                radialMin: hit.radialMin,
                radialRatio: hit.radialRatio,
                rawValue: hit.rawValue,
                seriesId: hit.seriesId,
                seriesName: hit.seriesName,
                seriesType: hit.seriesType,
                sizeValue: hit.sizeValue,
                sliceId: hit.sliceId,
                stackEnd: hit.stackEnd,
                stackGroup: hit.stackGroup,
                stackMode: hit.stackMode,
                stackPercentage: hit.stackPercentage,
                stackPosition: hit.stackPosition,
                stackStart: hit.stackStart,
                stackTotal: hit.stackTotal,
                toValue,
                value:
                    hit.value ??
                    (isRange && fromValue !== undefined && toValue !== undefined
                        ? [fromValue, toValue]
                        : hit.hierarchy?.aggregateValue ?? hit.yValue),
                valueKind: hit.valueKind ?? (isRange ? "range" : hit.financial ? "ohlc" : hit.waterfall ? "waterfall" : "scalar"),
                waterfall: hit.waterfall,
                xValue: hit.xValue,
                yCategory: hit.yCategory,
                yValue: hit.yValue
            };
        });

        const effectivePrimaryHit = primaryHit ?? hits[0];
        const primaryContext =
            (effectivePrimaryHit
                ? pointContexts.find(
                      p =>
                          p.seriesId === effectivePrimaryHit.seriesId &&
                          p.dataIndex === effectivePrimaryHit.index &&
                          (effectivePrimaryHit.sliceId ? p.sliceId === effectivePrimaryHit.sliceId : true)
                  )
                : undefined) ?? pointContexts[0];
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
        this.#activeKeyboardHitKey = null;
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
                    if (
                        width > 0 &&
                        height > 0 &&
                        (Math.abs(width - this.#currentWidth) >= 0.5 || Math.abs(height - this.#currentHeight) >= 0.5)
                    ) {
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
        if (reason === ChartInvalidationReason.Interaction) {
            this.#paint();
            return;
        }

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

        const sizeChanged =
            !this.scene() ||
            Math.abs(this.scene()!.width - this.#currentWidth) >= 0.5 ||
            Math.abs(this.scene()!.height - this.#currentHeight) >= 0.5;

        const isStructural =
            hasInvalidationReason(reason, ChartInvalidationReason.Data) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Layout) ||
            (hasInvalidationReason(reason, ChartInvalidationReason.Size) && sizeChanged) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Visibility);

        const requiresSceneRefresh =
            isStructural || hasInvalidationReason(reason, ChartInvalidationReason.Style) || !this.scene();

        if (isStructural) {
            this.#clearInteractionState();
            this.activeAccessibilityText.set("");
        }

        const newScene = requiresSceneRefresh
            ? ChartLayoutEngine.computeScene({
                  angularAxis: this.#angularAxis() ?? undefined,
                  containerHeight: this.#currentHeight,
                  containerWidth: this.#currentWidth,
                  measurements: this.#labelMeasurements,
                  radialAxis: this.#radialAxis() ?? undefined,
                  rootData: this.data(),
                  rootXField: this.xField(),
                  series: this.#registeredSeries(),
                  styleResolver: this.#styleResolver,
                  warnedDiagnosticSignatures: this.#warnedDiagnosticSignatures,
                  xAxis: this.#xAxis() ?? undefined,
                  yAxis: this.#yAxis() ?? undefined
              })
            : this.scene()!;

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
            } else if (newScene.polarKind === "arc") {
                const arcScene = newScene as PolarArcChartScene;
                if (arcScene.arcMode === "rose") {
                    const validKeys = new Set<string>();
                    if (arcScene.angularAxis) {
                        for (const tick of arcScene.angularAxis.ticks) {
                            validKeys.add(`angular:${tick.tickKey}`);
                            validKeys.add(`angular:${tick.value}`);
                        }
                    }
                    if (arcScene.radialAxis) {
                        for (const tick of arcScene.radialAxis.ticks) {
                            validKeys.add(`radial:${tick.tickKey}`);
                            validKeys.add(`radial:${tick.value}`);
                        }
                    }
                    for (const key of Array.from(this.#labelMeasurements.keys())) {
                        if ((key.startsWith("angular:") || key.startsWith("radial:")) && !validKeys.has(key)) {
                            this.#labelMeasurements.delete(key);
                        }
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

        if (!this.#canvasReady) {
            return;
        }

        const isPassiveSizeReflow = trigger === "layout" && hasInvalidationReason(reason, ChartInvalidationReason.Size);
        if (isPassiveSizeReflow && this.#animationController.isRunning()) {
            this.#hasPendingSizeReflow = true;
            return;
        }

        if (trigger === "layout" || effectiveOptions.duration === 0) {
            this.#animationController.cancel("keep-current");
            this.#renderScene = newScene;
            this.#hasCommittedVisualScene = true;
            this.#isAnimating.set(false);
            this.#isStructuralAnimation.set(false);
            this.#animationMode.set(null);
            this.#isExitingData.set(false);
            if (this.#hasPendingLabelMeasurementLayout || this.#hasPendingSizeReflow) {
                this.#hasPendingLabelMeasurementLayout = false;
                this.#hasPendingSizeReflow = false;
                this.invalidate(ChartInvalidationReason.Layout);
            }
            this.#paint();
            return;
        }

        const fromVisual = this.#renderScene;
        const plan = ChartTransitionPlanner.plan(fromVisual, newScene, trigger, effectiveOptions);

        if (plan.mode === "immediate" || plan.duration === 0) {
            this.#animationController.cancel("keep-current");
            this.#renderScene = newScene;
            this.#hasCommittedVisualScene = true;
            this.#isAnimating.set(false);
            this.#isStructuralAnimation.set(false);
            this.#animationMode.set(null);
            this.#isExitingData.set(false);
            if (this.#hasPendingLabelMeasurementLayout || this.#hasPendingSizeReflow) {
                this.#hasPendingLabelMeasurementLayout = false;
                this.#hasPendingSizeReflow = false;
                this.invalidate(ChartInvalidationReason.Layout);
            }
            this.#paint();
        } else {
            const isExitingDataTransition =
                (trigger === "data" || trigger === "visibility") &&
                Boolean(fromVisual && fromVisual.hasRenderableData && !newScene.hasRenderableData);
            if (isExitingDataTransition) {
                this.#isExitingData.set(true);
            }
            this.#isAnimating.set(true);
            this.#isStructuralAnimation.set(plan.mode !== "crossfade");
            this.#animationMode.set(plan.mode === "crossfade" ? "crossfade" : "morph");

            this.#animationController.start(plan, {
                onComplete: () => {
                    this.#renderScene = newScene;
                    this.#hasCommittedVisualScene = true;
                    this.#isAnimating.set(false);
                    this.#isStructuralAnimation.set(false);
                    this.#animationMode.set(null);
                    this.#isExitingData.set(false);
                    if (this.#hasPendingLabelMeasurementLayout || this.#hasPendingSizeReflow) {
                        this.#hasPendingLabelMeasurementLayout = false;
                        this.#hasPendingSizeReflow = false;
                        this.invalidate(ChartInvalidationReason.Layout);
                    }
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

    #setKeyboardSelection(
        bucketIndex: number,
        preferredSeriesId: string | null,
        preferredHitKey: string | null = null
    ): void {
        const currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) return;

        let matchingHit: SceneHitTarget | undefined;
        let bucketAnchor: ChartPoint | undefined;

        if (currentScene.coordinateSystem === "hierarchical") {
            matchingHit =
                (preferredHitKey
                    ? currentScene.hitTargets.find(
                          h => (h.animationKey ?? `${h.seriesId}:${h.index}`) === preferredHitKey
                      )
                    : undefined) ?? currentScene.hitTargets[0];
            if (!matchingHit) return;
        } else {
            const buckets = currentScene.interactionBuckets;
            if (!buckets || buckets.length === 0) return;

            this.#activeKeyboardBucketIndex = clamp(bucketIndex, 0, buckets.length - 1);
            const bucket = buckets[this.#activeKeyboardBucketIndex];
            if (!bucket || bucket.hits.length === 0) return;

            matchingHit =
                (preferredHitKey
                    ? bucket.hits.find(
                          h => (h.animationKey ?? h.sliceId ?? `${h.seriesId}:${h.index}`) === preferredHitKey
                      )
                    : undefined) ??
                bucket.hits.find(h => h.seriesId === preferredSeriesId) ??
                bucket.hits[0];
            bucketAnchor = bucket.anchor;
        }

        this.#activeKeyboardSeriesId = matchingHit.seriesId;
        this.#activeKeyboardHitKey =
            matchingHit.animationKey ?? matchingHit.sliceId ?? `${matchingHit.seriesId}:${matchingHit.index}`;

        const pointPos: ChartPoint = {
            x:
                matchingHit.point?.x ??
                (matchingHit.bounds ? matchingHit.bounds.x + matchingHit.bounds.width / 2 : (bucketAnchor?.x ?? 0)),
            y: matchingHit.point?.y ?? (matchingHit.bounds ? matchingHit.bounds.y : (bucketAnchor?.y ?? 0))
        };

        const shared = this.#resolveSharedTooltip(currentScene);
        const activeHits =
            shared && bucketIndex >= 0 && currentScene.interactionBuckets?.[bucketIndex]
                ? currentScene.interactionBuckets[bucketIndex].hits
                : [matchingHit];

        this.#interactionState = {
            activeHitTarget: matchingHit,
            activeHits,
            pointerPosition: pointPos,
            source: "keyboard"
        };

        this.tooltipPosition.set(pointPos);
        this.tooltipContext.set(this.#buildTooltipContext(activeHits, shared, matchingHit));

        this.pointFocusChange.emit(this.#toPointFocusEvent(matchingHit));

        if (currentScene.coordinateSystem === "hierarchical" && currentScene.hierarchicalKind === "treemap") {
            const hit = matchingHit;
            if (hit.hierarchy) {
                const pathStr = hit.hierarchy.formattedPath.join(" / ");
                const valStr = hit.hierarchy.formattedValue;
                const pctStr =
                    hit.hierarchy.percentageOfRoot !== undefined
                        ? `, ${(hit.hierarchy.percentageOfRoot * 100).toFixed(1)}% of total`
                        : "";
                const leafStr = hit.hierarchy.isLeaf ? "Leaf" : `Group (${hit.hierarchy.childCount} children)`;
                this.activeAccessibilityText.set(`${pathStr}: ${valStr}${pctStr}, ${leafStr}`);
            }
        } else if (currentScene.coordinateSystem === "polar") {
            if (matchingHit.seriesType === "gauge") {
                const valStr = matchingHit.formattedValue ?? String(matchingHit.yValue);
                const clampedStr = matchingHit.isClamped ? " (visual indicator clamped)" : "";
                const minStr = matchingHit.formattedRadialMin ?? (matchingHit.radialMin !== undefined ? String(matchingHit.radialMin) : "");
                const maxStr = matchingHit.formattedRadialMax ?? (matchingHit.radialMax !== undefined ? String(matchingHit.radialMax) : "");
                const rangeStr = minStr && maxStr ? `, range ${minStr} to ${maxStr}` : "";
                this.activeAccessibilityText.set(
                    `${matchingHit.seriesName}: ${valStr}${rangeStr}${clampedStr}`
                );
            } else {
                const pctStr = matchingHit.formattedPercentage ? `, ${matchingHit.formattedPercentage}` : "";
                const valStr = matchingHit.formattedValue ?? String(matchingHit.yValue);
                const catStr = matchingHit.formattedCategory ?? matchingHit.category ?? matchingHit.seriesName;
                this.activeAccessibilityText.set(
                    `${matchingHit.seriesName}, ${catStr}: ${valStr}${pctStr}`
                );
            }
        } else if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "heatmap") {
            const xTitle = this.#xAxis()?.title() ? `${this.#xAxis()?.title()} ` : "";
            const yTitle = this.#yAxis()?.title() ? `${this.#yAxis()?.title()} ` : "";
            const xStr = `${xTitle}${matchingHit.formattedXValue ?? matchingHit.formattedCategory ?? matchingHit.categoryX ?? matchingHit.xValue}`;
            const yStr = `${yTitle}${matchingHit.formattedYCategory ?? matchingHit.categoryY ?? matchingHit.category}`;
            const valStr = matchingHit.formattedValue ?? String(matchingHit.yValue);
            this.activeAccessibilityText.set(`${matchingHit.seriesName}: ${xStr}, ${yStr}, ${valStr}`);
        } else if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "funnel") {
            const totalStages = currentScene.hitTargets.length;
            const stageNum = (matchingHit.renderOrder ?? 0) + 1;
            const stagePrefix = totalStages > 0 ? `, stage ${stageNum} of ${totalStages}` : "";
            const parts: string[] = [];
            if (matchingHit.funnel?.formattedConversionRate) {
                parts.push(`Conversion ${matchingHit.funnel.formattedConversionRate} of previous stage.`);
            }
            if (matchingHit.funnel?.formattedOverallConversionRate) {
                parts.push(`Overall conversion ${matchingHit.funnel.formattedOverallConversionRate}.`);
            }
            if (matchingHit.funnel?.dropOff !== undefined && matchingHit.funnel.dropOff > 0) {
                parts.push(`Drop-off ${matchingHit.funnel.dropOff}.`);
            }
            const details = parts.length > 0 ? ` ${parts.join(" ")}` : "";
            this.activeAccessibilityText.set(
                `${matchingHit.seriesName}, ${matchingHit.formattedCategory}${stagePrefix}: ${matchingHit.formattedValue}.${details}`.trim()
            );
        } else if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "waterfall") {
            const wf = matchingHit.waterfall;
            const totalSteps = currentScene.hitTargets.length;
            const stepNum = (matchingHit.renderOrder ?? 0) + 1;
            const stepPrefix = totalSteps > 0 ? `, step ${stepNum} of ${totalSteps}` : "";
            let detail = "";
            if (wf?.kind === "subtotal") {
                detail = `subtotal ${matchingHit.formattedValue}`;
            } else if (wf?.kind === "total") {
                detail = `total ${matchingHit.formattedValue}`;
            } else {
                const delta = wf?.deltaValue ?? 0;
                if (delta > 0) {
                    const deltaFormatted = wf?.formattedDelta ? wf.formattedDelta.replace(/^\+/, "") : String(delta);
                    detail = `increase ${deltaFormatted}, running total ${wf?.formattedCumulativeBefore ?? ""} to ${wf?.formattedCumulativeAfter ?? ""}`;
                } else if (delta < 0) {
                    const deltaFormatted = wf?.formattedDelta ? wf.formattedDelta.replace(/^-/, "") : String(Math.abs(delta));
                    detail = `decrease ${deltaFormatted}, running total ${wf?.formattedCumulativeBefore ?? ""} to ${wf?.formattedCumulativeAfter ?? ""}`;
                } else {
                    detail = `no change, running total ${wf?.formattedCumulativeAfter ?? matchingHit.formattedValue}`;
                }
            }
            this.activeAccessibilityText.set(
                `${matchingHit.seriesName}, ${matchingHit.formattedCategory}${stepPrefix}: ${detail}.`
            );
        } else {
            const xAxis = this.#xAxis();
            const yAxis = this.#yAxis();
            const xStr =
                matchingHit.formattedCategory ??
                formatXValue(matchingHit.xValue, matchingHit.index, xAxis?.formatter(), xAxis?.type());
            const isRange = matchingHit.valueKind === "range" || matchingHit.range !== undefined;
            const fromStr = matchingHit.formattedFrom ?? matchingHit.range?.formattedFrom;
            const toStr = matchingHit.formattedTo ?? matchingHit.range?.formattedTo;
            const yStr =
                matchingHit.formattedValue ??
                (isRange && fromStr && toStr
                    ? `${fromStr} – ${toStr}`
                    : formatYValue(matchingHit.yValue, matchingHit.index, yAxis?.formatter()));
            const sizeStr =
                matchingHit.formattedSize ?? (matchingHit.sizeValue !== undefined ? String(matchingHit.sizeValue) : "");
            const isPercent = matchingHit.stackMode === "percent";
            const shareStr =
                isPercent && matchingHit.formattedStackPercentage
                    ? `, stack share ${matchingHit.formattedStackPercentage}`
                    : "";

            const isFinancial =
                matchingHit.valueKind === "ohlc" ||
                matchingHit.seriesType === "candlestick" ||
                matchingHit.seriesType === "ohlc";
            if (isFinancial) {
                const fin = matchingHit.financial;
                const openStr =
                    fin?.formattedOpen ?? (fin?.open !== undefined ? String(fin.open) : String(matchingHit.open));
                const highStr =
                    fin?.formattedHigh ?? (fin?.high !== undefined ? String(fin.high) : String(matchingHit.high));
                const lowStr =
                    fin?.formattedLow ?? (fin?.low !== undefined ? String(fin.low) : String(matchingHit.low));
                const closeStr =
                    fin?.formattedClose ?? (fin?.close !== undefined ? String(fin.close) : String(matchingHit.close));
                const dirStr = fin?.direction ?? matchingHit.financialDirection ?? "";
                const changeStr = fin?.formattedChange ? `, change ${fin.formattedChange}` : "";
                const dirPhrase = dirStr ? `, ${dirStr}` : "";
                this.activeAccessibilityText.set(
                    `${matchingHit.seriesName}, ${xStr}. Open ${openStr}, high ${highStr}, low ${lowStr}, close ${closeStr}${dirPhrase}${changeStr}.`
                );
            } else if (isRange && fromStr && toStr) {
                this.activeAccessibilityText.set(`${matchingHit.seriesName}: ${xStr}, ${fromStr} to ${toStr}`);
            } else if (matchingHit.seriesType === "bubble" && sizeStr) {
                this.activeAccessibilityText.set(
                    `${matchingHit.seriesName}: ${xStr}, ${yStr}, size ${sizeStr}${shareStr}`
                );
            } else {
                this.activeAccessibilityText.set(`${matchingHit.seriesName}: ${xStr}, ${yStr}${shareStr}`);
            }
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
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        if (Math.abs(cos) < 0.15) {
            return sin > 0 ? "translate(-50%, 0)" : "translate(-50%, -100%)";
        }
        return cos > 0 ? "translate(0, -50%)" : "translate(-100%, -50%)";
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

    protected treemapLabelContext(
        lbl: SceneTreemapLabel,
        _seriesScene: ChartTreemapSeriesScene
    ): ChartTreemapLabelTemplateContext {
        const nodeContext: ChartHierarchyNodeContext = {
            aggregateValue: lbl.aggregateValue,
            childCount: lbl.childCount,
            dataIndex: lbl.dataIndex,
            datum: lbl.datum,
            depth: lbl.depth,
            descendantCount: lbl.descendantCount,
            formattedLabel: lbl.formattedLabel,
            formattedPath: lbl.formattedPath,
            formattedValue: lbl.formattedValue,
            isCollapsed: lbl.isCollapsed,
            isLeaf: lbl.isLeaf,
            label: lbl.label,
            nodeId: lbl.nodeId,
            parentId: lbl.parentId,
            path: lbl.path,
            percentageOfParent: lbl.percentageOfParent,
            percentageOfRoot: lbl.percentageOfRoot,
            rawValue: lbl.rawValue,
            siblingIndex: lbl.siblingIndex,
            sourceIndexPath: lbl.sourceIndexPath,
            treeHeight: lbl.treeHeight
        };

        return {
            $implicit: nodeContext,
            bounds: lbl.bounds,
            color: lbl.color,
            datum: lbl.datum,
            depth: lbl.depth,
            formattedLabel: lbl.formattedLabel,
            formattedPath: lbl.formattedPath,
            formattedValue: lbl.formattedValue,
            isCollapsed: lbl.isCollapsed,
            isLeaf: lbl.isLeaf,
            label: lbl.label,
            node: nodeContext,
            nodeId: lbl.nodeId,
            path: lbl.path,
            percentageOfParent: lbl.percentageOfParent,
            percentageOfRoot: lbl.percentageOfRoot,
            textColor: lbl.textColor,
            value: lbl.aggregateValue
        };
    }

    protected funnelLabelContext(
        lbl: SceneFunnelLabel,
        _seriesScene: ChartFunnelSeriesScene
    ): ChartFunnelLabelTemplateContext {
        const stageContext: ChartFunnelStageContext = {
            bounds: lbl.bounds,
            category: lbl.category,
            color: lbl.fillColor,
            conversionRate: lbl.conversionRate,
            dataIndex: lbl.dataIndex,
            datum: lbl.datum,
            dropOff: lbl.dropOff,
            formattedCategory: lbl.formattedCategory,
            formattedConversionRate: lbl.formattedConversionRate,
            formattedOverallConversionRate: lbl.formattedOverallConversionRate,
            formattedValue: lbl.formattedValue,
            overallConversionRate: lbl.overallConversionRate,
            previousValue: lbl.previousValue,
            stageId: lbl.stageId,
            stageIndex: lbl.stageIndex,
            textColor: lbl.textColor,
            value: lbl.value
        };

        return {
            $implicit: stageContext,
            bounds: lbl.bounds,
            category: lbl.category,
            color: lbl.fillColor,
            conversionRate: lbl.conversionRate,
            dataIndex: lbl.dataIndex,
            datum: lbl.datum,
            dropOff: lbl.dropOff,
            formattedCategory: lbl.formattedCategory,
            formattedConversionRate: lbl.formattedConversionRate,
            formattedOverallConversionRate: lbl.formattedOverallConversionRate,
            formattedValue: lbl.formattedValue,
            overallConversionRate: lbl.overallConversionRate,
            previousValue: lbl.previousValue,
            stage: stageContext,
            stageId: lbl.stageId,
            stageIndex: lbl.stageIndex,
            textColor: lbl.textColor,
            value: lbl.value
        };
    }

    protected waterfallLabelContext(
        lbl: SceneWaterfallLabel,
        _seriesScene: ChartWaterfallSeriesScene
    ): ChartWaterfallLabelTemplateContext {
        const pointContext: ChartWaterfallPointContext = {
            barEnd: lbl.barEnd,
            barStart: lbl.barStart,
            bounds: lbl.barBounds,
            category: lbl.category,
            color: lbl.fillColor,
            cumulativeAfter: lbl.cumulativeAfter,
            cumulativeBefore: lbl.cumulativeBefore,
            dataIndex: lbl.dataIndex,
            datum: lbl.datum,
            deltaValue: lbl.deltaValue,
            formattedCategory: lbl.formattedCategory,
            formattedCumulativeAfter: lbl.formattedCumulativeAfter,
            formattedCumulativeBefore: lbl.formattedCumulativeBefore,
            formattedDelta: lbl.formattedDelta,
            formattedValue: lbl.formattedValue,
            kind: lbl.kind,
            textColor: lbl.textColor,
            value: lbl.value,
            visualKind: lbl.visualKind
        };

        return {
            $implicit: pointContext,
            barEnd: lbl.barEnd,
            barStart: lbl.barStart,
            bounds: lbl.bounds,
            category: lbl.category,
            color: lbl.fillColor,
            cumulativeAfter: lbl.cumulativeAfter,
            cumulativeBefore: lbl.cumulativeBefore,
            dataIndex: lbl.dataIndex,
            datum: lbl.datum,
            deltaValue: lbl.deltaValue,
            formattedCategory: lbl.formattedCategory,
            formattedCumulativeAfter: lbl.formattedCumulativeAfter,
            formattedCumulativeBefore: lbl.formattedCumulativeBefore,
            formattedDelta: lbl.formattedDelta,
            formattedValue: lbl.formattedValue,
            kind: lbl.kind,
            step: pointContext,
            textColor: lbl.textColor,
            value: lbl.value,
            visualKind: lbl.visualKind
        };
    }

    public observeLabelElement(element: HTMLElement, labelId: string): void {
        if (!labelId || typeof ResizeObserver === "undefined") {
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
                        if (widthDiff > 3 || heightDiff > 3) {
                            this.#labelMeasurements.set(targetId, { width, height });
                            hasChanged = true;
                        }
                    }
                }
                if (hasChanged) {
                    if (this.#animationController.isRunning()) {
                        this.#hasPendingLabelMeasurementLayout = true;
                    } else {
                        this.invalidate(ChartInvalidationReason.Layout);
                    }
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

    protected gaugeCenterContext(gaugeSeries: ChartGaugeSeriesScene): ChartGaugeCenterTemplateContext {
        const val = gaugeSeries.value;
        return {
            $implicit: val.rawValue,
            formattedMax: val.formattedMax ?? String(val.max),
            formattedMin: val.formattedMin ?? String(val.min),
            formattedValue: val.formattedValue,
            isClamped: val.isClamped,
            max: val.max,
            min: val.min,
            ratio: val.ratio,
            seriesId: gaugeSeries.id,
            seriesName: gaugeSeries.name,
            value: val.rawValue
        };
    }

    protected gaugeFontSize(gaugeSeries: ChartGaugeSeriesScene): number {
        return Math.max(14, Math.round(gaugeSeries.value.innerRadius * 0.35));
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

    #toPointEvent(target: SceneHitTarget): ChartPointEvent {
        const fromValue = target.fromValue ?? target.range?.fromValue;
        const toValue = target.toValue ?? target.range?.toValue;
        const value =
            target.value ??
            (fromValue !== undefined && toValue !== undefined
                ? [fromValue, toValue]
                : (target.hierarchy?.aggregateValue ?? target.yValue));
        return {
            category: target.category,
            categoryX: target.categoryX,
            categoryY: target.categoryY,
            change: target.financial?.change,
            changePercentage: target.financial?.changePercentage,
            close: target.close ?? target.financial?.close,
            dataIndex: target.index,
            datum: target.datum,
            financial: target.financial,
            financialDirection: target.financialDirection ?? target.financial?.direction,
            formattedChange: target.financial?.formattedChange,
            formattedChangePercentage: target.financial?.formattedChangePercentage,
            formattedClose: target.formattedClose ?? target.financial?.formattedClose,
            formattedFrom: target.formattedFrom ?? target.range?.formattedFrom,
            formattedHigh: target.formattedHigh ?? target.financial?.formattedHigh,
            formattedLow: target.formattedLow ?? target.financial?.formattedLow,
            formattedOpen: target.formattedOpen ?? target.financial?.formattedOpen,
            formattedTo: target.formattedTo ?? target.range?.formattedTo,
            formattedXValue: target.formattedXValue ?? target.formattedCategory,
            formattedYCategory: target.formattedYCategory,
            fromValue,
            hierarchy: target.hierarchy,
            high: target.high ?? target.financial?.high,
            low: target.low ?? target.financial?.low,
            open: target.open ?? target.financial?.open,
            percentage: target.percentage,
            rawValue: target.rawValue,
            seriesId: target.seriesId,
            seriesName: target.seriesName,
            seriesType: target.seriesType,
            sizeValue: target.sizeValue,
            sliceId: target.sliceId,
            stackEnd: target.stackEnd,
            stackGroup: target.stackGroup,
            stackMode: target.stackMode,
            stackPercentage: target.stackPercentage,
            stackPosition: target.stackPosition,
            stackStart: target.stackStart,
            stackTotal: target.stackTotal,
            toValue,
            value,
            valueKind:
                target.valueKind ??
                (target.range
                    ? "range"
                    : target.financial
                      ? "ohlc"
                      : target.waterfall
                        ? "waterfall"
                        : "scalar"),
            waterfall: target.waterfall,
            funnel: target.funnel,
            xValue: target.xValue,
            yCategory: target.yCategory,
            yValue: target.yValue ?? (typeof value === "number" ? value : undefined)
        };
    }

    #toPointFocusEvent(target: SceneHitTarget): ChartPointFocusEvent {
        return this.#toPointEvent(target);
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
