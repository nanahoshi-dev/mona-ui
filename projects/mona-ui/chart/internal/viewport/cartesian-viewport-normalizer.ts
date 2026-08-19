import type {
    ChartCategoryViewportWindow,
    ChartContinuousViewportWindow,
    ChartViewportAxisRef,
    ChartViewportConstraint,
    ChartViewportState,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import { clamp } from "../utils/number-utils";

export interface InternalContinuousViewport {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly kind: "continuous";
    readonly max: number;
    readonly min: number;
}

export interface InternalCategoryViewport {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly endIndexExclusive: number;
    readonly firstVisibleKey?: string;
    readonly kind: "category";
    readonly lastVisibleKey?: string;
    readonly startIndex: number;
}

export type InternalAxisViewport =
    | InternalCategoryViewport
    | InternalContinuousViewport;

export interface InternalCartesianViewportState {
    readonly x: ReadonlyMap<string, InternalAxisViewport>;
    readonly y: ReadonlyMap<string, InternalAxisViewport>;
}

export interface ResolvedAxisInfo {
    readonly baseDomain: readonly unknown[];
    readonly resolvedType: ResolvedChartCartesianAxisType;
}

export interface ResolvedAxisInfoMap {
    readonly x: ReadonlyMap<string, ResolvedAxisInfo>;
    readonly y: ReadonlyMap<string, ResolvedAxisInfo>;
}

export function createEmptyInternalViewportState(): InternalCartesianViewportState {
    return {
        x: new Map<string, InternalAxisViewport>(),
        y: new Map<string, InternalAxisViewport>()
    };
}

export function areAxisViewportsEqual(
    a: InternalAxisViewport | undefined,
    b: InternalAxisViewport | undefined
): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.axis !== b.axis || a.axisId !== b.axisId || a.kind !== b.kind) return false;

    if (a.kind === "continuous" && b.kind === "continuous") {
        return Math.abs(a.min - b.min) < 1e-9 && Math.abs(a.max - b.max) < 1e-9;
    }

    if (a.kind === "category" && b.kind === "category") {
        return a.startIndex === b.startIndex && a.endIndexExclusive === b.endIndexExclusive;
    }

    return false;
}

export function areInternalViewportStatesEqual(
    a: InternalCartesianViewportState | undefined,
    b: InternalCartesianViewportState | undefined
): boolean {
    if (a === b) return true;
    if (!a || !b) return false;

    if (a.x.size !== b.x.size || a.y.size !== b.y.size) return false;

    for (const [id, aView] of a.x) {
        const bView = b.x.get(id);
        if (!areAxisViewportsEqual(aView, bView)) return false;
    }

    for (const [id, aView] of a.y) {
        const bView = b.y.get(id);
        if (!areAxisViewportsEqual(aView, bView)) return false;
    }

    return true;
}

export function areViewportStatesEqual(
    a: ChartViewportState | undefined,
    b: ChartViewportState | undefined
): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.axes.length !== b.axes.length) return false;

    const findMatch = (target: ChartViewportWindow, list: readonly ChartViewportWindow[]) => {
        return list.find(w => w.axis === target.axis && w.axisId === target.axisId);
    };

    for (const wA of a.axes) {
        const wB = findMatch(wA, b.axes);
        if (!wB || wA.kind !== wB.kind) return false;

        if (wA.kind === "continuous" && wB.kind === "continuous") {
            const minA = wA.min instanceof Date ? wA.min.getTime() : Number(wA.min);
            const maxA = wA.max instanceof Date ? wA.max.getTime() : Number(wA.max);
            const minB = wB.min instanceof Date ? wB.min.getTime() : Number(wB.min);
            const maxB = wB.max instanceof Date ? wB.max.getTime() : Number(wB.max);
            if (Math.abs(minA - minB) > 1e-9 || Math.abs(maxA - maxB) > 1e-9) return false;
        } else if (wA.kind === "category" && wB.kind === "category") {
            if (wA.startIndex !== wB.startIndex || wA.endIndexExclusive !== wB.endIndexExclusive) return false;
        }
    }

    return true;
}

