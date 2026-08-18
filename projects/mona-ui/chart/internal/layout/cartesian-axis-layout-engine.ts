import type {
    ChartAxisFormatter,
    ChartAxisPosition,
    ChartXAxisPosition,
    ChartXAxisType,
    ChartYAxisPosition,
    ChartYAxisType
} from "../../models/chart-axis.models";
import type { ChartAxisRegistrationBase } from "../context/chart-registration-context";
import type { ChartAxisScene, ChartAxisSceneTick } from "../scene/cartesian-scene";
import { clamp, isFiniteNumber } from "../utils/number-utils";
import { CartesianAxisLabelGeometry } from "./cartesian-axis-label-geometry";

export interface CartesianScaleLike {
    readonly bandwidth?: () => number;
    readonly domain: () => readonly unknown[];
    readonly map?: (value: any) => number | undefined;
    readonly scale?: (value: any) => number;
    readonly step?: () => number;
    readonly ticks?: (count?: number) => readonly any[];
}

export interface CartesianAxisLayoutOptions {
    readonly axis: "x" | "y";
    readonly axisType: ChartXAxisType | ChartYAxisType;
    readonly containerSize: number;
    readonly defaultGridLines: boolean;
    readonly effectiveFormatter?: ChartAxisFormatter<any>;
    readonly measurements?: ReadonlyMap<string, { height: number; width: number }>;
    readonly plotGutterConstraint: number;
    readonly position: ChartAxisPosition;
    readonly registration?: ChartAxisRegistrationBase;
    readonly scale: CartesianScaleLike;
}

export interface CartesianAxisLayoutResult {
    readonly axisScene: ChartAxisScene;
    readonly gutter: number;
    readonly resolvedRotation: number;
}

interface IntermediateTick {
    coordinate: number;
    extentAlongAxis: number;
    formattedValue: string;
    index: number;
    labelVisible: boolean;
    outwardExtent: number;
    tickKey: string;
    unrotatedHeight: number;
    unrotatedWidth: number;
    value: unknown;
}

