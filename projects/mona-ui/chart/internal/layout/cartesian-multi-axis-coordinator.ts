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
import { CartesianAxisGeometry, type ChartRect } from "./cartesian-axis-geometry";
import { CartesianAxisLabelGeometry } from "./cartesian-axis-label-geometry";
import type { CartesianAxisRegistryResolution, ResolvedCartesianAxisDescriptor } from "./cartesian-axis-registry-resolver";
import { CartesianAxisOverhangResolver } from "./cartesian-axis-overhang-resolver";
import type { ChartLabelMeasurement } from "../../models/chart-polar.models";
import { formatPercentagePoint } from "../utils/chart-formatter";
import type { SeriesAxisBindingResolution } from "./cartesian-series-axis-binding-resolver";

export interface MultiAxisCoordinatorOptions {
    readonly axisResolution: CartesianAxisRegistryResolution;
    readonly bindingResolution: SeriesAxisBindingResolution;
    readonly chartHeight: number;
    readonly chartWidth: number;
    readonly insets?: { bottom?: number; left?: number; right?: number; top?: number };
    readonly labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>;
    readonly rootData?: readonly unknown[];
    readonly rootXField?: ChartField;
    readonly warnedDiagnosticSignatures?: Set<string>;
}

export interface MultiAxisCoordinatorResult {
    readonly axisScenes: readonly ChartAxisScene[];
    readonly axisUnitModes: ReadonlyMap<string, "percent" | "raw">;
    readonly plotRect: ChartRect;
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
            rootData,
            rootXField
        } = options;

        const effectiveRootXField = rootXField || (axisResolution.xAxes[0]?.field as ChartField | undefined);
        const warnings: string[] = [...axisResolution.warnings, ...bindingResolution.warnings];

        const insetTop = insets.top ?? 10;
        const insetBottom = insets.bottom ?? 10;
        const insetLeft = insets.left ?? 16;
        const insetRight = insets.right ?? 16;

        // 1. Resolve effective scale types and stack analyses per axis
        const resolvedTypesByAxisId = new Map<string, ResolvedChartCartesianAxisType>();
        const stackAnalysesByYAxis = new Map<string, CartesianStackAnalysis>();
        const axisUnitModes = new Map<string, "percent" | "raw">();

        for (const xAxis of axisResolution.xAxes) {
            const boundSeries = bindingResolution.seriesByXAxis.get(xAxis.axisId) ?? [];
            const compat = CartesianAxisCompatibilityPolicy.resolveAxisType(
                xAxis,
                boundSeries,
                rootData,
                effectiveRootXField
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
                effectiveRootXField
            );
            warnings.push(...compat.warnings);
            resolvedTypesByAxisId.set(yAxis.axisId, compat.resolvedType);

            // Compute stack analysis for this Y axis
            const primaryXType = resolvedTypesByAxisId.get(axisResolution.primaryXAxisId) ?? "category";
            const stackAnalysis = CartesianStackEngine.computeAnalysis({
                rootData: rootData ?? [],
                rootXField: effectiveRootXField,
                series: boundSeries.filter(s => "color" in s) as import("../context/chart-registration-context").ChartCartesianSeriesRegistration[],
                xAxisType: primaryXType === "time" || primaryXType === "utc" ? primaryXType : primaryXType === "linear" ? "linear" : "category"
            });
            stackAnalysesByYAxis.set(yAxis.axisId, stackAnalysis);
            axisUnitModes.set(yAxis.axisId, stackAnalysis.axisUnitMode);
        }

        // 2. Resolve domains for all axes
        const domainsByAxisId = new Map<string, readonly unknown[]>();

        for (const xAxis of axisResolution.xAxes) {
            const resolvedType = resolvedTypesByAxisId.get(xAxis.axisId)!;
            const boundSeries = bindingResolution.seriesByXAxis.get(xAxis.axisId) ?? [];
            const domainRes = CartesianAxisDomainResolver.resolveDomain(
                xAxis,
                resolvedType,
                boundSeries,
                rootData,
                effectiveRootXField
            );
            warnings.push(...domainRes.warnings);
            domainsByAxisId.set(xAxis.axisId, domainRes.domain);
        }

        for (const yAxis of axisResolution.yAxes) {
            const resolvedType = resolvedTypesByAxisId.get(yAxis.axisId)!;
            const boundSeries = bindingResolution.seriesByYAxis.get(yAxis.axisId) ?? [];
            const stackAnalysis = stackAnalysesByYAxis.get(yAxis.axisId);
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
                stackAnalysis
            );
            warnings.push(...domainRes.warnings);
            domainsByAxisId.set(yAxis.axisId, domainRes.domain);
        }

        // 3. Convergence loop for plotRect & gutters (max 3 iterations)
        let plotRect: ChartRect = {
            height: Math.max(10, chartHeight - insetTop - insetBottom - 60),
            width: Math.max(10, chartWidth - insetLeft - insetRight - 80),
            x: insetLeft + 48,
            y: insetTop + 20
        };

        const guttersByAxisId = new Map<string, number>();
        const sideOffsetsByAxisId = new Map<string, number>();
        const xScales = new Map<string, ChartPositionScale>();
        const yScales = new Map<string, ChartPositionScale>();

        const axisSpacing = 8;
        const maxIterations = 3;

        for (let iter = 0; iter < maxIterations; iter++) {
            // Build scales with current plotRect
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
                const range: readonly [number, number] = [plotRect.y + plotRect.height, plotRect.y];

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

            // Measure gutters per axis
            const allAxes: ResolvedCartesianAxisDescriptor[] = [
                ...axisResolution.xAxes,
                ...axisResolution.yAxes
            ];

            for (const axis of allAxes) {
                const scale = (axis.dimension === "x" ? xScales.get(axis.axisId) : yScales.get(axis.axisId))!;
                const resolvedType = resolvedTypesByAxisId.get(axis.axisId)!;
                const unitMode = axisUnitModes.get(axis.axisId) ?? "raw";
                const gutter = this.#estimateAxisGutter(axis, scale, resolvedType, labelMeasurements, unitMode);
                guttersByAxisId.set(axis.axisId, gutter);
            }

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
                for (let i = 0; i < axesOnSide.length; i++) {
                    const ax = axesOnSide[i];
                    sideOffsetsByAxisId.set(ax.axisId, accumOffset);
                    const axGutter = guttersByAxisId.get(ax.axisId) ?? (pos === "bottom" || pos === "top" ? 32 : 48);
                    accumOffset += axGutter + (i < axesOnSide.length - 1 ? axisSpacing : 0);
                }
                sideThickness[pos] = accumOffset;
            }

            // Calculate next plotRect
            const nextPlotX = insetLeft + sideThickness.left;
            const nextPlotY = insetTop + sideThickness.top;
            const nextPlotW = Math.max(10, chartWidth - insetLeft - insetRight - sideThickness.left - sideThickness.right);
            const nextPlotH = Math.max(10, chartHeight - insetTop - insetBottom - sideThickness.top - sideThickness.bottom);

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
        const scaleRegistry = new CartesianScaleRegistry({
            primaryXAxisId: axisResolution.primaryXAxisId,
            primaryYAxisId: axisResolution.primaryYAxisId,
            xScales,
            yScales
        });

        const axisScenes: ChartAxisScene[] = [];
        const allAxes: ResolvedCartesianAxisDescriptor[] = [
            ...axisResolution.xAxes,
            ...axisResolution.yAxes
        ];

        for (const axis of allAxes) {
            const scale = (axis.dimension === "x" ? xScales.get(axis.axisId) : yScales.get(axis.axisId))!;
            const resolvedType = resolvedTypesByAxisId.get(axis.axisId)!;
            const unitMode = axisUnitModes.get(axis.axisId) ?? "raw";
            const gutter = guttersByAxisId.get(axis.axisId) ?? 32;
            const sideOffset = sideOffsetsByAxisId.get(axis.axisId) ?? 0;

            const ticks = this.#generateAxisSceneTicks(
                axis,
                scale,
                resolvedType,
                labelMeasurements,
                unitMode
            );

            const scene: ChartAxisScene = {
                axis: axis.dimension,
                axisId: axis.axisId,
                axisLine: axis.axisLine,
                gridLines: axis.gridLines ?? (axis.dimension === "y"),
                gutter,
                isPrimary: axis.isPrimary,
                labelMaxWidth: axis.labelMaxWidth,
                labelPadding: axis.labelPadding ?? 4,
                labelRotation: typeof axis.labelRotation === "number" ? axis.labelRotation : 0,
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
            plotRect,
            scaleRegistry,
            stackAnalysesByYAxis,
            warnings
        };
    }

    static #estimateAxisGutter(
        axis: ResolvedCartesianAxisDescriptor,
        scale: ChartPositionScale,
        resolvedType: ResolvedChartCartesianAxisType,
        labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>,
        unitMode: "percent" | "raw" = "raw"
    ): number {
        if (!axis.visible) {
            return 0;
        }

        const tickMarksOffset = axis.tickMarks ? (axis.tickSize ?? 6) : 0;
        const labelPadding = axis.labelPadding ?? 4;
        const titlePadding = axis.titlePadding ?? 12;
        const titleExtent = axis.title ? 18 : 0;

        if (axis.labels === false) {
            return tickMarksOffset + (axis.title ? titlePadding + titleExtent + 8 : 0);
        }

        const rawTicks = "ticks" in scale
            ? (scale as ChartContinuousPositionScale<number>).ticks(axis.tickCount ?? 5)
            : (scale as ChartBandPositionScale).domain();
        let maxPerpExtent = 0;

        for (let i = 0; i < rawTicks.length; i++) {
            const val = rawTicks[i];
            const tickKey = `axis:${axis.dimension}:${encodeURIComponent(axis.axisId)}:${resolvedType}:${String(val)}`;
            const measurement = labelMeasurements.get(tickKey);

            let width = 26;
            let height = 16;

            if (measurement) {
                width = measurement.width;
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

            const rot = typeof axis.labelRotation === "number" ? axis.labelRotation : 0;
            if (axis.dimension === "x") {
                // Perpendicular is height
                if (rot === 0) {
                    maxPerpExtent = Math.max(maxPerpExtent, height);
                } else {
                    const rad = Math.abs(rot) * (Math.PI / 180);
                    const effH = Math.sin(rad) * width + Math.cos(rad) * height;
                    maxPerpExtent = Math.max(maxPerpExtent, Math.ceil(effH));
                }
            } else {
                // Perpendicular is width
                if (rot === 0) {
                    maxPerpExtent = Math.max(maxPerpExtent, width);
                } else {
                    const rad = Math.abs(rot) * (Math.PI / 180);
                    const effW = Math.cos(rad) * width + Math.sin(rad) * height;
                    maxPerpExtent = Math.max(maxPerpExtent, Math.ceil(effW));
                }
            }
        }

        const basePerp = maxPerpExtent > 0 ? maxPerpExtent : (axis.dimension === "x" ? 16 : 36);
        return tickMarksOffset + labelPadding + basePerp + (axis.title ? titlePadding + titleExtent + 8 : 0);
    }

    static #generateAxisSceneTicks(
        axis: ResolvedCartesianAxisDescriptor,
        scale: ChartPositionScale,
        resolvedType: ResolvedChartCartesianAxisType,
        labelMeasurements: ReadonlyMap<string, ChartLabelMeasurement>,
        unitMode: "percent" | "raw" = "raw"
    ): readonly ChartAxisSceneTick[] {
        const rawTicks = "ticks" in scale
            ? (scale as ChartContinuousPositionScale<number>).ticks(axis.tickCount ?? 5)
            : (scale as ChartBandPositionScale).domain();
        const ticks: ChartAxisSceneTick[] = [];
        const bandwidth = typeof (scale as any).bandwidth === "function" ? (scale as any).bandwidth() : 0;

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

            ticks.push({
                coordinate: coord,
                formattedValue: formattedText,
                index: i,
                labelVisible: formattedText !== "",
                tickKey,
                unrotatedHeight: measurement?.height ?? estimated?.height ?? 16,
                unrotatedWidth: measurement?.width ?? estimated?.width ?? (formattedText.length * 7.5),
                value: val
            });
        }

        return ticks;
    }
}
