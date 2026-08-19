import type { ChartAxisPosition, ChartXAxisType } from "../../models/chart-axis.models";
import type { ChartField, ChartRect } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import {
    CartesianStackEngine,
    type CartesianStackAnalysis,
    type CartesianStackCoordinationResult
} from "../data/cartesian-stack-engine";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import type {
    ChartBandPositionScale,
    ChartContinuousPositionScale,
    ChartPositionScale,
    ResolvedChartCartesianAxisType
} from "../scale/chart-scale";
import { CartesianScaleRegistry } from "../scale/cartesian-scale-registry";
import type { ChartAxisScene, ChartAxisSceneTick } from "../scene/cartesian-scene";
import { CartesianAxisCompatibilityPolicy } from "./cartesian-axis-compatibility-policy";
import { CartesianAxisDomainResolver } from "./cartesian-axis-domain-resolver";
import { CartesianAxisLabelGeometry } from "./cartesian-axis-label-geometry";
import { CartesianAxisOverhangResolver } from "./cartesian-axis-overhang-resolver";
import type {
    CartesianAxisRegistryResolution,
    ResolvedCartesianAxisDescriptor
} from "./cartesian-axis-registry-resolver";
import type { SeriesAxisBindingResolution } from "./cartesian-series-axis-binding-resolver";
import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import type {
    CartesianAxisMaps,
    ChartAxisValidity
} from "./cartesian-axis-resolved-context";
import { isFiniteNumber } from "../utils/number-utils";
import { formatPercentagePoint } from "../utils/chart-formatter";
import type { CartesianAxisTopologyItem, CartesianStackSceneConfig } from "../scene/chart-scene";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../viewport/cartesian-axis-coordinate-space";
import type { InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";

export interface MultiAxisPreparationOptions {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly orientation?: "horizontal" | "vertical";
    readonly rootData?: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export interface CartesianDomainPreparation {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly axisTopology: readonly CartesianAxisTopologyItem[];
    readonly axisTopologySignature: string;
    readonly axisUnitModes: CartesianAxisMaps<"percent" | "raw">;
    readonly axisValidity: CartesianAxisMaps<ChartAxisValidity>;
    readonly axisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly baseDomains: CartesianAxisMaps<readonly unknown[]>;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly effectiveRootXField?: ChartField;
    readonly effectiveSeries: readonly import("../context/chart-registration-context").ChartCartesianSeriesRegistration[];
    readonly hasBaseRenderableData: boolean;
    readonly orientation: "horizontal" | "vertical";
    readonly resolvedTypes: CartesianAxisMaps<ResolvedChartCartesianAxisType>;
    readonly resolvedTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedXTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedYTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly stackAnalysesByYAxis: ReadonlyMap<string, CartesianStackAnalysis>;
    readonly stackConfiguration: readonly CartesianStackSceneConfig[];
    readonly stackCoordination?: CartesianStackCoordinationResult;
    readonly stackSignature: string;
    readonly warnings: readonly string[];
    readonly xAxisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly yAxisValidityById: ReadonlyMap<string, ChartAxisValidity>;
}

export interface MultiAxisChromeOptions {
    readonly chartHeight: number;
    readonly chartWidth: number;
    readonly insets?: {
        readonly bottom?: number;
        readonly left?: number;
        readonly right?: number;
        readonly top?: number;
    };
    readonly labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>;
}

export interface CartesianAxisChromeLayout {
    readonly baseAxisScenes: readonly ChartAxisScene[];
    readonly baseScales: CartesianScaleRegistry;
    readonly effectiveRotations: CartesianAxisMaps<number>;
    readonly gutters: CartesianAxisMaps<number>;
    readonly height: number;
    readonly measurementKeys: ReadonlySet<string>;
    readonly plotRect: ChartRect;
    readonly sideOffsets: CartesianAxisMaps<number>;
    readonly width: number;
}

export interface MultiAxisViewportProjectionResult {
    readonly axisScenes: readonly ChartAxisScene[];
    readonly coordinateSpace: CartesianAxisCoordinateSpace;
    readonly scaleRegistry: CartesianScaleRegistry;
}

export interface MultiAxisCoordinatorOptions {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly chartHeight: number;
    readonly chartWidth: number;
    readonly insets?: {
        readonly bottom?: number;
        readonly left?: number;
        readonly right?: number;
        readonly top?: number;
    };
    readonly labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>;
    readonly orientation?: "horizontal" | "vertical";
    readonly rootData?: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly viewport?: InternalCartesianViewportState;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export interface MultiAxisCoordinatorResult {
    readonly axisScenes: readonly ChartAxisScene[];
    readonly axisUnitModes: CartesianAxisMaps<"percent" | "raw">;
    readonly axisValidity: CartesianAxisMaps<ChartAxisValidity>;
    readonly axisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly chrome: CartesianAxisChromeLayout;
    readonly coordinateSpace: CartesianAxisCoordinateSpace;
    readonly plotRect: ChartRect;
    readonly preparation: CartesianDomainPreparation;
    readonly resolvedTypes: CartesianAxisMaps<ResolvedChartCartesianAxisType>;
    readonly resolvedTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedXTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly resolvedYTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly scaleRegistry: CartesianScaleRegistry;
    readonly stackAnalysesByYAxis: ReadonlyMap<string, CartesianStackAnalysis>;
    readonly stackCoordination?: CartesianStackCoordinationResult;
    readonly warnings: readonly string[];
    readonly xAxisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly yAxisValidityById: ReadonlyMap<string, ChartAxisValidity>;
}

export class CartesianMultiAxisCoordinator {
    public static prepareDomains(options: MultiAxisPreparationOptions): CartesianDomainPreparation {
        const {
            axisResolution,
            bindingResolution,
            orientation = "vertical",
            rootData,
            rootXField
        } = options;

        const effectiveRootXField = rootXField || (axisResolution.xAxes[0]?.field as ChartField | undefined);
        const warnings: string[] = [...axisResolution.warnings, ...bindingResolution.warnings];

        const resolvedXTypes = new Map<string, ResolvedChartCartesianAxisType>();
        const resolvedYTypes = new Map<string, ResolvedChartCartesianAxisType>();
        const xAxisValidityById = new Map<string, ChartAxisValidity>();
        const yAxisValidityById = new Map<string, ChartAxisValidity>();
        const xUnitModes = new Map<string, "percent" | "raw">();
        const yUnitModes = new Map<string, "percent" | "raw">();

        const allDescriptors: ResolvedCartesianAxisDescriptor[] = [
            ...axisResolution.xAxes,
            ...axisResolution.yAxes
        ];

        for (const axis of allDescriptors) {
            if (axis.type === "log" && axis.logBase !== undefined) {
                if (!isFiniteNumber(axis.logBase) || axis.logBase <= 0 || axis.logBase === 1) {
                    warnings.push(
                        `[MonaChart] Log axis "${axis.axisId}" specified invalid logBase "${axis.logBase}". Falling back to default base 10.`
                    );
                }
            } else if (axis.type === "symlog" && axis.symlogConstant !== undefined) {
                if (!isFiniteNumber(axis.symlogConstant) || axis.symlogConstant <= 0) {
                    warnings.push(
                        `[MonaChart] Symlog axis "${axis.axisId}" specified invalid symlogConstant "${axis.symlogConstant}". Falling back to default constant 1.`
                    );
                }
            } else if (axis.type === "pow" && axis.exponent !== undefined) {
                if (!isFiniteNumber(axis.exponent) || axis.exponent <= 0) {
                    warnings.push(
                        `[MonaChart] Pow axis "${axis.axisId}" specified invalid exponent "${axis.exponent}". Falling back to default exponent 1.`
                    );
                }
            }
        }

        for (const xAxis of axisResolution.xAxes) {
            const boundSeries = bindingResolution.seriesByXAxis.get(xAxis.axisId) ?? [];
            const compat = CartesianAxisCompatibilityPolicy.resolveAxisType(
                xAxis,
                boundSeries,
                rootData,
                effectiveRootXField,
                orientation
            );
            warnings.push(...compat.warnings);
            resolvedXTypes.set(xAxis.axisId, compat.resolvedType);
        }

        for (const yAxis of axisResolution.yAxes) {
            const boundSeries = bindingResolution.seriesByYAxis.get(yAxis.axisId) ?? [];
            const compat = CartesianAxisCompatibilityPolicy.resolveAxisType(
                yAxis,
                boundSeries,
                rootData,
                effectiveRootXField,
                orientation
            );
            warnings.push(...compat.warnings);
            resolvedYTypes.set(yAxis.axisId, compat.resolvedType);
        }

        const allCartesianSeries = bindingResolution.activeSeries.filter(s => "color" in s) as import("../context/chart-registration-context").ChartCartesianSeriesRegistration[];
        const primaryXType = resolvedXTypes.get(axisResolution.primaryXAxisId) ?? (orientation === "horizontal" ? "linear" : "category");
        const stackCoordination = CartesianStackEngine.computeCoordination({
            orientation,
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            resolvedXAxisTypeByAxisId: resolvedXTypes,
            resolvedYAxisTypeByAxisId: resolvedYTypes,
            rootData: rootData ?? [],
            rootXField: effectiveRootXField,
            series: allCartesianSeries,
            xAxisType: orientation === "horizontal" ? "category" : (primaryXType === "time" || primaryXType === "utc" ? primaryXType : primaryXType === "linear" ? "linear" : "category")
        });

        for (const diag of stackCoordination.diagnostics) {
            warnings.push(`[MonaChart] ${diag.message}`);
        }

        for (const xAxis of axisResolution.xAxes) {
            const xState = stackCoordination.valueAxisState.x.get(xAxis.axisId);
            xUnitModes.set(xAxis.axisId, orientation === "horizontal" && xState?.unitMode === "percent" ? "percent" : "raw");
        }

        const stackAnalysesByYAxis = new Map<string, CartesianStackAnalysis>();
        for (const yAxis of axisResolution.yAxes) {
            const yState = stackCoordination.valueAxisState.y.get(yAxis.axisId);
            yUnitModes.set(yAxis.axisId, orientation !== "horizontal" && yState?.unitMode === "percent" ? "percent" : "raw");

            const singleAnalysis = stackCoordination.analysisByGroupId.get(`bar:${axisResolution.primaryXAxisId}:${yAxis.axisId}:`) ??
                stackCoordination.analysisByGroupId.get(`area:${axisResolution.primaryXAxisId}:${yAxis.axisId}:`) ??
                stackCoordination.analysisByGroupId.values().next().value;
            if (singleAnalysis) {
                stackAnalysesByYAxis.set(yAxis.axisId, singleAnalysis);
            }
        }

        const xDomains = new Map<string, readonly unknown[]>();
        const yDomains = new Map<string, readonly unknown[]>();

        for (const xAxis of axisResolution.xAxes) {
            const resolvedType = resolvedXTypes.get(xAxis.axisId)!;
            const boundSeries = bindingResolution.seriesByXAxis.get(xAxis.axisId) ?? [];
            const stackState = orientation === "horizontal"
                ? stackCoordination.valueAxisState.x.get(xAxis.axisId)
                : undefined;
            const stackedExtents = stackState && (stackState.hasPositive || stackState.hasNegative)
                ? { min: stackState.extent[0], max: stackState.extent[1] }
                : undefined;
            const stackAnalysis = orientation === "horizontal" && stackState
                ? {
                    axisUnitMode: stackState.unitMode === "percent" ? ("percent" as const) : ("raw" as const),
                    configuration: stackCoordination.configuration,
                    diagnostics: stackCoordination.diagnostics,
                    invalidGroupIds: stackCoordination.invalidGroupIds,
                    invalidSeriesIds: stackCoordination.invalidSeriesIds,
                    layout: stackCoordination.layout,
                    visibleLayout: stackCoordination.visibleLayout,
                    visibleYUnitMode: stackState.unitMode === "percent" ? ("percent-stack" as const) : ("normal-stack" as const),
                    yUnitMode: stackState.unitMode === "percent" ? ("percent" as const) : ("normal" as const)
                }
                : undefined;

            const domainRes = CartesianAxisDomainResolver.resolveDomain(
                xAxis,
                resolvedType,
                boundSeries,
                rootData,
                effectiveRootXField,
                stackedExtents,
                stackAnalysis,
                orientation
            );
            warnings.push(...domainRes.warnings);

            let canonicalBaseDomain: readonly unknown[] = domainRes.domain;
            if (domainRes.isValid && resolvedType !== "category" && Array.isArray(canonicalBaseDomain) && canonicalBaseDomain.length >= 2) {
                if (resolvedType === "time" || resolvedType === "utc") {
                    const minD = canonicalBaseDomain[0] instanceof Date ? canonicalBaseDomain[0] : new Date(Number(canonicalBaseDomain[0]));
                    const maxD = canonicalBaseDomain[1] instanceof Date ? canonicalBaseDomain[1] : new Date(Number(canonicalBaseDomain[1]));
                    const tempScale = CartesianScaleFactory.createTemporalScale({
                        domain: [minD, maxD],
                        explicitMax: xAxis.explicitMax,
                        explicitMin: xAxis.explicitMin,
                        nice: xAxis.nice ?? true,
                        range: [0, 1],
                        tickCount: xAxis.tickCount,
                        type: resolvedType
                    });
                    canonicalBaseDomain = tempScale.domain();
                } else {
                    const minN = Number(canonicalBaseDomain[0]);
                    const maxN = Number(canonicalBaseDomain[1]);
                    const tempScale = CartesianScaleFactory.createNumericScale({
                        domain: [minN, maxN],
                        explicitMax: typeof xAxis.explicitMax === "number" ? xAxis.explicitMax : undefined,
                        explicitMin: typeof xAxis.explicitMin === "number" ? xAxis.explicitMin : undefined,
                        exponent: xAxis.exponent,
                        logBase: xAxis.logBase,
                        nice: xAxis.nice ?? true,
                        range: [0, 1],
                        symlogConstant: xAxis.symlogConstant,
                        tickCount: xAxis.tickCount,
                        type: resolvedType as "linear" | "log" | "symlog" | "pow" | "sqrt"
                    });
                    canonicalBaseDomain = tempScale.domain();
                }
            }

            xDomains.set(xAxis.axisId, canonicalBaseDomain);
            xAxisValidityById.set(xAxis.axisId, { reason: domainRes.reason, valid: domainRes.isValid });
        }

        for (const yAxis of axisResolution.yAxes) {
            const resolvedType = resolvedYTypes.get(yAxis.axisId)!;
            const boundSeries = bindingResolution.seriesByYAxis.get(yAxis.axisId) ?? [];
            const stackState = orientation !== "horizontal"
                ? stackCoordination.valueAxisState.y.get(yAxis.axisId)
                : undefined;
            const stackedExtents = stackState && (stackState.hasPositive || stackState.hasNegative)
                ? { min: stackState.extent[0], max: stackState.extent[1] }
                : undefined;
            const stackAnalysis = orientation !== "horizontal" && stackState
                ? {
                    axisUnitMode: stackState.unitMode === "percent" ? ("percent" as const) : ("raw" as const),
                    configuration: stackCoordination.configuration,
                    diagnostics: stackCoordination.diagnostics,
                    invalidGroupIds: stackCoordination.invalidGroupIds,
                    invalidSeriesIds: stackCoordination.invalidSeriesIds,
                    layout: stackCoordination.layout,
                    visibleLayout: stackCoordination.visibleLayout,
                    visibleYUnitMode: stackState.unitMode === "percent" ? ("percent-stack" as const) : ("normal-stack" as const),
                    yUnitMode: stackState.unitMode === "percent" ? ("percent" as const) : ("normal" as const)
                }
                : undefined;

            const domainRes = CartesianAxisDomainResolver.resolveDomain(
                yAxis,
                resolvedType,
                boundSeries,
                rootData,
                effectiveRootXField,
                stackedExtents,
                stackAnalysis,
                orientation
            );
            warnings.push(...domainRes.warnings);

            let canonicalBaseDomain: readonly unknown[] = domainRes.domain;
            if (domainRes.isValid && resolvedType !== "category" && Array.isArray(canonicalBaseDomain) && canonicalBaseDomain.length >= 2) {
                if (resolvedType === "time" || resolvedType === "utc") {
                    const minD = canonicalBaseDomain[0] instanceof Date ? canonicalBaseDomain[0] : new Date(Number(canonicalBaseDomain[0]));
                    const maxD = canonicalBaseDomain[1] instanceof Date ? canonicalBaseDomain[1] : new Date(Number(canonicalBaseDomain[1]));
                    const tempScale = CartesianScaleFactory.createTemporalScale({
                        domain: [minD, maxD],
                        explicitMax: yAxis.explicitMax,
                        explicitMin: yAxis.explicitMin,
                        nice: yAxis.nice ?? true,
                        range: [0, 1],
                        tickCount: yAxis.tickCount,
                        type: resolvedType
                    });
                    canonicalBaseDomain = tempScale.domain();
                } else {
                    const minN = Number(canonicalBaseDomain[0]);
                    const maxN = Number(canonicalBaseDomain[1]);
                    const tempScale = CartesianScaleFactory.createNumericScale({
                        domain: [minN, maxN],
                        explicitMax: typeof yAxis.explicitMax === "number" ? yAxis.explicitMax : undefined,
                        explicitMin: typeof yAxis.explicitMin === "number" ? yAxis.explicitMin : undefined,
                        exponent: yAxis.exponent,
                        logBase: yAxis.logBase,
                        nice: yAxis.nice ?? true,
                        range: [0, 1],
                        symlogConstant: yAxis.symlogConstant,
                        tickCount: yAxis.tickCount,
                        type: resolvedType as "linear" | "log" | "symlog" | "pow" | "sqrt"
                    });
                    canonicalBaseDomain = tempScale.domain();
                }
            }

            yDomains.set(yAxis.axisId, canonicalBaseDomain);
            yAxisValidityById.set(yAxis.axisId, { reason: domainRes.reason, valid: domainRes.isValid });
        }

        const resolvedTypesByAxisId = new Map<string, ResolvedChartCartesianAxisType>();
        for (const [k, v] of resolvedXTypes) resolvedTypesByAxisId.set(k, v);
        for (const [k, v] of resolvedYTypes) resolvedTypesByAxisId.set(k, v);

        const axisValidityById = new Map<string, ChartAxisValidity>();
        for (const [k, v] of xAxisValidityById) axisValidityById.set(k, v);
        for (const [k, v] of yAxisValidityById) axisValidityById.set(k, v);

        const axisTopology: CartesianAxisTopologyItem[] = allDescriptors.map(a => ({
            axisId: a.axisId,
            dimension: a.dimension,
            isPrimary: a.isPrimary,
            position: a.position,
            resolvedType: (a.dimension === "x" ? resolvedXTypes.get(a.axisId) : resolvedYTypes.get(a.axisId)) ?? "linear",
            stackIndex: a.stackIndex,
            valid: (a.dimension === "x" ? xAxisValidityById.get(a.axisId)?.valid : yAxisValidityById.get(a.axisId)?.valid) ?? true,
            visible: a.visible
        }));
        const axisTopologySignature = JSON.stringify(axisTopology);

        const stackConfiguration: CartesianStackSceneConfig[] = stackCoordination
            ? stackCoordination.configuration.groups.map(g => ({
                  geometryType: g.geometryType,
                  groupId: g.id,
                  mode: g.mode,
                  registeredSeriesIds: g.registeredSeriesIds
              }))
            : [];
        const stackSignature = stackCoordination?.configuration.signature ?? "[]";

        return {
            axisResolution,
            axisTopology,
            axisTopologySignature,
            axisUnitModes: { x: xUnitModes, y: yUnitModes },
            axisValidity: { x: xAxisValidityById, y: yAxisValidityById },
            axisValidityById,
            baseDomains: { x: xDomains, y: yDomains },
            bindingResolution,
            effectiveRootXField,
            effectiveSeries: allCartesianSeries,
            hasBaseRenderableData: allCartesianSeries.length > 0 && ((rootData?.length ?? 0) > 0 || allCartesianSeries.some(s => (s.data?.()?.length ?? 0) > 0)),
            orientation,
            resolvedTypes: { x: resolvedXTypes, y: resolvedYTypes },
            resolvedTypesByAxisId,
            resolvedXTypesByAxisId: resolvedXTypes,
            resolvedYTypesByAxisId: resolvedYTypes,
            stackAnalysesByYAxis,
            stackConfiguration,
            stackCoordination,
            stackSignature,
            warnings,
            xAxisValidityById,
            yAxisValidityById
        };
    }

    public static computeChrome(
        preparation: CartesianDomainPreparation,
        options: MultiAxisChromeOptions
    ): CartesianAxisChromeLayout {
        const { chartHeight, chartWidth, insets = {}, labelMeasurements } = options;
        const { axisResolution, baseDomains, resolvedTypes, axisUnitModes } = preparation;

        const insetTop = insets.top ?? 10;
        const insetBottom = insets.bottom ?? 10;
        const insetLeft = insets.left ?? 16;
        const insetRight = insets.right ?? 16;

        let plotRect: ChartRect = {
            height: Math.max(0, chartHeight - insetTop - insetBottom - 60),
            width: Math.max(0, chartWidth - insetLeft - insetRight - 80),
            x: insetLeft + 48,
            y: insetTop + 20
        };

        const gutters = { x: new Map<string, number>(), y: new Map<string, number>() };
        const sideOffsets = { x: new Map<string, number>(), y: new Map<string, number>() };
        const effectiveRotations = { x: new Map<string, number>(), y: new Map<string, number>() };
        const measurementKeys = new Set<string>();

        const axisSpacing = 8;
        const maxIterations = 3;

        let finalScales: { xScales: Map<string, ChartPositionScale>; yScales: Map<string, ChartPositionScale> } = {
            xScales: new Map(),
            yScales: new Map()
        };

        const allDescriptors: ResolvedCartesianAxisDescriptor[] = [
            ...axisResolution.xAxes,
            ...axisResolution.yAxes
        ];

        for (let iter = 0; iter < maxIterations; iter++) {
            const currentScales = this.#buildScales(axisResolution, resolvedTypes, baseDomains, plotRect);
            finalScales = currentScales;

            for (const xAxis of axisResolution.xAxes) {
                const scale = currentScales.xScales.get(xAxis.axisId)!;
                const resolvedType = resolvedTypes.x.get(xAxis.axisId)!;
                const unitMode = axisUnitModes.x.get(xAxis.axisId) ?? "raw";
                const { gutter, resolvedRotation } = this.#estimateAxisGutterAndRotation(
                    xAxis,
                    scale,
                    resolvedType,
                    labelMeasurements,
                    unitMode,
                    plotRect
                );
                gutters.x.set(xAxis.axisId, gutter);
                effectiveRotations.x.set(xAxis.axisId, resolvedRotation);
            }

            for (const yAxis of axisResolution.yAxes) {
                const scale = currentScales.yScales.get(yAxis.axisId)!;
                const resolvedType = resolvedTypes.y.get(yAxis.axisId)!;
                const unitMode = axisUnitModes.y.get(yAxis.axisId) ?? "raw";
                const { gutter, resolvedRotation } = this.#estimateAxisGutterAndRotation(
                    yAxis,
                    scale,
                    resolvedType,
                    labelMeasurements,
                    unitMode,
                    plotRect
                );
                gutters.y.set(yAxis.axisId, gutter);
                effectiveRotations.y.set(yAxis.axisId, resolvedRotation);
            }

            const overhang = CartesianAxisOverhangResolver.computeOverhang(allDescriptors, labelMeasurements);

            const sideThickness: Record<ChartAxisPosition, number> = {
                bottom: 0,
                left: 0,
                right: 0,
                top: 0
            };

            const axesBySide: Record<ChartAxisPosition, ResolvedCartesianAxisDescriptor[]> = {
                bottom: axisResolution.xAxes.filter(a => a.position === "bottom").sort((a, b) => a.stackIndex - b.stackIndex),
                left: axisResolution.yAxes.filter(a => a.position === "left").sort((a, b) => a.stackIndex - b.stackIndex),
                right: axisResolution.yAxes.filter(a => a.position === "right").sort((a, b) => a.stackIndex - b.stackIndex),
                top: axisResolution.xAxes.filter(a => a.position === "top").sort((a, b) => a.stackIndex - b.stackIndex)
            };

            for (const pos of ["bottom", "top", "left", "right"] as ChartAxisPosition[]) {
                const axesOnSide = axesBySide[pos];
                let accumOffset = 0;
                const visibleAxesOnSide = axesOnSide.filter(a => a.visible);
                for (let i = 0; i < visibleAxesOnSide.length; i++) {
                    const ax = visibleAxesOnSide[i];
                    if (ax.dimension === "x") {
                        sideOffsets.x.set(ax.axisId, accumOffset);
                    } else {
                        sideOffsets.y.set(ax.axisId, accumOffset);
                    }
                    const axGutter = (ax.dimension === "x" ? gutters.x.get(ax.axisId) : gutters.y.get(ax.axisId)) ?? 0;
                    accumOffset += axGutter;
                    if (i < visibleAxesOnSide.length - 1) {
                        accumOffset += axisSpacing;
                    }
                }
                sideThickness[pos] = accumOffset;
            }

            const effectiveLeft = sideThickness.left + Math.max(0, overhang.left - insetLeft);
            const effectiveRight = sideThickness.right + Math.max(0, overhang.right - insetRight);
            const effectiveTop = sideThickness.top + Math.max(0, overhang.top - insetTop);
            const effectiveBottom = sideThickness.bottom + Math.max(0, overhang.bottom - insetBottom);

            const newX = insetLeft + effectiveLeft;
            const newY = insetTop + effectiveTop;
            const newWidth = Math.max(0, chartWidth - newX - insetRight - effectiveRight);
            const newHeight = Math.max(0, chartHeight - newY - insetBottom - effectiveBottom);

            const converged = Math.abs(plotRect.x - newX) < 0.5 &&
                Math.abs(plotRect.y - newY) < 0.5 &&
                Math.abs(plotRect.width - newWidth) < 0.5 &&
                Math.abs(plotRect.height - newHeight) < 0.5;

            plotRect = { height: newHeight, width: newWidth, x: newX, y: newY };
            if (converged) {
                break;
            }
        }

        finalScales = this.#buildScales(axisResolution, resolvedTypes, baseDomains, plotRect);

        const baseScaleRegistry = new CartesianScaleRegistry({
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            xScales: finalScales.xScales,
            yScales: finalScales.yScales
        });

        const baseAxisScenes: ChartAxisScene[] = [];
        for (const xAxis of axisResolution.xAxes) {
            const scale = finalScales.xScales.get(xAxis.axisId)!;
            const resolvedType = resolvedTypes.x.get(xAxis.axisId)!;
            const unitMode = axisUnitModes.x.get(xAxis.axisId) ?? "raw";
            const gutter = gutters.x.get(xAxis.axisId) ?? 0;
            const sideOffset = sideOffsets.x.get(xAxis.axisId) ?? 0;
            const labelRotation = effectiveRotations.x.get(xAxis.axisId) ?? 0;

            const ticks = xAxis.labels !== false
                ? this.#generateAxisSceneTicks(
                    xAxis,
                    scale,
                    resolvedType,
                    labelMeasurements,
                    unitMode,
                    plotRect
                )
                : [];

            for (const t of ticks) {
                if (t.tickKey) measurementKeys.add(t.tickKey);
            }

            const defaultGrid = preparation.orientation === "horizontal"
                ? (xAxis.dimension === "x" && xAxis.isPrimary)
                : false;

            baseAxisScenes.push({
                axis: "x",
                axisId: xAxis.axisId,
                axisLine: xAxis.axisLine,
                gridLines: xAxis.gridLines ?? defaultGrid,
                gutter,
                isPrimary: xAxis.isPrimary,
                labelMaxWidth: xAxis.labelMaxWidth,
                labelPadding: xAxis.labelPadding ?? 4,
                labelRotation,
                labels: xAxis.labels ?? true,
                position: xAxis.position,
                registrationId: xAxis.registrationId,
                scaleType: resolvedType,
                sideOffset,
                stackIndex: xAxis.stackIndex,
                tickMarks: xAxis.tickMarks ?? false,
                ticks,
                tickSize: xAxis.tickSize ?? 6,
                title: xAxis.title,
                titlePadding: xAxis.titlePadding ?? 8,
                visible: xAxis.visible
            });
        }

        for (const yAxis of axisResolution.yAxes) {
            const scale = finalScales.yScales.get(yAxis.axisId)!;
            const resolvedType = resolvedTypes.y.get(yAxis.axisId)!;
            const unitMode = axisUnitModes.y.get(yAxis.axisId) ?? "raw";
            const gutter = gutters.y.get(yAxis.axisId) ?? 0;
            const sideOffset = sideOffsets.y.get(yAxis.axisId) ?? 0;
            const labelRotation = effectiveRotations.y.get(yAxis.axisId) ?? 0;

            const ticks = yAxis.labels !== false
                ? this.#generateAxisSceneTicks(
                    yAxis,
                    scale,
                    resolvedType,
                    labelMeasurements,
                    unitMode,
                    plotRect
                )
                : [];

            for (const t of ticks) {
                if (t.tickKey) measurementKeys.add(t.tickKey);
            }

            const defaultGrid = preparation.orientation !== "horizontal"
                ? (yAxis.dimension === "y" && yAxis.isPrimary)
                : false;

            baseAxisScenes.push({
                axis: "y",
                axisId: yAxis.axisId,
                axisLine: yAxis.axisLine,
                gridLines: yAxis.gridLines ?? defaultGrid,
                gutter,
                isPrimary: yAxis.isPrimary,
                labelMaxWidth: yAxis.labelMaxWidth,
                labelPadding: yAxis.labelPadding ?? 4,
                labelRotation,
                labels: yAxis.labels ?? true,
                position: yAxis.position,
                registrationId: yAxis.registrationId,
                scaleType: resolvedType,
                sideOffset,
                stackIndex: yAxis.stackIndex,
                tickMarks: yAxis.tickMarks ?? false,
                ticks,
                tickSize: yAxis.tickSize ?? 6,
                title: yAxis.title,
                titlePadding: yAxis.titlePadding ?? 8,
                visible: yAxis.visible
            });
        }

        return {
            baseAxisScenes,
            baseScales: baseScaleRegistry,
            effectiveRotations: { x: effectiveRotations.x, y: effectiveRotations.y },
            gutters: { x: gutters.x, y: gutters.y },
            height: chartHeight,
            measurementKeys,
            plotRect,
            sideOffsets: { x: sideOffsets.x, y: sideOffsets.y },
            width: chartWidth
        };
    }

    public static projectViewport(
        preparation: CartesianDomainPreparation,
        chrome: CartesianAxisChromeLayout,
        viewport?: InternalCartesianViewportState,
        labelMeasurements?: ReadonlyMap<string, ChartLabelMeasurement>
    ): MultiAxisViewportProjectionResult {
        const { axisResolution, baseDomains, resolvedTypes, axisUnitModes, xAxisValidityById, yAxisValidityById } = preparation;
        const { plotRect, gutters, sideOffsets, effectiveRotations, baseScales } = chrome;
        const measurements = labelMeasurements ?? new Map();

        const xScales = new Map<string, ChartPositionScale>();
        const yScales = new Map<string, ChartPositionScale>();
        const xSnapshots = new Map<string, CartesianAxisCoordinateSnapshot>();
        const ySnapshots = new Map<string, CartesianAxisCoordinateSnapshot>();

        for (const xAxis of axisResolution.xAxes) {
            const resolvedType = resolvedTypes.x.get(xAxis.axisId)!;
            const baseDomain = baseDomains.x.get(xAxis.axisId)!;
            const range: readonly [number, number] = [plotRect.x, plotRect.x + plotRect.width];
            const baseScale = baseScales.getXScale(xAxis.axisId)!;

            const win = viewport?.x.get(xAxis.axisId);
            let effectiveDomain: readonly unknown[] = baseDomain;
            if (win) {
                if (win.kind === "continuous") {
                    effectiveDomain = [
                        resolvedType === "time" || resolvedType === "utc" ? new Date(win.min) : win.min,
                        resolvedType === "time" || resolvedType === "utc" ? new Date(win.max) : win.max
                    ];
                } else if (win.kind === "category") {
                    effectiveDomain = (baseDomain as readonly unknown[]).slice(win.startIndex, win.endIndexExclusive);
                }
            }

            const viewportScale = CartesianScaleFactory.createExactPositionScale({
                domain: effectiveDomain,
                exponent: xAxis.exponent,
                logBase: xAxis.logBase,
                range,
                symlogConstant: xAxis.symlogConstant,
                type: resolvedType
            });

            xScales.set(xAxis.axisId, viewportScale);
            const isValid = xAxisValidityById.get(xAxis.axisId)?.valid ?? true;
            xSnapshots.set(xAxis.axisId, {
                baseDomain,
                baseScale,
                range,
                ref: { axis: "x", axisId: xAxis.axisId },
                resolvedType,
                valid: isValid,
                viewportDomain: effectiveDomain,
                viewportScale
            });
        }

        for (const yAxis of axisResolution.yAxes) {
            const resolvedType = resolvedTypes.y.get(yAxis.axisId)!;
            const baseDomain = baseDomains.y.get(yAxis.axisId)!;
            const range: readonly [number, number] = resolvedType === "category"
                ? [plotRect.y, plotRect.y + plotRect.height]
                : [plotRect.y + plotRect.height, plotRect.y];
            const baseScale = baseScales.getYScale(yAxis.axisId)!;

            const win = viewport?.y.get(yAxis.axisId);
            let effectiveDomain: readonly unknown[] = baseDomain;
            if (win) {
                if (win.kind === "continuous") {
                    effectiveDomain = [
                        resolvedType === "time" || resolvedType === "utc" ? new Date(win.min) : win.min,
                        resolvedType === "time" || resolvedType === "utc" ? new Date(win.max) : win.max
                    ];
                } else if (win.kind === "category") {
                    effectiveDomain = (baseDomain as readonly unknown[]).slice(win.startIndex, win.endIndexExclusive);
                }
            }

            const viewportScale = CartesianScaleFactory.createExactPositionScale({
                domain: effectiveDomain,
                exponent: yAxis.exponent,
                logBase: yAxis.logBase,
                range,
                symlogConstant: yAxis.symlogConstant,
                type: resolvedType
            });

            yScales.set(yAxis.axisId, viewportScale);
            const isValid = yAxisValidityById.get(yAxis.axisId)?.valid ?? true;
            ySnapshots.set(yAxis.axisId, {
                baseDomain,
                baseScale,
                range,
                ref: { axis: "y", axisId: yAxis.axisId },
                resolvedType,
                valid: isValid,
                viewportDomain: effectiveDomain,
                viewportScale
            });
        }

        const scaleRegistry = new CartesianScaleRegistry({
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            xScales,
            yScales
        });

        const coordinateSpace = new CartesianAxisCoordinateSpace(xSnapshots, ySnapshots);

        const axisScenes: ChartAxisScene[] = [];
        for (const xAxis of axisResolution.xAxes) {
            const scale = xScales.get(xAxis.axisId)!;
            const resolvedType = resolvedTypes.x.get(xAxis.axisId)!;
            const unitMode = axisUnitModes.x.get(xAxis.axisId) ?? "raw";
            const gutter = gutters.x.get(xAxis.axisId) ?? 0;
            const sideOffset = sideOffsets.x.get(xAxis.axisId) ?? 0;
            const labelRotation = effectiveRotations.x.get(xAxis.axisId) ?? 0;

            const ticks = xAxis.labels !== false
                ? this.#generateAxisSceneTicks(
                    xAxis,
                    scale,
                    resolvedType,
                    measurements,
                    unitMode,
                    plotRect
                )
                : [];

            const defaultGrid = preparation.orientation === "horizontal"
                ? (xAxis.dimension === "x" && xAxis.isPrimary)
                : false;

            axisScenes.push({
                axis: "x",
                axisId: xAxis.axisId,
                axisLine: xAxis.axisLine,
                gridLines: xAxis.gridLines ?? defaultGrid,
                gutter,
                isPrimary: xAxis.isPrimary,
                labelMaxWidth: xAxis.labelMaxWidth,
                labelPadding: xAxis.labelPadding ?? 4,
                labelRotation,
                labels: xAxis.labels ?? true,
                position: xAxis.position,
                registrationId: xAxis.registrationId,
                scaleType: resolvedType,
                sideOffset,
                stackIndex: xAxis.stackIndex,
                tickMarks: xAxis.tickMarks ?? false,
                ticks,
                tickSize: xAxis.tickSize ?? 6,
                title: xAxis.title,
                titlePadding: xAxis.titlePadding ?? 8,
                visible: xAxis.visible
            });
        }

        for (const yAxis of axisResolution.yAxes) {
            const scale = yScales.get(yAxis.axisId)!;
            const resolvedType = resolvedTypes.y.get(yAxis.axisId)!;
            const unitMode = axisUnitModes.y.get(yAxis.axisId) ?? "raw";
            const gutter = gutters.y.get(yAxis.axisId) ?? 0;
            const sideOffset = sideOffsets.y.get(yAxis.axisId) ?? 0;
            const labelRotation = effectiveRotations.y.get(yAxis.axisId) ?? 0;

            const ticks = yAxis.labels !== false
                ? this.#generateAxisSceneTicks(
                    yAxis,
                    scale,
                    resolvedType,
                    measurements,
                    unitMode,
                    plotRect
                )
                : [];

            const defaultGrid = preparation.orientation !== "horizontal"
                ? (yAxis.dimension === "y" && yAxis.isPrimary)
                : false;

            axisScenes.push({
                axis: "y",
                axisId: yAxis.axisId,
                axisLine: yAxis.axisLine,
                gridLines: yAxis.gridLines ?? defaultGrid,
                gutter,
                isPrimary: yAxis.isPrimary,
                labelMaxWidth: yAxis.labelMaxWidth,
                labelPadding: yAxis.labelPadding ?? 4,
                labelRotation,
                labels: yAxis.labels ?? true,
                position: yAxis.position,
                registrationId: yAxis.registrationId,
                scaleType: resolvedType,
                sideOffset,
                stackIndex: yAxis.stackIndex,
                tickMarks: yAxis.tickMarks ?? false,
                ticks,
                tickSize: yAxis.tickSize ?? 6,
                title: yAxis.title,
                titlePadding: yAxis.titlePadding ?? 8,
                visible: yAxis.visible
            });
        }

        return { axisScenes, coordinateSpace, scaleRegistry };
    }

    public static coordinate(options: MultiAxisCoordinatorOptions): MultiAxisCoordinatorResult {
        const prep = this.prepareDomains(options);
        const chrome = this.computeChrome(prep, options);
        const proj = this.projectViewport(prep, chrome, options.viewport, options.labelMeasurements);

        return {
            axisScenes: proj.axisScenes,
            axisUnitModes: prep.axisUnitModes,
            axisValidity: prep.axisValidity,
            axisValidityById: prep.axisValidityById,
            chrome,
            coordinateSpace: proj.coordinateSpace,
            plotRect: chrome.plotRect,
            preparation: prep,
            resolvedTypes: prep.resolvedTypes,
            resolvedTypesByAxisId: prep.resolvedTypesByAxisId,
            resolvedXTypesByAxisId: prep.resolvedXTypesByAxisId,
            resolvedYTypesByAxisId: prep.resolvedYTypesByAxisId,
            scaleRegistry: proj.scaleRegistry,
            stackAnalysesByYAxis: prep.stackAnalysesByYAxis,
            stackCoordination: prep.stackCoordination,
            warnings: prep.warnings,
            xAxisValidityById: prep.xAxisValidityById,
            yAxisValidityById: prep.yAxisValidityById
        };
    }

    static #buildScales(
        axisResolution: CartesianAxisRegistryResolution,
        resolvedTypes: { x: ReadonlyMap<string, ResolvedChartCartesianAxisType>; y: ReadonlyMap<string, ResolvedChartCartesianAxisType> },
        domains: { x: ReadonlyMap<string, readonly unknown[]>; y: ReadonlyMap<string, readonly unknown[]> },
        plotRect: ChartRect
    ): { xScales: Map<string, ChartPositionScale>; yScales: Map<string, ChartPositionScale> } {
        const xScales = new Map<string, ChartPositionScale>();
        const yScales = new Map<string, ChartPositionScale>();

        for (const xAxis of axisResolution.xAxes) {
            const type = resolvedTypes.x.get(xAxis.axisId)!;
            const domain = domains.x.get(xAxis.axisId)!;
            const range: readonly [number, number] = [plotRect.x, plotRect.x + plotRect.width];

            const scale = CartesianScaleFactory.createExactPositionScale({
                domain,
                exponent: xAxis.exponent,
                logBase: xAxis.logBase,
                range,
                symlogConstant: xAxis.symlogConstant,
                type
            });
            xScales.set(xAxis.axisId, scale);
        }

        for (const yAxis of axisResolution.yAxes) {
            const type = resolvedTypes.y.get(yAxis.axisId)!;
            const domain = domains.y.get(yAxis.axisId)!;
            const range: readonly [number, number] = type === "category"
                ? [plotRect.y, plotRect.y + plotRect.height]
                : [plotRect.y + plotRect.height, plotRect.y];

            const scale = CartesianScaleFactory.createExactPositionScale({
                domain,
                exponent: yAxis.exponent,
                logBase: yAxis.logBase,
                range,
                symlogConstant: yAxis.symlogConstant,
                type
            });
            yScales.set(yAxis.axisId, scale);
        }

        return { xScales, yScales };
    }

    static #estimateAxisGutterAndRotation(
        axis: ResolvedCartesianAxisDescriptor,
        scale: ChartPositionScale,
        resolvedType: ResolvedChartCartesianAxisType,
        labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>,
        unitMode: "percent" | "raw" = "raw",
        plotRect: ChartRect
    ): { gutter: number; resolvedRotation: number } {
        if (!axis.visible) {
            return { gutter: 0, resolvedRotation: 0 };
        }

        const tickMarksOffset = axis.tickMarks ? (axis.tickSize ?? 6) : 0;
        const labelPadding = axis.labelPadding ?? 4;
        const titlePadding = axis.titlePadding ?? 8;
        const titleExtent = axis.title ? 24 : 0;

        if (axis.labels === false) {
            return {
                gutter: tickMarksOffset + (axis.title ? titlePadding + titleExtent : 0),
                resolvedRotation: 0
            };
        }

        const rawTicks = "ticks" in scale
            ? (scale as ChartContinuousPositionScale<number>).ticks(axis.tickCount ?? 5)
            : (scale as ChartBandPositionScale).domain();

        const step = typeof (scale as any).step === "function"
            ? (scale as any).step()
            : rawTicks.length > 1
                ? (axis.dimension === "x" ? plotRect.width : plotRect.height) / rawTicks.length
                : 60;

        let maxUnrotatedWidth = 0;
        let maxUnrotatedHeight = 0;

        for (let i = 0; i < rawTicks.length; i++) {
            const val = rawTicks[i];
            const tickKey = `axis:${axis.dimension}:${encodeURIComponent(axis.axisId)}:${resolvedType}:${String(val)}`;
            const measurement = labelMeasurements.get(tickKey);

            let width: number;
            let height: number;

            if (measurement) {
                width = axis.labelMaxWidth !== undefined ? Math.min(axis.labelMaxWidth, measurement.width) : measurement.width;
                height = measurement.height;
            } else {
                let formattedText: string;
                if (axis.formatter) {
                    formattedText = axis.formatter(val, i);
                } else if (unitMode === "percent" && typeof val === "number") {
                    formattedText = formatPercentagePoint(val);
                } else if ("formatTick" in scale && typeof (scale as ChartContinuousPositionScale<number>).formatTick === "function") {
                    formattedText = (scale as ChartContinuousPositionScale<number>).formatTick!(val as number, axis.tickCount ?? 5);
                } else {
                    formattedText = String(val);
                }
                const estimated = CartesianAxisLabelGeometry.estimateLabelDimensions(formattedText);
                width = Math.min(axis.labelMaxWidth ?? 120, estimated.width);
                height = estimated.height;
            }

            maxUnrotatedWidth = Math.max(maxUnrotatedWidth, width);
            maxUnrotatedHeight = Math.max(maxUnrotatedHeight, height);
        }

        let resolvedRotation = 0;
        if (axis.labelRotation === "auto" || (axis.labelRotation === undefined && resolvedType === "category")) {
            if (axis.dimension === "x") {
                if (maxUnrotatedWidth + 4 <= step) {
                    resolvedRotation = 0;
                } else {
                    const rot45Proj = CartesianAxisLabelGeometry.projectRotatedDimensions(maxUnrotatedWidth, maxUnrotatedHeight, 45);
                    if (rot45Proj.projectedWidth + 4 <= step) {
                        resolvedRotation = axis.position === "top" ? -45 : 45;
                    } else {
                        resolvedRotation = axis.position === "top" ? -90 : 90;
                    }
                }
            } else {
                resolvedRotation = 0;
            }
        } else if (typeof axis.labelRotation === "number") {
            resolvedRotation = axis.labelRotation;
        }

        const proj = CartesianAxisLabelGeometry.projectRotatedDimensions(maxUnrotatedWidth, maxUnrotatedHeight, resolvedRotation);
        const perpExtent = axis.dimension === "x" ? proj.projectedHeight : proj.projectedWidth;
        const basePerp = perpExtent > 0 ? perpExtent : (axis.dimension === "x" ? 16 : 36);

        const gutter = tickMarksOffset + labelPadding + basePerp + (axis.title ? titlePadding + titleExtent : 0);
        return { gutter, resolvedRotation };
    }

    static #generateAxisSceneTicks(
        axis: ResolvedCartesianAxisDescriptor,
        scale: ChartPositionScale,
        resolvedType: ResolvedChartCartesianAxisType,
        labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>,
        unitMode: "percent" | "raw" = "raw",
        plotRect: ChartRect
    ): readonly ChartAxisSceneTick[] {
        const rawTicks = "ticks" in scale
            ? (scale as ChartContinuousPositionScale<number>).ticks(axis.tickCount ?? 5)
            : (scale as ChartBandPositionScale).domain();
        const ticks: ChartAxisSceneTick[] = [];
        const bandwidth = typeof (scale as any).bandwidth === "function" ? (scale as any).bandwidth() : 0;
        const step = typeof (scale as any).step === "function"
            ? (scale as any).step()
            : rawTicks.length > 1
                ? (axis.dimension === "x" ? plotRect.width : plotRect.height) / rawTicks.length
                : 60;

        let thinningFlags: readonly boolean[] | undefined;
        if (resolvedType === "category" && rawTicks.length > 1) {
            thinningFlags = CartesianAxisLabelGeometry.resolveCategoryLabelThinning({
                categoryCount: rawTicks.length,
                categoryStep: step,
                maxLabelExtentAlongAxis: axis.labelMaxWidth ?? 60,
                preferredTickCount: axis.tickCount
            });
        }

        for (let i = 0; i < rawTicks.length; i++) {
            const val = rawTicks[i];
            let coord = (scale as ChartPositionScale<any>).map(val);
            if (coord === undefined || !Number.isFinite(coord)) {
                continue;
            }
            if (bandwidth > 0) {
                coord += bandwidth / 2;
            }

            let formattedText: string;
            if (axis.formatter) {
                formattedText = axis.formatter(val, i);
            } else if (unitMode === "percent" && typeof val === "number") {
                formattedText = formatPercentagePoint(val);
            } else if ("formatTick" in scale && typeof (scale as ChartContinuousPositionScale<number>).formatTick === "function") {
                formattedText = (scale as ChartContinuousPositionScale<number>).formatTick!(val as number, axis.tickCount ?? 5);
            } else {
                formattedText = String(val);
            }

            const tickKey = `axis:${axis.dimension}:${encodeURIComponent(axis.axisId)}:${resolvedType}:${String(val)}`;
            const measurement = labelMeasurements.get(tickKey);
            const estimated = !measurement ? CartesianAxisLabelGeometry.estimateLabelDimensions(formattedText) : undefined;

            const isThinned = thinningFlags ? !thinningFlags[i] : false;
            const labelVisible = formattedText !== "" && !isThinned;

            ticks.push({
                coordinate: coord,
                formattedValue: formattedText,
                index: i,
                labelVisible,
                tickKey,
                unrotatedHeight: measurement?.height ?? estimated?.height ?? 16,
                unrotatedWidth: measurement?.width ?? estimated?.width ?? (formattedText.length * 7.5),
                value: val
            });
        }

        return ticks;
    }
}
