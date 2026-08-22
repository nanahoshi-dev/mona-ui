import type { ChartAxisTick, ChartXAxisType, ChartYAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartPadding, ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartLegendItem } from "../../models/chart-series.models";
import type {
    ChartAreaSeriesRegistration,
    ChartBarSeriesRegistration,
    ChartBubbleSeriesRegistration,
    ChartCartesianSeriesRegistration,
    ChartFinancialSeriesRegistration,
    ChartLineSeriesRegistration,
    ChartRangeAreaSeriesRegistration,
    ChartRangeBarSeriesRegistration,
    ChartScalarSeriesRegistrationBase,
    ChartXAxisRegistration,
    ChartYAxisRegistration
} from "../context/chart-registration-context";
import { calculateCategoryDomain } from "../data/chart-domain";
import { resolveData, resolveSeriesDisplayName, resolveValue } from "../data/chart-value-resolver";
import { ChartMarkKeyResolver } from "../animation/animation-identity";
import {
    BandScale,
    CartesianScaleFactory,
    LinearScale,
    TimeScale,
    UtcScale
} from "../scale/cartesian-scale-factory";
import type { ChartPositionScale, ChartBandPositionScale, ChartContinuousPositionScale, ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type {
    ChartAreaSeriesScene,
    ChartAxisScene,
    ChartBarSeriesScene,
    ChartCandlestickSeriesScene,
    ChartLineSeriesScene,
    ChartOhlcSeriesScene,
    ChartRangeAreaSeriesScene,
    ChartRangeBarSeriesScene,
    ChartSeriesScene
} from "../scene/cartesian-scene";
import type { ChartSeriesDensityMetadata } from "../scene/chart-scene";
import { projectRangeEnvelopeIndexView, projectScalarIndexView } from "../density/cartesian-density-projector";
import { CartesianConnectedPathInteractionProvider } from "../density/cartesian-dense-interaction-provider";
import { createDenseHitMaterializer } from "../density/cartesian-dense-hit-materializer";
import { CartesianMarkerSpatialInteractionProvider } from "../density/cartesian-marker-dense-provider";
import { ChartDensityTracker } from "./chart-density-instrumentation";
import { computeSharedStackSampleIndices } from "../density/cartesian-stack-downsampler";
import type { CartesianStackEntry } from "../data/cartesian-stack-engine";
import { computeRangeAreaLayout, computeRangeBarLayout } from "./cartesian-range-layout";
import { computeFinancialLayout } from "./cartesian-financial-layout";
import { CartesianSeriesPolicy } from "./cartesian-series-policy";
import type { CartesianFinancialIndex } from "../interaction/cartesian-financial-index";
import type {
    CartesianAxisTopologyItem,
    CartesianStackSceneConfig,
    CartesianXYChartScene
} from "../scene/chart-scene";
import type {
    ChartCornerRadii,
    ChartInteractionBucket,
    ChartInteractionXKey,
    SceneAreaPoint,
    SceneBar,
    SceneHitTarget,
    ScenePoint
} from "../scene/scene-geometry";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianBarSlots } from "./cartesian-bar-slots";
import { CartesianHorizontalBarLayoutEngine } from "./cartesian-horizontal-bar-layout-engine";
import { CartesianLegendBuilder } from "./cartesian-legend-builder";
import { CartesianMarkerLayout } from "./cartesian-marker-layout";
import { CartesianOrientationPolicy } from "./cartesian-orientation-policy";
import { CartesianAxisRegistryResolver, type ResolvedCartesianAxisDescriptor, type CartesianAxisRegistryResolution } from "./cartesian-axis-registry-resolver";
import { CartesianSeriesAxisBindingResolver, type SeriesAxisBindingResolution } from "./cartesian-series-axis-binding-resolver";
import {
    CartesianMultiAxisCoordinator,
    type CartesianAxisChromeLayout,
    type CartesianDomainPreparation,
    type MultiAxisViewportProjectionResult
} from "./cartesian-multi-axis-coordinator";
import { CartesianPointSpatialIndex } from "../interaction/cartesian-point-spatial-index";
import { CartesianViewportHitPolicy } from "../interaction/cartesian-viewport-hit-policy";
import { formatPercentagePoint, formatXValue, formatYValue } from "../utils/chart-formatter";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { CartesianAxisResolvedContextBuilder, type CartesianAxisResolvedContext } from "./cartesian-axis-resolved-context";
import { CartesianAxisCompatibilityPolicy } from "./cartesian-axis-compatibility-policy";
import {
    clamp,
    formatCompactNumber,
    isFiniteNumber,
    normalizeNonNegativeNumber,
    normalizeOpacity
} from "../utils/number-utils";
import {
    toPublicViewportState,
    type InternalCartesianViewportState
} from "../viewport/cartesian-viewport-normalizer";
import { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import { CartesianViewportReconciler } from "../viewport/cartesian-viewport-reconciler";
import type { CartesianNavigationProfile } from "../viewport/cartesian-viewport-target-resolver";
import {
    attachDensityRuntime,
    buildDensityRuntime,
    type CartesianDensityRuntime
} from "../density/cartesian-density-runtime";
import { defaultDownsamplingOptions } from "../density/chart-downsampling-options";

export interface CartesianXYLayoutRuntime {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly axisTopology: readonly CartesianAxisTopologyItem[];
    readonly axisTopologySignature: string;
    readonly baseCoordinateSpace: CartesianAxisCoordinateSpace;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly chrome: CartesianAxisChromeLayout;
    readonly containerHeight: number;
    readonly containerWidth: number;
    readonly density?: CartesianDensityRuntime;
    readonly effectiveRootXField?: ChartField;
    readonly effectiveSeries: readonly ChartCartesianSeriesRegistration[];
    readonly navigationProfile: CartesianNavigationProfile;
    readonly orientation: "horizontal" | "vertical";
    readonly plotRect: ChartRect;
    readonly preparation: CartesianDomainPreparation;
    readonly primaryXAxisId: string;
    readonly primaryXType: ResolvedChartCartesianAxisType;
    readonly primaryYAxisId: string;
    readonly primaryYType: ResolvedChartCartesianAxisType;
    readonly resolvedContext: CartesianAxisResolvedContext;
    readonly rootData: readonly unknown[];
    readonly stackConfigForScene: readonly CartesianStackSceneConfig[];
    readonly stackSignature: string;
    readonly styleResolver: ChartStyleResolver;
}

export interface CartesianLayoutComputation {
    readonly runtime?: CartesianXYLayoutRuntime;
    readonly scene: CartesianXYChartScene;
}

export interface CartesianLayoutOptions {
    containerHeight: number;
    containerWidth: number;
    downsamplingPolicy?: import("../density/chart-downsampling-options").NormalizedChartDownsamplingOptions;
    effectiveSeries?: readonly ChartCartesianSeriesRegistration[];
    measurements?: ReadonlyMap<string, { height: number; width: number }>;
    rootData?: readonly unknown[];
    rootXField?: ChartField;
    series?: readonly ChartCartesianSeriesRegistration[];
    styleResolver?: ChartStyleResolver;
    viewport?: InternalCartesianViewportState;
    warnedDiagnosticSignatures?: Set<string>;
    xAxis?: ChartXAxisRegistration;
    xAxes?: readonly ChartXAxisRegistration[];
    yAxis?: ChartYAxisRegistration;
    yAxes?: readonly ChartYAxisRegistration[];
}

export interface CartesianPreparedLayout {
    readonly fallbackScene?: CartesianXYChartScene;
    readonly runtime?: CartesianXYLayoutRuntime;
}

export class CartesianLayoutEngine {
    public static prepareRuntime(options: CartesianLayoutOptions): CartesianPreparedLayout {
        const {
            containerHeight,
            containerWidth,
            rootXField,
            warnedDiagnosticSignatures
        } = options;
        const rootData = options.rootData ?? [];
        const styleResolver = options.styleResolver ?? new ChartStyleResolver();

        const inputSeries = options.series ?? options.effectiveSeries ?? [];
        const seriesPolicy = CartesianSeriesPolicy.resolve(inputSeries);
        const effectiveSeries = seriesPolicy.effectiveSeries;
        if (warnedDiagnosticSignatures) {
            for (const d of seriesPolicy.diagnostics) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, d.message, d.signature);
            }
        }

        const orientationResolution = CartesianOrientationPolicy.resolve(effectiveSeries);
        if (warnedDiagnosticSignatures) {
            for (const d of orientationResolution.diagnostics) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, d);
            }
        }

        if (!orientationResolution.valid) {
            const legendItems = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);
            const emptyScene: CartesianXYChartScene = {
                axes: [],
                axisTopology: [],
                axisTopologySignature: "[]",
                barHitTargets: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionAxis: orientationResolution.orientation === "horizontal" ? "y" : "x",
                interactionBuckets: [],
                legendItems,
                orientation: orientationResolution.orientation,
                plotRect: { height: 0, width: 0, x: 0, y: 0 },
                primaryXAxisId: "default-x",
                primaryYAxisId: "default-y",
                series: [],
                stackConfiguration: [],
                stackSignature: "",
                width: containerWidth,
                xAxisType: "category",
                yAxisType: "linear"
            };
            return { fallbackScene: emptyScene };
        }

        const isHorizontal = orientationResolution.orientation === "horizontal";

        if (isHorizontal) {
            return CartesianHorizontalBarLayoutEngine.prepareRuntime({
                containerHeight,
                containerWidth,
                effectiveSeries,
                measurements: options.measurements,
                rootData,
                rootXField,
                series: effectiveSeries,
                styleResolver,
                viewport: options.viewport,
                warnedDiagnosticSignatures,
                xAxis: options.xAxis,
                xAxes: options.xAxes,
                yAxis: options.yAxis,
                yAxes: options.yAxes
            });
        }

        const xAxes = options.xAxes && options.xAxes.length > 0
            ? options.xAxes
            : (options.xAxis ? [options.xAxis] : []);
        const yAxes = options.yAxes && options.yAxes.length > 0
            ? options.yAxes
            : (options.yAxis ? [options.yAxis] : []);

        const axisResolution = CartesianAxisRegistryResolver.resolve(xAxes, yAxes);
        if (warnedDiagnosticSignatures) {
            for (const w of axisResolution.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const bindingResolution = CartesianSeriesAxisBindingResolver.resolve(effectiveSeries, axisResolution);
        if (warnedDiagnosticSignatures) {
            for (const w of bindingResolution.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const effectiveRootXField = rootXField || (axisResolution.xAxes[0]?.field as ChartField | undefined);

        // Stage A: Domain preparation
        const prep = CartesianMultiAxisCoordinator.prepareDomains({
            axisResolution,
            bindingResolution,
            orientation: "vertical",
            rootData,
            rootXField: effectiveRootXField
        });

        // Stage B: Chrome layout
        const chrome = CartesianMultiAxisCoordinator.computeChrome(prep, {
            chartHeight: containerHeight,
            chartWidth: containerWidth,
            labelMeasurements: options.measurements ?? new Map()
        });

        const baseCoordinateSpace = CartesianAxisCoordinateSpace.fromBaseAuthority(prep, chrome);

        if (warnedDiagnosticSignatures) {
            for (const w of prep.warnings) {
                ChartDiagnostics.warnOnce(warnedDiagnosticSignatures, w);
            }
        }

        const resolvedContext = CartesianAxisResolvedContextBuilder.create({
            axisResolution,
            axisUnitModes: prep.axisUnitModes,
            axisValidity: prep.axisValidity,
            axisValidityById: prep.axisValidityById,
            bindingResolution,
            invalidStackSeriesIds: prep.stackCoordination?.invalidSeriesIds,
            orientation: "vertical",
            resolvedTypes: prep.resolvedTypes,
            resolvedXTypeByAxisId: prep.resolvedXTypesByAxisId,
            resolvedYTypeByAxisId: prep.resolvedYTypesByAxisId,
            rootXField: effectiveRootXField,
            seriesIncompatibilityById: new Set(
                axisResolution.xAxes.flatMap(a => CartesianAxisCompatibilityPolicy.resolveAxisType(a, bindingResolution.seriesByXAxis.get(a.axisId) ?? [], rootData, effectiveRootXField, "vertical").incompatibleSeriesIds)
                .concat(axisResolution.yAxes.flatMap(a => CartesianAxisCompatibilityPolicy.resolveAxisType(a, bindingResolution.seriesByYAxis.get(a.axisId) ?? [], rootData, effectiveRootXField, "vertical").incompatibleSeriesIds))
            ),
            xAxisValidityById: prep.xAxisValidityById,
            yAxisValidityById: prep.yAxisValidityById
        });

        const primaryXType = (chrome.baseScales.getXScale(axisResolution.primaryXAxisId)?.type as ChartXAxisType) ?? "category";
        const primaryYType = (chrome.baseScales.getYScale(axisResolution.primaryYAxisId)?.type as ChartYAxisType) ?? "linear";

        const stackConfigForScene = prep.stackCoordination
            ? prep.stackCoordination.configuration.groups.map(g => ({
                  geometryType: g.geometryType,
                  groupId: g.id,
                  mode: g.mode,
                  name: g.name,
                  registeredSeriesIds: g.registeredSeriesIds,
                  valid: g.valid,
                  xAxisId: g.xAxisId,
                  yAxisId: g.yAxisId
              }))
            : [];
        const stackSignature = prep.stackCoordination?.configuration.signature ?? "";

        const axisTopology = [
            ...axisResolution.xAxes.map(ax => ({
                axis: "x" as const,
                axisId: ax.axisId,
                dimension: "x" as const,
                isPrimary: ax.isPrimary,
                position: ax.position,
                resolvedType: resolvedContext.resolvedXTypeByAxisId.get(ax.axisId) ?? "category",
                stackIndex: ax.stackIndex,
                valid: resolvedContext.xAxisValidityById.get(ax.axisId)?.valid ?? true,
                visible: ax.visible
            })),
            ...axisResolution.yAxes.map(ay => ({
                axis: "y" as const,
                axisId: ay.axisId,
                dimension: "y" as const,
                isPrimary: ay.isPrimary,
                position: ay.position,
                resolvedType: resolvedContext.resolvedYTypeByAxisId.get(ay.axisId) ?? "linear",
                stackIndex: ay.stackIndex,
                valid: resolvedContext.yAxisValidityById.get(ay.axisId)?.valid ?? true,
                visible: ay.visible
            }))
        ];
        const axisTopologySignature = JSON.stringify(axisTopology);

        const navigationProfile: CartesianNavigationProfile = effectiveSeries.some(s => s.type === "scatter" || s.type === "bubble")
            ? "xy"
            : "independent-x";

        const runtime: CartesianXYLayoutRuntime = {
            axisResolution,
            axisTopology,
            axisTopologySignature,
            baseCoordinateSpace,
            bindingResolution,
            chrome,
            containerHeight,
            containerWidth,
            effectiveRootXField,
            effectiveSeries,
            navigationProfile,
            orientation: "vertical",
            plotRect: chrome.plotRect,
            preparation: prep,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryXType: primaryXType as import("../scale/chart-scale").ResolvedChartCartesianAxisType,
            primaryYAxisId: axisResolution.primaryYAxisId,
            primaryYType: primaryYType as import("../scale/chart-scale").ResolvedChartCartesianAxisType,
            resolvedContext,
            rootData,
            stackConfigForScene,
            stackSignature,
            styleResolver
        };

        // Retained structural density runtime (WP7): built once per authority revision.
        if (options.downsamplingPolicy?.enabled !== false) {
            try {
                const density = buildDensityRuntime(
                    effectiveSeries,
                    prep,
                    resolvedContext,
                    rootData,
                    effectiveRootXField ?? "",
                    options.downsamplingPolicy ?? defaultDownsamplingOptions,
                    chrome.plotRect.width,
                    baseCoordinateSpace
                );
                return { runtime: attachDensityRuntime(runtime, density) };
            } catch {
                // Density preparation must never break ordinary layout; fall back to full layout.
                return { runtime };
            }
        }

        return { runtime };
    }

    public static projectRuntime(
        runtime: CartesianXYLayoutRuntime,
        viewport?: InternalCartesianViewportState,
        measurements?: ReadonlyMap<string, { height: number; width: number }>,
        warnedDiagnosticSignatures?: Set<string>
    ): CartesianLayoutComputation {
        if (runtime.orientation === "horizontal") {
            return CartesianHorizontalBarLayoutEngine.projectRuntime(runtime, viewport, measurements, warnedDiagnosticSignatures);
        }

        const {
            axisResolution,
            axisTopology,
            axisTopologySignature,
            chrome,
            containerHeight,
            containerWidth,
            effectiveSeries,
            preparation,
            primaryXType,
            primaryYType,
            stackConfigForScene,
            stackSignature,
            styleResolver
        } = runtime;

        if (chrome.plotRect.width <= 0 || chrome.plotRect.height <= 0) {
            const legendItems = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);
            const emptyScene: CartesianXYChartScene = {
                axes: chrome.baseAxisScenes,
                axisTopology,
                axisTopologySignature,
                barHitTargets: [],
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: false,
                height: containerHeight,
                hitTargets: [],
                interactionAxis: "x",
                interactionBuckets: [],
                legendItems,
                orientation: "vertical",
                plotRect: chrome.plotRect,
                primaryXAxisId: axisResolution.primaryXAxisId,
                primaryYAxisId: axisResolution.primaryYAxisId,
                series: [],
                stackConfiguration: stackConfigForScene,
                stackSignature,
                width: containerWidth,
                xAxisType: primaryXType as ChartXAxisType,
                yAxisType: primaryYType as ChartYAxisType
            };
            return { runtime, scene: emptyScene };
        }

        const proj = CartesianMultiAxisCoordinator.projectViewport(
            preparation,
            chrome,
            viewport,
            measurements
        );

        const scene = this.#projectSeriesGeometry(runtime, proj, viewport, warnedDiagnosticSignatures);
        return { runtime, scene };
    }

    public static compute(options: CartesianLayoutOptions): CartesianLayoutComputation {
        const prep = this.prepareRuntime(options);
        if (prep.fallbackScene) {
            return { runtime: prep.runtime, scene: prep.fallbackScene };
        }
        if (!prep.runtime) {
            throw new Error("Cartesian runtime could not be prepared");
        }
        const canonicalViewport = options.viewport
            ? CartesianViewportReconciler.reconcile(options.viewport, prep.runtime.baseCoordinateSpace, {
                  clampToData: true
              }).viewport
            : undefined;
        return this.projectRuntime(prep.runtime, canonicalViewport, options.measurements, options.warnedDiagnosticSignatures);
    }

    public static computeScene(options: CartesianLayoutOptions): CartesianXYChartScene {
        return this.compute(options).scene;
    }

    public static recomputeChrome(
        runtime: CartesianXYLayoutRuntime,
        containerWidth: number,
        containerHeight: number,
        measurements?: ReadonlyMap<string, { height: number; width: number }>
    ): CartesianXYLayoutRuntime {
        if (runtime.orientation === "horizontal") {
            return CartesianHorizontalBarLayoutEngine.recomputeChrome(runtime, containerWidth, containerHeight, measurements);
        }
        const chrome = CartesianMultiAxisCoordinator.computeChrome(runtime.preparation, {
            chartHeight: containerHeight,
            chartWidth: containerWidth,
            labelMeasurements: measurements ?? new Map()
        });
        const baseCoordinateSpace = CartesianAxisCoordinateSpace.fromBaseAuthority(runtime.preparation, chrome);
        return {
            ...runtime,
            baseCoordinateSpace,
            chrome,
            containerHeight,
            containerWidth,
            plotRect: chrome.plotRect
        };
    }

    public static projectViewportFastPath(
        runtime: CartesianXYLayoutRuntime,
        viewport?: InternalCartesianViewportState,
        measurements?: ReadonlyMap<string, { height: number; width: number }>,
        warnedDiagnosticSignatures?: Set<string>
    ): CartesianLayoutComputation {
        return this.projectRuntime(runtime, viewport, measurements, warnedDiagnosticSignatures);
    }

    static #projectSeriesGeometry(
        runtime: CartesianXYLayoutRuntime,
        projection: MultiAxisViewportProjectionResult,
        viewport?: InternalCartesianViewportState,
        warnedDiagnosticSignatures?: Set<string>
    ): CartesianXYChartScene {
        const {
            axisResolution,
            axisTopology,
            axisTopologySignature,
            containerHeight,
            containerWidth,
            effectiveRootXField,
            effectiveSeries,
            plotRect,
            preparation,
            primaryXAxisId,
            primaryXType,
            primaryYAxisId,
            primaryYType,
            resolvedContext,
            rootData,
            stackConfigForScene,
            stackSignature,
            styleResolver
        } = runtime;

        const { axisScenes, coordinateSpace, scaleRegistry } = projection;
        const stackAnalysesByYAxis = preparation.stackAnalysesByYAxis;

        const hitTargets: SceneHitTarget[] = [];
        const barHitTargets: SceneHitTarget[] = [];
        const pointHitTargets: SceneHitTarget[] = [];
        const seriesScenes: ChartSeriesScene[] = [];
        const seriesDensityMetadataById = new Map<string, ChartSeriesDensityMetadata>();
        const sharedStackSampleCache = new Map<string, Set<number> | null>();
        const denseInteractionById = new Map<string, import("../density/cartesian-dense-interaction-provider").CartesianDenseInteractionProvider>();
        const hitsByAxisId = new Map<string, Map<ChartInteractionXKey, SceneHitTarget[]>>();

        const recordHitTarget = (target: SceneHitTarget, isBar: boolean, isPoint: boolean): void => {
            if (!CartesianViewportHitPolicy.isHitTargetVisible(target, plotRect)) {
                return;
            }
            hitTargets.push(target);
            if (isBar && target.bounds) {
                barHitTargets.push(target);
            }
            if (isPoint && target.point) {
                pointHitTargets.push(target);
            }
            const axisId = target.xAxisId ?? primaryXAxisId;
            let axisMap = hitsByAxisId.get(axisId);
            if (!axisMap) {
                axisMap = new Map();
                hitsByAxisId.set(axisId, axisMap);
            }
            let list = axisMap.get(target.xKey);
            if (!list) {
                list = [];
                axisMap.set(target.xKey, list);
            }
            list.push(target);
        };

        const renderOrderCounter = { value: 0 };
        let validMarkerCount = 0;
        let activeFinancialIndex: CartesianFinancialIndex | undefined;

        // Bubble size domain
        const visibleBubbleSeries = effectiveSeries.filter(
            (s: ChartCartesianSeriesRegistration): s is ChartBubbleSeriesRegistration => s.visible() && s.type === "bubble"
        );
        const bubbleSizeDomain = CartesianMarkerLayout.calculateBubbleSizeDomain(
            visibleBubbleSeries,
            rootData,
            effectiveRootXField,
            primaryXType as ChartXAxisType,
            id => resolvedContext.resolvedSeriesContextById.get(id)
        );

        for (let sIdx = 0; sIdx < effectiveSeries.length; sIdx++) {
            const s = effectiveSeries[sIdx];
            const sCtx = resolvedContext.resolvedSeriesContextById.get(s.id);
            if (!sCtx || !sCtx.valid || !s.visible()) {
                continue;
            }

            const binding = sCtx.binding;
            const seriesXAxis = binding.xAxis;
            const seriesYAxis = binding.yAxis;
            const seriesXScale = scaleRegistry.getXScale(binding.xAxisId);
            const seriesYScale = scaleRegistry.getYScale(binding.yAxisId);

            if (!seriesXScale || !seriesYScale) {
                continue;
            }

            const seriesStackAnalysis = binding.yAxisId ? stackAnalysesByYAxis.get(binding.yAxisId) : undefined;
            const seriesStackLayout = seriesStackAnalysis?.visibleLayout;

            const seriesDisplayName = resolveSeriesDisplayName(s, sIdx);
            const sStyle = styleResolver.resolveSeriesStyle(s, sIdx);
            const sData = resolveData(s.data(), rootData);
            const sXField = sCtx.effectiveXField;
            const keyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.(), s.seriesKey?.());

            if (s.type === "candlestick" || s.type === "ohlc") {
                const financialLayoutResult = computeFinancialLayout({
                    plotRect,
                    recordHitTarget,
                    renderOrderCounter,
                    rootData,
                    rootXField: sXField,
                    series: s as ChartFinancialSeriesRegistration,
                    seriesDisplayName,
                    styleResolver,
                    warnedDiagnosticSignatures,
                    xAxis: seriesXAxis?.registration,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    xAxisType: seriesXScale.type as ChartXAxisType,
                    xScale: seriesXScale as any,
                    yAxis: seriesYAxis?.registration,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yFormatter: seriesYAxis?.formatter,
                    yScale: seriesYScale as any
                } as any);
                if (financialLayoutResult) {
                    seriesScenes.push(financialLayoutResult.scene);
                    activeFinancialIndex = financialLayoutResult.financialIndex;
                }
                continue;
            }

            if (s.type === "scatter" || s.type === "bubble") {
                // Marker density: representative subset from the normalized
                // spatial hierarchy keeps scene volume bounded (§56/§60).
                const markerEntry = runtime.density?.seriesById.get(s.id) ?? null;
                let markerIndexView: readonly number[] | null = null;
                if (markerEntry?.spatial && markerEntry.scalar && seriesXScale.type !== "category") {
                    const xSnap = projection.coordinateSpace?.get({ axis: "x", axisId: binding.xAxisId ?? "" });
                    const ySnap = projection.coordinateSpace?.get({ axis: "y", axisId: binding.yAxisId ?? "" });
                    const effectiveViewport = viewport ?? { x: new Map(), y: new Map() };
                    const xWindow = resolveViewportUnitInterval(xSnap, effectiveViewport, "x");
                    const yWindow = resolveViewportUnitInterval(ySnap, effectiveViewport, "y");
                    if (xWindow && yWindow) {
                        const budget = Math.max(
                            256,
                            Math.min(30_000, Math.floor((plotRect.width / 8) * (plotRect.height / 8)))
                        );
                        const representatives: number[] = [];
                        markerEntry.spatial.index.collectRepresentatives(
                            [
                                Math.max(0, Math.min(xWindow[0], xWindow[1])),
                                Math.max(0, Math.min(yWindow[0], yWindow[1])),
                                Math.abs(xWindow[1] - xWindow[0]),
                                Math.abs(yWindow[1] - yWindow[0])
                            ],
                            budget,
                            idx => representatives.push(idx),
                            () => ChartDensityTracker.current?.onSpatialNodeVisited?.()
                        );
                        representatives.sort((a, b) => a - b);
                        markerIndexView = representatives;
                        recordSeriesDensityMetadata(seriesDensityMetadataById, s.id, sData.length, {
                            algorithm: "pixel",
                            indices: representatives,
                            renderedCount: representatives.length,
                            sampled: true,
                            sourceCount: sData.length,
                            visibleSourceCount: representatives.length
                        });

                        // Exact raw interaction over the full marker source (§64).
                        const spatialEntry = markerEntry.spatial;
                        const markerKeyResolver = new ChartMarkKeyResolver(s.id, s.keyField?.(), s.seriesKey?.());
                        const markerTemporal = resolveTemporalFlag(projection.coordinateSpace, binding.xAxisId);
                        const toPublicX = (epochOrNumber: number): number | Date =>
                            markerTemporal ? new Date(epochOrNumber) : epochOrNumber;
                        denseInteractionById.set(
                            s.id,
                            new CartesianMarkerSpatialInteractionProvider({
                                hierarchy: spatialEntry.index,
                                materialize: idx => {
                                    const datum = sData[idx];
                                    if (datum === undefined) {
                                        return null;
                                    }
                                    const xVal = resolveValue(datum, sXField, idx);
                                    const yVal = resolveValue(datum, (s as ChartScalarSeriesRegistrationBase).field(), idx);
                                    if (!isFiniteNumber(yVal)) {
                                        return null;
                                    }
                                    const xPos = seriesXScale.map(xVal as never);
                                    const yPos = seriesYScale.map(Number(yVal));
                                    if (
                                        xPos === undefined || yPos === undefined ||
                                        !Number.isFinite(xPos) || !Number.isFinite(yPos)
                                    ) {
                                        return null;
                                    }
                                    const normalizedKey = markerTemporal
                                        ? (xVal instanceof Date ? xVal.getTime() : Number(xVal))
                                        : Number(xVal);
                                    return {
                                        animationKey: markerKeyResolver.resolveKey(datum, normalizedKey, idx),
                                        color: undefined,
                                        datum,
                                        formattedCategory: formatXValue(
                                            xVal,
                                            idx,
                                            seriesXAxis?.formatter,
                                            (seriesXScale.type ?? "category") as any
                                        ),
                                        formattedValue: formatYValue(Number(yVal), idx, seriesYAxis?.formatter),
                                        index: idx,
                                        point: { x: xPos, y: yPos },
                                        radius: 16,
                                        renderOrder: ++renderOrderCounter.value,
                                        seriesId: s.id,
                                        seriesName: seriesDisplayName,
                                        seriesType: s.type,
                                        xAxisId: binding.xAxisId,
                                        xAxisTitle: seriesXAxis?.title,
                                        xKey: normalizedKey,
                                        xValue: xVal,
                                        yAxisId: binding.yAxisId,
                                        yAxisTitle: seriesYAxis?.title,
                                        yValue: Number(yVal)
                                    };
                                },
                                onNodeVisited: () => ChartDensityTracker.current?.onSpatialNodeVisited?.(),
                                xBaseNormalize: semantic => {
                                    const p = xSnap!.baseScale.map(semantic as never);
                                    if (p === undefined || !Number.isFinite(p)) {
                                        return Number.NaN;
                                    }
                                    const [r0, r1] = xSnap!.range;
                                    return r1 === r0 ? 0 : (p - r0) / (r1 - r0);
                                },
                                xViewportScale: seriesXScale as ChartContinuousPositionScale<number | Date>,
                                yBaseNormalize: semantic => {
                                    const p = ySnap!.baseScale.map(semantic as never);
                                    if (p === undefined || !Number.isFinite(p)) {
                                        return Number.NaN;
                                    }
                                    const [r0, r1] = ySnap!.range;
                                    return r1 === r0 ? 0 : (p - r0) / (r1 - r0);
                                },
                                yViewportScale: seriesYScale
                            })
                        );
                    } else {
                        recordSeriesDensityMetadata(seriesDensityMetadataById, s.id, sData.length, null);
                    }
                } else {
                    recordSeriesDensityMetadata(seriesDensityMetadataById, s.id, sData.length, null);
                }

                const markerRes = CartesianMarkerLayout.computeSeries({
                    bubbleSizeDomain,
                    indexView: markerIndexView,
                    plotRect,
                    renderOrderCounter,
                    rootData,
                    rootXField: sXField,
                    series: s,
                    seriesIndex: sIdx,
                    styleResolver,
                    xAxis: seriesXAxis?.registration,
                    xAxisFormatter: seriesXAxis?.formatter,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    xAxisType: seriesXScale.type as ChartXAxisType,
                    xScale: seriesXScale,
                    yAxis: seriesYAxis?.registration,
                    yAxisFormatter: seriesYAxis?.formatter,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yScale: seriesYScale
                });

                if (markerRes) {
                    seriesScenes.push(markerRes.scene);
                    for (const hit of markerRes.hitTargets) {
                        recordHitTarget(hit, false, true);
                    }
                    validMarkerCount += markerRes.validDatumCount;
                }
                continue;
            }

            if (s.type === "rangeBar") {
                const barSlotLayout = CartesianBarSlots.computeSlotLayout(
                    effectiveSeries.filter((es: ChartCartesianSeriesRegistration) => {
                        const esCtx = resolvedContext.resolvedSeriesContextById.get(es.id);
                        return esCtx?.valid && esCtx.binding.xAxisId === binding.xAxisId;
                    }),
                    seriesStackLayout,
                    new Set()
                );
                const bandScale = seriesXScale.type === "category" ? (seriesXScale as BandScale<string>) : undefined;
                let nestedBarScale: BandScale<string> | undefined;
                if (barSlotLayout.slots.length > 0 && bandScale) {
                    const slotIds = barSlotLayout.slots.map(sl => sl.id);
                    nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, bandScale.bandwidth()], 0.1, 0.05);
                }

                const rangeBarScene = computeRangeBarLayout({
                    bandScale,
                    barSlotLayout,
                    nestedBarScale,
                    recordHitTarget,
                    renderOrderCounter,
                    rootData,
                    rootXField: sXField,
                    series: s as ChartRangeBarSeriesRegistration,
                    seriesDisplayName,
                    style: sStyle,
                    xAxis: seriesXAxis?.registration,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    yAxis: seriesYAxis?.registration,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yFormatter: seriesYAxis?.formatter,
                    yScale: seriesYScale as any
                });
                if (rangeBarScene) {
                    seriesScenes.push(rangeBarScene);
                }
                continue;
            }

            if (s.type === "rangeArea") {
                const rangeEntry = runtime.density?.seriesById.get(s.id) ?? null;
                let rangeIndexView: readonly number[] | null | undefined;
                if (
                    rangeEntry?.scalar &&
                    rangeEntry.capability.mode === "connected-range" &&
                    rangeEntry.range &&
                    seriesXScale.type !== "category"
                ) {
                    const envelope = projectRangeEnvelopeIndexView({
                        baseDomainMax: toBaseExtent(projection.coordinateSpace, binding.xAxisId).max,
                        baseDomainMin: toBaseExtent(projection.coordinateSpace, binding.xAxisId).min,
                        fromY: rangeEntry.range.from,
                        maxPoints: null,
                        plotSpanPx: plotRect.width,
                        samplesPerPixel: 1,
                        toY: rangeEntry.range.to,
                        viewportScale: seriesXScale as ChartContinuousPositionScale<number | Date>,
                        x: rangeEntry.scalar.x
                    });
                    rangeIndexView = envelope.indices;
                    recordSeriesDensityMetadata(seriesDensityMetadataById, s.id, sData.length, envelope);
                } else {
                    recordSeriesDensityMetadata(seriesDensityMetadataById, s.id, sData.length, null);
                }

                const rangeAreaScene = computeRangeAreaLayout({
                    bandScale: seriesXScale.type === "category" ? (seriesXScale as BandScale<string>) : undefined,
                    indexView: rangeIndexView ?? null,
                    linearXScale: seriesXScale.type === "linear" ? (seriesXScale as LinearScale) : undefined,
                    plotRect,
                    recordHitTarget,
                    renderOrderCounter,
                    rootData,
                    rootXField: sXField,
                    scalarSegmentEnds: rangeEntry?.scalar?.segments.map(seg => seg.endIndexExclusive),
                    scalarSegmentIds: rangeEntry?.scalar?.segmentIds,
                    series: s as ChartRangeAreaSeriesRegistration,
                    seriesDisplayName,
                    style: sStyle,
                    timeScale: seriesXScale.type === "time" || seriesXScale.type === "utc" ? (seriesXScale as TimeScale | UtcScale) : undefined,
                    xAxis: seriesXAxis?.registration,
                    xAxisId: binding.xAxisId,
                    xAxisTitle: seriesXAxis?.title,
                    xAxisType: seriesXScale.type as ChartXAxisType,
                    xScale: seriesXScale,
                    yAxis: seriesYAxis?.registration,
                    yAxisId: binding.yAxisId,
                    yAxisTitle: seriesYAxis?.title,
                    yFormatter: seriesYAxis?.formatter,
                    yScale: seriesYScale as any
                });
                seriesScenes.push(rangeAreaScene);
                continue;
            }

            const sField = (s as ChartScalarSeriesRegistrationBase).field();

            if (s.type === "bar") {
                const barSlotLayout = CartesianBarSlots.computeSlotLayout(
                    effectiveSeries.filter((es: ChartCartesianSeriesRegistration) => {
                        const esCtx = resolvedContext.resolvedSeriesContextById.get(es.id);
                        return esCtx?.valid && esCtx.binding.xAxisId === binding.xAxisId;
                    }),
                    seriesStackLayout,
                    new Set()
                );
                const bandScale = seriesXScale.type === "category" ? (seriesXScale as BandScale<string>) : undefined;
                if (!bandScale) {
                    continue;
                }

                const slot = barSlotLayout.bySeriesId.get(s.id);
                let nestedBarScale: BandScale<string> | undefined;
                if (barSlotLayout.slots.length > 0) {
                    const slotIds = barSlotLayout.slots.map(sl => sl.id);
                    nestedBarScale = CartesianScaleFactory.createBandScale(slotIds, [0, bandScale.bandwidth()], 0.1, 0.05);
                }

                const slotWidth = nestedBarScale ? nestedBarScale.bandwidth() : bandScale.bandwidth();
                const explicitBarWidth = "maxBarWidth" in s && typeof s.maxBarWidth === "function" ? s.maxBarWidth() : undefined;
                const effectiveBarWidth = explicitBarWidth !== undefined && isFiniteNumber(explicitBarWidth) && (explicitBarWidth as number) > 0
                    ? Math.min(explicitBarWidth as number, slotWidth)
                    : (slot?.maxBarWidth !== undefined ? Math.min(slotWidth, slot.maxBarWidth) : slotWidth);

                const centerOffset = (slotWidth - effectiveBarWidth) / 2;
                const subX = nestedBarScale && slot ? (nestedBarScale.map(slot.id) ?? 0) : 0;
                const barWidth = effectiveBarWidth;

                const bars: SceneBar[] = [];
                const isStacked = seriesStackLayout?.bySeriesId.has(s.id);
                const stackGroup = seriesStackLayout?.groupBySeriesId.get(s.id);
                const baselineY = clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height);
                const radius = normalizeNonNegativeNumber((s as ChartBarSeriesRegistration).borderRadius?.(), 4);

                if (isStacked && seriesStackLayout) {
                    const stackEntries = seriesStackLayout.orderedBySeriesId.get(s.id) ?? [];
                    const seriesRawFormatter = (s as ChartBarSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter =
                        seriesRawFormatter ?? (stackGroup?.mode === "percent" ? undefined : seriesYAxis?.formatter);

                    for (const stackEntry of stackEntries) {
                        const catKey = String(stackEntry.xKey);
                        const bandOuterX = bandScale.map(catKey);
                        if (bandOuterX === undefined) continue;

                        const barX = bandOuterX + subX + centerOffset;
                        const fromY = seriesYScale.map(stackEntry.stackStart) ?? baselineY;
                        const toY = seriesYScale.map(stackEntry.stackEnd) ?? baselineY;
                        const barHeight = Math.abs(toY - fromY);
                        const topY = Math.min(fromY, toY);
                        const isPositive = stackEntry.rawValue >= 0;
                        const isZeroBar = stackEntry.rawValue === 0;

                        const pos = stackEntry.stackPosition ?? "single";
                        let cornerRadii: ChartCornerRadii;
                        if (radius > 0 && barHeight > 0 && !isZeroBar) {
                            if (pos === "single") {
                                cornerRadii = isPositive
                                    ? { bottomLeft: 0, bottomRight: 0, topLeft: radius, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: radius, topLeft: 0, topRight: 0 };
                            } else if (pos === "outer") {
                                cornerRadii = isPositive
                                    ? { bottomLeft: 0, bottomRight: 0, topLeft: radius, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: radius, topLeft: 0, topRight: 0 };
                            } else {
                                cornerRadii = { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };
                            }
                        } else {
                            cornerRadii = { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };
                        }

                        const bar: SceneBar = {
                            animationKey: stackEntry.animationKey,
                            cornerRadii,
                            datum: stackEntry.datum,
                            height: barHeight,
                            index: stackEntry.dataIndex,
                            isPositive,
                            radius,
                            stackEndValue: stackEntry.stackEnd,
                            stackGroup: stackGroup?.name,
                            stackMode: stackGroup?.mode,
                            stackPercentage: stackEntry.stackPercentage,
                            stackPosition: pos,
                            stackStartValue: stackEntry.stackStart,
                            stackTotal: stackEntry.stackTotal,
                            synthetic: stackEntry.synthetic,
                            width: barWidth,
                            x: barX,
                            xValue: stackEntry.xValue,
                            y: topY,
                            yValue: stackEntry.rawValue
                        };
                        bars.push(bar);

                        if (!stackEntry.synthetic) {
                            const currentRenderOrder = ++renderOrderCounter.value;
                            const formattedStackTotal =
                                stackEntry.stackTotal !== undefined
                                    ? (seriesRawFormatter
                                        ? formatYValue(stackEntry.stackTotal, stackEntry.dataIndex, seriesRawFormatter)
                                        : formatCompactNumber(stackEntry.stackTotal))
                                    : undefined;
                            const formattedStackPercentage =
                                stackEntry.stackPercentage !== undefined
                                    ? formatPercentagePoint(stackEntry.stackPercentage)
                                    : undefined;
                            const formattedValue = formatYValue(
                                stackEntry.rawValue,
                                stackEntry.dataIndex,
                                effectiveRawFormatter
                            );

                            const isZeroBar = stackEntry.rawValue === 0 || barHeight === 0;
                            const barTarget: SceneHitTarget = {
                                animationKey: stackEntry.animationKey,
                                borderRadius: radius,
                                bounds: isZeroBar
                                    ? undefined
                                    : {
                                        height: Math.max(4, barHeight),
                                        width: barWidth,
                                        x: barX,
                                        y: topY
                                    },
                                cornerRadii,
                                datum: stackEntry.datum,
                                formattedCategory: formatXValue(
                                    catKey,
                                    stackEntry.dataIndex,
                                    seriesXAxis?.formatter,
                                    "category"
                                ),
                                formattedPercentage: formattedStackPercentage,
                                formattedStackPercentage,
                                formattedStackTotal,
                                formattedValue,
                                index: stackEntry.dataIndex,
                                isPositive,
                                percentage: stackEntry.stackPercentage,
                                renderOrder: currentRenderOrder,
                                seriesId: s.id,
                                seriesName: seriesDisplayName,
                                seriesType: "bar",
                                stackEnd: stackEntry.stackEnd,
                                stackGroup: stackGroup?.name,
                                stackMode: stackGroup?.mode,
                                stackPercentage: stackEntry.stackPercentage,
                                stackStart: stackEntry.stackStart,
                                stackTotal: stackEntry.stackTotal,
                                value: stackEntry.rawValue,
                                visualBounds: {
                                    height: barHeight,
                                    width: barWidth,
                                    x: barX,
                                    y: topY
                                },
                                xAxisId: binding.xAxisId,
                                xAxisTitle: seriesXAxis?.title,
                                xKey: catKey,
                                xValue: stackEntry.xValue,
                                yAxisId: binding.yAxisId,
                                yAxisTitle: seriesYAxis?.title,
                                yValue: stackEntry.rawValue
                            };
                            recordHitTarget(barTarget, true, false);
                        }
                    }
                } else {
                    const seriesRawFormatter = (s as ChartBarSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter = seriesRawFormatter ?? seriesYAxis?.formatter;

                    for (let dIdx = 0; dIdx < sData.length; dIdx++) {
                        const datum = sData[dIdx];
                        const xVal = resolveValue(datum, sXField, dIdx);
                        const yVal = resolveValue(datum, sField, dIdx);

                        if (!isFiniteNumber(yVal)) {
                            continue;
                        }

                        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                        const bandOuterX = bandScale.map(catKey);
                        if (bandOuterX === undefined) continue;

                        const barX = bandOuterX + subX + centerOffset;
                        const yPos = seriesYScale.map(Number(yVal)) ?? baselineY;
                        const isPositive = Number(yVal) >= 0;
                        const topY = isPositive ? yPos : baselineY;
                        const barHeight = Math.abs(yPos - baselineY);
                        const animationKey = keyResolver.resolveKey(datum, catKey, dIdx);

                        const cornerRadii: ChartCornerRadii =
                            barHeight > 0
                                ? isPositive
                                    ? { bottomLeft: 0, bottomRight: 0, topLeft: radius, topRight: radius }
                                    : { bottomLeft: radius, bottomRight: radius, topLeft: 0, topRight: 0 }
                                : { bottomLeft: 0, bottomRight: 0, topLeft: 0, topRight: 0 };

                        const bar: SceneBar = {
                            animationKey,
                            cornerRadii,
                            datum,
                            height: barHeight,
                            index: dIdx,
                            isPositive,
                            radius,
                            width: barWidth,
                            x: barX,
                            xValue: xVal,
                            y: topY,
                            yValue: Number(yVal)
                        };
                        bars.push(bar);

                        const currentRenderOrder = ++renderOrderCounter.value;
                        const barTarget: SceneHitTarget = {
                            animationKey,
                            borderRadius: radius,
                            bounds: {
                                height: Math.max(4, barHeight),
                                width: barWidth,
                                x: barX,
                                y: barHeight === 0 ? topY - 2 : topY
                            },
                            cornerRadii,
                            datum,
                            formattedCategory: formatXValue(catKey, dIdx, seriesXAxis?.formatter, "category"),
                            formattedValue: formatYValue(yVal, dIdx, effectiveRawFormatter),
                            index: dIdx,
                            isPositive,
                            renderOrder: currentRenderOrder,
                            seriesId: s.id,
                            seriesName: seriesDisplayName,
                            seriesType: "bar",
                            visualBounds: {
                                height: barHeight,
                                width: barWidth,
                                x: barX,
                                y: topY
                            },
                            xAxisId: binding.xAxisId,
                            xAxisTitle: seriesXAxis?.title,
                            xKey: catKey,
                            xValue: xVal,
                            yAxisId: binding.yAxisId,
                            yAxisTitle: seriesYAxis?.title,
                            yValue: Number(yVal)
                        };
                        recordHitTarget(barTarget, true, false);
                    }
                }

                const barScene: ChartBarSeriesScene = {
                    bars,
                    borderRadius: radius,
                    fillOpacity: normalizeOpacity(s.fillOpacity?.(), 1),
                    id: s.id,
                    name: seriesDisplayName,
                    style: sStyle,
                    type: "bar",
                    xAxisId: binding.xAxisId ?? "default-x",
                    yAxisId: binding.yAxisId ?? "default-y"
                };
                seriesScenes.push(barScene);
            } else if (s.type === "line") {
                const points: ScenePoint[] = [];
                const lineReg = s as ChartLineSeriesRegistration;
                const seriesConnectNulls = lineReg.connectNulls?.() ?? false;

                const densityEntry = runtime.density?.seriesById.get(s.id) ?? null;
                const indexView = resolveConnectedScalarIndexView(
                    densityEntry,
                    seriesXScale,
                    projection.coordinateSpace,
                    binding.xAxisId,
                    plotRect,
                    warnedDiagnosticSignatures
                );
                recordSeriesDensityMetadata(
                    seriesDensityMetadataById,
                    s.id,
                    sData.length,
                    indexView
                );
                if (indexView?.sampled && densityEntry?.scalar && indexView.indices) {
                    denseInteractionById.set(
                        s.id,
                        new CartesianConnectedPathInteractionProvider({
                            materialize: createDenseHitMaterializer({
                                keyResolver,
                                scalar: densityEntry.scalar,
                                seriesDisplayName,
                                seriesId: s.id,
                                seriesType: "line",
                                temporal: resolveTemporalFlag(projection.coordinateSpace, binding.xAxisId),
                                valueFormatter:
                                    "valueFormatter" in s && typeof s.valueFormatter === "function"
                                        ? (s.valueFormatter() as never)
                                        : undefined,
                                xAxisFormatter: seriesXAxis?.formatter,
                                xAxisId: binding.xAxisId ?? "default-x",
                                xAxisTitle: seriesXAxis?.title,
                                xScale: seriesXScale as ChartContinuousPositionScale<number | Date>,
                                yAxisFormatter: seriesYAxis?.formatter,
                                yAxisId: binding.yAxisId ?? "default-y",
                                yAxisTitle: seriesYAxis?.title,
                                yScale: seriesYScale as ChartContinuousPositionScale<number | Date>
                            }),
                            scalar: densityEntry.scalar,
                            xScale: seriesXScale as ChartContinuousPositionScale<number | Date>,
                            yScale: seriesYScale as ChartContinuousPositionScale<number | Date>
                        })
                    );
                }

                const visitDatum = (dIdx: number): void => {
                    const datum = sData[dIdx];
                    const xVal = resolveValue(datum, sXField, dIdx);
                    const yVal = resolveValue(datum, sField, dIdx);

                    let xPos = plotRect.x;
                    let isXValid = false;
                    let normalizedXKey: number | string = dIdx;

                    if (seriesXScale.type === "category") {
                        const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                        normalizedXKey = catKey;
                        const bPos = (seriesXScale as BandScale<string>).map(catKey);
                        if (bPos !== undefined) {
                            xPos = bPos + (seriesXScale as BandScale<string>).bandwidth() / 2;
                            isXValid = true;
                        }
                    } else if (seriesXScale.type === "time" || seriesXScale.type === "utc") {
                        let dateVal: Date | undefined;
                        if (xVal instanceof Date && !Number.isNaN(xVal.getTime())) {
                            dateVal = xVal;
                        } else if (typeof xVal === "number" && Number.isFinite(xVal)) {
                            dateVal = new Date(xVal);
                        } else if (typeof xVal === "string") {
                            const parsed = Date.parse(xVal);
                            if (!Number.isNaN(parsed)) {
                                dateVal = new Date(parsed);
                            }
                        }
                        if (dateVal !== undefined && Number.isFinite(dateVal.getTime())) {
                            normalizedXKey = dateVal.getTime();
                            const coord = (seriesXScale as any).map(dateVal);
                            if (coord !== undefined && Number.isFinite(coord)) {
                                xPos = coord;
                                isXValid = true;
                            }
                        }
                    } else {
                        if (isFiniteNumber(xVal)) {
                            normalizedXKey = Number(xVal);
                            const coord = (seriesXScale as any).map(Number(xVal));
                            if (coord !== undefined && Number.isFinite(coord)) {
                                xPos = coord;
                                isXValid = true;
                            }
                        }
                    }

                    let isYValid = isFiniteNumber(yVal);
                    let yPos = plotRect.y + plotRect.height;
                    if (isYValid) {
                        const coord = (seriesYScale as any).map(Number(yVal));
                        if (coord !== undefined && Number.isFinite(coord)) {
                            yPos = coord;
                        } else {
                            isYValid = false;
                        }
                    }

                    const defined = isXValid && isYValid;
                    const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                    const point: ScenePoint = {
                        animationKey,
                        datum,
                        defined,
                        index: dIdx,
                        x: xPos,
                        xValue: xVal,
                        y: yPos,
                        yValue: isYValid ? Number(yVal) : 0
                    };
                    points.push(point);

                    if (defined) {
                        const showPoints = lineReg.showPoints?.() ?? false;
                        const pointRadius = lineReg.pointRadius?.() ?? 4;
                        const visualRadius = showPoints ? pointRadius : 0;

                        const currentRenderOrder = ++renderOrderCounter.value;
                        const pointTarget: SceneHitTarget = {
                            animationKey,
                            datum,
                            formattedCategory: formatXValue(
                                normalizedXKey,
                                dIdx,
                                seriesXAxis?.formatter,
                                (seriesXScale.type ?? "category") as any
                            ),
                            formattedValue: formatYValue(yVal, dIdx, ("valueFormatter" in s && typeof s.valueFormatter === "function" ? s.valueFormatter() : undefined) ?? seriesYAxis?.formatter),
                            index: dIdx,
                            point: { x: xPos, y: yPos },
                            radius: 16,
                            renderOrder: currentRenderOrder,
                            seriesId: s.id,
                            seriesName: seriesDisplayName,
                            seriesType: "line",
                            visualRadius,
                            xAxisId: binding.xAxisId,
                            xAxisTitle: seriesXAxis?.title,
                            xKey: normalizedXKey,
                            xValue: xVal,
                            yAxisId: binding.yAxisId,
                            yAxisTitle: seriesYAxis?.title,
                            yValue: Number(yVal)
                        };
                        recordHitTarget(pointTarget, false, true);
                    }
                };

                iterateSampledOrFullIndices({
                    connectNulls: seriesConnectNulls,
                    indices: indexView?.indices ?? null,
                    scalar: densityEntry?.scalar ?? null,
                    total: sData.length,
                    visit: visitDatum
                });

                const lineScene: ChartLineSeriesScene = {
                    connectNulls: seriesConnectNulls,
                    curve: lineReg.curve?.() ?? "linear",
                    id: s.id,
                    name: seriesDisplayName,
                    points,
                    showPoints: lineReg.showPoints?.() ?? false,
                    style: sStyle,
                    type: "line",
                    xAxisId: binding.xAxisId ?? "default-x",
                    yAxisId: binding.yAxisId ?? "default-y"
                };
                seriesScenes.push(lineScene);
            } else if (s.type === "area") {
                const points: SceneAreaPoint[] = [];
                const isStacked = seriesStackLayout?.bySeriesId.has(s.id);
                const stackGroup = seriesStackLayout?.groupBySeriesId.get(s.id);

                if (isStacked && seriesStackLayout) {
                    let stackEntries = seriesStackLayout.orderedBySeriesId.get(s.id) ?? [];

                    // Coordinated group-wide sampling (§54/§55): one shared index
                    // selection per stack group per projection, derived from full
                    // stack totals — never per-layer independent reduction.
                    if (stackGroup && seriesXScale.type !== "category") {
                        const cacheKey = `area:${stackGroup.id}`;
                        let sharedSet = sharedStackSampleCache.get(cacheKey);
                        if (sharedSet === undefined) {
                            const entriesBySeriesId = new Map<string, readonly CartesianStackEntry[]>();
                            for (const memberId of stackGroup.seriesIds) {
                                const memberEntries = seriesStackLayout.orderedBySeriesId.get(memberId);
                                if (memberEntries && memberEntries.length > 0) {
                                    entriesBySeriesId.set(memberId, memberEntries);
                                }
                            }
                            sharedSet = computeSharedStackSampleIndices({
                                entriesBySeriesId,
                                plotSpanPx: plotRect.width,
                                samplesPerPixel: 1,
                                viewportScale: seriesXScale as ChartContinuousPositionScale<number | Date>
                            });
                            sharedStackSampleCache.set(cacheKey, sharedSet);
                        }
                        if (sharedSet) {
                            const before = stackEntries.length;
                            stackEntries = stackEntries.filter(e => sharedSet!.has(e.dataIndex));
                            recordSeriesDensityMetadata(seriesDensityMetadataById, s.id, before, {
                                algorithm: "stack-envelope",
                                indices: null,
                                renderedCount: stackEntries.length,
                                sampled: true,
                                sourceCount: before,
                                visibleSourceCount: before
                            });
                        } else {
                            recordSeriesDensityMetadata(seriesDensityMetadataById, s.id, stackEntries.length, null);
                        }
                    }

                    const seriesRawFormatter = (s as ChartAreaSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter =
                        seriesRawFormatter ?? (stackGroup?.mode === "percent" ? undefined : seriesYAxis?.formatter);

                    for (const entry of stackEntries) {
                        const isDefined = entry.defined;
                        let xPos = plotRect.x;
                        if (seriesXScale.type === "category") {
                            const bPos = (seriesXScale as BandScale<string>).map(String(entry.xKey));
                            if (bPos !== undefined) {
                                xPos = bPos + (seriesXScale as BandScale<string>).bandwidth() / 2;
                            }
                        } else if (seriesXScale.type === "time" || seriesXScale.type === "utc") {
                            const dateVal = entry.xValue instanceof Date ? entry.xValue : new Date(Number(entry.xValue));
                            xPos = (seriesXScale as TimeScale | UtcScale).map(dateVal) ?? plotRect.x;
                        } else {
                            xPos = (seriesXScale as LinearScale).map(Number(entry.xValue)) ?? plotRect.x;
                        }

                        const baselineY = clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height);
                        const topY = isDefined ? (seriesYScale.map(entry.stackEnd) ?? baselineY) : baselineY;
                        const baseY = isDefined ? (seriesYScale.map(entry.stackStart) ?? baselineY) : baselineY;

                        const point: SceneAreaPoint = {
                            animationKey: entry.animationKey,
                            baseY,
                            datum: entry.datum,
                            defined: isDefined,
                            index: entry.dataIndex,
                            stackEndValue: entry.stackEnd,
                            stackPercentage: entry.stackPercentage,
                            stackStartValue: entry.stackStart,
                            stackTotal: entry.stackTotal,
                            synthetic: entry.synthetic,
                            x: xPos,
                            xValue: entry.xValue,
                            y: topY,
                            yValue: entry.rawValue
                        };
                        points.push(point);

                        if (isDefined && !entry.synthetic) {
                            const currentRenderOrder = ++renderOrderCounter.value;
                            const formattedStackTotal =
                                entry.stackTotal !== undefined
                                    ? (seriesRawFormatter
                                        ? formatYValue(entry.stackTotal, entry.dataIndex, seriesRawFormatter)
                                        : formatCompactNumber(entry.stackTotal))
                                    : undefined;
                            const formattedStackPercentage =
                                entry.stackPercentage !== undefined
                                    ? formatPercentagePoint(entry.stackPercentage)
                                    : undefined;
                            const formattedValue = formatYValue(
                                entry.rawValue,
                                entry.dataIndex,
                                effectiveRawFormatter
                            );

                            const areaReg = s as ChartAreaSeriesRegistration;
                            const showPoints = areaReg.showPoints?.() ?? false;
                            const pointRadius = areaReg.pointRadius?.() ?? 4;
                            const visualRadius = showPoints ? pointRadius : 0;

                            const pointTarget: SceneHitTarget = {
                                animationKey: entry.animationKey,
                                datum: entry.datum,
                                formattedCategory: formatXValue(
                                    entry.xKey,
                                    entry.dataIndex,
                                    seriesXAxis?.formatter,
                                    (seriesXScale.type ?? "category") as any
                                ),
                                formattedStackPercentage,
                                formattedStackTotal,
                                formattedValue,
                                index: entry.dataIndex,
                                point: { x: xPos, y: topY },
                                radius: 16,
                                renderOrder: currentRenderOrder,
                                seriesId: s.id,
                                seriesName: seriesDisplayName,
                                seriesType: s.type,
                                stackEnd: entry.stackEnd,
                                stackGroup: stackGroup?.name,
                                stackMode: stackGroup?.mode,
                                stackPercentage: entry.stackPercentage,
                                stackStart: entry.stackStart,
                                stackTotal: entry.stackTotal,
                                visualRadius,
                                xAxisId: binding.xAxisId,
                                xAxisTitle: seriesXAxis?.title,
                                xKey: entry.xKey,
                                xValue: entry.xValue,
                                yAxisId: binding.yAxisId,
                                yAxisTitle: seriesYAxis?.title,
                                yValue: entry.rawValue
                            };
                            recordHitTarget(pointTarget, false, true);
                        }
                    }
                } else {
                    const baselineY = clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height);
                    const seriesRawFormatter = (s as ChartAreaSeriesRegistration).valueFormatter?.();
                    const effectiveRawFormatter = seriesRawFormatter ?? seriesYAxis?.formatter;

                    const areaDensityEntry = runtime.density?.seriesById.get(s.id) ?? null;
                    const areaIndexView = resolveConnectedScalarIndexView(
                        areaDensityEntry,
                        seriesXScale,
                        projection.coordinateSpace,
                        binding.xAxisId,
                        plotRect,
                        warnedDiagnosticSignatures
                    );
                    recordSeriesDensityMetadata(
                        seriesDensityMetadataById,
                        s.id,
                        sData.length,
                        areaIndexView
                    );
                    if (areaIndexView?.sampled && areaDensityEntry?.scalar && areaIndexView.indices) {
                        denseInteractionById.set(
                            s.id,
                            new CartesianConnectedPathInteractionProvider({
                                materialize: createDenseHitMaterializer({
                                    keyResolver,
                                    scalar: areaDensityEntry.scalar,
                                    seriesDisplayName,
                                    seriesId: s.id,
                                    seriesType: "area",
                                    temporal: resolveTemporalFlag(projection.coordinateSpace, binding.xAxisId),
                                    valueFormatter:
                                        "valueFormatter" in s && typeof s.valueFormatter === "function"
                                            ? (s.valueFormatter() as never)
                                            : undefined,
                                    xAxisFormatter: seriesXAxis?.formatter,
                                    xAxisId: binding.xAxisId ?? "default-x",
                                    xAxisTitle: seriesXAxis?.title,
                                    xScale: seriesXScale as ChartContinuousPositionScale<number | Date>,
                                    yAxisFormatter: seriesYAxis?.formatter,
                                    yAxisId: binding.yAxisId ?? "default-y",
                                    yAxisTitle: seriesYAxis?.title,
                                    yScale: seriesYScale as ChartContinuousPositionScale<number | Date>
                                }),
                                scalar: areaDensityEntry.scalar,
                                xScale: seriesXScale as ChartContinuousPositionScale<number | Date>,
                                yScale: seriesYScale as ChartContinuousPositionScale<number | Date>
                            })
                        );
                    }

                    const visitAreaDatum = (dIdx: number): void => {
                        const datum = sData[dIdx];
                        const xVal = resolveValue(datum, sXField, dIdx);
                        const yVal = resolveValue(datum, sField, dIdx);

                        let xPos = plotRect.x;
                        let isXValid = false;
                        let normalizedXKey: number | string = dIdx;

                        if (seriesXScale.type === "category") {
                            const catKey = xVal !== undefined && xVal !== null ? String(xVal) : String(dIdx);
                            normalizedXKey = catKey;
                            const bPos = (seriesXScale as BandScale<string>).map(catKey);
                            if (bPos !== undefined) {
                                xPos = bPos + (seriesXScale as BandScale<string>).bandwidth() / 2;
                                isXValid = true;
                            }
                        } else if (seriesXScale.type === "time" || seriesXScale.type === "utc") {
                            let dateVal: Date | undefined;
                            if (xVal instanceof Date && !Number.isNaN(xVal.getTime())) {
                                dateVal = xVal;
                            } else if (typeof xVal === "number" && Number.isFinite(xVal)) {
                                dateVal = new Date(xVal);
                            } else if (typeof xVal === "string") {
                                const parsed = Date.parse(xVal);
                                if (!Number.isNaN(parsed)) {
                                    dateVal = new Date(parsed);
                                }
                            }
                            if (dateVal) {
                                normalizedXKey = dateVal.getTime();
                                const tPos = (seriesXScale as TimeScale | UtcScale).map(dateVal);
                                if (tPos !== undefined) {
                                    xPos = tPos;
                                    isXValid = true;
                                }
                            }
                        } else {
                            if (typeof xVal === "number" && Number.isFinite(xVal)) {
                                normalizedXKey = xVal;
                                const lPos = (seriesXScale as LinearScale).map(xVal);
                                if (lPos !== undefined) {
                                    xPos = lPos;
                                    isXValid = true;
                                }
                            }
                        }

                        const isYValid = isFiniteNumber(yVal);
                        const defined = isXValid && isYValid;
                        const topY = isYValid ? (seriesYScale.map(Number(yVal)) ?? baselineY) : baselineY;
                        const animationKey = keyResolver.resolveKey(datum, normalizedXKey, dIdx);

                        const point: SceneAreaPoint = {
                            animationKey,
                            baseY: baselineY,
                            datum,
                            defined,
                            index: dIdx,
                            x: xPos,
                            xValue: xVal,
                            y: topY,
                            yValue: isYValid ? Number(yVal) : 0
                        };
                        points.push(point);

                        if (defined) {
                            const showPoints = (s as ChartAreaSeriesRegistration).showPoints?.() ?? false;
                            const pointRadius = (s as ChartAreaSeriesRegistration).pointRadius?.() ?? 4;
                            const visualRadius = showPoints ? pointRadius : 0;

                            const currentRenderOrder = ++renderOrderCounter.value;
                            const pointTarget: SceneHitTarget = {
                                animationKey,
                                datum,
                                formattedCategory: formatXValue(
                                    normalizedXKey,
                                    dIdx,
                                    seriesXAxis?.formatter,
                                    (seriesXScale.type ?? "category") as any
                                ),
                                formattedValue: formatYValue(yVal, dIdx, effectiveRawFormatter),
                                index: dIdx,
                                point: { x: xPos, y: topY },
                                radius: 16,
                                renderOrder: currentRenderOrder,
                                seriesId: s.id,
                                seriesName: seriesDisplayName,
                                seriesType: s.type,
                                visualRadius,
                                xAxisId: binding.xAxisId,
                                xAxisTitle: seriesXAxis?.title,
                                xKey: normalizedXKey,
                                xValue: xVal,
                                yAxisId: binding.yAxisId,
                                yAxisTitle: seriesYAxis?.title,
                                yValue: Number(yVal)
                            };
                            recordHitTarget(pointTarget, false, true);
                        }
                    };

                    iterateSampledOrFullIndices({
                        connectNulls: (s as ChartAreaSeriesRegistration).connectNulls?.() ?? false,
                        indices: areaIndexView?.indices ?? null,
                        scalar: areaDensityEntry?.scalar ?? null,
                        total: sData.length,
                        visit: visitAreaDatum
                    });
                }

                const areaReg = s as ChartAreaSeriesRegistration;
                const areaScene: ChartAreaSeriesScene = {
                    baselineY: clamp(seriesYScale.map(0) ?? plotRect.y + plotRect.height, plotRect.y, plotRect.y + plotRect.height),
                    connectNulls: areaReg.connectNulls?.() ?? false,
                    curve: areaReg.curve?.() ?? "linear",
                    fillMode: areaReg.fillMode?.() ?? "gradient",
                    fillOpacity: normalizeOpacity(areaReg.fillOpacity?.(), 0.18),
                    id: s.id,
                    name: seriesDisplayName,
                    points,
                    showPoints: areaReg.showPoints?.() ?? false,
                    style: sStyle,
                    type: "area",
                    xAxisId: binding.xAxisId ?? "default-x",
                    yAxisId: binding.yAxisId ?? "default-y"
                };
                seriesScenes.push(areaScene);
            }
        }

        let pointSpatialIndex: CartesianPointSpatialIndex | undefined;
        if (pointHitTargets.length > 0) {
            pointSpatialIndex = new CartesianPointSpatialIndex(32);
            pointSpatialIndex.insertAll(pointHitTargets);
        }

        // Build namespaced interaction buckets per X axis ID (MAX3-004)
        const interactionBucketsByAxisId = new Map<string, Map<ChartInteractionXKey, ChartInteractionBucket>>();

        for (const xAxis of axisResolution.xAxes) {
            const xAxisId = xAxis.axisId;
            const xAxisScale = scaleRegistry.getXScale(xAxisId);
            const axisHitsMap = hitsByAxisId.get(xAxisId) ?? new Map();
            const axisBuckets = new Map<ChartInteractionXKey, ChartInteractionBucket>();

            if (xAxisScale && xAxisScale.type === "category") {
                const bandScale = xAxisScale as BandScale<string>;
                const categoryDomain = bandScale.domain() as readonly string[];
                for (let i = 0; i < categoryDomain.length; i++) {
                    const catKey = categoryDomain[i];
                    const hits = axisHitsMap.get(catKey) ?? [];
                    const bPos = bandScale.map(catKey);
                    const centerX = (bPos ?? plotRect.x) + bandScale.bandwidth() / 2;

                    const bucket: ChartInteractionBucket = {
                        anchor: { x: centerX, y: plotRect.y + plotRect.height / 2 },
                        axisDimension: "x",
                        axisId: xAxisId,
                        hits,
                        order: i,
                        xAxisId,
                        xAxisTitle: xAxis.title ?? "",
                        xKey: catKey,
                        xValue: catKey,
                        yAxisId: hits[0]?.yAxisId ?? axisResolution.primaryYAxisId,
                        yAxisTitle: hits[0]?.yAxisTitle ?? ""
                    };
                    axisBuckets.set(catKey, bucket);
                }
            } else {
                const sortedKeys = Array.from(axisHitsMap.keys()).sort((a, b) => Number(a) - Number(b));
                for (let i = 0; i < sortedKeys.length; i++) {
                    const key = sortedKeys[i];
                    const hits = axisHitsMap.get(key) ?? [];
                    const primaryHit = hits[0];
                    const targetX = primaryHit?.point?.x ?? (primaryHit?.bounds ? primaryHit.bounds.x + primaryHit.bounds.width / 2 : plotRect.x);
                    const targetY = primaryHit?.point?.y ?? (primaryHit?.bounds ? primaryHit.bounds.y + primaryHit.bounds.height / 2 : plotRect.y + plotRect.height / 2);

                    const bucket: ChartInteractionBucket = {
                        anchor: { x: targetX, y: targetY },
                        axisDimension: "x",
                        axisId: xAxisId,
                        hits,
                        order: i,
                        xAxisId,
                        xAxisTitle: xAxis.title ?? "",
                        xKey: key,
                        xValue: primaryHit?.xValue ?? key,
                        yAxisId: hits[0]?.yAxisId ?? axisResolution.primaryYAxisId,
                        yAxisTitle: hits[0]?.yAxisTitle ?? ""
                    };
                    axisBuckets.set(key, bucket);
                }
            }

            interactionBucketsByAxisId.set(xAxisId, axisBuckets);
        }

        const primaryBucketsMap = interactionBucketsByAxisId.get(axisResolution.primaryXAxisId) ?? new Map();
        const interactionBuckets = Array.from(primaryBucketsMap.values());
        const interactionBucketLookup = primaryBucketsMap;

        const hasRenderedElements =
            seriesScenes.some(s => {
                if (s.type === "bar" || s.type === "rangeBar") return s.bars.length > 0;
                if (s.type === "scatter" || s.type === "bubble") return s.markers.length > 0;
                if (s.type === "candlestick" || s.type === "ohlc") return s.marks.length > 0;
                if (s.type === "line" || s.type === "area" || s.type === "rangeArea") {
                    return s.points.some((p: { defined: boolean }) => p.defined);
                }
                return false;
            }) || validMarkerCount > 0;

        const hasData = hasRenderedElements;

        const legendItems: ChartLegendItem[] = CartesianLegendBuilder.buildSeriesItems(effectiveSeries, styleResolver);

        const viewportState = viewport && coordinateSpace
            ? toPublicViewportState(viewport, coordinateSpace.toResolvedAxisInfoMap())
            : undefined;

        return {
            axes: axisScenes,
            axisTopology,
            axisTopologySignature,
            barHitTargets,
            cartesianKind: "xy",
            coordinateSpace,
            coordinateSystem: "cartesian",
            densityRuntime: runtime.density,
            denseInteraction: denseInteractionById.size > 0 ? denseInteractionById : undefined,
            financialIndex: activeFinancialIndex,
            hasRenderableData: hasData,
            height: containerHeight,
            hitTargets,
            interactionAxis: "x",
            interactionBucketLookup,
            interactionBuckets,
            interactionBucketsByAxisId,
            legendItems,
            markerSpatialIndex: pointSpatialIndex,
            orientation: "vertical",
            plotRect,
            pointSpatialIndex,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            series: seriesScenes,
            seriesDensityMetadataById,
            stackConfiguration: stackConfigForScene,
            stackSignature,
            viewport: viewportState,
            width: containerWidth,
            xAxisType: primaryXType as ChartXAxisType,
            yAxisType: primaryYType as ChartYAxisType
        };
    }
}

