import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
    afterNextRender,
    AfterContentChecked,
    booleanAttribute,
    Component,
    computed,
    contentChild,
    DestroyRef,
    effect,
    ElementRef,
    ErrorHandler,
    inject,
    input,
    output,
    PLATFORM_ID,
    Signal,
    signal,
    untracked,
    viewChild
} from "@angular/core";
import { injectComponentDirection, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { createElementControlId } from "@nanahoshi/mona-ui/internal";
import { twMerge } from "tailwind-merge";
import { ChartAxisLabelTemplateDirective } from "../../directives/chart-axis-label-template.directive";
import { ChartNoDataTemplateDirective } from "../../directives/chart-no-data-template.directive";
import { ChartSubtitleTemplateDirective } from "../../directives/chart-subtitle-template.directive";
import { ChartTitleTemplateDirective } from "../../directives/chart-title-template.directive";
import { CHART_DEFAULT_MESSAGES } from "../../i18n/chart.default-messages";
import { BrowserAnimationClock } from "../../internal/animation/chart-animation-clock";
import { ChartAnimationController } from "../../internal/animation/chart-animation-controller";
import {
    normalizeChartAnimationOptions,
    type NormalizedChartAnimationOptions
} from "../../internal/animation/chart-animation-options";
import { ChartTransitionPlanner } from "../../internal/animation/chart-transition-planner";
import type { ChartAnimationRenderFrame, ChartAnimationTrigger } from "../../internal/animation/chart-transition-types";
import { CHART_CONTEXT } from "../../internal/context/chart-context.token";
import { guardChartCallback, guardRegistrationCallbacks } from "../../internal/utils/chart-callback-guard";
import {
    ChartInvalidationReason,
    hasInvalidationReason,
    type ChartAngularAxisRegistration,
    type ChartAnnotationRegistration,
    type ChartBrushRegistration,
    type ChartCrosshairRegistration,
    type ChartDonutSeriesRegistration,
    type ChartFunnelSeriesRegistration,
    type ChartGaugeSeriesRegistration,
    type ChartHeatmapSeriesRegistration,
    type ChartLegendRegistration,
    type ChartRadialAxisRegistration,
    type ChartRadialBarSeriesRegistration,
    type ChartReferenceBandRegistration,
    type ChartReferenceLineRegistration,
    type ChartRegistrationContext,
    type ChartRoseSeriesRegistration,
    type ChartSectorSeriesRegistration,
    type ChartSelectionRegistration,
    type ChartSeriesRegistration,
    type ChartTooltipRegistration,
    type ChartTreemapSeriesRegistration,
    type ChartWaterfallSeriesRegistration,
    type ChartXAxisRegistration,
    type ChartYAxisRegistration
} from "../../internal/context/chart-registration-context";
import { ChartDataLabelMeasureDirective } from "../../internal/directives/chart-data-label-measure.directive";
import { ChartLabelMeasureDirective } from "../../internal/directives/chart-label-measure.directive";
import { ChartOverlayLabelMeasureDirective } from "../../internal/directives/chart-overlay-label-measure.directive";
import { ChartHitTestEngine } from "../../internal/interaction/chart-hit-test-engine";
import type { ChartInteractionState } from "../../internal/interaction/chart-interaction-state";
import type { ChartCrosshairState } from "../../internal/interaction/chart-crosshair-state";
import { ChartMarkIdentityResolver } from "../../internal/interaction/chart-mark-identity-resolver";
import { ChartVisibleMarkIndex } from "../../internal/interaction/chart-visible-mark-index";
import { CartesianDataLabelProjector } from "../../internal/data-label/cartesian-data-label-projector";
import type { CartesianDataLabelScene } from "../../internal/scene/cartesian-data-label-scene";
import type { ChartAxisScene, ChartAxisSceneTick } from "../../internal/scene/cartesian-scene";
import { CartesianSelectionProjector } from "../../internal/selection/cartesian-selection-projector";
import type { CartesianSelectionScene } from "../../internal/scene/cartesian-selection-scene";
import { ChartSelectionController, toSelectedPoint } from "../../internal/selection/chart-selection-controller";
import { CartesianBrushRangeResolver } from "../../internal/brush/cartesian-brush-range-resolver";
import { CartesianBrushMarkIndex } from "../../internal/brush/cartesian-brush-mark-index";
import {
    ChartBrushGestureController,
    type BrushGestureResult
} from "../../internal/brush/chart-brush-gesture-controller";
import {
    CartesianBrushTargetResolver,
    type ResolvedCartesianBrushTarget
} from "../../internal/brush/cartesian-brush-target-resolver";
import { normalizeSeriesKey } from "../../internal/animation/animation-identity";
import { CartesianCrosshairResolver } from "../../internal/interaction/cartesian-crosshair-resolver";
import {
    ChartPointerInteractionResolver,
    type ChartPointerInteractionDemand,
    type ChartPointerResolution
} from "../../internal/interaction/chart-pointer-interaction-resolver";
import { CartesianOverlayProjector } from "../../internal/overlay/cartesian-overlay-projector";
import {
    ChartOverlayLabelPositioner,
    type LabelAnchorFraction
} from "../../internal/overlay/chart-overlay-label-positioner";
import type {
    CartesianOverlayScene,
    ScenePointAnnotation,
    SceneReferenceBand,
    SceneReferenceLine
} from "../../internal/scene/cartesian-overlay-scene";
import {
    ChartKeyboardNavigation,
    type ChartKeyboardAxisNamespace,
    resolveInteractionBuckets
} from "../../internal/interaction/chart-keyboard-navigation";
import { ChartLabelMeasurementPruner } from "../../internal/layout/chart-label-measurement-pruner";
import { ChartLayoutEngine } from "../../internal/layout/chart-layout-engine";
import { formatPolarLabelText } from "../../internal/layout/polar-label-layout";
import { CanvasChartRenderer } from "../../internal/render/canvas-chart-renderer";
import type { ChartRendererMode } from "../../models/chart-renderer.models";
import type { ChartRenderBackend } from "../../internal/render/chart-render-backend";
import { createChartRenderBackend } from "../../internal/render/chart-render-backend-factory";
import type { ChartRenderPresentationState } from "../../internal/render/chart-render-presentation-state";
import { ChartRenderScheduler } from "../../internal/render/chart-render-scheduler";
import {
    ChartExportError,
    type ChartDownloadOptions,
    type ChartExportOptions,
    type ChartExportResult
} from "../../models/chart-export.models";
import { normalizeChartDownloadOptions, normalizeChartExportOptions } from "../../internal/export/chart-export-options";
import { ChartExportSnapshotBuilder } from "../../internal/export/chart-export-snapshot-builder";
import { ChartExportCoordinator } from "../../internal/export/chart-export-coordinator";
import { ChartDownloadHelper } from "../../internal/export/chart-download-helper";
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
import type {
    ChartWaterfallLabelTemplateContext,
    ChartWaterfallPointContext
} from "../../models/chart-waterfall.models";
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
    ChartBrushAxisRange,
    ChartBrushCancelReason,
    ChartBrushHitPolicy,
    ChartBrushMode,
    ChartBrushPhase,
    ChartBrushSelectionBehavior
} from "../../models/chart-brush.models";
import {
    buildChartDataTable,
    type ChartDataTableModel,
    describeChartData
} from "../../internal/accessibility/chart-data-description";
import { resolveSeriesDisplayName } from "../../internal/data/chart-value-resolver";
import type { ChartSelectionMode } from "../../models/chart-selection.models";
import type {
    ChartPointEvent,
    ChartPointFocusEvent,
    ChartSeriesVisibilityEvent
} from "../../models/chart-event.models";
import type {
    ChartNavigationAxisTarget,
    ChartNavigationInput,
    ChartViewportAxisRef,
    ChartViewportChangeEvent,
    ChartViewportChangePhase,
    ChartViewportChangeSource,
    ChartViewportState,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type { ChartSynchronizationInput } from "../../models/chart-synchronization.models";
import type { ChartDownsamplingInput } from "../../models/chart-downsampling.models";
import { normalizeChartDownsamplingOptions } from "../../internal/density/chart-downsampling-options";
import { normalizeChartSynchronizationOptions } from "../../internal/synchronization/chart-synchronization-options";
import {
    ChartSynchronizationController,
    type ViewportCommitNotification
} from "../../internal/synchronization/chart-synchronization-controller";
import { ChartSynchronizationCoordinator } from "../../internal/synchronization/chart-synchronization-coordinator";
import { resolveSynchronizationLocalTarget } from "../../internal/synchronization/chart-synchronization-local-target-resolver";
import {
    collectDenseBrushHits,
    mergeBrushHitsByIdentity,
    resolveDenseMarkById
} from "../../internal/density/cartesian-dense-selection";
import { normalizeChartNavigationOptions } from "../../internal/viewport/chart-navigation-options";
import {
    areInternalViewportStatesEqual,
    diffInternalViewportStates,
    normalizeViewportState,
    toPublicViewportState,
    type InternalCartesianViewportState
} from "../../internal/viewport/cartesian-viewport-normalizer";
import type { CartesianAxisCoordinateSpace } from "../../internal/viewport/cartesian-axis-coordinate-space";
import { CartesianViewportOperationCoordinator } from "../../internal/viewport/cartesian-viewport-operation-coordinator";
import { CartesianViewportReconciler } from "../../internal/viewport/cartesian-viewport-reconciler";
import { CartesianViewportTargetResolver } from "../../internal/viewport/cartesian-viewport-target-resolver";
import { ChartViewportGestureController } from "../../internal/viewport/chart-viewport-gesture-controller";
import { ChartViewportKeyboardController } from "../../internal/viewport/chart-viewport-keyboard-controller";
import {
    CartesianLayoutEngine,
    releaseCartesianLayoutRuntime,
    type CartesianXYLayoutRuntime
} from "../../internal/layout/cartesian-layout-engine";
import type {
    ChartLabelMeasurement,
    ChartSliceContext,
    ChartSliceLabelTemplateContext
} from "../../models/chart-polar.models";
import type {} from "../../internal/scale/chart-scale";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type { ChartTooltipPointContext, ChartTooltipTemplateContext } from "../../models/chart-tooltip.models";
import type { ChartField, ChartPoint, ChartRect, ChartSize } from "../../models/chart.models";
import type { ChartHeaderAlignment } from "../../models/chart-axis.models";
import {
    chartAnnotationLabelBaseThemeVariants,
    chartAxisLabelBaseThemeVariants,
    chartBaseThemeVariants,
    chartCrosshairLabelBaseThemeVariants,
    chartHeaderBaseThemeVariants,
    chartNoDataBaseThemeVariants,
    chartReferenceLabelBaseThemeVariants,
    chartSubtitleBaseThemeVariants,
    chartTitleBaseThemeVariants
} from "../../styles/chart.styles";
import {
    formatChartNumber,
    formatChartPercent,
    joinChartAnnouncement,
    setChartLocale
} from "../../internal/utils/chart-locale";
import { resolveHeaderAlignment, resolveLegendPlacement } from "../../internal/utils/chart-direction";

/** A sign at the start of a formatted number, after any bidi marks ("+5", "-3", "−" in some locales). */
const LEADING_SIGN = /^[\u200e\u200f\u061c]*[+\-\u2212]/;

/** Keys that move between points; at an edge they read the focused point again. */
const NAVIGATION_KEYS: ReadonlySet<string> = new Set([
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp"
]);
const ARROW_KEYS: ReadonlySet<string> = new Set(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"]);

/** A hit's box in plot pixels; a point has no size. */
function hitBox(hit: SceneHitTarget): ChartRect {
    if (hit.bounds) {
        return hit.bounds;
    }
    return { height: 0, width: 0, x: hit.point?.x ?? 0, y: hit.point?.y ?? 0 };
}

/** The pixel bounds of a keyboard brush from one point to another, along the brush's dimensions. */
function keyboardBrushBounds(
    from: SceneHitTarget,
    to: SceneHitTarget,
    plot: ChartRect,
    mode: ChartBrushMode
): ChartRect {
    const a = hitBox(from);
    const b = hitBox(to);
    // A pixel of padding so a point on the edge counts for both hit policies.
    const pad = 1;
    const left = Math.min(a.x, b.x) - pad;
    const right = Math.max(a.x + a.width, b.x + b.width) + pad;
    const top = Math.min(a.y, b.y) - pad;
    const bottom = Math.max(a.y + a.height, b.y + b.height) + pad;
    if (mode === "x") {
        return { height: plot.height, width: right - left, x: left, y: plot.y };
    }
    if (mode === "y") {
        return { height: bottom - top, width: plot.width, x: plot.x, y: top };
    }
    return { height: bottom - top, width: right - left, x: left, y: top };
}

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

type ChartTransientInteractionOwner = "tooltip" | "crosshair" | "keyboard" | null;

@Component({
    selector: "mona-chart",
    templateUrl: "./chart.component.html",
    imports: [
        NgTemplateOutlet,
        ChartLabelMeasureDirective,
        ChartOverlayLabelMeasureDirective,
        ChartDataLabelMeasureDirective
    ],
    providers: [
        {
            provide: CHART_CONTEXT,
            useExisting: ChartComponent
        }
    ],
    host: {
        "[class]": "baseClasses()",
        "[attr.tabindex]": "0",
        "[attr.role]": "landmark() ? 'region' : 'application'",
        "[attr.aria-roledescription]": "landmark() ? null : messages().chartRoleDescription",
        "[attr.aria-label]": "effectiveAriaLabel()",
        "[attr.aria-describedby]": "descriptionId",
        "[style.--mona-chart-animation-duration]": "animationDurationCss()",
        "[style.--mona-chart-animation-easing]": "animationEasingCss()",
        "(keydown)": "onKeyDown($event)",
        "(focusout)": "onFocusOut($event)"
    }
})
export class ChartComponent implements ChartRegistrationContext, AfterContentChecked {
    readonly #activeBrushBounds = signal<ChartRect | null>(null);
    readonly #activeExportControllers = new Set<AbortController>();
    readonly #angularAxis = signal<ChartAngularAxisRegistration | null>(null);
    readonly #animationController: ChartAnimationController;
    readonly #animationMode = signal<"crossfade" | "morph" | null>(null);
    readonly #annotationById = computed(() => {
        const map = new Map<string, ChartAnnotationRegistration>();
        for (const r of this.#annotations()) {
            map.set(r.id, r);
        }
        return map;
    });
    readonly #annotations = signal<ChartAnnotationRegistration[]>([]);
    readonly #brush = signal<ChartBrushRegistration | null>(null);
    readonly #brushGestureController = new ChartBrushGestureController();
    readonly #crosshair = signal<ChartCrosshairRegistration | null>(null);
    readonly #dataLabelMeasurementRevision = signal(0);
    readonly #dataLabelMeasurements = new Map<string, ChartSize>();
    readonly #destroyRef = inject(DestroyRef);
    readonly #direction = injectComponentDirection();
    readonly #document = inject(DOCUMENT);
    readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    readonly #errorHandler = inject(ErrorHandler);
    readonly #i18n = inject(MonaI18nService);
    readonly #hasInitializedDefaultSelection = signal(false);
    readonly #hasInitializedDefaultViewport = signal(false);
    readonly #internalSelectedMarkIds = signal<readonly string[]>([]);
    readonly #isAnimating = signal(false);
    /** On the server the chart renders its empty host: no layout, scheduling, observers or measurement. */
    readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    readonly #isExitingData = signal(false);
    readonly #isStructuralAnimation = signal(false);
    readonly #labelMeasurements = new Map<string, ChartLabelMeasurement>();
    readonly #legend = signal<ChartLegendRegistration | null>(null);
    readonly #observedDataLabelElements = new Map<Element, string>();
    readonly #observedLabelElements = new Map<Element, string>();
    readonly #observedOverlayLabelElements = new Map<Element, string>();
    readonly #overlayLabelMeasurementRevision = signal(0);
    readonly #overlayLabelMeasurements = new Map<string, ChartLabelMeasurement>();
    readonly #radialAxis = signal<ChartRadialAxisRegistration | null>(null);
    readonly #referenceBandById = computed(() => {
        const map = new Map<string, ChartReferenceBandRegistration>();
        for (const r of this.#referenceBands()) {
            map.set(r.id, r);
        }
        return map;
    });
    readonly #referenceBands = signal<ChartReferenceBandRegistration[]>([]);
    readonly #referenceLineById = computed(() => {
        const map = new Map<string, ChartReferenceLineRegistration>();
        for (const r of this.#referenceLines()) {
            map.set(r.id, r);
        }
        return map;
    });
    readonly #referenceLines = signal<ChartReferenceLineRegistration[]>([]);
    readonly #registeredSeries = signal<ChartSeriesRegistration[]>([]);
    readonly #renderScheduler: ChartRenderScheduler;
    readonly #reportedCallbackErrors = new Set<string>();
    readonly #rootXField = computed(() =>
        guardChartCallback(this.xField(), "xField", (_, error) => this.#reportCallbackError("chart xField", error))
    );
    readonly #selection = signal<ChartSelectionRegistration | null>(null);
    readonly #styleResolver: ChartStyleResolver;
    readonly #synchronizationCoordinator = inject(ChartSynchronizationCoordinator);
    readonly #tooltip = signal<ChartTooltipRegistration | null>(null);
    readonly #uncontrolledViewportState = signal<InternalCartesianViewportState>({ x: new Map(), y: new Map() });
    readonly #warnedDiagnosticSignatures = new Set<string>();
    readonly #xAxes = signal<ChartXAxisRegistration[]>([]);
    readonly #yAxes = signal<ChartYAxisRegistration[]>([]);
    #activeKeyboardBucketIndex: number = -1;
    #activeKeyboardHitKey: string | null = null;
    #activeKeyboardNamespace: ChartKeyboardAxisNamespace | null = null;
    #activeKeyboardSeriesId: string | null = null;
    /** Announced after the next structural layout, which clears the live region (a legend toggle's result). */
    #announcementAfterLayout: string | null = null;
    #brushMarkIndex: CartesianBrushMarkIndex | null = null;
    #brushMarkIndexScene: ChartScene | null = null;
    #canvasContext: CanvasRenderingContext2D | null = null;
    #canvasReady: boolean = false;
    #cartesianLayoutRuntime: CartesianXYLayoutRuntime | null = null;
    #currentHeight: number = 300;
    #currentWidth: number = 500;
    #dataLabelResizeObserver: ResizeObserver | null = null;
    #devicePixelRatioListener: (() => void) | null = null;
    #devicePixelRatioQuery: MediaQueryList | null = null;
    #gestureController: ChartViewportGestureController | null = null;
    #hasCommittedVisualScene: boolean = false;
    #hasEmittedBrushStart = false;
    #hasWarnedBrushWithoutSelection = false;
    #hasWarnedMultiBrush = false;
    #hasWarnedMultiSelection = false;
    #hasWarnedSelectionNonCartesian = false;
    #initialMeasurementFrameId: number | null = null;
    #initialMeasurementPending: boolean = true;
    #interactionOwner: ChartTransientInteractionOwner = null;
    #interactionRevision: number = 0;
    #interactionState: ChartInteractionState | null = null;
    #isDestroyed = false;
    /** The point a keyboard brush started from, while one is being extended. */
    #keyboardBrushAnchor: SceneHitTarget | null = null;
    #labelResizeObserver: ResizeObserver | null = null;
    #lastControlledSelection: readonly string[] | undefined = undefined;
    #lastInteractionSource: "pointer" | "keyboard" | null = null;
    #lastNormalizedControlledViewport: InternalCartesianViewportState | null = null;
    #lastPointerResolution: ChartPointerResolution | null = null;
    #lastSelectionMode: ChartSelectionMode | undefined = undefined;
    #mediaQueryList: MediaQueryList | null = null;
    #mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
    #overlayLabelResizeObserver: ResizeObserver | null = null;
    #pendingBrushFrame: {
        event: PointerEvent;
        phase: ChartBrushPhase;
        result: BrushGestureResult;
        scene: CartesianXYChartScene;
        target: ResolvedCartesianBrushTarget;
    } | null = null;
    #pendingBrushRafId: number | null = null;
    #pendingLabelMeasurementReason: number = 0;
    #pendingPointerEvent: PointerEvent | null = null;
    #pointerFrameId: number | null = null;
    #renderBackend: ChartRenderBackend | null = null;
    #renderScene: ChartScene | null = null;
    #resizeObserver: ResizeObserver | null = null;
    #resizeObserverTarget: HTMLElement | null = null;
    #suppressNextCanvasClick: boolean = false;
    #synchronizationController: ChartSynchronizationController | null = null;
    #themeObserver: MutationObserver | null = null;
    #themeSignature = "";
    protected readonly messages = this.#i18n.componentMessages("chart", CHART_DEFAULT_MESSAGES);
    protected readonly activeAccessibilityText = signal<string>("");
    protected readonly animationDurationCss = computed(() => `${this.normalizedAnimationOptions().duration}ms`);
    protected readonly animationEasingCss = computed(() => easingToCss(this.normalizedAnimationOptions().easing));
    protected readonly annotationBadgeAnchors = computed<ReadonlyMap<string, ChartPoint>>(() => {
        this.#overlayLabelMeasurementRevision();
        const overlays = this.cartesianOverlayScene();
        if (!overlays || overlays.annotations.length === 0) {
            return new Map();
        }
        const containerRect: ChartRect = {
            height: this.#currentHeight,
            width: this.#currentWidth,
            x: 0,
            y: 0
        };
        const map = new Map<string, ChartPoint>();
        for (const ann of overlays.annotations) {
            if (!ann.label) continue;
            const measurement = this.#overlayLabelMeasurements.get("overlay:ann:" + ann.id);
            let fraction: LabelAnchorFraction;
            switch (ann.label.placement) {
                case "top":
                    fraction = { x: 0.5, y: 1 };
                    break;
                case "bottom":
                    fraction = { x: 0.5, y: 0 };
                    break;
                case "left":
                    fraction = { x: 1, y: 0.5 };
                    break;
                case "right":
                default:
                    fraction = { x: 0, y: 0.5 };
                    break;
            }
            const pos = ChartOverlayLabelPositioner.position({
                anchorFraction: fraction,
                containerRect,
                desiredAnchor: ann.label.anchor,
                measurement,
                padding: 0
            });
            map.set(ann.id, pos.anchor);
        }
        return map;
    });
    protected readonly annotationLabelClasses = computed(() => chartAnnotationLabelBaseThemeVariants());
    protected readonly axisLabelClasses = computed(() => chartAxisLabelBaseThemeVariants());
    protected readonly baseClasses = computed(() =>
        twMerge(chartBaseThemeVariants({ interactive: true }), this.userClass())
    );
    protected readonly canvasElement = viewChild<ElementRef<HTMLCanvasElement>>("canvas");
    protected readonly cartesianDataLabelScene = computed<CartesianDataLabelScene | null>(() => {
        const scene = this.cartesianXYScene();
        if (!scene || !scene.hasRenderableData) {
            return null;
        }

        this.#dataLabelMeasurementRevision();

        const selectedSet = this.selectedMarkIdSet();
        const seriesList = this.#registeredSeries();

        const labelStyle = this.#styleResolver.resolveDataLabelStyle();

        const seriesColors = new Map<string, string>();
        if (scene.series) {
            for (const s of scene.series) {
                const c =
                    ("style" in s && s.style?.color) ||
                    ("color" in s && typeof (s as { color?: unknown }).color === "string"
                        ? (s as { color?: string }).color
                        : undefined);
                if (c) {
                    seriesColors.set(s.id, c);
                }
            }
        }

        return CartesianDataLabelProjector.project({
            defaultColor: labelStyle.color,
            font: labelStyle.font,
            haloColor: labelStyle.haloColor,
            haloWidth: labelStyle.haloWidth,
            hitTargets: scene.hitTargets,
            orientation: scene.orientation,
            plotRect: scene.plotRect,
            resolvedSeriesColors: seriesColors,
            scene,
            selectedMarkIds: selectedSet,
            seriesRegistrations: seriesList,
            templateMeasurements: this.#dataLabelMeasurements
        });
    });
    protected readonly cartesianOverlayScene = computed<CartesianOverlayScene | null>(() => {
        const scene = this.cartesianXYScene();
        if (!scene?.coordinateSpace) {
            return null;
        }

        return CartesianOverlayProjector.project(
            scene,
            this.#referenceLines(),
            this.#referenceBands(),
            this.#annotations(),
            this.#styleResolver
        );
    });
    protected readonly cartesianScene = computed<CartesianChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "cartesian" ? (sc as CartesianChartScene) : null;
    });
    protected readonly cartesianSelectionScene = computed<CartesianSelectionScene | null>(() => {
        const reg = this.#selection();
        if (!reg || reg.enabled?.() === false) {
            return null;
        }
        const visibleIndex = this.visibleMarkIndex();
        const selectedSet = this.selectedMarkIdSet();
        return CartesianSelectionProjector.project(visibleIndex, selectedSet);
    });
    protected readonly cartesianXYScene = computed<CartesianXYChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "cartesian" && sc.cartesianKind === "xy" ? (sc as CartesianXYChartScene) : null;
    });
    protected readonly crosshairLabelClasses = computed(() => chartCrosshairLabelBaseThemeVariants());
    protected readonly crosshairState = signal<ChartCrosshairState | null>(null);
    /** The visually hidden data table, when `dataTable` is on. */
    protected readonly dataTableModel = computed<ChartDataTableModel | null>(() => {
        const scene = this.scene();
        if (!this.dataTable() || !scene) {
            return null;
        }
        this.#i18n.localeId();
        const xTitle = this.#xAxes()[0]?.title?.() ?? "";
        return buildChartDataTable(scene, this.messages(), xTitle);
    });
    protected readonly descriptionId = createElementControlId();
    /**
     * The chart's description (`aria-describedby`): `ariaDescription` when set, else the subtitle and a summary of the
     * data, followed by the keyboard instructions.
     */
    protected readonly descriptionText = computed<string>(() => {
        const messages = this.messages();
        this.#i18n.localeId();
        const scene = this.scene();
        const explicit = this.ariaDescription().trim();
        const parts: string[] = [];
        if (explicit) {
            parts.push(explicit);
        } else {
            const subtitle = this.subtitle().trim();
            if (subtitle) {
                parts.push(subtitle);
            }
            if (scene) {
                parts.push(...describeChartData(scene, messages));
            }
        }
        if (scene?.hasRenderableData) {
            parts.push(messages.keyboardHelp);
        }
        return parts.join(" ");
    });
    protected readonly donutSeriesRegistration = computed<ChartDonutSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "donut") as ChartDonutSeriesRegistration) ?? null;
    });
    protected readonly effectiveAriaDescription = computed<string | null>(() => {
        const explicit = this.ariaDescription().trim();
        const builtIn = this.subtitle().trim();
        return explicit || builtIn || null;
    });
    protected readonly effectiveAriaLabel = computed<string>(() => {
        const explicit = this.ariaLabel().trim();
        const builtIn = this.title().trim();
        return explicit || builtIn || this.messages().chart;
    });
    protected readonly effectiveSelectedMarkIds = computed<readonly string[]>(() => {
        const reg = this.#selection();
        if (!reg || reg.enabled?.() === false) {
            return [];
        }
        const controlled = reg.selectedMarkIds?.();
        const mode = reg.mode?.() ?? "single";
        if (controlled !== undefined) {
            if (mode === "single" && controlled.length > 1) {
                if (typeof ngDevMode !== "undefined" && ngDevMode) {
                    const signature = "controlled-single-multiselect-warning";
                    if (!this.#warnedDiagnosticSignatures.has(signature)) {
                        this.#warnedDiagnosticSignatures.add(signature);
                        console.warn(
                            `[Mona Chart] <mona-chart-selection mode="single"> received ${controlled.length} selectedMarkIds. Only the first ID will be selected.`
                        );
                    }
                }
            }
            return ChartSelectionController.normalizeForMode(controlled, mode);
        }
        return this.#internalSelectedMarkIds();
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
    protected readonly gaugeScene = computed<ChartGaugeSeriesScene | null>(() => {
        const sc = this.polarArcScene();
        if (sc && sc.arcMode === "gauge" && sc.series[0]?.type === "gauge") {
            return sc.series[0] as ChartGaugeSeriesScene;
        }
        return null;
    });
    protected readonly gaugeSeriesRegistration = computed<ChartGaugeSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "gauge") as ChartGaugeSeriesRegistration) ?? null;
    });
    protected readonly hasHeader = computed(() =>
        Boolean(this.title().trim() || this.subtitle().trim() || this.titleTemplate() || this.subtitleTemplate())
    );
    protected readonly hasNoData = computed(() => {
        const sc = this.scene();
        if (!sc) return false;
        if (this.#isExitingData()) return false;
        return !sc.hasRenderableData;
    });
    protected readonly headerClasses = computed(() =>
        twMerge(chartHeaderBaseThemeVariants({ align: resolveHeaderAlignment(this.titleAlign(), this.#direction()) }))
    );
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
    protected readonly layoutClasses = computed(() => {
        const placement = this.legendPlacement();
        return placement === "start" || placement === "end"
            ? "relative flex flex-row items-center flex-1 min-h-0 min-w-0 w-full overflow-hidden"
            : "relative flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-hidden";
    });
    protected readonly legendPlacement = computed(() =>
        resolveLegendPlacement(this.#legend()?.position() ?? "bottom", this.#direction())
    );
    protected readonly noDataClasses = computed(() => chartNoDataBaseThemeVariants());
    protected readonly noDataTemplate = contentChild(ChartNoDataTemplateDirective);
    protected readonly normalizedAnimationOptions = computed(() => normalizeChartAnimationOptions(this.animation()));
    protected readonly normalizedDownsampling = computed(() => normalizeChartDownsamplingOptions(this.downsampling()));
    protected readonly normalizedNavigation = computed(() => normalizeChartNavigationOptions(this.navigation()));
    protected readonly normalizedSynchronization = computed(() =>
        normalizeChartSynchronizationOptions(this.synchronization(), this.#warnedDiagnosticSignatures)
    );
    protected readonly plotOrder = computed(() => {
        const placement = this.legendPlacement();
        return placement === "top" || placement === "start" ? 1 : 0;
    });
    protected readonly plotSurfaceElement = viewChild<ElementRef<HTMLElement>>("plotSurface");
    protected readonly polarArcScene = computed<PolarArcChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" && sc.polarKind === "arc" ? (sc as PolarArcChartScene) : null;
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
    protected readonly polarSectorScene = computed<PolarSectorChartScene | null>(() => {
        const sc = this.scene();
        return sc?.coordinateSystem === "polar" && sc.polarKind === "sector" ? (sc as PolarSectorChartScene) : null;
    });
    protected readonly polarSeriesRegistration = computed<ChartSectorSeriesRegistration | null>(() => {
        const list = this.#registeredSeries();
        return (list.find(s => s.type === "pie" || s.type === "donut") as ChartSectorSeriesRegistration) ?? null;
    });
    protected readonly referenceLabelClasses = computed(() => chartReferenceLabelBaseThemeVariants());
    protected readonly selectedMarkIdSet = computed<ReadonlySet<string>>(() => {
        return new Set(this.effectiveSelectedMarkIds());
    });
    protected readonly styleRevision = signal(0);
    protected readonly subtitleClasses = computed(() => twMerge(chartSubtitleBaseThemeVariants()));
    protected readonly subtitleTemplate = contentChild(ChartSubtitleTemplateDirective);
    protected readonly svgElement = viewChild<ElementRef<SVGSVGElement>>("svgSurface");
    protected readonly titleClasses = computed(() => twMerge(chartTitleBaseThemeVariants()));
    protected readonly titleTemplate = contentChild(ChartTitleTemplateDirective);
    protected readonly touchActionStyle = computed(() => {
        const nav = this.normalizedNavigation();
        return nav.enabled && (nav.dragPan || nav.pinchZoom) ? "none" : null;
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
    protected readonly viewportCursor = signal<string | null>(null);
    protected readonly visibleMarkIndex = computed<ChartVisibleMarkIndex>(() => {
        const scene = this.scene();
        const index = new ChartVisibleMarkIndex();
        if (scene?.hitTargets) {
            index.build(scene.hitTargets);
        }
        // Lazy reverse lookup: selected raw marks absent from the render sample
        // resolve through dense providers only when selection demands it (§72/§73).
        const xyScene = this.cartesianXYScene();
        if (xyScene?.denseInteraction && xyScene.densityRuntime) {
            for (const markId of this.effectiveSelectedMarkIds()) {
                if (index.has(markId)) {
                    continue;
                }
                const hit = resolveDenseMarkById(xyScene, markId);
                if (hit) {
                    index.add(hit);
                }
            }
        }
        return index;
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
    public readonly angularAxisRegistration: Signal<ChartAngularAxisRegistration | null> =
        this.#angularAxis.asReadonly();
    /**
     * @description Animation settings for initial render and subsequent data or visibility transitions.
     * @default true
     */
    public readonly animation = input<ChartAnimationInput>(true);
    public readonly animationMode = this.#animationMode.asReadonly();
    /**
     * @description Detailed accessible description explaining the chart's purpose and trends.
     * @default ""
     */
    public readonly ariaDescription = input("", { alias: "aria-description" });
    /**
     * @description Accessible name for the chart container.
     * @default ""
     */
    public readonly ariaLabel = input("", { alias: "aria-label" });
    /**
     * @description Primary dataset shared across all child series.
     * @default []
     */
    public readonly data = input<readonly unknown[]>([]);
    /**
     * @description Renders a visually hidden table of the chart's data (its first 100 rows) for screen readers.
     * @default false
     */
    public readonly dataTable = input(false, { transform: booleanAttribute });
    /**
     * @description Initial default viewport window state for chart axes.
     * @default undefined
     */
    public readonly defaultViewport = input<ChartViewportState | undefined>(undefined);
    /**
     * @description High-density downsampling policy for eligible dense series.
     * @default true
     */
    public readonly downsampling = input<ChartDownsamplingInput>(true);
    public readonly isAnimating = this.#isAnimating.asReadonly();
    public readonly isExitingData = this.#isExitingData.asReadonly();
    public readonly isStructuralAnimation = this.#isStructuralAnimation.asReadonly();
    /**
     * @description Makes the chart a `region` landmark instead of an `application`. A landmark keeps screen readers in
     * browse mode, so they read the arrow keys themselves; give each landmark chart a unique name.
     * @default false
     */
    public readonly landmark = input(false, { transform: booleanAttribute });
    public readonly legendItems = computed<readonly ChartLegendItem[]>(() => {
        this.styleRevision();
        return this.scene()?.legendItems ?? [];
    });
    public readonly legendScale = computed<ChartColorLegendScale | null>(() => {
        const s = this.scene();
        if (!s || !s.hasRenderableData || s.coordinateSystem !== "cartesian" || s.cartesianKind !== "heatmap") {
            return null;
        }
        const hm = s as CartesianHeatmapChartScene;
        return (hm.colorScale as unknown as ChartColorLegendScale) ?? null;
    });
    /**
     * @description Navigation, panning, and zooming options for the chart.
     * @default false
     */
    public readonly navigation = input<ChartNavigationInput>(false);
    /**
     * @description Emits when a data point, vertex, or bar in the chart is clicked.
     */
    public readonly pointClick = output<ChartPointEvent>();
    /**
     * @description Emits when the keyboard focus moves to a new data point, spoke, or series.
     */
    public readonly pointFocusChange = output<ChartPointFocusEvent>();
    public readonly radialAxisRegistration: Signal<ChartRadialAxisRegistration | null> = this.#radialAxis.asReadonly();
    /**
     * The rendering engine used to draw the chart surface.
     * Defaults to `"canvas"`. Set to `"svg"` for vector-based retained DOM rendering.
     * @description The rendering engine used to draw the chart surface ("canvas" | "svg").
     * @default "canvas"
     */
    public readonly renderer = input<ChartRendererMode>("canvas");
    public readonly rootData: Signal<readonly unknown[]> = this.data;
    public readonly scene = signal<ChartScene | null>(null);
    /**
     * @description Emits when a series visibility state is toggled via legend interaction.
     */
    public readonly seriesVisibilityChange = output<ChartSeriesVisibilityEvent>();
    /**
     * @description Subtitle text rendered beneath the title.
     * @default ""
     */
    public readonly subtitle = input("");
    /**
     * @description Cross-chart synchronization configuration. Accepts `false`, a group name shorthand, or full options.
     * @default false
     */
    public readonly synchronization = input<ChartSynchronizationInput>(false);
    /**
     * @description Title text rendered above the plot area.
     * @default ""
     */
    public readonly title = input("");
    /**
     * @description Horizontal alignment of the title and subtitle ('center', 'left', or 'right').
     * @default "start"
     */
    public readonly titleAlign = input<ChartHeaderAlignment>("start");
    public readonly tooltipContext = signal<ChartTooltipTemplateContext | null>(null);
    public readonly tooltipPosition = signal<ChartPoint | null>(null);
    /**
     * @description Additional CSS classes applied to chart root container.
     * @default ""
     */
    public readonly userClass = input("", { alias: "class" });
    /**
     * @description Active viewport window state for chart axes.
     * @default undefined
     */
    public readonly viewport = input<ChartViewportState | undefined>(undefined);
    /**
     * @description Emits when the chart viewport changes via pan, zoom, fit, reset, or keyboard navigation.
     */
    public readonly viewportChange = output<ChartViewportChangeEvent>();
    public readonly xAxesRegistration: Signal<readonly ChartXAxisRegistration[]> = this.#xAxes.asReadonly();
    public readonly xAxisRegistration: Signal<ChartXAxisRegistration | null> = computed(() => this.#xAxes()[0] ?? null);
    /**
     * @description Property key or accessor extracting the X-axis coordinate for each data item.
     * @default ""
     */
    public readonly xField = input<ChartField>("");
    public readonly yAxesRegistration: Signal<readonly ChartYAxisRegistration[]> = this.#yAxes.asReadonly();
    public readonly yAxisRegistration: Signal<ChartYAxisRegistration | null> = computed(() => this.#yAxes()[0] ?? null);

    public constructor() {
        this.#styleResolver = new ChartStyleResolver(this.#elementRef.nativeElement);
        this.#animationController = new ChartAnimationController(new BrowserAnimationClock());
        this.#renderScheduler = new ChartRenderScheduler(reason => this.#recomputeAndPaint(reason));
        this.#synchronizationController = new ChartSynchronizationController(
            this.#synchronizationCoordinator,
            {
                getBaseDomainSignature: () => null,
                getCoordinateSpace: () =>
                    this.#cartesianLayoutRuntime?.baseCoordinateSpace ??
                    this.cartesianXYScene()?.coordinateSpace ??
                    null,
                getNavigationOptions: () => ({
                    clampToData: this.normalizedNavigation().clampToData,
                    constraints: this.normalizedNavigation().constraints,
                    linkGroups: this.normalizedNavigation().linkGroups,
                    minVisibleCategories: this.normalizedNavigation().minVisibleCategories
                }),
                getCrosshairSceneContext: () => {
                    const scene = this.cartesianXYScene();
                    if (!scene || !scene.coordinateSpace) {
                        return null;
                    }
                    return {
                        axisScenes: scene.axes,
                        coordinateSpace: scene.coordinateSpace,
                        plotRect: scene.plotRect,
                        primaryXAxisId: scene.primaryXAxisId ?? "default-x",
                        primaryYAxisId: scene.primaryYAxisId ?? "default-y",
                        resolveNearestPoint: (
                            pixel: ChartPoint,
                            dimension: "x" | "y" | "xy" = "xy",
                            mappedXAxisId?: string,
                            mappedYAxisId?: string
                        ) => {
                            const sc = this.cartesianXYScene();
                            if (!sc) return null;
                            const res = resolveSynchronizationLocalTarget({
                                anchor: pixel,
                                dimension,
                                mappedXAxisId,
                                mappedYAxisId,
                                scene: sc,
                                sharedTooltip: this.#tooltip()?.shared() ?? false
                            });
                            if (!res) return null;
                            return { point: res.nearestAnchor, xValue: res.xValue, yValue: res.yValue };
                        },
                        xTimeSpanMs: scene.xTimeSpanMs
                    };
                },
                getPrimaryAxisIds: () => {
                    const scene = this.cartesianXYScene();
                    if (!scene) return null;
                    return {
                        x: scene.primaryXAxisId ?? "default-x",
                        y: scene.primaryYAxisId ?? "default-y"
                    };
                },
                getViewport: () => this.#effectiveViewportState(),
                isControlled: () => this.viewport() !== undefined,
                onRemoteCrosshairState: state => this.#applyRemoteCrosshairState(state),
                onSyncViewportCommit: (state, changedAxes, phase) =>
                    this.#applySyncViewportCommit(state, changedAxes, phase),
                onSyncViewportProposal: (state, changedAxes, phase) =>
                    this.#emitSyncViewportProposal(state, changedAxes, phase)
            },
            this.#warnedDiagnosticSignatures
        );

        // Synchronization group membership follows the normalized synchronization options
        effect(() => {
            const syncOptions = this.normalizedSynchronization();
            untracked(() => {
                this.#synchronizationController?.setOptions(syncOptions);
                if (!syncOptions?.crosshair.showTooltip && this.crosshairState()?.source === "sync") {
                    this.tooltipContext.set(null);
                    this.tooltipPosition.set(null);
                }
            });
        });

        if (typeof window !== "undefined" && window.matchMedia) {
            this.#mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
            this.#mediaQueryListener = (e: MediaQueryListEvent) => {
                if (e.matches && this.#animationController.isRunning()) {
                    this.#animationController.cancel("finish-target");
                }
            };
            this.#mediaQueryList.addEventListener("change", this.#mediaQueryListener);
        }

        // A hover tooltip can be dismissed with Escape without moving the pointer, wherever the focus is.
        const onDocumentKeyDown = (event: KeyboardEvent): void => this.#dismissPointerTooltip(event);
        if (this.#isBrowser) {
            this.#document.addEventListener("keydown", onDocumentKeyDown);
        }

        this.#destroyRef.onDestroy(() => {
            this.#document.removeEventListener("keydown", onDocumentKeyDown);
            this.#isDestroyed = true;
            this.#canvasContext = null;
            this.#unwatchDevicePixelRatio();
            releaseCartesianLayoutRuntime(this.#cartesianLayoutRuntime, "destroy");
            this.#cartesianLayoutRuntime = null;
            this.#synchronizationController?.destroy();
            this.#synchronizationController = null;
            this.#cancelPendingPointerInteraction();
            this.#cancelBrushAuthority("destroyed");
            this.#renderScheduler.cancel();
            this.#gestureController?.destroy();
            this.#gestureController = null;
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
            if (this.#initialMeasurementFrameId !== null) {
                cancelAnimationFrame(this.#initialMeasurementFrameId);
                this.#initialMeasurementFrameId = null;
            }
            if (this.#resizeObserver) {
                this.#resizeObserver.disconnect();
                this.#resizeObserver = null;
            }
            this.#resizeObserverTarget = null;
            if (this.#labelResizeObserver) {
                this.#labelResizeObserver.disconnect();
                this.#labelResizeObserver = null;
            }
            this.#observedLabelElements.clear();
            this.#labelMeasurements.clear();
            if (this.#overlayLabelResizeObserver) {
                this.#overlayLabelResizeObserver.disconnect();
                this.#overlayLabelResizeObserver = null;
            }
            this.#observedOverlayLabelElements.clear();
            this.#overlayLabelMeasurements.clear();
            if (this.#dataLabelResizeObserver) {
                this.#dataLabelResizeObserver.disconnect();
                this.#dataLabelResizeObserver = null;
            }
            this.#observedDataLabelElements.clear();
            this.#dataLabelMeasurements.clear();
            if (this.#themeObserver) {
                this.#themeObserver.disconnect();
                this.#themeObserver = null;
            }
            if (this.#renderBackend) {
                this.#renderBackend.destroy();
                this.#renderBackend = null;
            }
            this.#renderScene = null;
            this.scene.set(null);
            for (const ctrl of this.#activeExportControllers) {
                ctrl.abort();
            }
            this.#activeExportControllers.clear();
        });

        // Dynamic backend synchronization
        // A locale change (MonaI18nService.load), new messages or a new direction reformat every label and restyle in
        // place.
        let isLocaleApplied = false;
        effect(() => {
            const direction = this.#direction();
            const localeId = this.#i18n.localeId();
            const messages = this.messages();
            untracked(() => {
                setChartLocale(localeId, messages, direction);
                if (isLocaleApplied) {
                    this.invalidate(ChartInvalidationReason.Style);
                }
                isLocaleApplied = true;
            });
        });

        effect(() => {
            const mode = this.renderer();
            const canvas = this.canvasElement()?.nativeElement ?? null;
            const svg = this.svgElement()?.nativeElement ?? null;

            untracked(() => {
                if (this.#renderBackend && this.#renderBackend.kind === mode) {
                    return;
                }

                if ((mode === "canvas" && canvas) || (mode === "svg" && svg)) {
                    this.#setupRenderBackend(mode, canvas, svg);
                }
            });
        });

        // Diagnostic duplicate seriesKey check
        effect(() => {
            const seriesList = this.#registeredSeries();
            const seenKeys = new Map<string, string>();
            for (const s of seriesList) {
                if (
                    "seriesKey" in s &&
                    typeof (s as { seriesKey?: () => string | undefined }).seriesKey === "function"
                ) {
                    const raw = (s as { seriesKey?: () => string | undefined }).seriesKey!();
                    const norm = normalizeSeriesKey(raw);
                    if (norm) {
                        if (seenKeys.has(norm)) {
                            if (typeof ngDevMode !== "undefined" && ngDevMode) {
                                const sig = `duplicate-seriesKey:${norm}`;
                                if (!this.#warnedDiagnosticSignatures.has(sig)) {
                                    this.#warnedDiagnosticSignatures.add(sig);
                                    console.warn(
                                        `[Mona Chart] Duplicate seriesKey "${norm}" detected among series. Provide unique seriesKey values to guarantee distinct mark identities across updates.`
                                    );
                                }
                            }
                        } else {
                            seenKeys.set(norm, s.id);
                        }
                    }
                }
            }
        });

        // Brush authority retirement on configuration property changes during active brush/candidate
        let lastBrushActivation: unknown = undefined;
        let lastBrushMode: unknown = undefined;
        let lastBrushHitPolicy: unknown = undefined;
        let lastBrushXAxisId: unknown = undefined;
        let lastBrushYAxisId: unknown = undefined;
        let lastBrushSelectionBehavior: unknown = undefined;
        let lastBrushMinDragDistance: unknown = undefined;
        let initialBrushTracking = true;

        effect(() => {
            const brushReg = this.#brush();
            if (!brushReg) {
                lastBrushActivation = undefined;
                lastBrushMode = undefined;
                lastBrushHitPolicy = undefined;
                lastBrushXAxisId = undefined;
                lastBrushYAxisId = undefined;
                lastBrushSelectionBehavior = undefined;
                lastBrushMinDragDistance = undefined;
                initialBrushTracking = true;
                return;
            }

            const activation = brushReg.activation?.();
            const mode = brushReg.mode?.();
            const hitPolicy = brushReg.hitPolicy?.();
            const xAxisId = brushReg.xAxisId?.();
            const yAxisId = brushReg.yAxisId?.();
            const selectionBehavior = brushReg.selectionBehavior?.();
            const minDragDistance = brushReg.minDragDistance?.();
            const enabled = brushReg.enabled?.();

            if (enabled === false) {
                this.#cancelBrushAuthority("disabled");
            }

            if (!initialBrushTracking && this.#brushGestureController.activeSession !== null) {
                if (
                    activation !== lastBrushActivation ||
                    mode !== lastBrushMode ||
                    hitPolicy !== lastBrushHitPolicy ||
                    xAxisId !== lastBrushXAxisId ||
                    yAxisId !== lastBrushYAxisId ||
                    selectionBehavior !== lastBrushSelectionBehavior ||
                    minDragDistance !== lastBrushMinDragDistance
                ) {
                    this.#cancelBrushAuthority("authority-change");
                }
            }

            lastBrushActivation = activation;
            lastBrushMode = mode;
            lastBrushHitPolicy = hitPolicy;
            lastBrushXAxisId = xAxisId;
            lastBrushYAxisId = yAxisId;
            lastBrushSelectionBehavior = selectionBehavior;
            lastBrushMinDragDistance = minDragDistance;
            initialBrushTracking = false;
        });

        // Invalidate when data inputs change
        let initialData = true;
        let lastDataRef: unknown = undefined;
        effect(() => {
            const curData = this.data();
            this.xField();
            this.downsampling();
            if (initialData) {
                initialData = false;
                lastDataRef = curData;
                return;
            }
            if (curData !== lastDataRef) {
                lastDataRef = curData;
                this.#cancelBrushAuthority("data-change");
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
                if (this.#pendingLabelMeasurementReason !== 0) {
                    const r = this.#pendingLabelMeasurementReason;
                    this.#pendingLabelMeasurementReason = 0;
                    this.invalidate(r as ChartInvalidationReason);
                }
                this.#paint();
            }
        });

        // Sync external viewport model changes to internal state
        effect(() => {
            const extViewport = this.viewport();
            const baseCoord =
                this.#cartesianLayoutRuntime?.baseCoordinateSpace ?? this.cartesianXYScene()?.coordinateSpace;
            if (extViewport !== undefined) {
                if (baseCoord) {
                    const normalized = normalizeViewportState(extViewport, baseCoord, {
                        clampToData: this.normalizedNavigation().clampToData,
                        constraints: this.normalizedNavigation().constraints,
                        minVisibleCategories: this.normalizedNavigation().minVisibleCategories,
                        warnedSignatures: this.#warnedDiagnosticSignatures
                    });
                    const prev = this.#lastNormalizedControlledViewport;
                    if (prev && areInternalViewportStatesEqual(prev, normalized)) {
                        return;
                    }
                    const acknowledgedInbound =
                        this.#synchronizationController?.consumeAcknowledgedInbound(normalized) ?? false;
                    this.#retireTransientInteractionForViewportChange();
                    this.#lastNormalizedControlledViewport = normalized;
                    this.invalidate(ChartInvalidationReason.Viewport);
                    this.#notifyCommittedViewport({
                        acknowledgedInbound,
                        changedAxes: diffInternalViewportStates(prev ?? undefined, normalized).changedAxes,
                        phase: "end",
                        source: "programmatic"
                    });
                }
            } else {
                if (this.#lastNormalizedControlledViewport !== null) {
                    this.#retireTransientInteractionForViewportChange();
                    this.#uncontrolledViewportState.set(this.#lastNormalizedControlledViewport);
                    this.#lastNormalizedControlledViewport = null;
                    this.invalidate(ChartInvalidationReason.Viewport);
                }
            }
        });

        // Invalidate or re-resolve tooltip when tooltip inputs or registration change
        effect(() => {
            const tt = this.#tooltip();
            if (tt) {
                tt.enabled();
                tt.shared();
            }
            untracked(() => {
                this.#reconcilePointerInteractionFeaturesFromRetainedPointer();
            });
        });

        // Invalidate or re-resolve crosshair when crosshair inputs or registration change
        effect(() => {
            const ch = this.#crosshair();
            if (ch) {
                ch.enabled();
                ch.mode();
                ch.snap();
                ch.xAxisId();
                ch.yAxisId();
                ch.maxSnapDistance();
            }
            untracked(() => {
                const enabled = ch ? ch.enabled() !== false : false;
                if (!enabled) {
                    this.#synchronizationController?.publishLocalCrosshair(null);
                    this.#synchronizationController?.dropRemoteCrosshairPresentation();
                }
                this.#reconcilePointerInteractionFeaturesFromRetainedPointer();
            });
        });

        // Update gesture controller when cartesian XY scene or navigation options change
        effect(() => {
            this.#updateGestureController();
        });

        // Reconcile selection controlled/uncontrolled state transitions and mode changes
        effect(() => {
            const selReg = this.#selection();
            if (!selReg) {
                this.#lastControlledSelection = undefined;
                this.#lastSelectionMode = undefined;
                return;
            }
            const mode = selReg.mode?.() ?? "single";
            const controlled = selReg.selectedMarkIds?.();
            if (controlled !== undefined) {
                this.#lastControlledSelection = ChartSelectionController.normalizeForMode(controlled, mode);
            } else if (this.#lastControlledSelection !== undefined) {
                const seeded = this.#lastControlledSelection;
                this.#lastControlledSelection = undefined;
                this.#internalSelectedMarkIds.set(seeded);
            }

            if (controlled === undefined) {
                if (this.#lastSelectionMode === "multiple" && mode === "single") {
                    const current = this.#internalSelectedMarkIds();
                    const normalized = ChartSelectionController.normalizeForMode(current, "single");
                    if (normalized.length !== current.length) {
                        this.#internalSelectedMarkIds.set(normalized);
                        const changeEvt = ChartSelectionController.buildChangeEvent(
                            "programmatic",
                            { added: [], next: normalized, removed: current.filter(id => !normalized.includes(id)) },
                            current,
                            this.visibleMarkIndex(),
                            undefined,
                            this.cartesianXYScene()
                        );
                        selReg.emitSelectionChange?.(changeEvt);
                    }
                }
                this.#lastSelectionMode = mode;
            }
        });

        // Warn if brush has selectionBehavior without selection component
        effect(() => {
            const brushReg = this.#brush();
            const selReg = this.#selection();
            if (brushReg) {
                const behavior = brushReg.selectionBehavior?.() ?? "none";
                if (behavior !== "none" && !selReg && !this.#hasWarnedBrushWithoutSelection) {
                    this.#hasWarnedBrushWithoutSelection = true;
                    if (typeof ngDevMode !== "undefined" && ngDevMode) {
                        console.warn(
                            `[Mona Chart] mona-chart-brush specifies selectionBehavior="${behavior}" but no <mona-chart-selection> component is present.`
                        );
                    }
                }
            }
        });

        afterNextRender(() => {
            const oldWidth = this.#currentWidth;
            const oldHeight = this.#currentHeight;
            this.#initCanvasAndObserver();
            const mode = this.renderer();
            const canvas = this.canvasElement()?.nativeElement ?? null;
            const svg = this.svgElement()?.nativeElement ?? null;
            this.#setupRenderBackend(mode, canvas, svg);
            this.#canvasReady = true;
            this.#watchDevicePixelRatio();
            if (!this.scene()) {
                this.#renderScheduler.flushWithDefault(ChartInvalidationReason.Data | ChartInvalidationReason.Size);
            } else if (this.#currentWidth !== oldWidth || this.#currentHeight !== oldHeight) {
                this.#renderScheduler.flushWithDefault(ChartInvalidationReason.Size);
            } else {
                this.#renderScheduler.flush();
                this.#paint();
            }
        });
    }

    #applyGestureViewportEvent(nextState: InternalCartesianViewportState, event: ChartViewportChangeEvent): void {
        if (this.#isDestroyed) return;
        this.#retireTransientInteractionForViewportChange();
        this.viewportChange.emit(event);

        const isControlled = this.viewport() !== undefined;
        if (!isControlled && event.phase === "update") {
            this.#uncontrolledViewportState.set(nextState);
            this.invalidate(ChartInvalidationReason.Viewport);
            this.#notifyCommittedViewport({
                changedAxes: event.changedAxes,
                phase: "update",
                source: event.source
            });
        }
    }

    /**
     * Applies an inbound synchronized crosshair presentation.
     * Local pointer/keyboard interaction always outranks remote state, so the
     * remote state is cached and only displayed while no local interaction owns the crosshair.
     */
    #applyRemoteCrosshairState(state: ChartCrosshairState | null): void {
        if (this.#isDestroyed) return;
        const crosshairEnabled = this.#crosshair()?.enabled() !== false && this.#crosshair() !== null;
        if (!crosshairEnabled) {
            return;
        }
        const localActive =
            this.#interactionOwner === "tooltip" ||
            this.#interactionOwner === "crosshair" ||
            this.#interactionOwner === "keyboard";
        if (localActive || (this.crosshairState() !== null && this.crosshairState()?.source !== "sync")) {
            // Local presentation wins; keep the remote state cached for restore on local leave.
            return;
        }
        this.crosshairState.set(state);
        this.#paint();

        const syncOptions = this.normalizedSynchronization();
        if (syncOptions?.crosshair.showTooltip && state) {
            const sc = this.cartesianXYScene();
            if (sc) {
                const dimension: "x" | "y" | "xy" = state.x && state.y ? "xy" : state.x ? "x" : "y";
                const res = resolveSynchronizationLocalTarget({
                    anchor: state.anchor,
                    dimension,
                    mappedXAxisId: state.x?.axisId,
                    mappedYAxisId: state.y?.axisId,
                    scene: sc,
                    sharedTooltip: this.#tooltip()?.shared() ?? false
                });
                if (res && res.primaryHit) {
                    this.tooltipPosition.set(res.nearestAnchor);
                    this.tooltipContext.set(
                        this.#buildTooltipContext(res.sharedHits, this.#resolveSharedTooltip(sc), res.primaryHit)
                    );
                } else {
                    this.tooltipContext.set(null);
                    this.tooltipPosition.set(null);
                }
            }
        } else if (state === null && !localActive) {
            if (this.tooltipContext()) {
                this.tooltipContext.set(null);
                this.tooltipPosition.set(null);
            }
        }
    }

    #applySyncViewportCommit(
        state: InternalCartesianViewportState,
        changedAxes: readonly ChartViewportAxisRef[],
        phase: ChartViewportChangePhase
    ): void {
        if (this.#isDestroyed) return;
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const previousState = this.#effectiveViewportState();
        const resolvedAxisMap = sc.coordinateSpace.toResolvedAxisInfoMap();
        const publicState = toPublicViewportState(state, resolvedAxisMap);

        this.#retireTransientInteractionForViewportChange();
        this.#uncontrolledViewportState.set(state);
        this.viewportChange.emit({
            changedAxes,
            phase,
            previousViewport: toPublicViewportState(previousState, resolvedAxisMap),
            source: "sync",
            viewport: publicState
        });
        this.invalidate(ChartInvalidationReason.Viewport);
    }

    #applyViewportUpdate(
        nextState: InternalCartesianViewportState,
        source: ChartViewportChangeSource,
        phase: ChartViewportChangePhase,
        changedAxes?: readonly ChartViewportAxisRef[]
    ): void {
        if (this.#isDestroyed) return;
        this.#retireTransientInteractionForViewportChange();
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const resolvedAxisMap = sc.coordinateSpace.toResolvedAxisInfoMap();
        const previousState = this.#effectiveViewportState();
        const prevPublicState = toPublicViewportState(previousState, resolvedAxisMap);
        const publicState = toPublicViewportState(nextState, resolvedAxisMap);

        const isControlled = this.viewport() !== undefined;

        this.viewportChange.emit({
            changedAxes: changedAxes ?? [],
            phase,
            previousViewport: prevPublicState,
            source,
            viewport: publicState
        });

        if (!isControlled) {
            this.#uncontrolledViewportState.set(nextState);
            this.invalidate(ChartInvalidationReason.Viewport);
            this.#notifyCommittedViewport({
                changedAxes: changedAxes ?? [],
                phase,
                source
            });
        } else {
            // Controlled charts publish only after the parent accepts via the viewport input.
        }
    }

    #beginInteractionAuthorityChange(): void {
        this.#cancelPendingPointerInteraction();
        this.#cancelBrushAuthority("authority-change");
        this.#gestureController?.abortForAuthorityChange();
        this.#takeGestureClickSuppression();
        this.#retireInteractionAuthority({ repaintIfVisual: false });
        this.#interactionRevision++;
    }

    #buildTooltipContext(
        hits: readonly SceneHitTarget[],
        shared: boolean,
        primaryHit?: SceneHitTarget
    ): ChartTooltipTemplateContext {
        const seriesItems = this.legendItems();
        const xAxes = this.#xAxes();
        const yAxes = this.#yAxes();

        const pointContexts: ChartTooltipPointContext[] = hits.map(hit => {
            const seriesItem = seriesItems.find(
                s => s.itemId === hit.sliceId || s.itemId === hit.itemId || s.seriesId === hit.seriesId
            );
            const color = hit.color ?? seriesItem?.color ?? "#3b82f6";
            const hitXAxis = (hit.xAxisId ? xAxes.find(a => a.axisId?.() === hit.xAxisId) : undefined) ?? xAxes[0];
            const hitYAxis = (hit.yAxisId ? yAxes.find(a => a.axisId?.() === hit.yAxisId) : undefined) ?? yAxes[0];
            const xFormatter = hitXAxis?.formatter();
            const yFormatter = hitYAxis?.formatter();
            const xAxisType = hitXAxis?.type();
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
                        : (hit.hierarchy?.aggregateValue ?? hit.yValue)),
                valueKind:
                    hit.valueKind ??
                    (isRange ? "range" : hit.financial ? "ohlc" : hit.waterfall ? "waterfall" : "scalar"),
                waterfall: hit.waterfall,
                xAxisId: hit.xAxisId,
                xAxisTitle: hit.xAxisTitle,
                xValue: hit.xValue,
                yAxisId: hit.yAxisId,
                yAxisTitle: hit.yAxisTitle,
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

    #cancelBrushAuthority(reason: ChartBrushCancelReason, options?: { element?: HTMLElement; silent?: boolean }): void {
        this.#cancelPendingBrushFrame();
        this.#hasEmittedBrushStart = false;

        const session = this.#brushGestureController.activeSession;
        const brushReg = this.#brush();
        const hadBounds = this.#activeBrushBounds() !== null;
        const wasBrushing = this.#brushGestureController.cancel(
            options?.element ?? this.#getSurfaceElement() ?? undefined
        );
        this.#activeBrushBounds.set(null);

        if (!options?.silent && (wasBrushing || hadBounds) && brushReg) {
            brushReg.emitBrushChange?.({
                cancelReason: reason,
                mode: session?.target.mode ?? session?.mode ?? brushReg.mode?.() ?? "xy",
                phase: "cancel",
                pixelBounds: null
            });
            this.#paint();
        }
    }

    #cancelPendingBrushFrame(): void {
        if (this.#pendingBrushRafId !== null && typeof cancelAnimationFrame !== "undefined") {
            cancelAnimationFrame(this.#pendingBrushRafId);
            this.#pendingBrushRafId = null;
        }
        this.#pendingBrushFrame = null;
    }

    #cancelPendingPointerInteraction(): void {
        if (this.#pointerFrameId !== null) {
            cancelAnimationFrame(this.#pointerFrameId);
            this.#pointerFrameId = null;
        }
        this.#pendingPointerEvent = null;
    }

    #clearInteraction(): void {
        this.#retireInteractionAuthority({ repaintIfVisual: true });
    }

    #clearInteractionState(): void {
        this.#activeKeyboardBucketIndex = -1;
        this.#activeKeyboardHitKey = null;
        this.#activeKeyboardNamespace = null;
        this.#activeKeyboardSeriesId = null;
        this.#lastPointerResolution = null;
        this.#lastInteractionSource = null;
        this.#interactionState = null;
        this.#interactionOwner = null;
        this.crosshairState.set(null);
        this.tooltipContext.set(null);
        this.tooltipPosition.set(null);
    }

    #clearTransientInteractionOwnedBy(owner: Exclude<ChartTransientInteractionOwner, null>): boolean {
        if (this.#interactionOwner === owner) {
            this.#interactionState = null;
            this.#interactionOwner = null;
            return true;
        }
        return false;
    }

    #effectiveViewportState(): InternalCartesianViewportState {
        const controlled = this.viewport();
        if (controlled !== undefined) {
            if (this.#lastNormalizedControlledViewport !== null) {
                return this.#lastNormalizedControlledViewport;
            }
            const baseCoord =
                this.#cartesianLayoutRuntime?.baseCoordinateSpace ?? this.cartesianXYScene()?.coordinateSpace;
            if (baseCoord) {
                const norm = normalizeViewportState(controlled, baseCoord, {
                    clampToData: this.normalizedNavigation().clampToData,
                    constraints: this.normalizedNavigation().constraints,
                    minVisibleCategories: this.normalizedNavigation().minVisibleCategories,
                    warnedSignatures: this.#warnedDiagnosticSignatures
                });
                this.#lastNormalizedControlledViewport = norm;
                return norm;
            }
        }
        return this.#uncontrolledViewportState();
    }

    #emitSyncViewportProposal(
        state: InternalCartesianViewportState,
        changedAxes: readonly ChartViewportAxisRef[],
        phase: ChartViewportChangePhase
    ): void {
        if (this.#isDestroyed) return;
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const previousState = this.#effectiveViewportState();
        const resolvedAxisMap = sc.coordinateSpace.toResolvedAxisInfoMap();

        this.viewportChange.emit({
            changedAxes,
            phase,
            previousViewport: toPublicViewportState(previousState, resolvedAxisMap),
            source: "sync",
            viewport: toPublicViewportState(state, resolvedAxisMap)
        });
    }

    #flushBrushPresentationFrame(): void {
        const frame = this.#pendingBrushFrame;
        this.#pendingBrushFrame = null;
        if (!frame) {
            return;
        }

        const brushReg = this.#brush();
        if (!brushReg) {
            return;
        }

        this.#cancelPendingPointerInteraction();
        this.#retireInteractionAuthority({ repaintIfVisual: false });
        this.#activeBrushBounds.set(frame.result.bounds);

        const ranges = frame.scene.coordinateSpace
            ? CartesianBrushRangeResolver.resolve(frame.result.bounds, frame.scene.coordinateSpace, frame.target)
            : {};

        if (frame.phase === "start") {
            this.#hasEmittedBrushStart = true;
        }

        brushReg.emitBrushChange?.({
            mode: frame.target.mode,
            phase: frame.phase,
            pixelBounds: frame.result.bounds,
            xRange: ranges.xRange,
            yRange: ranges.yRange
        });

        this.#paint();
    }

    #flushPendingBrushFrameNow(): void {
        if (this.#pendingBrushRafId !== null && typeof cancelAnimationFrame !== "undefined") {
            cancelAnimationFrame(this.#pendingBrushRafId);
            this.#pendingBrushRafId = null;
        }
        if (this.#pendingBrushFrame) {
            this.#flushBrushPresentationFrame();
        }
    }

    #formatHitAnnouncement(matchingHit: SceneHitTarget): string {
        const xStr =
            matchingHit.formattedXValue ?? (matchingHit.xValue !== undefined ? String(matchingHit.xValue) : "");
        const yStr = matchingHit.formattedValue ?? (matchingHit.yValue !== undefined ? String(matchingHit.yValue) : "");
        const isRange = matchingHit.range || matchingHit.fromValue !== undefined || matchingHit.toValue !== undefined;
        const fromStr =
            matchingHit.formattedFrom ?? (matchingHit.fromValue !== undefined ? String(matchingHit.fromValue) : "");
        const toStr = matchingHit.formattedTo ?? (matchingHit.toValue !== undefined ? String(matchingHit.toValue) : "");
        const messages = this.messages();
        if (isRange && fromStr && toStr) {
            const title = messages.labeledValue(matchingHit.seriesName, xStr);
            return messages.rangeDescription(title, fromStr, toStr);
        }
        return messages.labeledValue(
            matchingHit.seriesName,
            joinChartAnnouncement([xStr, yStr], messages.announcementSeparator)
        );
    }

    /** Matches the marks inside a finished brush, applies its selection behavior and emits the `end` phase. */
    #commitBrush(
        xyScene: CartesianXYChartScene,
        brushReg: ChartBrushRegistration,
        bounds: ChartRect,
        target: ResolvedCartesianBrushTarget,
        hitPolicy: ChartBrushHitPolicy,
        selectionBehavior: ChartBrushSelectionBehavior,
        ranges: { xRange?: ChartBrushAxisRange; yRange?: ChartBrushAxisRange }
    ): number {
        const markIndex = this.#getOrCreateBrushMarkIndex(xyScene);
        const ordinaryBrushHits = markIndex.query(
            bounds,
            hitPolicy,
            target,
            undefined,
            undefined,
            undefined,
            xyScene.primaryXAxisId,
            xyScene.primaryYAxisId
        );
        // Dense raw range providers keep exact brush semantics over
        // unsampled source points (§68/§70). Explicit exact results
        // may legitimately be O(M); they are never truncated.
        const matchedHits = mergeBrushHitsByIdentity(
            ordinaryBrushHits,
            collectDenseBrushHits(xyScene, bounds, target),
            {
                seriesOrdinalById: new Map(xyScene.series.map((series, index) => [series.id, index]))
            }
        );
        const matchedMarkIds = matchedHits.map(h => ChartMarkIdentityResolver.resolve(h));
        const matchedPoints = matchedHits.map(h => toSelectedPoint(h, xyScene));

        const selReg = this.#selection();
        if (selectionBehavior !== "none" && selReg && selReg.enabled?.() !== false) {
            const currentSelected = this.effectiveSelectedMarkIds();
            const mode = selReg.mode?.() ?? "single";
            const mutation = ChartSelectionController.applyBrush(
                currentSelected,
                matchedMarkIds,
                selectionBehavior,
                mode
            );
            if (mutation.added.length > 0 || mutation.removed.length > 0) {
                if (selReg.selectedMarkIds?.() === undefined) {
                    this.#internalSelectedMarkIds.set(mutation.next);
                }
                const changeEvt = ChartSelectionController.buildChangeEvent(
                    "brush",
                    mutation,
                    currentSelected,
                    this.visibleMarkIndex(),
                    matchedHits,
                    xyScene
                );
                selReg.emitSelectionChange?.(changeEvt);
            }
        }

        brushReg.emitBrushChange?.({
            matchedMarkIds,
            matchedPoints,
            mode: target.mode,
            phase: "end",
            pixelBounds: bounds,
            xRange: ranges.xRange,
            yRange: ranges.yRange
        });
        return matchedMarkIds.length;
    }

    /**
     * With a brush, Shift+arrow from a focused point moves the focus and extends a brush from where it started; Enter
     * commits the brush and Escape cancels it. Returns whether it handled the key.
     */
    #handleKeyboardBrush(event: KeyboardEvent, scene: ChartScene): boolean {
        const brushReg = this.#brush();
        if (
            !brushReg ||
            brushReg.enabled?.() === false ||
            scene.coordinateSystem !== "cartesian" ||
            scene.cartesianKind !== "xy"
        ) {
            this.#keyboardBrushAnchor = null;
            return false;
        }
        const xyScene = scene as CartesianXYChartScene;
        if (this.#keyboardBrushAnchor && this.#activeBrushBounds() === null) {
            // A layout, viewport or pointer change canceled the brush.
            this.#keyboardBrushAnchor = null;
        }
        const anchor = this.#keyboardBrushAnchor;
        const messages = this.messages();

        if (anchor && event.key === "Enter") {
            event.preventDefault();
            const bounds = this.#activeBrushBounds() as ChartRect;
            const target = CartesianBrushTargetResolver.resolve(xyScene, brushReg);
            const ranges = xyScene.coordinateSpace
                ? CartesianBrushRangeResolver.resolve(bounds, xyScene.coordinateSpace, target)
                : {};
            this.#keyboardBrushAnchor = null;
            this.#activeBrushBounds.set(null);
            const count = this.#commitBrush(
                xyScene,
                brushReg,
                bounds,
                target,
                brushReg.hitPolicy?.() ?? "intersect",
                brushReg.selectionBehavior?.() ?? "none",
                ranges
            );
            this.#announce(messages.brushApplied(count));
            this.#paint();
            return true;
        }
        if (anchor && event.key === "Escape") {
            event.preventDefault();
            this.#keyboardBrushAnchor = null;
            this.#cancelBrushAuthority("escape");
            this.#announce(messages.brushCleared);
            return true;
        }

        const focused = this.#interactionState?.source === "keyboard" ? this.#interactionState.activeHitTarget : null;
        if (!event.shiftKey || !ARROW_KEYS.has(event.key) || !focused) {
            return false;
        }
        event.preventDefault();
        const navResult = ChartKeyboardNavigation.handleKeyDown(
            event,
            scene,
            this.#activeKeyboardBucketIndex,
            this.#activeKeyboardSeriesId,
            this.#activeKeyboardHitKey,
            this.#activeKeyboardNamespace
        );
        if (navResult) {
            this.#setKeyboardSelection(
                navResult.bucketIndex,
                navResult.seriesId,
                navResult.hitKey,
                navResult.namespace
            );
        }
        const current = this.#interactionState?.activeHitTarget ?? focused;
        const start = anchor ?? focused;
        const target = CartesianBrushTargetResolver.resolve(xyScene, brushReg);
        const bounds = keyboardBrushBounds(start, current, xyScene.plotRect, target.mode);
        const ranges = xyScene.coordinateSpace
            ? CartesianBrushRangeResolver.resolve(bounds, xyScene.coordinateSpace, target)
            : {};
        if (!anchor) {
            this.#keyboardBrushAnchor = start;
            brushReg.emitBrushChange?.({
                mode: target.mode,
                phase: "start",
                pixelBounds: bounds,
                xRange: ranges.xRange,
                yRange: ranges.yRange
            });
        }
        brushReg.emitBrushChange?.({
            mode: target.mode,
            phase: "update",
            pixelBounds: bounds,
            xRange: ranges.xRange,
            yRange: ranges.yRange
        });
        this.#activeBrushBounds.set(bounds);
        this.#paint();
        const label = (hit: SceneHitTarget): string =>
            hit.formattedCategory ?? hit.formattedXValue ?? String(hit.xValue ?? "");
        this.#announce(messages.brushRange(label(start), label(current)));
        return true;
    }

    /** Escape anywhere hides a tooltip the pointer opened, unless something else handled the key. */
    #dismissPointerTooltip(event: KeyboardEvent): void {
        if (event.key !== "Escape" || event.defaultPrevented) {
            return;
        }
        if (this.#interactionState?.source !== "pointer" || this.tooltipContext() === null) {
            return;
        }
        this.#cancelPendingPointerInteraction();
        this.#clearInteraction();
    }

    #getOrCreateBrushMarkIndex(scene: CartesianXYChartScene): CartesianBrushMarkIndex {
        if (this.#brushMarkIndexScene !== scene || !this.#brushMarkIndex) {
            this.#brushMarkIndex = new CartesianBrushMarkIndex();
            if (scene.hitTargets) {
                this.#brushMarkIndex.build(scene.hitTargets);
            }
            this.#brushMarkIndexScene = scene;
        }
        return this.#brushMarkIndex;
    }

    #getReferenceLineAnchorFraction(line: SceneReferenceLine): LabelAnchorFraction {
        if (line.axis === "x") {
            switch (line.label?.position) {
                case "start":
                    return { x: 0.5, y: 0 };
                case "center":
                    return { x: 0.5, y: 0.5 };
                case "end":
                default:
                    return { x: 0.5, y: 1 };
            }
        } else {
            switch (line.label?.position) {
                case "start":
                    return { x: 0, y: 0.5 };
                case "center":
                    return { x: 0.5, y: 0.5 };
                case "end":
                default:
                    return { x: 1, y: 0.5 };
            }
        }
    }

    #getSurfaceElement(): HTMLElement | null {
        return this.plotSurfaceElement()?.nativeElement ?? this.canvasElement()?.nativeElement ?? null;
    }

    #getPlotElement(): HTMLElement {
        return (
            this.plotSurfaceElement()?.nativeElement ||
            this.canvasElement()?.nativeElement.parentElement ||
            this.#elementRef.nativeElement
        );
    }

    #measurePlotElement(plotEl: HTMLElement): { height: number; width: number } | null {
        const rect = plotEl.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : plotEl.offsetWidth;
        const height = rect.height > 0 ? rect.height : plotEl.offsetHeight;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            return null;
        }
        return { height, width };
    }

    #applyMeasuredSize(width: number, height: number): boolean {
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            return false;
        }

        const wasPending = this.#initialMeasurementPending;
        const changed = Math.abs(width - this.#currentWidth) >= 0.5 || Math.abs(height - this.#currentHeight) >= 0.5;
        this.#currentWidth = width;
        this.#currentHeight = height;
        this.#initialMeasurementPending = false;
        const requiresRepaint = changed || wasPending;
        if (requiresRepaint) {
            this.#updateCanvasBackingStore(width, height);
        }
        return requiresRepaint;
    }

    #syncResizeObserverTarget(): HTMLElement {
        const plotEl = this.#getPlotElement();
        if (this.#resizeObserver && this.#resizeObserverTarget !== plotEl) {
            if (this.#resizeObserverTarget) {
                this.#resizeObserver.unobserve(this.#resizeObserverTarget);
            }
            this.#resizeObserverTarget = plotEl;
            this.#resizeObserver.observe(plotEl);
        }
        return plotEl;
    }

    #scheduleInitialMeasurement(attempt = 0): void {
        if (
            !this.#initialMeasurementPending ||
            this.#initialMeasurementFrameId !== null ||
            typeof requestAnimationFrame === "undefined" ||
            attempt >= 3
        ) {
            return;
        }

        this.#initialMeasurementFrameId = requestAnimationFrame(() => {
            this.#initialMeasurementFrameId = null;
            if (this.#isDestroyed) {
                return;
            }

            const plotEl = this.#syncResizeObserverTarget();
            const measurement = this.#measurePlotElement(plotEl);
            if (measurement) {
                if (this.#applyMeasuredSize(measurement.width, measurement.height)) {
                    this.invalidate(ChartInvalidationReason.Size);
                }
                return;
            }

            this.#scheduleInitialMeasurement(attempt + 1);
        });
    }

    #initCanvasAndObserver(): void {
        const canvasRef = this.canvasElement();
        if (canvasRef?.nativeElement) {
            this.#canvasContext = canvasRef.nativeElement.getContext("2d");
        }

        const plotEl = this.#getPlotElement();

        // recomputeScene() can run this before the first render; the second call replaces the observers.
        this.#resizeObserver?.disconnect();
        this.#resizeObserver = null;
        this.#resizeObserverTarget = null;
        this.#themeObserver?.disconnect();
        this.#themeObserver = null;

        if (typeof ResizeObserver !== "undefined") {
            this.#resizeObserver = new ResizeObserver(entries => {
                this.#syncResizeObserverTarget();
                for (const entry of entries) {
                    const { height, width } = entry.contentRect;
                    if (width > 0 && height > 0 && this.#applyMeasuredSize(width, height)) {
                        this.invalidate(ChartInvalidationReason.Size);
                    }
                }
            });
            this.#syncResizeObserverTarget();
        }

        if (typeof MutationObserver !== "undefined") {
            // A class or style change on <html> or <body> (a theme switch, or a dialog's scroll block) only
            // restyles the chart when the styles it reads changed.
            this.#themeSignature = this.#captureThemeSignature();
            this.#themeObserver = new MutationObserver(() => {
                const signature = this.#captureThemeSignature();
                if (signature === this.#themeSignature) {
                    return;
                }
                this.#themeSignature = signature;
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
        const initialMeasurement = this.#measurePlotElement(plotEl);
        if (initialMeasurement) {
            this.#applyMeasuredSize(initialMeasurement.width, initialMeasurement.height);
        } else {
            this.#initialMeasurementPending = true;
            this.#scheduleInitialMeasurement();
        }
    }

    #normalizePointer(event: MouseEvent | PointerEvent): ChartPoint | null {
        const element = this.#getSurfaceElement();
        if (!element) {
            return null;
        }
        const rect = element.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    #notifyCommittedViewport(notification: ViewportCommitNotification): void {
        if (this.#isDestroyed) return;
        this.#synchronizationController?.onCommittedViewportChange(notification);
    }

    /**
     * Updates the live region. The same text again (Home twice, an edge) gets a trailing no-break space toggled, so
     * screen readers read it again instead of ignoring a region that didn't change.
     */
    #announce(text: string): void {
        const current = this.activeAccessibilityText();
        if (text && current.replace(/\u00a0$/, "") === text) {
            this.activeAccessibilityText.set(current.endsWith("\u00a0") ? text : `${text}\u00a0`);
            return;
        }
        this.activeAccessibilityText.set(text);
    }

    /** Announces a visibility toggle now and again after the layout it causes, which clears the live region. */
    #announceToggle(text: string): void {
        this.#announce(text);
        this.#announcementAfterLayout = text;
    }

    /** Lays out and formats what follows for this chart's locale, messages and direction. */
    #applyLocale(): void {
        setChartLocale(this.#i18n.localeId(), this.messages(), this.#direction());
    }

    /** The styles the chart reads from its host, as one string to compare between mutations. */
    #captureThemeSignature(): string {
        const snapshot = ChartStyleResolver.captureStyleSnapshot(this.#elementRef.nativeElement);
        let signature = "";
        for (const [name, value] of snapshot) {
            signature += `${name}:${value};`;
        }
        return signature;
    }

    #guardCallbacks(registration: object, owner: () => string): void {
        guardRegistrationCallbacks(registration, owner, (name, error) => this.#reportCallbackError(name, error));
    }

    #paint(): void {
        this.#applyLocale();
        const currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            return;
        }

        const isAnimating = this.#isAnimating();
        const selReg = this.#selection();
        const presentation: ChartRenderPresentationState = {
            activeBrushBounds: isAnimating ? null : this.#activeBrushBounds(),
            annotationBadgeAnchors: this.annotationBadgeAnchors(),
            brushRegistration: this.#brush(),
            cartesianDataLabels: isAnimating ? null : this.cartesianDataLabelScene(),
            cartesianOverlay: this.cartesianOverlayScene(),
            crosshair: this.crosshairState(),
            crosshairRegistration: this.#crosshair(),
            interaction: this.#interactionState,
            selectionOptions: selReg
                ? {
                      color: selReg.color?.(),
                      fillOpacity: selReg.fillOpacity?.(),
                      strokeWidth: selReg.strokeWidth?.()
                  }
                : null,
            selectionScene: isAnimating ? null : this.cartesianSelectionScene()
        };

        if (this.#renderBackend) {
            this.#renderBackend.render({
                presentation,
                scene: currentScene,
                styleResolver: this.#styleResolver
            });
        } else if (this.#canvasContext) {
            CanvasChartRenderer.render(this.#canvasContext, currentScene, presentation, this.#styleResolver);
        }
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

        const tooltip = this.#tooltip();
        const tooltipEnabled = tooltip ? tooltip.enabled() !== false : false;
        const crosshair = this.#crosshair();
        const crosshairEnabled = crosshair ? crosshair.enabled() !== false : false;

        if (!tooltipEnabled && !crosshairEnabled) {
            this.#clearInteraction();
            return;
        }

        this.#lastPointerResolution = {
            bucketHits: [],
            hitState: {
                activeHitTarget: null,
                activeHits: [],
                pointerPosition: pointer
            },
            nearestAnchor: null,
            pointer,
            primaryHit: null,
            snappedAnchor: null
        };
        this.#lastInteractionSource = "pointer";

        this.#reconcilePointerInteractionFeaturesFromRetainedPointer();
    }

    /** Reports an error from the app's callbacks (or the layout) through `ErrorHandler`, once per callback and message. */
    #reportCallbackError(source: string, error: unknown): void {
        const message = error instanceof Error ? error.message : String(error);
        const key = `${source}\u0000${message}`;
        if (this.#reportedCallbackErrors.has(key)) {
            return;
        }
        this.#reportedCallbackErrors.add(key);
        this.#errorHandler.handleError(new Error(`[MonaChart] The ${source} threw: ${message}`, { cause: error }));
    }

    /**
     * Recomputes and paints, keeping an error out of change detection: an error the guarded callbacks didn't catch is
     * reported, and the chart keeps the scene it had.
     */
    #recomputeAndPaint(reason: ChartInvalidationReason): void {
        if (this.#isDestroyed || !this.#isBrowser) {
            return;
        }
        this.#applyLocale();
        if (reason !== ChartInvalidationReason.Interaction) {
            this.#styleResolver.clearCache();
        }
        try {
            this.#recomputeAndPaintUnguarded(reason);
        } catch (error) {
            this.#reportCallbackError("layout", error);
        }
    }

    #recomputeAndPaintUnguarded(reason: ChartInvalidationReason): void {
        if (reason === ChartInvalidationReason.Interaction) {
            this.#paint();
            return;
        }

        if (this.#initialMeasurementPending || this.#currentWidth <= 0 || this.#currentHeight <= 0) {
            const measurement = this.#measurePlotElement(this.#getPlotElement());
            if (measurement) {
                this.#applyMeasuredSize(measurement.width, measurement.height);
            } else if (
                // SVG sector paths embed their measured center and radii. Painting the
                // fallback scene would leave those coordinates clipped if lazy layout
                // settles after the first render.
                this.renderer() === "svg" &&
                typeof ResizeObserver !== "undefined" &&
                this.#registeredSeries().some(series => series.type === "donut" || series.type === "pie")
            ) {
                this.#initialMeasurementPending = true;
                this.#scheduleInitialMeasurement();
                return;
            }
        }

        const previousScene = this.scene();
        const sizeChanged =
            !previousScene ||
            Math.abs(previousScene.width - this.#currentWidth) >= 0.5 ||
            Math.abs(previousScene.height - this.#currentHeight) >= 0.5;

        const isStructural =
            hasInvalidationReason(reason, ChartInvalidationReason.Data) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Layout) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Visibility);

        const isChromeOnly =
            (hasInvalidationReason(reason, ChartInvalidationReason.Chrome) ||
                (hasInvalidationReason(reason, ChartInvalidationReason.Size) && sizeChanged)) &&
            !isStructural &&
            !hasInvalidationReason(reason, ChartInvalidationReason.Style) &&
            this.#cartesianLayoutRuntime !== null;

        const isViewportOnly =
            hasInvalidationReason(reason, ChartInvalidationReason.Viewport) &&
            !isStructural &&
            !isChromeOnly &&
            !hasInvalidationReason(reason, ChartInvalidationReason.Style) &&
            this.#cartesianLayoutRuntime !== null;

        const isNonCartesianSizeChange =
            hasInvalidationReason(reason, ChartInvalidationReason.Size) &&
            sizeChanged &&
            this.#cartesianLayoutRuntime === null;

        const requiresSceneRefresh =
            isStructural ||
            isChromeOnly ||
            isNonCartesianSizeChange ||
            hasInvalidationReason(reason, ChartInvalidationReason.Style) ||
            hasInvalidationReason(reason, ChartInvalidationReason.Viewport) ||
            !this.scene();

        if (isStructural) {
            this.#clearInteractionState();
            this.activeAccessibilityText.set(this.#announcementAfterLayout ?? "");
            this.#announcementAfterLayout = null;
        }

        let newScene: ChartScene;
        if (isViewportOnly && this.#cartesianLayoutRuntime) {
            const computation = CartesianLayoutEngine.projectRuntime(
                this.#cartesianLayoutRuntime,
                this.#effectiveViewportState(),
                this.#labelMeasurements,
                this.#warnedDiagnosticSignatures
            );
            newScene = computation.scene;
        } else if (isChromeOnly && this.#cartesianLayoutRuntime) {
            this.#beginInteractionAuthorityChange();
            this.#cartesianLayoutRuntime = CartesianLayoutEngine.recomputeChrome(
                this.#cartesianLayoutRuntime,
                this.#currentWidth,
                this.#currentHeight,
                this.#labelMeasurements
            );
            const baseCoordSpace = this.#cartesianLayoutRuntime.baseCoordinateSpace;
            const { viewport: canonicalViewport, reconciliationEvent } = this.#resolveCanonicalViewportForAuthority(
                baseCoordSpace,
                "chrome"
            );

            if (reconciliationEvent) {
                this.viewportChange.emit(reconciliationEvent);
            }

            const projectedComp = CartesianLayoutEngine.projectRuntime(
                this.#cartesianLayoutRuntime,
                canonicalViewport,
                this.#labelMeasurements,
                this.#warnedDiagnosticSignatures
            );
            newScene = projectedComp.scene;
            this.#renderScheduler.consume(ChartInvalidationReason.Viewport);
        } else if (requiresSceneRefresh) {
            // Drop the previous source generation before constructing its replacement so
            // large source-dependent authorities do not overlap at peak allocation.
            releaseCartesianLayoutRuntime(this.#cartesianLayoutRuntime, "source-replacement");
            this.#cartesianLayoutRuntime = null;
            const preparation = ChartLayoutEngine.prepareStructural({
                angularAxis: this.#angularAxis() ?? undefined,
                containerHeight: this.#currentHeight,
                containerWidth: this.#currentWidth,
                downsamplingPolicy: this.normalizedDownsampling(),
                measurements: this.#labelMeasurements,
                radialAxis: this.#radialAxis() ?? undefined,
                rootData: this.data(),
                rootXField: this.#rootXField(),
                series: this.#registeredSeries(),
                styleResolver: this.#styleResolver,
                viewport: undefined,
                warnedDiagnosticSignatures: this.#warnedDiagnosticSignatures,
                xAxis: this.#xAxes()[0] ?? undefined,
                xAxes: this.#xAxes(),
                yAxis: this.#yAxes()[0] ?? undefined,
                yAxes: this.#yAxes()
            });

            if (preparation.kind === "cartesian-xy") {
                this.#beginInteractionAuthorityChange();
                this.#cartesianLayoutRuntime = preparation.runtime;
                const baseCoordSpace = this.#cartesianLayoutRuntime.baseCoordinateSpace;
                const { viewport: canonicalViewport, reconciliationEvent } = this.#resolveCanonicalViewportForAuthority(
                    baseCoordSpace,
                    "structural"
                );

                if (reconciliationEvent) {
                    this.viewportChange.emit(reconciliationEvent);
                }

                const projectedComp = CartesianLayoutEngine.projectRuntime(
                    this.#cartesianLayoutRuntime,
                    canonicalViewport,
                    this.#labelMeasurements,
                    this.#warnedDiagnosticSignatures
                );
                newScene = projectedComp.scene;
                this.#renderScheduler.consume(ChartInvalidationReason.Viewport);
            } else {
                this.#beginInteractionAuthorityChange();
                newScene = preparation.scene;
            }
        } else {
            newScene = this.scene()!;
        }

        // Prune measurements (retaining base chrome measurements across viewport zoom)
        ChartLabelMeasurementPruner.prune(
            this.#labelMeasurements,
            newScene,
            this.#cartesianLayoutRuntime?.chrome?.measurementKeys
        );

        if (newScene?.hitTargets && this.#dataLabelMeasurements.size > 0) {
            const activeKeys = new Set(
                newScene.hitTargets.map(h => `${h.seriesId}:${ChartMarkIdentityResolver.resolve(h)}`)
            );
            for (const key of this.#dataLabelMeasurements.keys()) {
                if (!activeKeys.has(key)) {
                    this.#dataLabelMeasurements.delete(key);
                }
            }
        }

        // Commit semantic target scene immediately
        this.scene.set(newScene);
        this.#updateGestureController();

        const isWaitingForInitialPolarSvgMeasurement =
            this.#initialMeasurementPending &&
            this.renderer() === "svg" &&
            newScene.coordinateSystem === "polar" &&
            newScene.polarKind === "arc";
        if (isWaitingForInitialPolarSvgMeasurement) {
            this.#renderScene = null;
            this.#hasCommittedVisualScene = false;
            this.#isAnimating.set(false);
            this.#isStructuralAnimation.set(false);
            this.#animationMode.set(null);
            this.#isExitingData.set(false);
            return;
        }

        const isInitial = !this.#hasCommittedVisualScene;
        const isVisibility = hasInvalidationReason(reason, ChartInvalidationReason.Visibility);
        const isData = hasInvalidationReason(reason, ChartInvalidationReason.Data);
        if (isData || isVisibility) {
            this.#cancelBrushAuthority("data-change");
        }
        if (isData) {
            const selReg = this.#selection();
            if (selReg && selReg.retainOnDataChange?.() === false) {
                const currentEffective = this.effectiveSelectedMarkIds();
                const controlled = selReg.selectedMarkIds?.();
                if (controlled !== undefined) {
                    if (currentEffective.length > 0) {
                        const changeEvt = ChartSelectionController.buildChangeEvent(
                            "programmatic",
                            {
                                added: [],
                                next: [],
                                removed: [...currentEffective]
                            },
                            currentEffective,
                            this.visibleMarkIndex(),
                            undefined,
                            this.cartesianXYScene()
                        );
                        selReg.emitSelectionChange?.(changeEvt);
                    }
                } else {
                    if (currentEffective.length > 0) {
                        this.#internalSelectedMarkIds.set([]);
                        const changeEvt = ChartSelectionController.buildChangeEvent(
                            "programmatic",
                            {
                                added: [],
                                next: [],
                                removed: [...currentEffective]
                            },
                            currentEffective,
                            this.visibleMarkIndex(),
                            undefined,
                            this.cartesianXYScene()
                        );
                        selReg.emitSelectionChange?.(changeEvt);
                    }
                }
            }
        }
        const trigger: ChartAnimationTrigger = isInitial
            ? "initial"
            : isVisibility
              ? "visibility"
              : isData
                ? "data"
                : isViewportOnly
                  ? "viewport"
                  : "layout";

        const animOptions = this.normalizedAnimationOptions();
        const prefersReducedMotion =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
                : false;
        const isAnimationDisabled = animOptions.enabled === false || animOptions.duration === 0 || prefersReducedMotion;

        const effectiveOptions: NormalizedChartAnimationOptions = isAnimationDisabled
            ? { ...animOptions, duration: 0, easing: "linear", enabled: false }
            : animOptions;

        if (!this.#canvasReady) {
            return;
        }

        // The render surface has already adopted the new viewport. Reusing or morphing
        // from geometry computed for the previous viewport would paint off-center marks.
        const mustCommitSizeImmediately =
            sizeChanged && hasInvalidationReason(reason, ChartInvalidationReason.Size) && previousScene !== null;

        // A restyle (a theme switch) repaints in place; only data, layout and visibility changes animate.
        const isStyleOnly =
            hasInvalidationReason(reason, ChartInvalidationReason.Style) &&
            (reason & ~(ChartInvalidationReason.Style | ChartInvalidationReason.Interaction)) === 0;

        if (isAnimationDisabled || mustCommitSizeImmediately || isStyleOnly) {
            this.#animationController.cancel("keep-current");
            this.#renderScene = newScene;
            this.#hasCommittedVisualScene = true;
            this.#isAnimating.set(false);
            this.#isStructuralAnimation.set(false);
            this.#animationMode.set(null);
            this.#isExitingData.set(false);
            if (this.#pendingLabelMeasurementReason !== 0) {
                const reasonToInvalidate = this.#pendingLabelMeasurementReason;
                this.#pendingLabelMeasurementReason = 0;
                this.invalidate(reasonToInvalidate as ChartInvalidationReason);
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
            if (this.#pendingLabelMeasurementReason !== 0) {
                const reasonToInvalidate = this.#pendingLabelMeasurementReason;
                this.#pendingLabelMeasurementReason = 0;
                this.invalidate(reasonToInvalidate as ChartInvalidationReason);
            }
            this.#paint();
        } else {
            const isExitingDataTransition =
                (trigger === "data" || trigger === "visibility") &&
                Boolean(fromVisual && fromVisual.hasRenderableData && !newScene.hasRenderableData);
            if (isExitingDataTransition) {
                this.#isExitingData.set(true);
            }
            if (trigger === "data" || trigger === "visibility") {
                this.#cancelBrushAuthority("data-change");
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
                    if (this.#pendingLabelMeasurementReason !== 0) {
                        const reasonToInvalidate = this.#pendingLabelMeasurementReason;
                        this.#pendingLabelMeasurementReason = 0;
                        this.invalidate(reasonToInvalidate as ChartInvalidationReason);
                    }
                    this.#paint();
                },
                onFrame: (frame: ChartAnimationRenderFrame) => {
                    this.#renderScene = frame.scene;
                    if (frame.mode === "crossfade") {
                        const presentation: ChartRenderPresentationState = {
                            annotationBadgeAnchors: this.annotationBadgeAnchors(),
                            cartesianOverlay: this.cartesianOverlayScene(),
                            crosshair: this.crosshairState(),
                            crosshairRegistration: this.#crosshair(),
                            interaction: this.#interactionState
                        };
                        if (this.#renderBackend) {
                            this.#renderBackend.renderCrossfade({
                                fromScene: frame.fromScene ?? null,
                                presentation,
                                progress: frame.progress,
                                styleResolver: this.#styleResolver,
                                toScene: frame.toScene ?? newScene
                            });
                        } else if (this.#canvasContext) {
                            CanvasChartRenderer.renderCrossfade(
                                this.#canvasContext,
                                frame.fromScene ?? null,
                                frame.toScene ?? newScene,
                                frame.progress,
                                presentation,
                                this.#styleResolver
                            );
                        }
                    } else {
                        this.#paint();
                    }
                }
            });
        }
    }

    #reconcilePointerInteractionFeaturesFromRetainedPointer(): void {
        const tooltip = this.#tooltip();
        const tooltipEnabled = tooltip ? tooltip.enabled() !== false : false;
        const crosshair = this.#crosshair();
        const crosshairEnabled = crosshair ? crosshair.enabled() !== false : false;

        let changed = false;

        if (!tooltipEnabled) {
            if (this.tooltipPosition() !== null) {
                this.tooltipPosition.set(null);
                changed = true;
            }
            if (this.tooltipContext() !== null) {
                this.tooltipContext.set(null);
                changed = true;
            }
            if (this.#clearTransientInteractionOwnedBy("tooltip")) {
                changed = true;
            }
        }

        if (!crosshairEnabled) {
            if (this.crosshairState() !== null) {
                this.crosshairState.set(null);
                changed = true;
            }
            if (this.#clearTransientInteractionOwnedBy("crosshair")) {
                changed = true;
            }
        }

        if (!tooltipEnabled && !crosshairEnabled) {
            if (changed) {
                this.#paint();
            }
            return;
        }

        const currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            if (changed) {
                this.#paint();
            }
            return;
        }

        const lastRes = this.#lastPointerResolution;
        const lastSrc = this.#lastInteractionSource;
        if (!lastRes || !lastRes.pointer || !lastSrc) {
            if (changed) {
                this.#paint();
            }
            return;
        }

        const pointer = lastRes.pointer;
        const shared = this.#resolveSharedTooltip(currentScene);
        const isCrosshairSnapNearest = crosshair?.snap() === "nearest" || lastSrc === "keyboard";
        const needHitTest = tooltipEnabled || (crosshairEnabled && isCrosshairSnapNearest);
        const crosshairDist = crosshair?.maxSnapDistance() ?? 32;
        const demand: ChartPointerInteractionDemand = {
            crosshairMaxDistance: crosshairDist,
            maxDistance: 32,
            needCrosshairCandidates: crosshairEnabled && isCrosshairSnapNearest,
            needHitTest
        };

        const resolution = ChartPointerInteractionResolver.resolve(pointer, currentScene, shared, demand);
        this.#lastPointerResolution = resolution;
        const hitState = resolution.hitState;

        let hasAnyState = false;

        const nextCrosshairRes =
            crosshairEnabled && currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "xy"
                ? CartesianCrosshairResolver.resolve(
                      currentScene as CartesianXYChartScene,
                      crosshair,
                      resolution,
                      lastSrc
                  )
                : null;

        this.crosshairState.set(nextCrosshairRes?.state ?? null);
        if (nextCrosshairRes?.state !== null && nextCrosshairRes?.state !== undefined) {
            hasAnyState = true;
            this.#synchronizationController?.publishLocalCrosshair(nextCrosshairRes.state);
        } else {
            const restored = this.#synchronizationController?.restoreRemoteCrosshair() ?? false;
            if (restored) {
                hasAnyState = true;
            }
        }

        if (tooltipEnabled && (hitState.activeHitTarget || hitState.activeHits.length > 0)) {
            this.#setTransientInteraction(
                {
                    ...hitState,
                    source: lastSrc
                },
                "tooltip"
            );
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
                hasAnyState = true;
            }
        } else if (
            crosshairEnabled &&
            nextCrosshairRes &&
            nextCrosshairRes.snapKind === "mark" &&
            (nextCrosshairRes.activeHitTarget || nextCrosshairRes.activeHits.length > 0)
        ) {
            this.#setTransientInteraction(
                {
                    ...hitState,
                    activeHitTarget: nextCrosshairRes.activeHitTarget,
                    activeHits: nextCrosshairRes.activeHits,
                    pointerPosition: pointer,
                    source: lastSrc
                },
                "crosshair"
            );
            this.tooltipPosition.set(null);
            this.tooltipContext.set(null);
            hasAnyState = true;
        } else {
            this.#setTransientInteraction(null, null);
            this.tooltipPosition.set(null);
            this.tooltipContext.set(null);
        }

        if (hasAnyState || changed) {
            this.#paint();
        } else {
            this.#clearInteraction();
        }
    }

    #resolveCanonicalViewportForAuthority(
        baseCoordSpace: CartesianAxisCoordinateSpace,
        _cause: "structural" | "chrome"
    ): {
        viewport: InternalCartesianViewportState;
        reconciliationEvent?: ChartViewportChangeEvent;
    } {
        const rawControlled = this.viewport();
        const nav = this.normalizedNavigation();
        const normalizeOpts = {
            clampToData: nav.clampToData,
            constraints: nav.constraints,
            minVisibleCategories: nav.minVisibleCategories,
            warnedSignatures: this.#warnedDiagnosticSignatures
        };

        if (rawControlled !== undefined) {
            // Controlled: normalize raw public input against the newly computed base authority
            const canonicalViewport = normalizeViewportState(rawControlled, baseCoordSpace, normalizeOpts);
            const previousCanonical = this.#lastNormalizedControlledViewport;
            const canonicalChanged =
                previousCanonical !== null && !areInternalViewportStatesEqual(previousCanonical, canonicalViewport);
            this.#lastNormalizedControlledViewport = canonicalViewport;

            if (canonicalChanged) {
                // Base authority changed under a controlled chart (e.g. data-domain shrink):
                // publish the committed canonical viewport without emitting a fake public event.
                this.#synchronizationController?.clearPendingAcknowledgement();
                this.#notifyCommittedViewport({
                    acknowledgedInbound: false,
                    changedAxes: diffInternalViewportStates(previousCanonical, canonicalViewport).changedAxes,
                    phase: "end",
                    source: "data-reconcile"
                });
            }

            return { viewport: canonicalViewport };
        }

        // Uncontrolled
        // If transitioning from controlled, seed from last normalized controlled viewport
        if (this.#lastNormalizedControlledViewport !== null) {
            this.#uncontrolledViewportState.set(this.#lastNormalizedControlledViewport);
            this.#lastNormalizedControlledViewport = null;
        }

        // Initial default viewport seeding (once, if defaultViewport is provided and not yet initialized)
        const rawDefault = this.defaultViewport();
        if (rawDefault !== undefined && !this.#hasInitializedDefaultViewport()) {
            this.#hasInitializedDefaultViewport.set(true);
            const canonicalDefault = normalizeViewportState(rawDefault, baseCoordSpace, normalizeOpts);
            this.#uncontrolledViewportState.set(canonicalDefault);
            return { viewport: canonicalDefault };
        }

        const reconcilerRes = CartesianViewportReconciler.reconcile(this.#uncontrolledViewportState(), baseCoordSpace, {
            clampToData: nav.clampToData,
            constraints: nav.constraints,
            minVisibleCategories: nav.minVisibleCategories
        });

        let reconciliationEvent: ChartViewportChangeEvent | undefined;
        if (reconcilerRes.changed) {
            const resolvedMap = baseCoordSpace.toResolvedAxisInfoMap();
            const prevPublic = toPublicViewportState(this.#uncontrolledViewportState(), resolvedMap);
            const nextPublic = toPublicViewportState(reconcilerRes.viewport, resolvedMap);
            this.#uncontrolledViewportState.set(reconcilerRes.viewport);
            if (!this.#isDestroyed) {
                reconciliationEvent = {
                    changedAxes: reconcilerRes.changedAxes,
                    phase: "end",
                    previousViewport: prevPublic,
                    source: "data-reconcile",
                    viewport: nextPublic
                };
                this.#notifyCommittedViewport({
                    changedAxes: reconcilerRes.changedAxes,
                    phase: "end",
                    source: "data-reconcile"
                });
            }
        }

        return {
            viewport: reconcilerRes.viewport,
            reconciliationEvent
        };
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

    #restoreOrClearRemoteCrosshair(): void {
        if (this.#isDestroyed) return;
        const restored = this.#synchronizationController?.restoreRemoteCrosshair() ?? false;
        if (!restored && this.crosshairState()?.source === "sync") {
            this.crosshairState.set(null);
        }
    }

    #retireInteractionAuthority(options?: { repaintIfVisual?: boolean }): boolean {
        const hadVisual =
            this.#interactionState !== null ||
            this.crosshairState() !== null ||
            this.tooltipPosition() !== null ||
            this.tooltipContext() !== null;

        this.#clearInteractionState();

        if (hadVisual && options?.repaintIfVisual !== false && !this.#isDestroyed) {
            this.#paint();
        }
        return hadVisual;
    }

    #retireTransientInteractionForViewportChange(): boolean {
        this.#cancelPendingPointerInteraction();
        this.#cancelBrushAuthority("viewport-change");
        return this.#retireInteractionAuthority({ repaintIfVisual: true });
    }

    #scheduleBrushPresentation(
        scene: CartesianXYChartScene,
        target: ResolvedCartesianBrushTarget,
        result: BrushGestureResult,
        event: PointerEvent
    ): void {
        if (!this.#pendingBrushFrame) {
            this.#pendingBrushFrame = {
                event,
                phase: result.phase,
                result,
                scene,
                target
            };
        } else {
            const effectivePhase: ChartBrushPhase =
                this.#pendingBrushFrame.phase === "start" || result.phase === "start" ? "start" : "update";
            this.#pendingBrushFrame = {
                event,
                phase: effectivePhase,
                result,
                scene,
                target
            };
        }

        if (this.#pendingBrushRafId === null && typeof requestAnimationFrame !== "undefined") {
            this.#pendingBrushRafId = requestAnimationFrame(() => {
                this.#pendingBrushRafId = null;
                this.#flushBrushPresentationFrame();
            });
        }
    }

    #setKeyboardSelection(
        bucketIndex: number,
        preferredSeriesId: string | null,
        preferredHitKey: string | null = null,
        namespace?: ChartKeyboardAxisNamespace | null
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
            const isCartesianXY = currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "xy";
            if (isCartesianXY) {
                const xyScene = currentScene as CartesianXYChartScene;
                const dimension: "x" | "y" = xyScene.interactionAxis === "y" ? "y" : "x";
                const primaryId =
                    dimension === "y" ? (xyScene.primaryYAxisId ?? "default") : (xyScene.primaryXAxisId ?? "default");
                this.#activeKeyboardNamespace = namespace ??
                    this.#activeKeyboardNamespace ?? { axis: dimension, axisId: primaryId };
            }

            const buckets = resolveInteractionBuckets(currentScene, this.#activeKeyboardNamespace);
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
        const resolvedBuckets =
            currentScene.coordinateSystem === "hierarchical"
                ? undefined
                : resolveInteractionBuckets(currentScene, this.#activeKeyboardNamespace);
        const activeHits =
            shared && bucketIndex >= 0 && resolvedBuckets && resolvedBuckets[this.#activeKeyboardBucketIndex]
                ? resolvedBuckets[this.#activeKeyboardBucketIndex].hits
                : [matchingHit];

        this.#setTransientInteraction(
            {
                activeHitTarget: matchingHit,
                activeHits,
                pointerPosition: pointPos,
                source: "keyboard"
            },
            "keyboard"
        );

        this.tooltipPosition.set(pointPos);
        this.tooltipContext.set(this.#buildTooltipContext(activeHits, shared, matchingHit));

        this.pointFocusChange.emit(this.#toPointFocusEvent(matchingHit));

        const messages = this.messages();
        const join = (parts: readonly (string | null | undefined | false)[]): string =>
            joinChartAnnouncement(parts, messages.announcementSeparator);
        const positionStr =
            resolvedBuckets && resolvedBuckets.length > 1
                ? messages.pointPosition(this.#activeKeyboardBucketIndex + 1, resolvedBuckets.length)
                : null;
        if (currentScene.coordinateSystem === "hierarchical" && currentScene.hierarchicalKind === "treemap") {
            const hit = matchingHit;
            if (hit.hierarchy) {
                const pathStr = hit.hierarchy.formattedPath.join(messages.pathSeparator);
                const shareStr =
                    hit.hierarchy.percentageOfRoot !== undefined
                        ? messages.shareOfTotal(formatChartPercent(hit.hierarchy.percentageOfRoot))
                        : null;
                const kindStr = hit.hierarchy.isLeaf
                    ? messages.treemapLeaf
                    : messages.treemapGroup(hit.hierarchy.childCount);
                this.#announce(join([messages.labeledValue(pathStr, hit.hierarchy.formattedValue), shareStr, kindStr]));
            }
        } else if (currentScene.coordinateSystem === "polar") {
            if (matchingHit.seriesType === "gauge") {
                const valStr = matchingHit.formattedValue ?? String(matchingHit.yValue);
                const clampedStr = matchingHit.isClamped ? messages.visualIndicatorClamped : null;
                const minStr =
                    matchingHit.formattedRadialMin ??
                    (matchingHit.radialMin !== undefined ? String(matchingHit.radialMin) : "");
                const maxStr =
                    matchingHit.formattedRadialMax ??
                    (matchingHit.radialMax !== undefined ? String(matchingHit.radialMax) : "");
                const rangeStr = minStr && maxStr ? messages.gaugeRange(minStr, maxStr) : null;
                this.#announce(join([messages.labeledValue(matchingHit.seriesName, valStr), rangeStr, clampedStr]));
            } else {
                const valStr = matchingHit.formattedValue ?? String(matchingHit.yValue);
                const catStr = matchingHit.formattedCategory ?? matchingHit.category ?? matchingHit.seriesName;
                this.#announce(
                    join([
                        matchingHit.seriesName,
                        messages.labeledValue(String(catStr), valStr),
                        matchingHit.formattedPercentage,
                        positionStr
                    ])
                );
            }
        } else if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "heatmap") {
            const primaryX = this.#xAxes()[0];
            const primaryY = this.#yAxes()[0];
            const xTitle = primaryX?.title() ? `${primaryX.title()} ` : "";
            const yTitle = primaryY?.title() ? `${primaryY.title()} ` : "";
            const xStr = `${xTitle}${matchingHit.formattedXValue ?? matchingHit.formattedCategory ?? matchingHit.categoryX ?? matchingHit.xValue}`;
            const yStr = `${yTitle}${matchingHit.formattedYCategory ?? matchingHit.categoryY ?? matchingHit.category}`;
            const valStr = matchingHit.formattedValue ?? String(matchingHit.yValue);
            this.#announce(messages.labeledValue(matchingHit.seriesName, join([xStr, yStr, valStr])));
        } else if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "funnel") {
            const totalStages = currentScene.hitTargets.length;
            const stageNum = (matchingHit.renderOrder ?? 0) + 1;
            const funnel = matchingHit.funnel;
            const stageStr = totalStages > 0 ? messages.stagePosition(stageNum, totalStages) : null;
            this.#announce(
                join([
                    matchingHit.seriesName,
                    messages.labeledValue(
                        join([matchingHit.formattedCategory, stageStr]),
                        matchingHit.formattedValue ?? ""
                    ),
                    funnel?.formattedConversionRate && messages.conversionOfPrevious(funnel.formattedConversionRate),
                    funnel?.formattedOverallConversionRate &&
                        messages.overallConversion(funnel.formattedOverallConversionRate),
                    funnel?.dropOff !== undefined &&
                        funnel.dropOff > 0 &&
                        messages.dropOffValue(formatChartNumber(funnel.dropOff))
                ])
            );
        } else if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "waterfall") {
            const wf = matchingHit.waterfall;
            const totalSteps = currentScene.hitTargets.length;
            const stepNum = (matchingHit.renderOrder ?? 0) + 1;
            const stepStr = totalSteps > 0 ? messages.stepPosition(stepNum, totalSteps) : null;
            const valueStr = matchingHit.formattedValue ?? "";
            const beforeStr = wf?.formattedCumulativeBefore ?? "";
            const afterStr = wf?.formattedCumulativeAfter ?? "";
            let detail: string;
            if (wf?.kind === "subtotal") {
                detail = messages.subtotalAnnouncement(valueStr);
            } else if (wf?.kind === "total") {
                detail = messages.totalAnnouncement(valueStr);
            } else {
                const delta = wf?.deltaValue ?? 0;
                // The message says increase or decrease, so the amount drops its sign.
                const deltaStr = wf?.formattedDelta
                    ? wf.formattedDelta.replace(LEADING_SIGN, "")
                    : formatChartNumber(Math.abs(delta));
                if (delta > 0) {
                    detail = messages.increaseAnnouncement(deltaStr, beforeStr, afterStr);
                } else if (delta < 0) {
                    detail = messages.decreaseAnnouncement(deltaStr, beforeStr, afterStr);
                } else {
                    detail = messages.noChangeAnnouncement(wf?.formattedCumulativeAfter ?? valueStr);
                }
            }
            this.#announce(
                join([
                    matchingHit.seriesName,
                    messages.labeledValue(join([matchingHit.formattedCategory, stepStr]), detail)
                ])
            );
        } else {
            const xAxis =
                (matchingHit.xAxisId ? this.#xAxes().find(a => a.axisId?.() === matchingHit.xAxisId) : undefined) ??
                this.#xAxes()[0];
            const yAxis =
                (matchingHit.yAxisId ? this.#yAxes().find(a => a.axisId?.() === matchingHit.yAxisId) : undefined) ??
                this.#yAxes()[0];
            const xStr =
                matchingHit.formattedCategory ??
                formatXValue(matchingHit.xValue, matchingHit.index, xAxis?.formatter(), xAxis?.type());
            const isRange = matchingHit.valueKind === "range" || matchingHit.range !== undefined;
            const fromStr = matchingHit.formattedFrom ?? matchingHit.range?.formattedFrom;
            const toStr = matchingHit.formattedTo ?? matchingHit.range?.formattedTo;
            const yStr =
                matchingHit.formattedValue ??
                (isRange && fromStr && toStr
                    ? messages.valueRange(fromStr, toStr)
                    : formatYValue(matchingHit.yValue, matchingHit.index, yAxis?.formatter()));
            const sizeStr =
                matchingHit.formattedSize ?? (matchingHit.sizeValue !== undefined ? String(matchingHit.sizeValue) : "");
            const isPercent = matchingHit.stackMode === "percent";
            const shareStr =
                isPercent && matchingHit.formattedStackPercentage
                    ? messages.stackShare(matchingHit.formattedStackPercentage)
                    : null;

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
                const direction = fin?.direction ?? matchingHit.financialDirection;
                const directionStr =
                    direction === "rising"
                        ? messages.rising
                        : direction === "falling"
                          ? messages.falling
                          : direction === "neutral"
                            ? messages.unchanged
                            : null;
                this.#announce(
                    join([
                        matchingHit.seriesName,
                        xStr,
                        messages.ohlcValues(openStr, highStr, lowStr, closeStr),
                        directionStr,
                        fin?.formattedChange && messages.changeValue(fin.formattedChange),
                        positionStr
                    ])
                );
            } else if (isRange && fromStr && toStr) {
                this.#announce(
                    join([
                        messages.labeledValue(
                            matchingHit.seriesName,
                            join([xStr, messages.rangeValue(fromStr, toStr)])
                        ),
                        positionStr
                    ])
                );
            } else if (matchingHit.seriesType === "bubble" && sizeStr) {
                this.#announce(
                    join([
                        messages.labeledValue(
                            matchingHit.seriesName,
                            join([xStr, yStr, messages.sizeValue(sizeStr), shareStr])
                        ),
                        positionStr
                    ])
                );
            } else {
                this.#announce(
                    join([messages.labeledValue(matchingHit.seriesName, join([xStr, yStr, shareStr])), positionStr])
                );
            }
        }

        if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "xy") {
            const crosshair = this.#crosshair();
            if (crosshair && crosshair.enabled() !== false) {
                const keyboardHitState: ChartInteractionState = this.#interactionState ?? {
                    activeHitTarget: matchingHit,
                    activeHits,
                    pointerPosition: pointPos,
                    source: "keyboard"
                };
                const resolution: ChartPointerResolution = {
                    bucketHits: activeHits,
                    crosshairCandidates: activeHits,
                    hitState: keyboardHitState,
                    nearestAnchor: bucketAnchor ?? pointPos,
                    pointer: pointPos,
                    primaryHit: matchingHit,
                    snappedAnchor: pointPos
                };
                this.#lastPointerResolution = resolution;
                this.#lastInteractionSource = "keyboard";
                const crosshairRes = CartesianCrosshairResolver.resolve(
                    currentScene as CartesianXYChartScene,
                    crosshair,
                    resolution,
                    "keyboard"
                );
                this.crosshairState.set(crosshairRes.state);
            }
        }

        this.#paint();
    }

    #setTransientInteraction(state: ChartInteractionState | null, owner: ChartTransientInteractionOwner): void {
        this.#interactionState = state;
        this.#interactionOwner = state !== null ? owner : null;
    }

    #setupRenderBackend(mode: ChartRendererMode, canvas: HTMLCanvasElement | null, svg: SVGSVGElement | null): void {
        if (this.#renderBackend) {
            this.#renderBackend.destroy();
            this.#renderBackend = null;
        }
        try {
            this.#renderBackend = createChartRenderBackend(mode, canvas, svg);
            if (!this.#initialMeasurementPending && this.#currentWidth > 0 && this.#currentHeight > 0) {
                const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
                this.#renderBackend.resize({
                    devicePixelRatio: dpr,
                    height: this.#currentHeight,
                    width: this.#currentWidth
                });
            }
            this.#paint();
        } catch {
            // Ignored if elements are not mounted yet
        }
    }

    #takeGestureClickSuppression(): void {
        if (this.#gestureController?.consumeClickSuppression()) {
            this.#suppressNextCanvasClick = true;
        }
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
            markId: ChartMarkIdentityResolver.resolve(target),
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
                (target.range ? "range" : target.financial ? "ohlc" : target.waterfall ? "waterfall" : "scalar"),
            waterfall: target.waterfall,
            funnel: target.funnel,
            xAxisId: target.xAxisId,
            xAxisTitle: target.xAxisTitle,
            xValue: target.xValue,
            yAxisId: target.yAxisId,
            yAxisTitle: target.yAxisTitle,
            yCategory: target.yCategory,
            yValue: target.yValue ?? (typeof value === "number" ? value : undefined)
        };
    }

    #toPointFocusEvent(target: SceneHitTarget): ChartPointFocusEvent {
        return this.#toPointEvent(target);
    }

    /**
     * Keeps the canvas sharp when the device pixel ratio changes (browser zoom, or a move to another monitor), which
     * no resize reports: a resolution query for the current ratio fires once it stops matching, and is re-armed.
     */
    #watchDevicePixelRatio(): void {
        this.#unwatchDevicePixelRatio();
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return;
        }
        const query = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
        const listener = (): void => {
            if (this.#isDestroyed) {
                return;
            }
            this.#updateCanvasBackingStore(this.#currentWidth, this.#currentHeight);
            this.#paint();
            this.#watchDevicePixelRatio();
        };
        query.addEventListener("change", listener);
        this.#devicePixelRatioQuery = query;
        this.#devicePixelRatioListener = listener;
    }

    #unwatchDevicePixelRatio(): void {
        if (this.#devicePixelRatioQuery && this.#devicePixelRatioListener) {
            this.#devicePixelRatioQuery.removeEventListener("change", this.#devicePixelRatioListener);
        }
        this.#devicePixelRatioQuery = null;
        this.#devicePixelRatioListener = null;
    }

    #updateCanvasBackingStore(width: number, height: number): void {
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        if (this.#renderBackend) {
            this.#renderBackend.resize({ devicePixelRatio: dpr, height, width });
            return;
        }

        const canvasRef = this.canvasElement();
        if (!canvasRef) {
            return;
        }

        const canvas = canvasRef.nativeElement;
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

    #updateGestureController(): void {
        const sc = this.cartesianXYScene();
        const nav = this.normalizedNavigation();
        if (sc && nav.enabled) {
            const gestureContext = {
                authorityToken: this.#interactionRevision,
                axisScenes: sc.axes,
                constraints: nav.constraints,
                coordinateSpace: sc.coordinateSpace,
                currentViewport: this.#effectiveViewportState(),
                linkGroups: nav.linkGroups,
                navigationOptions: nav,
                navigationProfile: this.#cartesianLayoutRuntime?.navigationProfile,
                onCursorChange: (cursor: string | null) => this.viewportCursor.set(cursor),
                onViewportChange: (nextState: InternalCartesianViewportState, event: ChartViewportChangeEvent) => {
                    this.#applyGestureViewportEvent(nextState, event);
                },
                orientation: sc.orientation ?? "vertical",
                plotRect: sc.plotRect,
                releasePointerCapture: (pointerId: number, target?: Element | null) => {
                    try {
                        const el = target ?? this.#getSurfaceElement();
                        el?.releasePointerCapture?.(pointerId);
                    } catch {
                        // Ignore: the pointer may already be released or the element detached.
                    }
                },
                setPointerCapture: (pointerId: number, target?: Element | null) => {
                    try {
                        const el = target ?? this.#getSurfaceElement();
                        el?.setPointerCapture?.(pointerId);
                    } catch {
                        // Ignore: the element may not support pointer capture in this environment.
                    }
                },
                warnedDiagnosticSignatures: this.#warnedDiagnosticSignatures
            };
            if (!this.#gestureController) {
                this.#gestureController = new ChartViewportGestureController(gestureContext);
            } else {
                this.#gestureController.updateContext(gestureContext);
            }
        } else {
            if (this.#gestureController) {
                this.#gestureController.cancel("navigation-disabled");
                this.#takeGestureClickSuppression();
                this.#gestureController.destroy();
                this.#gestureController = null;
                this.viewportCursor.set(null);
            }
        }
    }

    /**
     * @description Exports and triggers a browser file download of the chart in PNG, SVG, or PDF format.
     * @param options Download options including export format, file name, dimensions, and presentation options.
     */
    public async downloadChart(options: ChartDownloadOptions): Promise<ChartExportResult> {
        if (typeof window === "undefined" || typeof document === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Chart download operations are only supported in browser environments."
            );
        }

        const hostEl = this.#elementRef.nativeElement;
        const rect = hostEl.getBoundingClientRect();
        const { fileName } = normalizeChartDownloadOptions(
            options,
            rect.width > 0 ? rect.width : 500,
            rect.height > 0 ? rect.height : 300,
            this.title()
        );

        const result = await this.exportChart(options);
        ChartDownloadHelper.download(result.blob, fileName);
        return result;
    }

    /**
     * @description Exports the chart as a binary Blob in PNG, SVG, or PDF format.
     * @param options Export configuration including format, dimensions, background, and presentation options.
     */
    public async exportChart(options: ChartExportOptions): Promise<ChartExportResult> {
        if (typeof window === "undefined" || typeof document === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Chart export operations are only supported in browser environments."
            );
        }

        if (this.#isDestroyed) {
            throw new ChartExportError("not-ready", "Cannot export a destroyed chart.");
        }

        this.#renderScheduler.flushStructural();

        const hostEl = this.#elementRef.nativeElement;
        const rect = hostEl.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            throw new ChartExportError("not-ready", "Chart is not ready or has zero dimensions.");
        }

        const request = normalizeChartExportOptions(options, rect.width, rect.height);

        const localController = new AbortController();
        this.#activeExportControllers.add(localController);

        let combinedSignal: AbortSignal;
        if (options.signal) {
            if (options.signal.aborted) {
                this.#activeExportControllers.delete(localController);
                throw new DOMException("Export was aborted", "AbortError");
            }
            combinedSignal = AbortSignal.any([options.signal, localController.signal]);
        } else {
            combinedSignal = localController.signal;
        }

        const effectiveRequest = {
            ...request,
            signal: combinedSignal
        };

        try {
            const snapshot = ChartExportSnapshotBuilder.build(
                {
                    activeBrushBounds: this.#activeBrushBounds(),
                    annotationBadgeAnchors: this.annotationBadgeAnchors(),
                    ariaDescription: this.effectiveAriaDescription(),
                    ariaLabel: this.effectiveAriaLabel(),
                    brushRegistration: this.#brush(),
                    cartesianDataLabels: this.cartesianDataLabelScene(),
                    cartesianOverlay: this.cartesianOverlayScene(),
                    cartesianSelectionScene: this.cartesianSelectionScene(),
                    crosshairRegistration: this.#crosshair(),
                    crosshairState: this.crosshairState(),
                    elementRef: hostEl,
                    hasNoData: this.hasNoData(),
                    plotSurfaceElement: this.plotSurfaceElement()?.nativeElement ?? null,
                    scene: this.scene(),
                    selectionOptions: this.#selection()
                        ? {
                              color: this.#selection()?.color?.(),
                              fillOpacity: this.#selection()?.fillOpacity?.(),
                              strokeWidth: this.#selection()?.strokeWidth?.()
                          }
                        : null
                },
                effectiveRequest
            );

            return await ChartExportCoordinator.export(snapshot, effectiveRequest);
        } finally {
            this.#activeExportControllers.delete(localController);
        }
    }

    /**
     * @description Fits the viewport window to a specified continuous range or category indices.
     * @deprecated Use 'setViewportWindow' instead.
     */
    public fit(window: ChartViewportWindow | readonly ChartViewportWindow[]): void {
        this.setViewportWindow(window);
    }

    /**
     * @description Fits target axes (or all axes) to full canonical base domain.
     */
    public fitViewport(target?: ChartNavigationAxisTarget): void {
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const targetAxes =
            target !== undefined ? CartesianViewportTargetResolver.resolveExplicitTarget(target, sc.axes) : undefined;
        const nav = this.normalizedNavigation();
        const res = CartesianViewportOperationCoordinator.fit(
            this.#effectiveViewportState(),
            sc.coordinateSpace,
            targetAxes,
            {
                linkGroups: nav.linkGroups,
                warnedSignatures: this.#warnedDiagnosticSignatures
            }
        );
        if (res.changed) {
            this.#applyViewportUpdate(res.viewport, "fit", "end", res.changedAxes);
        }
    }

    public flushPendingRender(): void {
        this.#cancelPendingPointerInteraction();
        this.#flushPendingBrushFrameNow();
        this.#gestureController?.flushPendingFrame();
        this.#renderScheduler.flush();
    }

    /**
     * @description Returns the current active viewport window state, or null if chart is not Cartesian XY.
     */
    public getViewport(): ChartViewportState | null {
        const sc = this.scene();
        if (!sc || sc.coordinateSystem !== "cartesian" || sc.cartesianKind !== "xy") return null;
        const xyScene = sc as CartesianXYChartScene;
        if (!xyScene.coordinateSpace) return null;
        return toPublicViewportState(this.#effectiveViewportState(), xyScene.coordinateSpace.toResolvedAxisInfoMap());
    }

    public invalidate(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        if (this.#isDestroyed || !this.#isBrowser) {
            return;
        }
        // An input changed (a series color, the crosshair style): read styles afresh on the next paint.
        this.#styleResolver.clearCache();
        this.#renderScheduler.schedule(reason);
    }

    public ngAfterContentChecked(): void {
        if (!this.#isBrowser) {
            return;
        }
        this.#syncResizeObserverTarget();
        // Once rendered, a chart waiting for a size (hidden in a tab or a closed panel) is measured by its
        // ResizeObserver, not by forcing a layout on every change-detection pass.
        const observedBySize = this.#canvasReady && this.#resizeObserver !== null;
        if (
            !observedBySize &&
            (!this.#canvasReady ||
                this.#initialMeasurementPending ||
                this.#currentWidth <= 0 ||
                this.#currentHeight <= 0)
        ) {
            const measurement = this.#measurePlotElement(this.#getPlotElement());
            if (measurement) {
                const changed = this.#applyMeasuredSize(measurement.width, measurement.height);
                if (this.#canvasReady && changed) {
                    this.invalidate(ChartInvalidationReason.Size);
                }
            }
        }

        this.#renderScheduler.flushStructural();
    }

    public observeDataLabelElement(element: HTMLElement, labelId: string): void {
        if (!labelId || typeof ResizeObserver === "undefined") {
            return;
        }
        if (!this.#dataLabelResizeObserver) {
            this.#dataLabelResizeObserver = new ResizeObserver(entries => {
                let changed = false;
                for (const entry of entries) {
                    const targetId = this.#observedDataLabelElements.get(entry.target);
                    if (targetId) {
                        const { width, height } = entry.contentRect;
                        const prev = this.#dataLabelMeasurements.get(targetId);
                        const widthDiff = prev ? Math.abs(prev.width - width) : 0;
                        const heightDiff = prev ? Math.abs(prev.height - height) : 0;
                        if (widthDiff > 1 || heightDiff > 1 || !prev) {
                            this.#dataLabelMeasurements.set(targetId, { width, height });
                            changed = true;
                        }
                    }
                }
                if (changed) {
                    this.#dataLabelMeasurementRevision.update(v => v + 1);
                    this.#paint();
                }
            });
        }

        this.#observedDataLabelElements.set(element, labelId);
        this.#dataLabelResizeObserver.observe(element);
    }

    public observeLabelElement(element: HTMLElement, labelId: string): void {
        if (!labelId || typeof ResizeObserver === "undefined") {
            return;
        }
        if (!this.#labelResizeObserver) {
            this.#labelResizeObserver = new ResizeObserver(entries => {
                let hasBaseChromeChanged = false;
                let hasViewportTickChanged = false;
                let hasNonCartesianLabelChanged = false;
                const baseKeys = this.#cartesianLayoutRuntime?.chrome?.measurementKeys;
                const isCartesian = this.#cartesianLayoutRuntime !== null;

                for (const entry of entries) {
                    const targetId = this.#observedLabelElements.get(entry.target);
                    if (targetId) {
                        const { width, height } = entry.contentRect;
                        const prev = this.#labelMeasurements.get(targetId);
                        const widthDiff = prev ? Math.abs(prev.width - width) : 0;
                        const heightDiff = prev ? Math.abs(prev.height - height) : 0;
                        if (widthDiff > 3 || heightDiff > 3) {
                            this.#labelMeasurements.set(targetId, { width, height });
                            if (isCartesian) {
                                if (baseKeys && !baseKeys.has(targetId) && targetId.startsWith("axis:")) {
                                    hasViewportTickChanged = true;
                                } else {
                                    hasBaseChromeChanged = true;
                                }
                            } else {
                                hasNonCartesianLabelChanged = true;
                            }
                        } else if (!prev) {
                            this.#labelMeasurements.set(targetId, { width, height });
                            if (!isCartesian) {
                                hasNonCartesianLabelChanged = true;
                            }
                        }
                    }
                }

                if (hasNonCartesianLabelChanged) {
                    if (this.#animationController.isRunning()) {
                        this.#pendingLabelMeasurementReason |= ChartInvalidationReason.Layout;
                    } else {
                        this.invalidate(ChartInvalidationReason.Layout);
                    }
                } else if (hasBaseChromeChanged) {
                    if (this.#animationController.isRunning()) {
                        this.#pendingLabelMeasurementReason |= ChartInvalidationReason.Chrome;
                    } else {
                        this.invalidate(ChartInvalidationReason.Chrome);
                    }
                } else if (hasViewportTickChanged) {
                    this.invalidate(ChartInvalidationReason.Viewport);
                }
            });
        }

        this.#observedLabelElements.set(element, labelId);
        this.#labelResizeObserver.observe(element);
    }

    public observeOverlayLabelElement(element: HTMLElement, labelId: string): void {
        if (!labelId || typeof ResizeObserver === "undefined") {
            return;
        }
        if (!this.#overlayLabelResizeObserver) {
            this.#overlayLabelResizeObserver = new ResizeObserver(entries => {
                let changed = false;
                let needsCanvasPaint = false;
                const prevAnchors = this.annotationBadgeAnchors();

                for (const entry of entries) {
                    const targetId = this.#observedOverlayLabelElements.get(entry.target);
                    if (targetId) {
                        const { width, height } = entry.contentRect;
                        const prev = this.#overlayLabelMeasurements.get(targetId);
                        const widthDiff = prev ? Math.abs(prev.width - width) : 0;
                        const heightDiff = prev ? Math.abs(prev.height - height) : 0;
                        if (widthDiff > 1 || heightDiff > 1 || !prev) {
                            this.#overlayLabelMeasurements.set(targetId, { width, height });
                            changed = true;

                            if (targetId.startsWith("overlay:ann:")) {
                                const annId = targetId.slice("overlay:ann:".length);
                                const prevAnchor = prevAnchors.get(annId);
                                const overlays = this.cartesianOverlayScene();
                                const ann = overlays?.annotations.find(a => a.id === annId);
                                if (ann && ann.label) {
                                    let fraction: LabelAnchorFraction;
                                    switch (ann.label.placement) {
                                        case "top":
                                            fraction = { x: 0.5, y: 1 };
                                            break;
                                        case "bottom":
                                            fraction = { x: 0.5, y: 0 };
                                            break;
                                        case "left":
                                            fraction = { x: 1, y: 0.5 };
                                            break;
                                        case "right":
                                        default:
                                            fraction = { x: 0, y: 0.5 };
                                            break;
                                    }
                                    const newPos = ChartOverlayLabelPositioner.position({
                                        anchorFraction: fraction,
                                        containerRect: {
                                            height: this.#currentHeight,
                                            width: this.#currentWidth,
                                            x: 0,
                                            y: 0
                                        },
                                        desiredAnchor: ann.label.anchor,
                                        measurement: { width, height },
                                        padding: 0
                                    });
                                    if (
                                        !prevAnchor ||
                                        Math.abs(prevAnchor.x - newPos.anchor.x) > 0.5 ||
                                        Math.abs(prevAnchor.y - newPos.anchor.y) > 0.5
                                    ) {
                                        needsCanvasPaint = true;
                                    }
                                }
                            }
                        }
                    }
                }
                if (changed) {
                    this.#overlayLabelMeasurementRevision.update(v => v + 1);
                    if (needsCanvasPaint && !this.#isAnimating() && !this.#isDestroyed) {
                        this.#paint();
                    }
                }
            });
        }

        this.#observedOverlayLabelElements.set(element, labelId);
        this.#overlayLabelResizeObserver.observe(element);
    }

    public onCanvasClick(event: MouseEvent): void {
        if (this.#isAnimating() && !this.#isStructuralAnimation()) {
            return;
        }
        if (this.#suppressNextCanvasClick) {
            this.#suppressNextCanvasClick = false;
            return;
        }
        if (this.#gestureController?.consumeClickSuppression()) {
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

        const selReg = this.#selection();
        if (selReg && selReg.enabled?.() !== false && selReg.clickSelection?.() !== false) {
            if (currentScene.coordinateSystem !== "cartesian" || currentScene.cartesianKind !== "xy") {
                if (!this.#hasWarnedSelectionNonCartesian && typeof ngDevMode !== "undefined" && ngDevMode) {
                    this.#hasWarnedSelectionNonCartesian = true;
                    console.warn("[Mona Chart] Selection is only supported on Cartesian XY charts.");
                }
                return;
            }
            const currentSelected = this.effectiveSelectedMarkIds();
            const mode = selReg.mode?.() ?? "single";

            if (hitState.activeHitTarget) {
                const markId = ChartMarkIdentityResolver.resolve(hitState.activeHitTarget);
                const mutation = ChartSelectionController.applyClick(currentSelected, markId, mode);
                if (mutation.added.length > 0 || mutation.removed.length > 0) {
                    if (selReg.selectedMarkIds?.() === undefined) {
                        this.#internalSelectedMarkIds.set(mutation.next);
                    }
                    const changeEvt = ChartSelectionController.buildChangeEvent(
                        "click",
                        mutation,
                        currentSelected,
                        this.visibleMarkIndex(),
                        [hitState.activeHitTarget],
                        currentScene as CartesianXYChartScene
                    );
                    selReg.emitSelectionChange?.(changeEvt);
                    this.#paint();
                }
            } else if (selReg.clearOnBackgroundClick?.() !== false) {
                const mutation = ChartSelectionController.applyClear(currentSelected);
                if (mutation.removed.length > 0) {
                    if (selReg.selectedMarkIds?.() === undefined) {
                        this.#internalSelectedMarkIds.set([]);
                    }
                    const changeEvt = ChartSelectionController.buildChangeEvent(
                        "click",
                        mutation,
                        currentSelected,
                        this.visibleMarkIndex(),
                        undefined,
                        currentScene as CartesianXYChartScene
                    );
                    selReg.emitSelectionChange?.(changeEvt);
                    this.#paint();
                }
            }
        }
    }

    public onFocusOut(event: FocusEvent): void {
        const related = event.relatedTarget as Node | null;
        if (!related || !this.#elementRef.nativeElement.contains(related)) {
            if (this.#keyboardBrushAnchor) {
                this.#keyboardBrushAnchor = null;
                this.#cancelBrushAuthority("authority-change");
            }
            this.#cancelPendingPointerInteraction();
            this.#clearInteraction();
            this.activeAccessibilityText.set("");
        }
    }

    public onKeyDown(event: KeyboardEvent): void {
        // Keys pressed in the legend, a tooltip or projected content belong to that content.
        if (event.target !== this.#elementRef.nativeElement) {
            return;
        }
        if (this.#isAnimating() && !this.#isStructuralAnimation()) {
            // Settle a restyle or data transition at once instead of dropping the key.
            this.#animationController.finish();
        }

        let currentScene = this.#renderScene ?? this.scene();
        if (!currentScene) {
            this.#recomputeAndPaint(ChartInvalidationReason.Data);
            currentScene = this.#renderScene ?? this.scene();
        }
        if (!currentScene) {
            return;
        }

        if (this.#handleKeyboardBrush(event, currentScene)) {
            return;
        }

        // Try Viewport Keyboard Navigation first
        if (currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "xy") {
            const xyScene = currentScene as CartesianXYChartScene;
            const nav = this.normalizedNavigation();
            const kbResult = ChartViewportKeyboardController.handleKeyDown(
                event,
                xyScene.coordinateSpace,
                xyScene.plotRect,
                xyScene.axes,
                nav,
                xyScene.orientation ?? "vertical",
                this.#effectiveViewportState(),
                nav.constraints,
                nav.linkGroups,
                this.#activeKeyboardNamespace,
                this.defaultViewport(),
                this.#cartesianLayoutRuntime?.navigationProfile
            );

            if (kbResult.handled) {
                event.preventDefault();
                if (kbResult.nextState) {
                    this.#applyViewportUpdate(kbResult.nextState, "keyboard", "end", kbResult.changedAxes);
                }
                if (kbResult.announcement) {
                    this.#announce(kbResult.announcement);
                }
                return;
            }
        }

        const isHierarchical = currentScene.coordinateSystem === "hierarchical";
        const isHeatmap = currentScene.coordinateSystem === "cartesian" && currentScene.cartesianKind === "heatmap";
        const buckets = resolveInteractionBuckets(currentScene, this.#activeKeyboardNamespace);
        if (!isHierarchical && !isHeatmap && (!buckets || buckets.length === 0)) {
            return;
        }

        const navResult = ChartKeyboardNavigation.handleKeyDown(
            event,
            currentScene,
            this.#activeKeyboardBucketIndex,
            this.#activeKeyboardSeriesId,
            this.#activeKeyboardHitKey,
            this.#activeKeyboardNamespace
        );

        if (navResult) {
            this.#setKeyboardSelection(
                navResult.bucketIndex,
                navResult.seriesId,
                navResult.hitKey,
                navResult.namespace
            );
            return;
        }

        if (NAVIGATION_KEYS.has(event.key) && this.#activeKeyboardHitKey !== null) {
            // At an edge the focused point stays; read it again so the key isn't silent.
            event.preventDefault();
            this.#setKeyboardSelection(
                this.#activeKeyboardBucketIndex,
                this.#activeKeyboardSeriesId,
                this.#activeKeyboardHitKey,
                this.#activeKeyboardNamespace
            );
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            const activeHit = this.#interactionState?.activeHitTarget;
            let targetHit: SceneHitTarget | undefined = activeHit ?? undefined;

            if (!targetHit && this.#activeKeyboardBucketIndex >= 0) {
                const resolvedBuckets = resolveInteractionBuckets(currentScene, this.#activeKeyboardNamespace);
                if (resolvedBuckets && resolvedBuckets.length > 0) {
                    const bucket = resolvedBuckets[this.#activeKeyboardBucketIndex];
                    targetHit =
                        (this.#activeKeyboardHitKey
                            ? bucket?.hits.find(
                                  h =>
                                      (h.animationKey ?? h.sliceId ?? `${h.seriesId}:${h.index}`) ===
                                      this.#activeKeyboardHitKey
                              )
                            : undefined) ??
                        bucket?.hits.find(h => h.seriesId === this.#activeKeyboardSeriesId) ??
                        bucket?.hits[0];
                }
            }

            if (targetHit) {
                event.preventDefault();
                const selReg = this.#selection();
                const isSelectable =
                    selReg !== null &&
                    selReg.enabled?.() !== false &&
                    selReg.keyboardSelection?.() !== false &&
                    currentScene.coordinateSystem === "cartesian" &&
                    currentScene.cartesianKind === "xy";
                // Enter activates the point; Space toggles its selection, or activates it where there is none.
                if (event.key === "Enter" || !isSelectable) {
                    this.pointClick.emit(this.#toPointEvent(targetHit));
                }

                if (isSelectable && selReg) {
                    const markId = ChartMarkIdentityResolver.resolve(targetHit);
                    const currentSelected = this.effectiveSelectedMarkIds();
                    const mode = selReg.mode?.() ?? "single";
                    const mutation = ChartSelectionController.applyClick(currentSelected, markId, mode);
                    if (mutation.added.length > 0 || mutation.removed.length > 0) {
                        if (selReg.selectedMarkIds?.() === undefined) {
                            this.#internalSelectedMarkIds.set(mutation.next);
                        }
                        const changeEvt = ChartSelectionController.buildChangeEvent(
                            "keyboard",
                            mutation,
                            currentSelected,
                            this.visibleMarkIndex(),
                            [targetHit],
                            currentScene as CartesianXYChartScene
                        );
                        selReg.emitSelectionChange?.(changeEvt);
                        const isSelected = mutation.added.includes(markId);
                        const pointLabel = this.#formatHitAnnouncement(targetHit);
                        this.#announce(
                            isSelected
                                ? this.messages().itemSelected(pointLabel)
                                : this.messages().itemDeselected(pointLabel)
                        );
                        this.#paint();
                    }
                }
            }
        } else if (event.key === "Escape") {
            const hasInteraction =
                this.#interactionState !== null ||
                this.tooltipContext() !== null ||
                this.#activeBrushBounds() !== null ||
                this.#brushGestureController.isBrushing ||
                this.activeAccessibilityText() !== "";
            if (!hasInteraction) {
                // Nothing to clear: let Escape reach the page, such as a dialog around the chart.
                return;
            }
            event.preventDefault();
            this.#cancelPendingPointerInteraction();
            this.#cancelBrushAuthority("escape");
            this.#gestureController?.cancel("escape");
            this.#clearInteraction();
            this.activeAccessibilityText.set("");
        }
    }

    public onLostPointerCapture(event: PointerEvent): void {
        if (this.#brushGestureController.activeSession?.pointerId === event.pointerId) {
            this.#cancelBrushAuthority("lost-pointer-capture");
        }
        this.#gestureController?.handleLostPointerCapture(event);
    }

    public onPointerCancel(event: PointerEvent): void {
        this.#cancelBrushAuthority("pointer-cancel");
        this.#gestureController?.handlePointerCancel(event);
    }

    public onPointerDown(event: PointerEvent): void {
        const brushReg = this.#brush();
        const currentScene = this.scene();
        const plotRect = currentScene?.plotRect;
        if (
            brushReg &&
            brushReg.enabled?.() !== false &&
            plotRect &&
            currentScene?.coordinateSystem === "cartesian" &&
            currentScene.cartesianKind === "xy"
        ) {
            const xyScene = currentScene as CartesianXYChartScene;
            const target = CartesianBrushTargetResolver.resolve(xyScene, brushReg, msg => {
                if (typeof ngDevMode !== "undefined" && ngDevMode) {
                    if (!this.#warnedDiagnosticSignatures.has(msg)) {
                        this.#warnedDiagnosticSignatures.add(msg);
                        console.warn(msg);
                    }
                }
            });
            const started = this.#brushGestureController.onPointerDown(
                event,
                plotRect,
                brushReg,
                target,
                this.#getSurfaceElement() ?? undefined
            );
            if (started) {
                return;
            }
        }

        if (!this.#gestureController) {
            this.#updateGestureController();
        }
        if (!this.#gestureController || this.#gestureController.activePointersCount === 0) {
            this.#suppressNextCanvasClick = false;
        }
        const pointer = this.#normalizePointer(event);
        if (!pointer) return;
        this.#gestureController?.handlePointerDown(event, pointer, event.currentTarget as Element);
    }

    public onPointerLeave(event?: PointerEvent): void {
        this.#cancelPendingPointerInteraction();
        if (event) {
            if (!this.#brushGestureController.isBrushing) {
                this.#brushGestureController.onPointerLeave(event);
                this.#gestureController?.handlePointerLeave(event);
            }
        }
        if (!this.#brushGestureController.isBrushing) {
            this.#clearInteraction();
            // Broadcast clear to synchronization peers, then restore the latest
            // remote presentation if another group origin remains active.
            this.#synchronizationController?.publishLocalCrosshair(null);
            this.#restoreOrClearRemoteCrosshair();
        }
    }

    public onPointerMove(event: PointerEvent): void {
        const brushReg = this.#brush();
        const currentScene = this.scene();
        const plotRect = currentScene?.plotRect;
        if (
            brushReg &&
            plotRect &&
            this.#brushGestureController.activeSession &&
            currentScene?.coordinateSystem === "cartesian" &&
            currentScene.cartesianKind === "xy"
        ) {
            const result = this.#brushGestureController.onPointerMove(
                event,
                plotRect,
                this.#getSurfaceElement() ?? undefined
            );
            if (result) {
                const xyScene = currentScene as CartesianXYChartScene;
                this.#scheduleBrushPresentation(xyScene, result.session.target, result, event);
                return;
            }
        }

        const pointer = this.#normalizePointer(event);
        if (pointer && this.#gestureController?.handlePointerMove(event, pointer)) {
            this.#cancelPendingPointerInteraction();
            this.#clearInteraction();
            return;
        }

        const tooltip = this.#tooltip();
        const tooltipEnabled = tooltip ? tooltip.enabled() !== false : false;
        const crosshair = this.#crosshair();
        const crosshairEnabled = crosshair ? crosshair.enabled() !== false : false;

        if ((!tooltipEnabled && !crosshairEnabled) || (this.#isAnimating() && !this.#isStructuralAnimation())) {
            this.#cancelPendingPointerInteraction();
            this.#clearInteraction();
            return;
        }

        this.#pendingPointerEvent = event;
        if (this.#pointerFrameId === null) {
            this.#pointerFrameId = requestAnimationFrame(() => {
                this.#pointerFrameId = null;
                const pending = this.#pendingPointerEvent;
                this.#pendingPointerEvent = null;
                if (pending) {
                    this.#processPointerMove(pending);
                }
            });
        }
    }

    public onPointerUp(event: PointerEvent): void {
        const brushReg = this.#brush();
        const currentScene = this.scene();
        const plotRect = currentScene?.plotRect;

        if (
            brushReg &&
            plotRect &&
            this.#brushGestureController.activeSession &&
            currentScene?.coordinateSystem === "cartesian" &&
            currentScene.cartesianKind === "xy"
        ) {
            const hadPendingStart =
                this.#pendingBrushFrame?.phase === "start" ||
                (!this.#hasEmittedBrushStart && this.#brushGestureController.isBrushing);
            this.#cancelPendingBrushFrame();

            const result = this.#brushGestureController.onPointerUp(
                event,
                plotRect,
                this.#getSurfaceElement() ?? undefined
            );
            if (result) {
                this.#activeBrushBounds.set(null);
                this.#suppressNextCanvasClick = true;

                const xyScene = currentScene as CartesianXYChartScene;
                const target = result.session.target;

                const ranges = xyScene.coordinateSpace
                    ? CartesianBrushRangeResolver.resolve(result.bounds, xyScene.coordinateSpace, target)
                    : {};

                if (hadPendingStart && !this.#hasEmittedBrushStart) {
                    this.#hasEmittedBrushStart = true;
                    brushReg.emitBrushChange?.({
                        mode: target.mode,
                        phase: "start",
                        pixelBounds: result.bounds,
                        xRange: ranges.xRange,
                        yRange: ranges.yRange
                    });
                }

                this.#commitBrush(
                    xyScene,
                    brushReg,
                    result.bounds,
                    target,
                    result.session.hitPolicy,
                    result.session.selectionBehavior,
                    ranges
                );

                this.#hasEmittedBrushStart = false;
                this.#paint();
                return;
            }
            this.#hasEmittedBrushStart = false;
        }

        this.#cancelPendingBrushFrame();
        this.#hasEmittedBrushStart = false;
        this.#gestureController?.handlePointerUp(event);
    }

    public onWheel(event: WheelEvent): void {
        const pointer = this.#normalizePointer(event);
        if (!pointer) return;
        if (this.#gestureController?.handleWheel(event, pointer)) {
            event.preventDefault();
            this.#cancelPendingPointerInteraction();
            this.#clearInteraction();
        }
    }

    /**
     * @description Pans the viewport by pixel delta vector { x, y }.
     */
    public pan(delta: { x: number; y: number }, target?: ChartNavigationAxisTarget): void {
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const nav = this.normalizedNavigation();
        const resolved = CartesianViewportTargetResolver.resolveTargets(
            null,
            sc.plotRect,
            sc.axes,
            nav,
            sc.orientation ?? "vertical",
            target ?? nav.panAxes,
            this.#cartesianLayoutRuntime?.navigationProfile
        );
        const res = CartesianViewportOperationCoordinator.transform(
            this.#effectiveViewportState(),
            sc.coordinateSpace,
            resolved.targetAxes,
            {
                panDeltaPx: delta
            },
            {
                clampToData: nav.clampToData,
                constraints: nav.constraints,
                linkGroups: nav.linkGroups,
                minVisibleCategories: nav.minVisibleCategories,
                warnedSignatures: this.#warnedDiagnosticSignatures
            }
        );
        if (res.changed) {
            this.#applyViewportUpdate(res.viewport, "programmatic", "end", res.changedAxes);
        }
    }

    public recomputeScene(reason: ChartInvalidationReason = ChartInvalidationReason.Layout): void {
        if (this.#isDestroyed || !this.#isBrowser) {
            return;
        }
        this.#renderScheduler.cancel();
        if (!this.#canvasReady) {
            const surfaceRef = this.#getSurfaceElement();
            if (surfaceRef) {
                this.#initCanvasAndObserver();
                this.#canvasReady = true;
            }
        }
        this.#recomputeAndPaint(reason);
    }

    public registerAngularAxis(registration: ChartAngularAxisRegistration): () => void {
        this.#guardCallbacks(registration, () => "angular axis");
        this.#angularAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Data);
        return () => {
            if (this.#angularAxis() === registration) {
                this.#angularAxis.set(null);
                this.invalidate(ChartInvalidationReason.Data);
            }
        };
    }

    public registerAnnotation(registration: ChartAnnotationRegistration): () => void {
        this.#annotations.update(list => [...list, registration]);
        this.invalidate(ChartInvalidationReason.Interaction);
        return () => {
            this.#annotations.update(list => list.filter(r => r !== registration));
            this.invalidate(ChartInvalidationReason.Interaction);
        };
    }

    public registerBrush(registration: ChartBrushRegistration): () => void {
        if (this.#brush() !== null) {
            if (!this.#hasWarnedMultiBrush && typeof ngDevMode !== "undefined" && ngDevMode) {
                this.#hasWarnedMultiBrush = true;
                console.warn(
                    "[Mona Chart] Multiple <mona-chart-brush> components detected. Only the first registered component is active."
                );
            }
            return () => {};
        }
        this.#brush.set(registration);
        this.invalidate(ChartInvalidationReason.Interaction);
        return () => {
            if (this.#brush() === registration) {
                this.#cancelBrushAuthority("component-disabled");
                this.#brush.set(null);
                this.invalidate(ChartInvalidationReason.Interaction);
            }
        };
    }

    public registerCrosshair(registration: ChartCrosshairRegistration): () => void {
        this.#crosshair.set(registration);
        return () => {
            if (this.#crosshair() === registration) {
                this.#crosshair.set(null);
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

    public registerRadialAxis(registration: ChartRadialAxisRegistration): () => void {
        this.#guardCallbacks(registration, () => "radial axis");
        this.#radialAxis.set(registration);
        this.invalidate(ChartInvalidationReason.Data);
        return () => {
            if (this.#radialAxis() === registration) {
                this.#radialAxis.set(null);
                this.invalidate(ChartInvalidationReason.Data);
            }
        };
    }

    public registerReferenceBand(registration: ChartReferenceBandRegistration): () => void {
        this.#referenceBands.update(list => [...list, registration]);
        this.invalidate(ChartInvalidationReason.Interaction);
        return () => {
            this.#referenceBands.update(list => list.filter(r => r !== registration));
            this.invalidate(ChartInvalidationReason.Interaction);
        };
    }

    public registerReferenceLine(registration: ChartReferenceLineRegistration): () => void {
        this.#referenceLines.update(list => [...list, registration]);
        this.invalidate(ChartInvalidationReason.Interaction);
        return () => {
            this.#referenceLines.update(list => list.filter(r => r !== registration));
            this.invalidate(ChartInvalidationReason.Interaction);
        };
    }

    public registerSelection(registration: ChartSelectionRegistration): () => void {
        if (this.#selection() !== null) {
            if (!this.#hasWarnedMultiSelection && typeof ngDevMode !== "undefined" && ngDevMode) {
                this.#hasWarnedMultiSelection = true;
                console.warn(
                    "[Mona Chart] Multiple <mona-chart-selection> components detected. Only the first registered component is active."
                );
            }
            return () => {};
        }
        this.#selection.set(registration);
        if (!this.#hasInitializedDefaultSelection()) {
            this.#hasInitializedDefaultSelection.set(true);
            const initial = registration.defaultSelectedMarkIds?.() ?? [];
            if (initial.length > 0) {
                this.#internalSelectedMarkIds.set(
                    ChartSelectionController.normalizeForMode(initial, registration.mode?.() ?? "single")
                );
            }
        }
        this.invalidate(ChartInvalidationReason.Interaction);
        return () => {
            if (this.#selection() === registration) {
                this.#selection.set(null);
                this.#internalSelectedMarkIds.set([]);
                this.#hasInitializedDefaultSelection.set(false);
                this.#lastControlledSelection = undefined;
                this.invalidate(ChartInvalidationReason.Interaction);
            }
        };
    }

    public registerSeries(registration: ChartSeriesRegistration): () => void {
        this.#guardCallbacks(registration, () => {
            const name = "name" in registration && typeof registration.name === "function" ? registration.name() : "";
            return `${registration.type} series "${name || registration.id}"`;
        });
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
        this.#guardCallbacks(registration, () => `X axis "${registration.axisId?.() ?? "x"}"`);
        this.#xAxes.update(list => [...list, registration]);
        this.invalidate(ChartInvalidationReason.Layout);
        return () => {
            this.#xAxes.update(list => list.filter(a => a !== registration));
            this.invalidate(ChartInvalidationReason.Layout);
        };
    }

    public registerYAxis(registration: ChartYAxisRegistration): () => void {
        this.#guardCallbacks(registration, () => `Y axis "${registration.axisId?.() ?? "y"}"`);
        this.#yAxes.update(list => [...list, registration]);
        this.invalidate(ChartInvalidationReason.Layout);
        return () => {
            this.#yAxes.update(list => list.filter(a => a !== registration));
            this.invalidate(ChartInvalidationReason.Layout);
        };
    }

    /**
     * @description Resets the viewport window back to the default viewport (or base domain) for target axes.
     */
    public resetViewport(target?: ChartNavigationAxisTarget): void {
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const targetAxes =
            target !== undefined ? CartesianViewportTargetResolver.resolveExplicitTarget(target, sc.axes) : undefined;
        const nav = this.normalizedNavigation();
        const res = CartesianViewportOperationCoordinator.reset(
            this.#effectiveViewportState(),
            sc.coordinateSpace,
            this.defaultViewport(),
            targetAxes,
            {
                clampToData: nav.clampToData,
                constraints: nav.constraints,
                linkGroups: nav.linkGroups,
                minVisibleCategories: nav.minVisibleCategories,
                warnedSignatures: this.#warnedDiagnosticSignatures
            }
        );
        if (res.changed) {
            this.#applyViewportUpdate(res.viewport, "reset", "end", res.changedAxes);
        }
    }

    /**
     * @description Sets the active viewport window state (full replacement).
     */
    public setViewport(viewport: ChartViewportState): void {
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const nav = this.normalizedNavigation();
        const res = CartesianViewportOperationCoordinator.setViewport(
            this.#effectiveViewportState(),
            sc.coordinateSpace,
            viewport,
            {
                clampToData: nav.clampToData,
                constraints: nav.constraints,
                linkGroups: nav.linkGroups,
                minVisibleCategories: nav.minVisibleCategories,
                warnedSignatures: this.#warnedDiagnosticSignatures
            }
        );
        if (res.changed) {
            this.#applyViewportUpdate(res.viewport, "programmatic", "end", res.changedAxes);
        }
    }

    /**
     * @description Sets the viewport window for specific axis/axes (partial mutation).
     */
    public setViewportWindow(window: ChartViewportWindow | readonly ChartViewportWindow[]): void {
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const nav = this.normalizedNavigation();
        const res = CartesianViewportOperationCoordinator.setWindow(
            this.#effectiveViewportState(),
            sc.coordinateSpace,
            window,
            {
                clampToData: nav.clampToData,
                constraints: nav.constraints,
                linkGroups: nav.linkGroups,
                minVisibleCategories: nav.minVisibleCategories,
                warnedSignatures: this.#warnedDiagnosticSignatures
            }
        );
        if (res.changed) {
            this.#applyViewportUpdate(res.viewport, "programmatic", "end", res.changedAxes);
        }
    }

    public toggleLegendItem(item: ChartLegendItem): void {
        if (item.kind === "semantic" || item.interactive === false) {
            return;
        }
        if (item.kind === "datum") {
            const series = this.#registeredSeries().find(s => s.id === item.seriesId);
            if (series) {
                this.#announceToggle(
                    item.visible ? this.messages().seriesHidden(item.name) : this.messages().seriesShown(item.name)
                );
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
            const seriesName = resolveSeriesDisplayName(s);
            this.#announceToggle(
                nextVisibility ? this.messages().seriesShown(seriesName) : this.messages().seriesHidden(seriesName)
            );

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
                    this.#setTransientInteraction(
                        {
                            activeHitTarget: primary,
                            activeHits,
                            pointerPosition: this.#interactionState.pointerPosition,
                            source: this.#interactionState.source
                        },
                        this.#interactionOwner
                    );
                    if (this.#interactionOwner === "tooltip" || this.#interactionOwner === "keyboard") {
                        const currentScene = this.#renderScene ?? this.scene();
                        const shared = currentScene ? this.#resolveSharedTooltip(currentScene) : false;
                        this.tooltipContext.set(this.#buildTooltipContext(activeHits, shared, primary));
                    }
                }
            }
        }
    }

    public unobserveDataLabelElement(element: HTMLElement, _labelId: string): void {
        if (this.#dataLabelResizeObserver) {
            this.#dataLabelResizeObserver.unobserve(element);
        }
        this.#observedDataLabelElements.delete(element);
    }

    public unobserveLabelElement(element: HTMLElement, _labelId: string): void {
        if (this.#labelResizeObserver) {
            this.#labelResizeObserver.unobserve(element);
        }
        this.#observedLabelElements.delete(element);
    }

    public unobserveOverlayLabelElement(element: HTMLElement, labelId: string): void {
        if (this.#overlayLabelResizeObserver) {
            this.#overlayLabelResizeObserver.unobserve(element);
        }
        this.#observedOverlayLabelElements.delete(element);
        this.#overlayLabelMeasurements.delete(labelId);
    }

    /**
     * @description Zooms the viewport by a scale factor around an optional pixel anchor point.
     */
    public zoom(factor: number, anchor?: ChartPoint, target?: ChartNavigationAxisTarget): void {
        const sc = this.cartesianXYScene();
        if (!sc || !sc.coordinateSpace) return;
        const center = anchor ?? {
            x: sc.plotRect.x + sc.plotRect.width / 2,
            y: sc.plotRect.y + sc.plotRect.height / 2
        };
        const nav = this.normalizedNavigation();
        const resolved = CartesianViewportTargetResolver.resolveTargets(
            center,
            sc.plotRect,
            sc.axes,
            nav,
            sc.orientation ?? "vertical",
            target ?? nav.zoomAxes,
            this.#cartesianLayoutRuntime?.navigationProfile
        );
        const res = CartesianViewportOperationCoordinator.transform(
            this.#effectiveViewportState(),
            sc.coordinateSpace,
            resolved.targetAxes,
            {
                anchor: center,
                zoomFactor: factor
            },
            {
                clampToData: nav.clampToData,
                constraints: nav.constraints,
                linkGroups: nav.linkGroups,
                minVisibleCategories: nav.minVisibleCategories,
                warnedSignatures: this.#warnedDiagnosticSignatures
            }
        );
        if (res.changed) {
            this.#applyViewportUpdate(res.viewport, "programmatic", "end", res.changedAxes);
        }
    }

    protected angularLabelTransform(tick: ChartAngularAxisTick): string {
        const sin = Math.sin(tick.angle);
        const cos = Math.cos(tick.angle);
        if (Math.abs(sin) < 0.15) {
            return cos > 0 ? "translate(-50%, -100%)" : "translate(-50%, 0%)";
        }
        return sin > 0 ? "translate(0, -50%)" : "translate(-100%, -50%)";
    }

    protected annotationLabelLeft(ann: ScenePointAnnotation): number {
        if (!ann.label) return 0;
        return this.annotationBadgeAnchors().get(ann.id)?.x ?? ann.label.anchor.x;
    }

    protected annotationLabelTop(ann: ScenePointAnnotation): number {
        if (!ann.label) return 0;
        return this.annotationBadgeAnchors().get(ann.id)?.y ?? ann.label.anchor.y;
    }

    protected annotationLabelTransform(ann: ScenePointAnnotation): string {
        switch (ann.label?.placement) {
            case "bottom":
                return "translate(-50%, 0)";
            case "left":
                return "translate(-100%, -50%)";
            case "right":
                return "translate(0, -50%)";
            case "top":
            default:
                return "translate(-50%, -100%)";
        }
    }

    protected axisLabelLeft(cart: CartesianChartScene, axisScene: ChartAxisScene, tick: ChartAxisSceneTick): number {
        if (axisScene.axis === "x") {
            return tick.coordinate;
        }
        const tickMarksOffset = axisScene.tickMarks ? (axisScene.tickSize ?? 6) : 0;
        const labelPadding = axisScene.labelPadding ?? 4;
        const sideOffset = axisScene.sideOffset ?? 0;
        return axisScene.position === "right"
            ? cart.plotRect.x + cart.plotRect.width + sideOffset + tickMarksOffset + labelPadding
            : cart.plotRect.x - sideOffset - tickMarksOffset - labelPadding;
    }

    protected axisLabelTop(cart: CartesianChartScene, axisScene: ChartAxisScene, tick: ChartAxisSceneTick): number {
        if (axisScene.axis === "y") {
            return tick.coordinate;
        }
        const tickMarksOffset = axisScene.tickMarks ? (axisScene.tickSize ?? 6) : 0;
        const labelPadding = axisScene.labelPadding ?? 4;
        const sideOffset = axisScene.sideOffset ?? 0;
        return axisScene.position === "top"
            ? cart.plotRect.y - sideOffset - tickMarksOffset - labelPadding
            : cart.plotRect.y + cart.plotRect.height + sideOffset + tickMarksOffset + labelPadding;
    }

    protected axisLabelTransform(axisScene: ChartAxisScene, _tick: ChartAxisSceneTick): string {
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

    protected axisLabelTransformOrigin(axisScene: ChartAxisScene): string {
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

    protected axisTitleLeft(cart: CartesianChartScene, axisScene: ChartAxisScene): number {
        if (axisScene.axis === "x") {
            return cart.plotRect.x + cart.plotRect.width / 2;
        }
        const gutter = axisScene.gutter ?? 48;
        const sideOffset = axisScene.sideOffset ?? 0;
        return axisScene.position === "right"
            ? cart.plotRect.x + cart.plotRect.width + sideOffset + gutter - 12
            : cart.plotRect.x - sideOffset - gutter + 12;
    }

    protected axisTitleTop(cart: CartesianChartScene, axisScene: ChartAxisScene): number {
        if (axisScene.axis === "y") {
            return cart.plotRect.y + cart.plotRect.height / 2;
        }
        const gutter = axisScene.gutter ?? 32;
        const sideOffset = axisScene.sideOffset ?? 0;
        return axisScene.position === "top"
            ? cart.plotRect.y - sideOffset - gutter + 4
            : cart.plotRect.y + cart.plotRect.height + sideOffset + gutter - 4;
    }

    protected crosshairXLabelLeft(cart: CartesianXYChartScene, state: ChartCrosshairState): number {
        if (!state.x) return 0;
        this.#overlayLabelMeasurementRevision();
        const targetAxis = cart.axes.find(a => a.axis === "x" && a.axisId === state.x?.axisId);
        const sideOffset = targetAxis?.sideOffset ?? 0;
        const offset = this.#crosshair()?.labelOffset() ?? 4;
        const desiredY =
            targetAxis?.position === "top"
                ? cart.plotRect.y - sideOffset - offset
                : cart.plotRect.y + cart.plotRect.height + sideOffset + offset;
        const fraction: LabelAnchorFraction = targetAxis?.position === "top" ? { x: 0.5, y: 1 } : { x: 0.5, y: 0 };
        const measurement = this.#overlayLabelMeasurements.get("crosshair:x");
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: { x: state.x.coordinate, y: desiredY },
            measurement
        });
        return pos.anchor.x;
    }

    protected crosshairXLabelTop(cart: CartesianXYChartScene, state: ChartCrosshairState): number {
        if (!state.x) return 0;
        this.#overlayLabelMeasurementRevision();
        const targetAxis = cart.axes.find(a => a.axis === "x" && a.axisId === state.x?.axisId);
        const sideOffset = targetAxis?.sideOffset ?? 0;
        const offset = this.#crosshair()?.labelOffset() ?? 4;
        const desiredY =
            targetAxis?.position === "top"
                ? cart.plotRect.y - sideOffset - offset
                : cart.plotRect.y + cart.plotRect.height + sideOffset + offset;
        const fraction: LabelAnchorFraction = targetAxis?.position === "top" ? { x: 0.5, y: 1 } : { x: 0.5, y: 0 };
        const measurement = this.#overlayLabelMeasurements.get("crosshair:x");
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: { x: state.x.coordinate, y: desiredY },
            measurement
        });
        return pos.anchor.y;
    }

    protected crosshairXLabelTransform(cart: CartesianXYChartScene, state: ChartCrosshairState): string {
        if (!state.x) return "";
        const targetAxis = cart.axes.find(a => a.axis === "x" && a.axisId === state.x?.axisId);
        return targetAxis?.position === "top" ? "translate(-50%, -100%)" : "translate(-50%, 0)";
    }

    protected crosshairYLabelLeft(cart: CartesianXYChartScene, state: ChartCrosshairState): number {
        if (!state.y) return 0;
        this.#overlayLabelMeasurementRevision();
        const targetAxis = cart.axes.find(a => a.axis === "y" && a.axisId === state.y?.axisId);
        const sideOffset = targetAxis?.sideOffset ?? 0;
        const offset = this.#crosshair()?.labelOffset() ?? 4;
        const desiredX =
            targetAxis?.position === "right"
                ? cart.plotRect.x + cart.plotRect.width + sideOffset + offset
                : cart.plotRect.x - sideOffset - offset;
        const fraction: LabelAnchorFraction = targetAxis?.position === "right" ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 };
        const measurement = this.#overlayLabelMeasurements.get("crosshair:y");
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: { x: desiredX, y: state.y.coordinate },
            measurement
        });
        return pos.anchor.x;
    }

    protected crosshairYLabelTop(cart: CartesianXYChartScene, state: ChartCrosshairState): number {
        if (!state.y) return 0;
        this.#overlayLabelMeasurementRevision();
        const targetAxis = cart.axes.find(a => a.axis === "y" && a.axisId === state.y?.axisId);
        const sideOffset = targetAxis?.sideOffset ?? 0;
        const offset = this.#crosshair()?.labelOffset() ?? 4;
        const desiredX =
            targetAxis?.position === "right"
                ? cart.plotRect.x + cart.plotRect.width + sideOffset + offset
                : cart.plotRect.x - sideOffset - offset;
        const fraction: LabelAnchorFraction = targetAxis?.position === "right" ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 };
        const measurement = this.#overlayLabelMeasurements.get("crosshair:y");
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: { x: desiredX, y: state.y.coordinate },
            measurement
        });
        return pos.anchor.y;
    }

    protected crosshairYLabelTransform(cart: CartesianXYChartScene, state: ChartCrosshairState): string {
        if (!state.y) return "";
        const targetAxis = cart.axes.find(a => a.axis === "y" && a.axisId === state.y?.axisId);
        return targetAxis?.position === "right" ? "translate(0, -50%)" : "translate(-100%, -50%)";
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

    protected isOutsideLabel(): boolean {
        const polarSeries = this.polarSeriesRegistration();
        const position = polarSeries?.labelPosition ? polarSeries.labelPosition() : "outside";
        return position === "outside";
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

    protected referenceBandLabelLeft(band: SceneReferenceBand): number {
        if (!band.label) return 0;
        this.#overlayLabelMeasurementRevision();
        const measurement = this.#overlayLabelMeasurements.get("overlay:band:" + band.id);
        const fraction: LabelAnchorFraction = { x: 0.5, y: 0.5 };
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: band.label.anchor,
            measurement
        });
        return pos.anchor.x;
    }

    protected referenceBandLabelTop(band: SceneReferenceBand): number {
        if (!band.label) return 0;
        this.#overlayLabelMeasurementRevision();
        const measurement = this.#overlayLabelMeasurements.get("overlay:band:" + band.id);
        const fraction: LabelAnchorFraction = { x: 0.5, y: 0.5 };
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: band.label.anchor,
            measurement
        });
        return pos.anchor.y;
    }

    protected referenceBandLabelTransform(_band: SceneReferenceBand): string {
        return "translate(-50%, -50%)";
    }

    protected referenceLineLabelLeft(line: SceneReferenceLine): number {
        if (!line.label) return 0;
        this.#overlayLabelMeasurementRevision();
        const measurement = this.#overlayLabelMeasurements.get("overlay:line:" + line.id);
        const fraction = this.#getReferenceLineAnchorFraction(line);
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: line.label.anchor,
            measurement
        });
        return pos.anchor.x;
    }

    protected referenceLineLabelTop(line: SceneReferenceLine): number {
        if (!line.label) return 0;
        this.#overlayLabelMeasurementRevision();
        const measurement = this.#overlayLabelMeasurements.get("overlay:line:" + line.id);
        const fraction = this.#getReferenceLineAnchorFraction(line);
        const containerRect: ChartRect = { height: this.#currentHeight, width: this.#currentWidth, x: 0, y: 0 };
        const pos = ChartOverlayLabelPositioner.position({
            anchorFraction: fraction,
            containerRect,
            desiredAnchor: line.label.anchor,
            measurement
        });
        return pos.anchor.y;
    }

    protected referenceLineLabelTransform(line: SceneReferenceLine): string {
        const fraction = this.#getReferenceLineAnchorFraction(line);
        const transformX = fraction.x === 0 ? "0%" : fraction.x === 0.5 ? "-50%" : "-100%";
        const transformY = fraction.y === 0 ? "0%" : fraction.y === 0.5 ? "-50%" : "-100%";
        return `translate(${transformX}, ${transformY})`;
    }

    protected resolveAnnotationRegistration(annId: string) {
        return this.#annotationById().get(annId);
    }

    protected resolveAnnotationTemplate(annId: string) {
        return this.#annotationById().get(annId)?.template?.();
    }

    protected resolveAxisLabelTemplate(axisScene: ChartAxisScene): ChartAxisLabelTemplateDirective | undefined {
        if (axisScene.axis === "x") {
            const reg = this.#xAxes().find(
                a => a.registrationId === axisScene.registrationId || (a.axisId?.() ?? "default-x") === axisScene.axisId
            );
            return reg?.labelTemplate?.();
        }
        const reg = this.#yAxes().find(
            a => a.registrationId === axisScene.registrationId || (a.axisId?.() ?? "default-y") === axisScene.axisId
        );
        return reg?.labelTemplate?.();
    }

    protected resolveCrosshairRegistration() {
        return this.#crosshair();
    }

    protected resolveReferenceBandRegistration(bandId: string) {
        return this.#referenceBandById().get(bandId);
    }

    protected resolveReferenceBandTemplate(bandId: string) {
        return this.#referenceBandById().get(bandId)?.template?.();
    }

    protected resolveReferenceLineRegistration(lineId: string) {
        return this.#referenceLineById().get(lineId);
    }

    protected resolveReferenceLineTemplate(lineId: string) {
        return this.#referenceLineById().get(lineId)?.template?.();
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

    protected sliceContrastColor(slice: SceneSectorSlice): string {
        return this.#styleResolver.getReadableForeground(slice.insideLabelBackgroundColor || slice.color);
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

    protected sliceLabelText(slice: SceneSectorSlice): string {
        const polarSeries = this.polarSeriesRegistration();
        const content = polarSeries?.labelContent() ?? "percentage";
        return formatPolarLabelText(slice, content);
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
}
