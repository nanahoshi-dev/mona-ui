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
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export interface MultiAxisCoordinatorResult {
    readonly axisScenes: readonly ChartAxisScene[];
    readonly axisUnitModes: CartesianAxisMaps<"percent" | "raw">;
    readonly axisValidity: CartesianAxisMaps<ChartAxisValidity>;
    readonly axisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly plotRect: ChartRect;
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
    public static coordinate(options: MultiAxisCoordinatorOptions): MultiAxisCoordinatorResult {
        const {
            axisResolution,
            bindingResolution,
            chartHeight,
            chartWidth,
            insets = {},
            labelMeasurements,
            orientation = "vertical",
            rootData,
            rootXField
        } = options;

        const effectiveRootXField = rootXField || (axisResolution.xAxes[0]?.field as ChartField | undefined);
        const warnings: string[] = [...axisResolution.warnings, ...bindingResolution.warnings];

        const insetTop = insets.top ?? 10;
        const insetBottom = insets.bottom ?? 10;
        const insetLeft = insets.left ?? 16;
        const insetRight = insets.right ?? 16;

        // 1. Resolve effective scale types with dimension-safe maps
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

        // 2. Perform Dimension-Neutral Stack Coordination (MAX3-006 & MAX3-007)
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

        // 3. Resolve domains for all axes
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
            xDomains.set(xAxis.axisId, domainRes.domain);
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
            yDomains.set(yAxis.axisId, domainRes.domain);
            yAxisValidityById.set(yAxis.axisId, { reason: domainRes.reason, valid: domainRes.isValid });
        }

        // 4. Convergence loop for plotRect & gutters
        let plotRect: ChartRect = {
            height: Math.max(0, chartHeight - insetTop - insetBottom - 60),
            width: Math.max(0, chartWidth - insetLeft - insetRight - 80),
            x: insetLeft + 48,
            y: insetTop + 20
        };

        const gutters = { x: new Map<string, number>(), y: new Map<string, number>() };
        const sideOffsets = { x: new Map<string, number>(), y: new Map<string, number>() };
        const effectiveRotations = { x: new Map<string, number>(), y: new Map<string, number>() };

        const axisSpacing = 8;
        const maxIterations = 3;

        for (let iter = 0; iter < maxIterations; iter++) {
            const currentScales = this.#buildScales(axisResolution, { x: resolvedXTypes, y: resolvedYTypes }, { x: xDomains, y: yDomains }, plotRect);

            for (const xAxis of axisResolution.xAxes) {
                const scale = currentScales.xScales.get(xAxis.axisId)!;
                const resolvedType = resolvedXTypes.get(xAxis.axisId)!;
                const unitMode = xUnitModes.get(xAxis.axisId) ?? "raw";
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
                const resolvedType = resolvedYTypes.get(yAxis.axisId)!;
                const unitMode = yUnitModes.get(yAxis.axisId) ?? "raw";
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

            // Calculate overhangs (MAX3-023)
            const overhang = CartesianAxisOverhangResolver.computeOverhang(allDescriptors, labelMeasurements);

            // Calculate side totals and offsets
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
                    accumOffset += axGutter + (i < visibleAxesOnSide.length - 1 ? axisSpacing : 0);
                }
                for (const ax of axesOnSide) {
                    if (!ax.visible) {
                        if (ax.dimension === "x") {
                            sideOffsets.x.set(ax.axisId, 0);
                        } else {
                            sideOffsets.y.set(ax.axisId, 0);
                        }
                    }
                }
                sideThickness[pos] = accumOffset;
            }

            // Calculate next plotRect with net overhang clearance beyond side thickness and insets
            const extraLeft = Math.max(0, overhang.left - insetLeft - sideThickness.left);
            const extraRight = Math.max(0, overhang.right - insetRight - sideThickness.right);
            const extraTop = Math.max(0, overhang.top - insetTop - sideThickness.top);
            const extraBottom = Math.max(0, overhang.bottom - insetBottom - sideThickness.bottom);

            const nextPlotX = insetLeft + sideThickness.left + extraLeft;
            const nextPlotY = insetTop + sideThickness.top + extraTop;
            const nextPlotW = Math.max(0, chartWidth - insetLeft - insetRight - sideThickness.left - sideThickness.right - extraLeft - extraRight);
            const nextPlotH = Math.max(0, chartHeight - insetTop - insetBottom - sideThickness.top - sideThickness.bottom - extraTop - extraBottom);

            const dx = Math.abs(nextPlotX - plotRect.x);
            const dy = Math.abs(nextPlotY - plotRect.y);
            const dw = Math.abs(nextPlotW - plotRect.width);
            const dh = Math.abs(nextPlotH - plotRect.height);

            plotRect = {
                height: nextPlotH,
                width: nextPlotW,
                x: nextPlotX,
                y: nextPlotY
            };

            if (dx < 0.5 && dy < 0.5 && dw < 0.5 && dh < 0.5) {
                break;
            }
        }

        // 5. Construct final ScaleRegistry & ChartAxisScenes
        const finalScales = this.#buildScales(axisResolution, { x: resolvedXTypes, y: resolvedYTypes }, { x: xDomains, y: yDomains }, plotRect);
        const scaleRegistry = new CartesianScaleRegistry({
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            xScales: finalScales.xScales,
            yScales: finalScales.yScales
        });

        const axisScenes: ChartAxisScene[] = [];

        for (const xAxis of axisResolution.xAxes) {
            const scale = finalScales.xScales.get(xAxis.axisId)!;
            const resolvedType = resolvedXTypes.get(xAxis.axisId)!;
            const unitMode = xUnitModes.get(xAxis.axisId) ?? "raw";
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

            const defaultGrid = orientation === "horizontal"
                ? (xAxis.dimension === "x" && xAxis.isPrimary)
                : false;

            const scene: ChartAxisScene = {
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
            };
            axisScenes.push(scene);
        }

        for (const yAxis of axisResolution.yAxes) {
            const scale = finalScales.yScales.get(yAxis.axisId)!;
            const resolvedType = resolvedYTypes.get(yAxis.axisId)!;
            const unitMode = yUnitModes.get(yAxis.axisId) ?? "raw";
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

            const defaultGrid = orientation !== "horizontal"
                ? (yAxis.dimension === "y" && yAxis.isPrimary)
                : false;

            const scene: ChartAxisScene = {
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
            };
            axisScenes.push(scene);
        }

        const resolvedTypesByAxisId = new Map<string, ResolvedChartCartesianAxisType>();
        for (const [k, v] of resolvedXTypes) resolvedTypesByAxisId.set(k, v);
        for (const [k, v] of resolvedYTypes) resolvedTypesByAxisId.set(k, v);

        const axisValidityById = new Map<string, ChartAxisValidity>();
        for (const [k, v] of xAxisValidityById) axisValidityById.set(k, v);
        for (const [k, v] of yAxisValidityById) axisValidityById.set(k, v);

        return {
            axisScenes,
            axisUnitModes: { x: xUnitModes, y: yUnitModes },
            axisValidity: { x: xAxisValidityById, y: yAxisValidityById },
            axisValidityById,
            plotRect,
            resolvedTypes: { x: resolvedXTypes, y: resolvedYTypes },
            resolvedTypesByAxisId,
            resolvedXTypesByAxisId: resolvedXTypes,
            resolvedYTypesByAxisId: resolvedYTypes,
            scaleRegistry,
            stackAnalysesByYAxis,
            stackCoordination,
            warnings,
            xAxisValidityById,
            yAxisValidityById
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

            let scale: ChartPositionScale;
            if (type === "category") {
                scale = CartesianScaleFactory.createBandScale(domain as readonly string[], range);
            } else if (type === "time" || type === "utc") {
                scale = CartesianScaleFactory.createTemporalScale({
                    domain: domain as readonly [Date, Date],
                    explicitMax: xAxis.explicitMax,
                    explicitMin: xAxis.explicitMin,
                    nice: xAxis.nice,
                    range,
                    tickCount: xAxis.tickCount,
                    type
                });
            } else {
                scale = CartesianScaleFactory.createNumericScale({
                    domain: domain as readonly [number, number],
                    explicitMax: typeof xAxis.explicitMax === "number" ? xAxis.explicitMax : undefined,
                    explicitMin: typeof xAxis.explicitMin === "number" ? xAxis.explicitMin : undefined,
                    exponent: xAxis.exponent,
                    logBase: xAxis.logBase,
                    nice: xAxis.nice,
                    range,
                    symlogConstant: xAxis.symlogConstant,
                    tickCount: xAxis.tickCount,
                    type
                });
            }
            xScales.set(xAxis.axisId, scale);
        }

        for (const yAxis of axisResolution.yAxes) {
            const type = resolvedTypes.y.get(yAxis.axisId)!;
            const domain = domains.y.get(yAxis.axisId)!;
            const range: readonly [number, number] = type === "category"
                ? [plotRect.y, plotRect.y + plotRect.height]
                : [plotRect.y + plotRect.height, plotRect.y];

            let scale: ChartPositionScale;
            if (type === "category") {
                scale = CartesianScaleFactory.createBandScale(domain as readonly string[], range);
            } else {
                scale = CartesianScaleFactory.createNumericScale({
                    domain: domain as readonly [number, number],
                    explicitMax: typeof yAxis.explicitMax === "number" ? yAxis.explicitMax : undefined,
                    explicitMin: typeof yAxis.explicitMin === "number" ? yAxis.explicitMin : undefined,
                    exponent: yAxis.exponent,
                    logBase: yAxis.logBase,
                    nice: yAxis.nice,
                    range,
                    symlogConstant: yAxis.symlogConstant,
                    tickCount: yAxis.tickCount,
                    type: type as "linear" | "log" | "symlog" | "pow" | "sqrt"
                });
            }
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

        // Thinning for category axes (MAX3-023)
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