export function toPublicViewportState(
    internal: InternalCartesianViewportState,
    resolvedAxes?: ResolvedAxisInfoMap
): ChartViewportState {
    const axes: ChartViewportWindow[] = [];

    // Helper to add windows in canonical order
    const processMap = (map: ReadonlyMap<string, InternalAxisViewport>, axis: "x" | "y") => {
        for (const [axisId, window] of map) {
            const axisInfo = resolvedAxes?.[axis]?.get(axisId);
            if (window.kind === "continuous") {
                const isDate = axisInfo?.resolvedType === "time" || axisInfo?.resolvedType === "utc";
                const min = isDate ? new Date(window.min) : window.min;
                const max = isDate ? new Date(window.max) : window.max;
                axes.push({
                    axis,
                    axisId,
                    kind: "continuous",
                    max,
                    min
                });
            } else if (window.kind === "category") {
                axes.push({
                    axis,
                    axisId,
                    endIndexExclusive: window.endIndexExclusive,
                    kind: "category",
                    startIndex: window.startIndex
                });
            }
        }
    };

    processMap(internal.x, "x");
    processMap(internal.y, "y");

    return { axes };
}

export function normalizeViewportState(
    publicState: ChartViewportState | undefined | null,
    resolvedAxes: ResolvedAxisInfoMap,
    options?: {
        clampToData?: boolean;
        constraints?: readonly ChartViewportConstraint[];
        minVisibleCategories?: number;
        warnedSignatures?: Set<string>;
    }
): InternalCartesianViewportState {
    const xMap = new Map<string, InternalAxisViewport>();
    const yMap = new Map<string, InternalAxisViewport>();
    const warned = options?.warnedSignatures ?? new Set<string>();
    const clampToData = options?.clampToData !== false;
    const defaultMinCat = options?.minVisibleCategories ?? 1;

    if (!publicState || !Array.isArray(publicState.axes) || publicState.axes.length === 0) {
        return { x: xMap, y: yMap };
    }

    const seenAxes = new Set<string>();

    for (const rawWindow of publicState.axes) {
        if (!rawWindow || typeof rawWindow !== "object") continue;
        const axis = rawWindow.axis;
        const axisId = rawWindow.axisId;

        if (axis !== "x" && axis !== "y") {
            ChartDiagnostics.warnOnce(
                warned,
                `Invalid viewport axis "${String(axis)}" on axisId "${String(axisId)}".`,
                `viewport-unknown-axis-${axis}-${axisId}`
            );
            continue;
        }

        const axisKey = `${axis}:${axisId}`;
        if (seenAxes.has(axisKey)) {
            ChartDiagnostics.warnOnce(
                warned,
                `Duplicate viewport window for axis "${axis}" with id "${axisId}". Ignoring duplicate.`,
                `viewport-duplicate-axis-${axis}-${axisId}`
            );
            continue;
        }
        seenAxes.add(axisKey);

        const axisMap = axis === "x" ? resolvedAxes.x : resolvedAxes.y;
        const axisInfo = axisMap.get(axisId);

        if (!axisInfo) {
            ChartDiagnostics.warnOnce(
                warned,
                `Viewport specified for unrecognized axis "${axis}" with id "${axisId}".`,
                `viewport-unknown-axis-${axis}-${axisId}`
            );
            continue;
        }

        const isCategory = axisInfo.resolvedType === "category";
        const constraint = options?.constraints?.find(c => c.axis === axis && c.axisId === axisId);

        if (isCategory) {
            if (rawWindow.kind !== "category") {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Viewport kind "${rawWindow.kind}" does not match category axis "${axisId}".`,
                    `viewport-kind-mismatch-${axis}-${axisId}`
                );
                continue;
            }

            const baseCount = Array.isArray(axisInfo.baseDomain) ? axisInfo.baseDomain.length : 0;
            if (baseCount === 0) continue;

            let startIndex = Math.floor(Number(rawWindow.startIndex));
            let endIndex = Math.ceil(Number(rawWindow.endIndexExclusive));

            if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || startIndex >= endIndex) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Invalid category viewport indices [${startIndex}, ${endIndex}] for axis "${axisId}".`,
                    `viewport-category-index-out-of-range-${axis}-${axisId}`
                );
                continue;
            }

            const minVisible = Math.max(
                1,
                constraint?.minVisibleCategories ?? defaultMinCat
            );
            const maxVisible = Math.min(
                baseCount,
                constraint?.maxVisibleCategories ?? baseCount
            );

            startIndex = clamp(startIndex, 0, baseCount - 1);
            endIndex = clamp(endIndex, startIndex + 1, baseCount);

            let span = endIndex - startIndex;
            if (span < minVisible) {
                span = Math.min(minVisible, baseCount);
                if (startIndex + span > baseCount) {
                    startIndex = Math.max(0, baseCount - span);
                }
                endIndex = startIndex + span;
            } else if (span > maxVisible) {
                span = maxVisible;
                endIndex = startIndex + span;
            }

            if (startIndex === 0 && endIndex === baseCount) {
                // Full domain is canonicalized to no entry
                continue;
            }

            const catDomain = axisInfo.baseDomain as readonly string[];
            const firstVisibleKey = catDomain[startIndex] !== undefined ? String(catDomain[startIndex]) : undefined;
            const lastVisibleKey = catDomain[endIndex - 1] !== undefined ? String(catDomain[endIndex - 1]) : undefined;

            const targetMap = axis === "x" ? xMap : yMap;
            targetMap.set(axisId, {
                axis,
                axisId,
                endIndexExclusive: endIndex,
                firstVisibleKey,
                kind: "category",
                lastVisibleKey,
                startIndex
            });
        } else {
            // Continuous
            if (rawWindow.kind !== "continuous") {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Viewport kind "${rawWindow.kind}" does not match continuous axis "${axisId}".`,
                    `viewport-kind-mismatch-${axis}-${axisId}`
                );
                continue;
            }

            let minVal = rawWindow.min instanceof Date ? rawWindow.min.getTime() : Number(rawWindow.min);
            let maxVal = rawWindow.max instanceof Date ? rawWindow.max.getTime() : Number(rawWindow.max);

            if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || minVal >= maxVal) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Invalid continuous viewport domain [${minVal}, ${maxVal}] for axis "${axisId}".`,
                    `viewport-invalid-domain-${axis}-${axisId}`
                );
                continue;
            }

            // Validate log sign before constraints/clamping
            if (axisInfo.resolvedType === "log" && Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2) {
                const baseMin = Number(axisInfo.baseDomain[0]);
                const baseMax = Number(axisInfo.baseDomain[1]);
                if (baseMin > 0 && (minVal <= 0 || maxVal <= 0)) {
                    ChartDiagnostics.warnOnce(
                        warned,
                        `Viewport [${minVal}, ${maxVal}] crosses zero or is negative on positive log axis "${axisId}".`,
                        `viewport-log-sign-mismatch-${axis}-${axisId}`
                    );
                    continue;
                }
                if (baseMax < 0 && (minVal >= 0 || maxVal >= 0)) {
                    ChartDiagnostics.warnOnce(
                        warned,
                        `Viewport [${minVal}, ${maxVal}] crosses zero or is positive on negative log axis "${axisId}".`,
                        `viewport-log-sign-mismatch-${axis}-${axisId}`
                    );
                    continue;
                }
            }

            // Apply constraints
            if (constraint) {
                if (constraint.minSpan !== undefined && constraint.minSpan > 0 && maxVal - minVal < constraint.minSpan) {
                    const mid = (minVal + maxVal) / 2;
                    minVal = mid - constraint.minSpan / 2;
                    maxVal = mid + constraint.minSpan / 2;
                }
                if (constraint.maxSpan !== undefined && constraint.maxSpan > 0 && maxVal - minVal > constraint.maxSpan) {
                    const mid = (minVal + maxVal) / 2;
                    minVal = mid - constraint.maxSpan / 2;
                    maxVal = mid + constraint.maxSpan / 2;
                }
                if (constraint.maxZoom !== undefined && constraint.maxZoom > 1 && Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2) {
                    const bMin = axisInfo.baseDomain[0] instanceof Date ? axisInfo.baseDomain[0].getTime() : Number(axisInfo.baseDomain[0]);
                    const bMax = axisInfo.baseDomain[1] instanceof Date ? axisInfo.baseDomain[1].getTime() : Number(axisInfo.baseDomain[1]);
                    const baseSpan = bMax - bMin;
                    if (baseSpan > 0) {
                        const minAllowedSpan = baseSpan / constraint.maxZoom;
                        if (maxVal - minVal < minAllowedSpan) {
                            const mid = (minVal + maxVal) / 2;
                            minVal = mid - minAllowedSpan / 2;
                            maxVal = mid + minAllowedSpan / 2;
                        }
                    }
                }
            }

            if (clampToData && Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2) {
                const bMin = axisInfo.baseDomain[0] instanceof Date ? axisInfo.baseDomain[0].getTime() : Number(axisInfo.baseDomain[0]);
                const bMax = axisInfo.baseDomain[1] instanceof Date ? axisInfo.baseDomain[1].getTime() : Number(axisInfo.baseDomain[1]);
                if (Number.isFinite(bMin) && Number.isFinite(bMax)) {
                    const span = maxVal - minVal;
                    const baseSpan = bMax - bMin;
                    if (span >= baseSpan) {
                        minVal = bMin;
                        maxVal = bMax;
                    } else {
                        if (minVal < bMin) {
                            minVal = bMin;
                            maxVal = bMin + span;
                        }
                        if (maxVal > bMax) {
                            maxVal = bMax;
                            minVal = bMax - span;
                        }
                    }
                }
            }

            // Re-validate log sign after constraints/clamping
            if (axisInfo.resolvedType === "log" && Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2) {
                const baseMin = Number(axisInfo.baseDomain[0]);
                const baseMax = Number(axisInfo.baseDomain[1]);
                if (baseMin > 0 && (minVal <= 0 || maxVal <= 0)) {
                    ChartDiagnostics.warnOnce(
                        warned,
                        `Viewport [${minVal}, ${maxVal}] crosses zero or is negative on positive log axis "${axisId}".`,
                        `viewport-log-sign-mismatch-${axis}-${axisId}`
                    );
                    continue;
                }
                if (baseMax < 0 && (minVal >= 0 || maxVal >= 0)) {
                    ChartDiagnostics.warnOnce(
                        warned,
                        `Viewport [${minVal}, ${maxVal}] crosses zero or is positive on negative log axis "${axisId}".`,
                        `viewport-log-sign-mismatch-${axis}-${axisId}`
                    );
                    continue;
                }
            }

            // Full domain check
            if (Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2) {
                const bMin = axisInfo.baseDomain[0] instanceof Date ? axisInfo.baseDomain[0].getTime() : Number(axisInfo.baseDomain[0]);
                const bMax = axisInfo.baseDomain[1] instanceof Date ? axisInfo.baseDomain[1].getTime() : Number(axisInfo.baseDomain[1]);
                if (Math.abs(minVal - bMin) < 1e-9 && Math.abs(maxVal - bMax) < 1e-9) {
                    continue;
                }
            }

            const targetMap = axis === "x" ? xMap : yMap;
            targetMap.set(axisId, {
                axis,
                axisId,
                kind: "continuous",
                max: maxVal,
                min: minVal
            });
        }
    }

    return { x: xMap, y: yMap };
}
