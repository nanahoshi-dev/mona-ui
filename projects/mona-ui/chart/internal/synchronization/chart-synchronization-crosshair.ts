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
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";

export interface CrosshairSceneContext {
    readonly coordinateSpace: CartesianAxisCoordinateSpace;
    readonly primaryXAxisId: string;
    readonly primaryYAxisId: string;
    readonly plotRect: ChartRect;
    readonly xTimeSpanMs?: number;
    readonly axisScenes: readonly ChartAxisScene[];
    readonly resolveNearestPoint?: (pixel: ChartPoint, dimension?: "x" | "y" | "xy", mappedXAxisId?: string, mappedYAxisId?: string) => { readonly point: ChartPoint; readonly xValue?: unknown; readonly yValue?: unknown } | null;
}

function toEpochMs(value: unknown): number | null {
    return resolveCartesianTemporalValue(value)?.epochMs ?? null;
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
        const isPrimary = dimension === "x" ? resolved.axisId === context.primaryXAxisId : resolved.axisId === context.primaryYAxisId;
        values.push({
            normalizedBasePosition: context.coordinateSpace.getNormalizedBasePosition(ref, resolved.value),
            sourceIsPrimary: isPrimary,
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
        if (!crosshairChannelIncludes(options.crosshair.axes, incoming.sourceRef.axis)) {
            continue;
        }
        const isPrimary = incoming.sourceIsPrimary ?? (incoming.sourceRef.axis === "x" ? incoming.sourceRef.axisId === context.primaryXAxisId : incoming.sourceRef.axisId === context.primaryYAxisId);
        const targetRef = ChartSynchronizationAxisMapper.resolveMappedAxisIdentity(
            incoming.sourceRef,
            isPrimary,
            context.coordinateSpace,
            options.axisMappings,
            new Set<string>(),
            { x: context.primaryXAxisId, y: context.primaryYAxisId }
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

    let anchor: ChartPoint = {
        x: resolvedX ? resolvedX.coordinate : context.plotRect.x + context.plotRect.width / 2,
        y: resolvedY ? resolvedY.coordinate : context.plotRect.y + context.plotRect.height / 2
    };
    let snapped = false;

    if (options.crosshair.match === "nearest-point" && context.resolveNearestPoint) {
        const dimension: "x" | "y" | "xy" = resolvedX && resolvedY ? "xy" : (resolvedX ? "x" : "y");
        const nearest = context.resolveNearestPoint(anchor, dimension, resolvedX?.axisId, resolvedY?.axisId);
        if (nearest) {
            anchor = nearest.point;
            snapped = true;
            if (resolvedX && nearest.xValue !== undefined) {
                const snapX = context.coordinateSpace.get({ axis: "x", axisId: resolvedX.axisId });
                if (snapX && snapX.valid) {
                    const nextX = resolveLocalAxisPresentation({ axis: "x", axisId: resolvedX.axisId }, nearest.xValue, snapX.resolvedType, context);
                    if (nextX) resolvedX = nextX;
                }
            }
            if (resolvedY && nearest.yValue !== undefined) {
                const snapY = context.coordinateSpace.get({ axis: "y", axisId: resolvedY.axisId });
                if (snapY && snapY.valid) {
                    const nextY = resolveLocalAxisPresentation({ axis: "y", axisId: resolvedY.axisId }, nearest.yValue, snapY.resolvedType, context);
                    if (nextY) resolvedY = nextY;
                }
            }
        }
    }

    return {
        anchor,
        snapped,
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