export class CartesianAxisLayoutEngine {
    public static computeAxisLayout(options: CartesianAxisLayoutOptions): CartesianAxisLayoutResult {
        const { axis, axisType, containerSize, defaultGridLines, effectiveFormatter, measurements, plotGutterConstraint, position, registration, scale } = options;

        const isVisible = registration ? registration.visible() : true;
        const labelsEnabled = registration?.labels ? (registration.labels() ?? true) : true;
        const axisLine = registration?.axisLine ? registration.axisLine() : true;
        const hasTickMarks = registration?.tickMarks ? (registration.tickMarks() ?? false) : false;
        const tickSize = registration?.tickSize ? (registration.tickSize() ?? 6) : 6;
        const labelPadding = registration?.labelPadding ? (registration.labelPadding() ?? 4) : 4;
        const labelMaxWidth = registration?.labelMaxWidth ? registration.labelMaxWidth() : undefined;
        const title = registration?.title ? registration.title() : "";
        const titlePadding = registration?.titlePadding ? (registration.titlePadding() ?? 6) : 6;
        const gridLines = registration?.gridLines?.() !== undefined ? (registration.gridLines() as boolean) : defaultGridLines;
        const userRotation = registration?.labelRotation ? registration.labelRotation() : 0;

        if (!isVisible) {
            const axisScene: ChartAxisScene = {
                axis,
                axisLine,
                gridLines,
                gutter: 0,
                labelMaxWidth,
                labelPadding,
                labelRotation: 0,
                labels: labelsEnabled,
                position,
                tickMarks: hasTickMarks,
                ticks: [],
                tickSize,
                title,
                titlePadding,
                visible: false
            };
            return {
                axisScene,
                gutter: 0,
                resolvedRotation: 0
            };
        }

        const mapValue = (val: unknown): number => {
            if (typeof scale.map === "function") {
                return scale.map(val) ?? 0;
            }
            if (typeof scale.scale === "function") {
                return scale.scale(val);
            }
            return 0;
        };

        const bandwidth = typeof scale.bandwidth === "function" ? scale.bandwidth() : 0;

        // 1. Generate ticks
        const rawTicks: { coordinate: number; formattedValue: string; index: number; tickKey: string; value: unknown }[] = [];
        if (axisType === "category") {
            const domain = (scale.domain() ?? []) as readonly unknown[];
            for (let i = 0; i < domain.length; i++) {
                const val = domain[i];
                const coord = mapValue(val) + (bandwidth > 0 ? bandwidth / 2 : 0);
                const formattedValue = effectiveFormatter
                    ? effectiveFormatter(val, i)
                    : (registration?.formatter?.()
                        ? registration.formatter()!(val, i)
                        : String(val ?? ""));
                const tickKey = CartesianAxisLabelGeometry.createTickKey(axis, "category", val, i);
                rawTicks.push({
                    coordinate: coord,
                    formattedValue,
                    index: i,
                    tickKey,
                    value: val
                });
            }
        } else {
            const tickCount = registration?.tickCount?.() ?? 5;
            const generated = typeof scale.ticks === "function" ? scale.ticks(tickCount) : [];
            for (let i = 0; i < generated.length; i++) {
                const item = generated[i];
                const val = item !== null && typeof item === "object" && "value" in item ? (item as { value: unknown }).value : item;
                const formatted = item !== null && typeof item === "object" && "formattedValue" in item
                    ? (item as { formattedValue: string }).formattedValue
                    : String(val instanceof Date ? val.toLocaleDateString() : val);
                const formattedValue = effectiveFormatter
                    ? effectiveFormatter(val, i)
                    : (registration?.formatter?.()
                        ? registration.formatter()!(val, i)
                        : formatted);
                const tickKey = CartesianAxisLabelGeometry.createTickKey(axis, axisType, val, i);
                rawTicks.push({
                    coordinate: mapValue(val),
                    formattedValue,
                    index: i,
                    tickKey,
                    value: val
                });
            }
        }

        // 2. Measure unrotated dimensions
        const intermediateTicks: IntermediateTick[] = rawTicks.map(t => {
            const measured = measurements?.get(t.tickKey) ?? CartesianAxisLabelGeometry.estimateLabelDimensions(t.formattedValue);
            let unrotatedWidth = measured.width;
            if (labelMaxWidth !== undefined && labelMaxWidth > 0) {
                unrotatedWidth = Math.min(unrotatedWidth, labelMaxWidth);
            }
            return {
                coordinate: t.coordinate,
                extentAlongAxis: unrotatedWidth,
                formattedValue: t.formattedValue,
                index: t.index,
                labelVisible: labelsEnabled,
                outwardExtent: measured.height,
                tickKey: t.tickKey,
                unrotatedHeight: measured.height,
                unrotatedWidth,
                value: t.value
            };
        });

        // 3. Resolve rotation
        const normRotation = CartesianAxisLabelGeometry.normalizeRotation(userRotation);
        let resolvedRotation = 0;
        if (normRotation === "auto") {
            if (axis === "x" && axisType === "category" && intermediateTicks.length > 1) {
                const maxUnrotatedWidth = intermediateTicks.reduce((max, t) => Math.max(max, t.unrotatedWidth), 12);
                const categoryStep = bandwidth > 0
                    ? bandwidth
                    : Math.abs(intermediateTicks[1].coordinate - intermediateTicks[0].coordinate);
                if (maxUnrotatedWidth > categoryStep - 8) {
                    const proj45 = CartesianAxisLabelGeometry.projectRotatedDimensions(maxUnrotatedWidth, 16, 45);
                    if (proj45.projectedWidth <= categoryStep + 4) {
                        resolvedRotation = 45;
                    } else {
                        resolvedRotation = 90;
                    }
                } else {
                    resolvedRotation = 0;
                }
            } else {
                resolvedRotation = 0;
            }
        } else {
            resolvedRotation = normRotation;
        }

        // 4. Project rotated dimensions
        for (const tick of intermediateTicks) {
            const projected = CartesianAxisLabelGeometry.projectRotatedDimensions(
                tick.unrotatedWidth,
                tick.unrotatedHeight,
                resolvedRotation
            );
            if (axis === "x") {
                tick.extentAlongAxis = projected.projectedWidth;
                tick.outwardExtent = projected.projectedHeight;
            } else {
                tick.extentAlongAxis = projected.projectedHeight;
                tick.outwardExtent = projected.projectedWidth;
            }
        }

        // 5. Category label thinning
        if (labelsEnabled && axisType === "category" && intermediateTicks.length > 0) {
            const maxExtentAlong = intermediateTicks.reduce((max, t) => Math.max(max, t.extentAlongAxis), 12);
            const categoryStep = bandwidth > 0
                ? bandwidth
                : (intermediateTicks.length > 1
                    ? Math.abs(intermediateTicks[1].coordinate - intermediateTicks[0].coordinate)
                    : containerSize);
            const thinningFlags = CartesianAxisLabelGeometry.resolveCategoryLabelThinning({
                categoryCount: intermediateTicks.length,
                categoryStep,
                maxLabelExtentAlongAxis: maxExtentAlong,
                preferredTickCount: registration?.tickCount?.()
            });
            for (let i = 0; i < intermediateTicks.length; i++) {
                intermediateTicks[i].labelVisible = thinningFlags[i] ?? false;
            }
        } else if (!labelsEnabled) {
            for (const tick of intermediateTicks) {
                tick.labelVisible = false;
            }
        }

        // 6. Gutter calculation
        const hasTitle = Boolean(title.trim());
        const titleExtent = hasTitle ? 18 : 0;
        const actualTitlePadding = hasTitle ? titlePadding : 0;
        const actualTickMarks = hasTickMarks ? tickSize : 0;

        const visibleTicks = intermediateTicks.filter(t => t.labelVisible);
        const maxOutwardLabel = visibleTicks.length > 0
            ? visibleTicks.reduce((max, t) => Math.max(max, t.outwardExtent), 0)
            : 0;

        const labelContribution = labelsEnabled && maxOutwardLabel > 0 ? maxOutwardLabel + labelPadding : 0;
        let rawGutter = actualTickMarks + labelContribution + (hasTitle ? titleExtent + actualTitlePadding : 0);

        if (rawGutter > 0) {
            rawGutter += 8; // standard baseline breathing room
        } else {
            rawGutter = axisLine ? 1 : 0;
        }

        const gutter = clamp(Math.round(rawGutter), 0, plotGutterConstraint);

        // 7. Assemble final SceneTicks and AxisScene
        const sceneTicks: ChartAxisSceneTick[] = intermediateTicks.map(t => ({
            coordinate: Math.round(t.coordinate * 100) / 100,
            formattedValue: t.formattedValue,
            index: t.index,
            labelVisible: t.labelVisible,
            tickKey: t.tickKey,
            unrotatedHeight: t.unrotatedHeight,
            unrotatedWidth: t.unrotatedWidth,
            value: t.value
        }));

        const axisScene: ChartAxisScene = {
            axis,
            axisLine,
            gridLines,
            gutter,
            labelMaxWidth,
            labelPadding,
            labelRotation: resolvedRotation,
            labels: labelsEnabled,
            position,
            tickMarks: hasTickMarks,
            ticks: sceneTicks,
            tickSize,
            title,
            titlePadding,
            visible: true
        };

        return {
            axisScene,
            gutter,
            resolvedRotation
        };
    }
}