export type { ChartSeriesDensityMetadata };

function toBaseExtent(
    coordinateSpace: CartesianAxisCoordinateSpace | undefined,
    axisId: string | undefined
): { readonly max: number; readonly min: number } {
    const snap = axisId ? coordinateSpace?.get({ axis: "x", axisId }) : undefined;
    if (!snap || snap.baseDomain.length < 2) {
        return { max: Number.POSITIVE_INFINITY, min: Number.NEGATIVE_INFINITY };
    }
    const toNumber = (v: unknown): number => (v instanceof Date ? v.getTime() : Number(v));
    const a = toNumber(snap.baseDomain[0]);
    const b = toNumber(snap.baseDomain[1]);
    return { max: Math.max(a, b), min: Math.min(a, b) };
}

function resolveTemporalFlag(
    coordinateSpace: CartesianAxisCoordinateSpace | undefined,
    axisId: string | undefined
): boolean {
    const resolved = axisId ? coordinateSpace?.get({ axis: "x", axisId })?.resolvedType : undefined;
    return resolved === "time" || resolved === "utc";
}

/**
 * Current viewport window as a normalized [0,1] unit interval for one axis,
 * or the full base extent when no explicit window is set.
 */
function resolveViewportUnitInterval(
    snap: import("../viewport/cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot | undefined,
    viewport: InternalCartesianViewportState,
    dimension: "x" | "y"
): readonly [number, number] | null {
    if (!snap || !snap.valid) {
        return null;
    }
    const internalWindow = dimension === "x" ? viewport.x.get(snap.ref.axisId) : viewport.y.get(snap.ref.axisId);
    const toUnit = (value: unknown): number =>
        normalizeToUnitInterval(snap.baseScale, value, snap.range);
    if (!internalWindow) {
        return [0, 1];
    }
    if (internalWindow.kind === "continuous") {
        const temporal = snap.resolvedType === "time" || snap.resolvedType === "utc";
        const min = toUnit(temporal ? new Date(internalWindow.min) : internalWindow.min);
        const max = toUnit(temporal ? new Date(internalWindow.max) : internalWindow.max);
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return null;
        }
        return [Math.min(min, max), Math.max(min, max)];
    }
    const count = snap.baseDomain.length;
    if (count === 0) {
        return null;
    }
    const u0 = internalWindow.startIndex / count;
    const u1 = internalWindow.endIndexExclusive / count;
    return [Math.min(u0, u1), Math.max(u0, u1)];
}

