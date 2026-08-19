import type { ChartAxisLabelRotation, ChartAxisPosition } from "../../models/chart-axis.models";
import type { ChartField } from "../../models/chart.models";
import type { ChartSeriesRegistration } from "../context/chart-registration-context";
import type { CartesianStackAnalysis } from "../data/cartesian-stack-engine";
import { CartesianStackEngine } from "../data/cartesian-stack-engine";
import type {
    ChartBandPositionScale,
    ChartContinuousPositionScale,
    ChartPositionScale,
    ResolvedChartCartesianAxisType
} from "../scale/chart-scale";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { CartesianScaleRegistry } from "../scale/cartesian-scale-registry";
import type { ChartAxisScene, ChartAxisSceneTick } from "../scene/cartesian-scene";
import { CartesianAxisCompatibilityPolicy } from "./cartesian-axis-compatibility-policy";
import { CartesianAxisDomainResolver } from "./cartesian-axis-domain-resolver";
import type { ChartRect } from "./cartesian-axis-geometry";
import { CartesianAxisLabelGeometry } from "./cartesian-axis-label-geometry";
import type { CartesianAxisRegistryResolution, ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";
import { CartesianAxisOverhangResolver } from "./cartesian-axis-overhang-resolver";
import type { ChartAxisValidity } from "./cartesian-axis-resolved-context";
import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import { formatPercentagePoint } from "../utils/chart-formatter";
import { isFiniteNumber } from "../utils/number-utils";
import type { SeriesAxisBindingResolution } from "./cartesian-series-axis-binding-resolver";

export interface MultiAxisCoordinatorOptions {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly chartHeight: number;
    readonly chartWidth: number;
    readonly insets?: { bottom?: number; left?: number; right?: number; top?: number };
    readonly labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>;
    readonly orientation?: "horizontal" | "vertical";
    readonly rootData?: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export interface MultiAxisCoordinatorResult {
    readonly axisScenes: readonly ChartAxisScene[];
    readonly axisUnitModes: ReadonlyMap<string, "percent" | "raw">;
    readonly axisValidityById: ReadonlyMap<string, ChartAxisValidity>;
    readonly plotRect: ChartRect;
    readonly resolvedTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>;
    readonly scaleRegistry: CartesianScaleRegistry;
    readonly stackAnalysesByYAxis: ReadonlyMap<string, CartesianStackAnalysis>;
    readonly warnings: readonly string[];
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

        // 1. Resolve effective scale types and check scale parameter diagnostics (MAXR-032)
        const resolvedTypesByAxisId = new Map<string, ResolvedChartCartesianAxisType>();
        const stackAnalysesByYAxis = new Map<string, CartesianStackAnalysis>();
        const axisUnitModes = new Map<string, "percent" | "raw">();
        const axisValidityById = new Map<string, ChartAxisValidity>();

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
            resolvedTypesByAxisId.set(xAxis.axisId, compat.resolvedType);
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
            resolvedTypesByAxisId.set(yAxis.axisId, compat.resolvedType);
        }

        // Compute stack analyses per Y axis
        for (const yAxis of axisResolution.yAxes) {
            const boundSeries = bindingResolution.seriesByYAxis.get(yAxis.axisId) ?? [];
            const primaryXType = resolvedTypesByAxisId.get(axisResolution.primaryXAxisId) ?? (orientation === "horizontal" ? "linear" : "category");
            const stackAnalysis = CartesianStackEngine.computeAnalysis({
                orientation,
                primaryXAxisId: axisResolution.primaryXAxisId,
                primaryYAxisId: yAxis.axisId,
                resolvedXAxisTypeByAxisId: resolvedTypesByAxisId,
                resolvedYAxisTypeByAxisId: resolvedTypesByAxisId,
                rootData: rootData ?? [],
                rootXField: effectiveRootXField,
                series: boundSeries.filter(s => "color" in s) as import("../context/chart-registration-context").ChartCartesianSeriesRegistration[],
                xAxisType: orientation === "horizontal" ? "category" : (primaryXType === "time" || primaryXType === "utc" ? primaryXType : primaryXType === "linear" ? "linear" : "category")
            });
            stackAnalysesByYAxis.set(yAxis.axisId, stackAnalysis);
            axisUnitModes.set(yAxis.axisId, stackAnalysis.axisUnitMode);
        }

        // 2. Resolve domains for all axes
        const domainsByAxisId = new Map<string, readonly unknown[]>();

        for (const xAxis of axisResolution.xAxes) {
            const resolvedType = resolvedTypesByAxisId.get(xAxis.axisId)!;
            const boundSeries = bindingResolution.seriesByXAxis.get(xAxis.axisId) ?? [];
            const stackAnalysis = orientation === "horizontal"
                ? stackAnalysesByYAxis.get(axisResolution.primaryYAxisId)
                : undefined;
            const stackedExtents = stackAnalysis && stackAnalysis.layout.groups.length > 0
                ? { min: stackAnalysis.layout.yExtent[0], max: stackAnalysis.layout.yExtent[1] }
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
            domainsByAxisId.set(xAxis.axisId, domainRes.domain);
            axisValidityById.set(xAxis.axisId, { valid: domainRes.isValid });
        }

        for (const yAxis of axisResolution.yAxes) {
            const resolvedType = resolvedTypesByAxisId.get(yAxis.axisId)!;
            const boundSeries = bindingResolution.seriesByYAxis.get(yAxis.axisId) ?? [];
            const stackAnalysis = orientation === "horizontal"
                ? undefined
                : stackAnalysesByYAxis.get(yAxis.axisId);
            const stackedExtents = stackAnalysis && stackAnalysis.layout.groups.length > 0
                ? { min: stackAnalysis.layout.yExtent[0], max: stackAnalysis.layout.yExtent[1] }
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
            domainsByAxisId.set(yAxis.axisId, domainRes.domain);
            axisValidityById.set(yAxis.axisId, { valid: domainRes.isValid });
        }

        // 3. Convergence loop for plotRect & gutters
        let plotRect: ChartRect = {
            height: Math.max(0, chartHeight - insetTop - insetBottom - 60),
            width: Math.max(0, chartWidth - insetLeft - insetRight - 80),
            x: insetLeft + 48,
            y: insetTop + 20
        };

        const guttersByAxisId = new Map<string, number>();
        const sideOffsetsByAxisId = new Map<string, number>();
        const effectiveRotationsByAxisId = new Map<string, number>();

        const axisSpacing = 8;
        const maxIterations = 3;

        for (let iter = 0; iter < maxIterations; iter++) {
            const currentScales = this.#buildScales(axisResolution, resolvedTypesByAxisId, domainsByAxisId, plotRect);

            for (const axis of allDescriptors) {
                const scale = (axis.dimension === "x" ? currentScales.xScales.get(axis.axisId) : currentScales.yScales.get(axis.axisId))!;
                const resolvedType = resolvedTypesByAxisId.get(axis.axisId)!;
                const unitMode = axisUnitModes.get(axis.axisId) ?? "raw";
                const { gutter, resolvedRotation } = this.#estimateAxisGutterAndRotation(
                    axis,
                    scale,
                    resolvedType,
                    labelMeasurements,
                    unitMode,
                    plotRect
                );
                guttersByAxisId.set(axis.axisId, gutter);
                effectiveRotationsByAxisId.set(axis.axisId, resolvedRotation);
            }

            // Calculate overhangs (MAXR-015)
            const overhang = CartesianAxisOverhangResolver.computeOverhang(allDescriptors, labelMeasurements);

            // Calculate side totals and offsets (MAXR-018: visible === false consumes 0 gutter and no spacing)
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
                    sideOffsetsByAxisId.set(ax.axisId, accumOffset);
                    const axGutter = guttersByAxisId.get(ax.axisId) ?? 0;
                    accumOffset += axGutter + (i < visibleAxesOnSide.length - 1 ? axisSpacing : 0);
                }
                for (const ax of axesOnSide) {
                    if (!ax.visible) {
                        sideOffsetsByAxisId.set(ax.axisId, 0);
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

        // 4. Construct final ScaleRegistry & ChartAxisScenes
        const finalScales = this.#buildScales(axisResolution, resolvedTypesByAxisId, domainsByAxisId, plotRect);
        const scaleRegistry = new CartesianScaleRegistry({
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            xScales: finalScales.xScales,
            yScales: finalScales.yScales
        });

        const axisScenes: ChartAxisScene[] = [];

        for (const axis of allDescriptors) {
            const scale = (axis.dimension === "x" ? finalScales.xScales.get(axis.axisId) : finalScales.yScales.get(axis.axisId))!;
            const resolvedType = resolvedTypesByAxisId.get(axis.axisId)!;
            const unitMode = axisUnitModes.get(axis.axisId) ?? "raw";
            const gutter = guttersByAxisId.get(axis.axisId) ?? 0;
            const sideOffset = sideOffsetsByAxisId.get(axis.axisId) ?? 0;
            const labelRotation = effectiveRotationsByAxisId.get(axis.axisId) ?? 0;

            const ticks = axis.labels !== false
                ? this.#generateAxisSceneTicks(
                    axis,
                    scale,
                    resolvedType,
                    labelMeasurements,
                    unitMode,
                    plotRect
                )
                : [];

            // Orientation-aware grid lines default (MAXR-017)
            const defaultGrid = orientation === "horizontal"
                ? (axis.dimension === "x" && axis.isPrimary)
                : (axis.dimension === "y" && axis.isPrimary);

            const scene: ChartAxisScene = {
                axis: axis.dimension,
                axisId: axis.axisId,
                axisLine: axis.axisLine,
                gridLines: axis.gridLines ?? defaultGrid,
                gutter,
                isPrimary: axis.isPrimary,
                labelMaxWidth: axis.labelMaxWidth,
                labelPadding: axis.labelPadding ?? 4,
                labelRotation,
                labels: axis.labels ?? true,
                position: axis.position,
                registrationId: axis.registrationId,
                scaleType: resolvedType,
                sideOffset,
                stackIndex: axis.stackIndex,
                tickMarks: axis.tickMarks ?? false,
                ticks,
                tickSize: axis.tickSize ?? 6,
                title: axis.title,
                titlePadding: axis.titlePadding ?? 8,
                visible: axis.visible
            };
            axisScenes.push(scene);
        }

        return {
            axisScenes,
            axisUnitModes,
            axisValidityById,
            plotRect,
            resolvedTypesByAxisId,
            scaleRegistry,
            stackAnalysesByYAxis,
            warnings
        };
    }

    static #buildScales(
        axisResolution: CartesianAxisRegistryResolution,
        resolvedTypesByAxisId: ReadonlyMap<string, ResolvedChartCartesianAxisType>,
        domainsByAxisId: ReadonlyMap<string, readonly unknown[]>,
        plotRect: ChartRect
    ): { xScales: Map<string, ChartPositionScale>; yScales: Map<string, ChartPositionScale> } {
        const xScales = new Map<string, ChartPositionScale>();
        const yScales = new Map<string, ChartPositionScale>();

        for (const xAxis of axisResolution.xAxes) {
            const type = resolvedTypesByAxisId.get(xAxis.axisId)!;
            const domain = domainsByAxisId.get(xAxis.axisId)!;
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
            const type = resolvedTypesByAxisId.get(yAxis.axisId)!;
            const domain = domainsByAxisId.get(yAxis.axisId)!;
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

        // Thinning for category axes (MAXR-014)
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
