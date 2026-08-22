import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import type { ChartAxisScene } from "../scene/cartesian-scene";
import type {
    ChartCrosshairState,
    ResolvedCrosshairAxisState
} from "../interaction/chart-crosshair-state";
import { formatCartesianAxisSemanticValue } from "../utils/chart-formatter";
import type { NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";
import { ChartSynchronizationAxisMapper } from "./chart-synchronization-axis-mapper";
import type { ChartSynchronizedAxisValue } from "./chart-synchronization-types";

export interface CrosshairSceneContext {
    readonly coordinateSpace: CartesianAxisCoordinateSpace;
    readonly primaryXAxisId: string;
    readonly primaryYAxisId: string;
    readonly plotRect: ChartRect;
    readonly xTimeSpanMs?: number;
    readonly axisScenes: readonly ChartAxisScene[];
}

function toEpochMs(value: unknown): number | null {
    if (value instanceof Date) {
        const t = value.getTime();
        return Number.isNaN(t) ? null : t;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
}

/**
 * Builds semantic crosshair values for publication from a local crosshair state.
 * Values are self-contained: continuous instants/numbers or category keys.
 */
export function buildPublishedCrosshairValues(
    state: ChartCrosshairState,
    context: CrosshairSceneContext
): readonly ChartSynchronizedAxisValue[] {
    const values: ChartSynchronizedAxisValue[] = [];
    const entries: readonly (readonly ["x" | "y", ResolvedCrosshairAxisState | undefined])[] = [["x", state.x], ["y", state.y]];

    for (const [dimension, resolved] of entries) {
        if (!resolved) {
            continue;
        }
        const ref: ChartViewportAxisRef = { axis: dimension, axisId: resolved.axisId };
        const snap = context.coordinateSpace.get(ref);
        if (!snap || !snap.valid) {
            continue;
        }
        values.push({
            normalizedBasePosition: context.coordinateSpace.getNormalizedBasePosition(ref, resolved.value),
            sourceRef: ref,
            sourceType: snap.resolvedType,
            value: resolved.value
        });
    }

    return values;
}

/**
 * Maps an inbound synchronized crosshair message to a local presentation state.
 * Returns null when no mapped axis value is visible inside the current target viewport.
 * Formatting and datum resolution remain fully local to the recipient.
 */
export function mapIncomingCrosshair(
    axes: readonly ChartSynchronizedAxisValue[],
    options: NormalizedChartSynchronizationOptions,
    context: CrosshairSceneContext
): ChartCrosshairState | null {
    let resolvedX: ResolvedCrosshairAxisState | undefined;
    let resolvedY: ResolvedCrosshairAxisState | undefined;

    for (const incoming of axes) {
        const targetRef = ChartSynchronizationAxisMapper.resolveTargetAxisRef(
            incoming.sourceRef,
            context.coordinateSpace,
            options,
            { x: context.primaryXAxisId, y: context.primaryYAxisId },
            new Set<string>()
        );
        if (!targetRef) {
            continue;
        }

        // Respect the recipient's crosshair channel axes selection.
        if (!crosshairChannelIncludes(options.crosshair.axes, targetRef.axis)) {
            continue;
        }

        const snap = context.coordinateSpace.get(targetRef);
        if (!snap || !snap.valid) {
            continue;
        }

        let value: unknown;
        if (options.crosshair.mode === "relative" && incoming.normalizedBasePosition !== undefined) {
            value = context.coordinateSpace.invertNormalizedBasePosition(targetRef, incoming.normalizedBasePosition);
            if (value === undefined) {
                continue;
            }
        } else {
            if (incoming.sourceType === "category" || snap.resolvedType === "category") {
                if (incoming.sourceType !== snap.resolvedType) {
                    continue;
                }
                value = String(incoming.value);
            } else if (incoming.sourceType === "time" || incoming.sourceType === "utc") {
                const epoch = toEpochMs(incoming.value);
                if (epoch === null) {
                    continue;
                }
                value = new Date(epoch);
            } else if (typeof incoming.value === "number" && Number.isFinite(incoming.value)) {
                value = incoming.value;
            } else {
                continue;
            }
        }

        const resolved = resolveLocalAxisPresentation(targetRef, value, snap.resolvedType, context);
        if (!resolved) {
            continue;
        }

        if (targetRef.axis === "x") {
            resolvedX = resolved;
        } else {
            resolvedY = resolved;
        }
    }

    if (!resolvedX && !resolvedY) {
        return null;
    }

    const anchor: ChartPoint = {
        x: resolvedX ? resolvedX.coordinate : context.plotRect.x + context.plotRect.width / 2,
        y: resolvedY ? resolvedY.coordinate : context.plotRect.y + context.plotRect.height / 2
    };

    return {
        anchor,
        snapped: false,
        source: "sync",
        x: resolvedX,
        y: resolvedY
    };
}

function crosshairChannelIncludes(axes: "auto" | "x" | "xy" | "y", dimension: "x" | "y"): boolean {
    return axes === "auto" || axes === "xy" || axes === dimension;
}

function resolveLocalAxisPresentation(
    ref: ChartViewportAxisRef,
    value: unknown,
    resolvedType: ResolvedChartCartesianAxisType,
    context: CrosshairSceneContext
): ResolvedCrosshairAxisState | undefined {
    const coordinateSpace = context.coordinateSpace;

    if (resolvedType === "category") {
        const geometry = coordinateSpace.resolveCategoryByKey(ref, value, "viewport");
        if (!geometry) {
            // Category not visible in the recipient viewport: hide instead of clamping.
            return undefined;
        }
        return {
            axis: ref.axis,
            axisId: ref.axisId,
            coordinate: geometry.bandCenter,
            formattedValue: formatValue(value, findAxisScene(context, ref), context),
            value
        };
    }

    const mapped = coordinateSpace.mapContinuousValue(ref, value, "viewport");
    if (mapped === undefined) {
        return undefined;
    }
    if (!isInsideViewportSpan(mapped, ref.axis, context.plotRect)) {
        return undefined;
    }

    return {
        axis: ref.axis,
        axisId: ref.axisId,
        coordinate: mapped,
        formattedValue: formatValue(value, findAxisScene(context, ref), context),
        value
    };
}

function isInsideViewportSpan(coordinate: number, dimension: "x" | "y", plotRect: ChartRect): boolean {
    if (dimension === "x") {
        return coordinate >= plotRect.x && coordinate <= plotRect.x + plotRect.width;
    }
    return coordinate >= plotRect.y && coordinate <= plotRect.y + plotRect.height;
}

function findAxisScene(context: CrosshairSceneContext, ref: ChartViewportAxisRef): ChartAxisScene | undefined {
    return context.axisScenes.find(a => a.axis === ref.axis && a.axisId === ref.axisId);
}

function formatValue(value: unknown, axisScene: ChartAxisScene | undefined, context: CrosshairSceneContext): string {
    return formatCartesianAxisSemanticValue({
        axisScene,
        index: 0,
        value,
        xTimeSpanMs: context.xTimeSpanMs
    });
}