function normalizeToUnitInterval(
    scale: ChartPositionScale<unknown>,
    value: unknown,
    range: readonly [number, number]
): number {
    const p = scale.map(value as never);
    if (p === undefined || !Number.isFinite(p)) {
        return Number.NaN;
    }
    const [r0, r1] = range;
    if (r1 === r0) {
        return 0;
    }
    return (p - r0) / (r1 - r0);
}

function resolveConnectedScalarIndexView(
    entry: import("../density/cartesian-density-runtime").CartesianSeriesDensityEntry | null | undefined,
    seriesXScale: ChartPositionScale<unknown>,
    coordinateSpace: CartesianAxisCoordinateSpace | undefined,
    xAxisId: string | undefined,
    plotRect: ChartRect,
    warnedDiagnosticSignatures?: Set<string>
): import("../density/cartesian-density-projector").CartesianProjectedIndexView | null {
    if (!entry || !entry.scalar || entry.capability.mode !== "connected-scalar") {
        return null;
    }
    if (seriesXScale.type === "category" || typeof (seriesXScale as ChartContinuousPositionScale<number | Date>).invert !== "function") {
        return null;
    }

    const base = toBaseExtent(coordinateSpace, xAxisId);
    const policy = entry.capability.algorithmOverride;
    return projectScalarIndexView({
        algorithm: policy,
        baseDomainMax: base.max,
        baseDomainMin: base.min,
        maxPoints: null,
        plotSpanPx: plotRect.width,
        samplesPerPixel: 1,
        scalar: entry.scalar,
        viewportScale: seriesXScale as ChartContinuousPositionScale<number | Date>,
        warnedSignatures: warnedDiagnosticSignatures
    });
}

function recordSeriesDensityMetadata(
    target: Map<string, ChartSeriesDensityMetadata>,
    seriesId: string,
    sourceCount: number,
    view: import("../density/cartesian-density-projector").CartesianProjectedIndexView | null
): void {
    target.set(seriesId, {
        algorithm: view?.algorithm ?? "full",
        renderedCount: view ? view.renderedCount : sourceCount,
        sampled: view?.sampled ?? false,
        sourceCount,
        visibleSourceCount: view?.visibleSourceCount ?? sourceCount
    });
}

/**
 * Iterates either the full source index range or the sampled index view,
 * inserting minimal gap markers between sampled points that belong to
 * different defined segments when nulls are not bridged.
 */
function iterateSampledOrFullIndices(input: {
    readonly connectNulls: boolean;
    readonly indices: readonly number[] | null;
    readonly scalar: import("../density/cartesian-density-preparer").CartesianScalarDensityData | null;
    readonly total: number;
    readonly visit: (dIdx: number) => void;
}): void {
    if (!input.indices) {
        for (let dIdx = 0; dIdx < input.total; dIdx++) {
            input.visit(dIdx);
        }
        return;
    }

    const scalar = input.scalar;
    let previousSegmentId = -1;
    let hasPrevious = false;

    for (const dIdx of input.indices) {
        const segmentId = scalar ? scalar.segmentIds[dIdx] : -2;
        if (
            scalar &&
            !input.connectNulls &&
            hasPrevious &&
            previousSegmentId >= 0 &&
            segmentId >= 0 &&
            segmentId !== previousSegmentId
        ) {
            // Minimal gap topology: one invalid datum marker per crossing (§49/§136).
            const markerIdx = scalar.segments[previousSegmentId]?.endIndexExclusive ?? -1;
            if (markerIdx >= 0 && markerIdx < input.total && scalar.segmentIds[markerIdx] === -1) {
                input.visit(markerIdx);
            }
        }
        if (segmentId >= 0) {
            previousSegmentId = segmentId;
            hasPrevious = true;
        }
        input.visit(dIdx);
    }
}
