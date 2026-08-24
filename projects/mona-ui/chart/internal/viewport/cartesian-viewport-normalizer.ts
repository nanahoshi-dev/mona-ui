import type {
    
    
    ChartViewportAxisRef,
    ChartViewportConstraint,
    ChartViewportState,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import { ChartDiagnostics } from "../utils/chart-diagnostics";
import type { CartesianAxisCoordinateSnapshot } from "./cartesian-axis-coordinate-space";
import { resolveCartesianNormalizedBaseMapper } from "./cartesian-normalized-base-mapper";

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
        return continuousViewportNumbersEqual(a.min, b.min) && continuousViewportNumbersEqual(a.max, b.max);
    }

    if (a.kind === "category" && b.kind === "category") {
        return a.startIndex === b.startIndex && a.endIndexExclusive === b.endIndexExclusive;
    }

    return false;
}

/**
 * Internal continuous viewport endpoints are canonical finite numbers. State
 * identity must not depend on the semantic magnitude of an endpoint: every
 * distinct representable number is a distinct viewport state.
 */
export function continuousViewportNumbersEqual(a: number, b: number): boolean {
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return false;
    }
    return canonicalViewportNumber(a) === canonicalViewportNumber(b);
}

/**
 * Determines whether a continuous window is the actual base extent. When a
 * coordinate snapshot is available, compare in its retained normalized
 * transform space so nonlinear and temporal domains do not need semantic-unit
 * tolerances. Resolved axis metadata without a scale falls back to exact
 * canonical endpoint identity. The normalized comparison is intentionally
 * separate from semantic viewport state identity.
 */
export function isFullContinuousViewport(
    min: number,
    max: number,
    axisInfo: ResolvedAxisInfo | CartesianAxisCoordinateSnapshot
): boolean {
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Array.isArray(axisInfo.baseDomain) || axisInfo.baseDomain.length < 2) {
        return false;
    }

    if ("baseScale" in axisInfo) {
        const mapper = resolveCartesianNormalizedBaseMapper(axisInfo);
        if (mapper) {
            const isTemporal = axisInfo.resolvedType === "time" || axisInfo.resolvedType === "utc";
            const normalizedMin = mapper.map(isTemporal ? new Date(min) : min);
            const normalizedMax = mapper.map(isTemporal ? new Date(max) : max);
            if (normalizedMin !== undefined && normalizedMax !== undefined) {
                return normalizedEndpointEquals(normalizedMin, 0) && normalizedEndpointEquals(normalizedMax, 1);
            }
        }
    }

    const baseMin =
        axisInfo.baseDomain[0] instanceof Date ? axisInfo.baseDomain[0].getTime() : Number(axisInfo.baseDomain[0]);
    const baseMax =
        axisInfo.baseDomain[1] instanceof Date ? axisInfo.baseDomain[1].getTime() : Number(axisInfo.baseDomain[1]);
    return continuousViewportNumbersEqual(min, baseMin) && continuousViewportNumbersEqual(max, baseMax);
}

function canonicalViewportNumber(value: number): number {
    return Object.is(value, -0) ? 0 : value;
}

function normalizedEndpointEquals(value: number, endpoint: 0 | 1): boolean {
    return Number.isFinite(value) && canonicalViewportNumber(value) === endpoint;
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

export interface InternalViewportDiff {
    readonly changed: boolean;
    readonly changedAxes: readonly ChartViewportAxisRef[];
}

export function diffInternalViewportStates(
    previous: InternalCartesianViewportState | undefined,
    next: InternalCartesianViewportState | undefined
): InternalViewportDiff {
    if (previous === next) {
        return { changed: false, changedAxes: [] };
    }
    if (!previous && !next) {
        return { changed: false, changedAxes: [] };
    }
    if (!previous) {
        const changedAxes: ChartViewportAxisRef[] = [];
        if (next) {
            for (const id of next.x.keys()) changedAxes.push({ axis: "x", axisId: id });
            for (const id of next.y.keys()) changedAxes.push({ axis: "y", axisId: id });
        }
        return { changed: changedAxes.length > 0, changedAxes };
    }
    if (!next) {
        const changedAxes: ChartViewportAxisRef[] = [];
        for (const id of previous.x.keys()) changedAxes.push({ axis: "x", axisId: id });
        for (const id of previous.y.keys()) changedAxes.push({ axis: "y", axisId: id });
        return { changed: changedAxes.length > 0, changedAxes };
    }

    const changedAxes: ChartViewportAxisRef[] = [];
    const allXKeys = new Set([...previous.x.keys(), ...next.x.keys()]);
    for (const id of allXKeys) {
        const prevW = previous.x.get(id);
        const nextW = next.x.get(id);
        if (!areAxisViewportsEqual(prevW, nextW)) {
            changedAxes.push({ axis: "x", axisId: id });
        }
    }

    const allYKeys = new Set([...previous.y.keys(), ...next.y.keys()]);
    for (const id of allYKeys) {
        const prevW = previous.y.get(id);
        const nextW = next.y.get(id);
        if (!areAxisViewportsEqual(prevW, nextW)) {
            changedAxes.push({ axis: "y", axisId: id });
        }
    }

    return {
        changed: changedAxes.length > 0,
        changedAxes
    };
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
            if (!continuousViewportNumbersEqual(minA, minB) || !continuousViewportNumbersEqual(maxA, maxB)) return false;
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

import { CartesianViewportConstraints } from "./cartesian-viewport-constraints";

export function normalizeAxisWindow(
    rawWindow: ChartViewportWindow,
    axisInfo: ResolvedAxisInfo | CartesianAxisCoordinateSnapshot,
    constraint?: ChartViewportConstraint,
    options?: {
        clampToData?: boolean;
        minVisibleCategories?: number;
        warnedSignatures?: Set<string>;
    }
): InternalAxisViewport | undefined {
    const axis = rawWindow.axis;
    const axisId = rawWindow.axisId;
    const isCategory = axisInfo.resolvedType === "category";
    const warned = options?.warnedSignatures ?? new Set<string>();
    const clampToData = options?.clampToData !== false;
    const defaultMinCat = options?.minVisibleCategories ?? 1;

    // Validate constraint applicability and bounds
    if (constraint) {
        if (isCategory) {
            if (constraint.minSpan !== undefined || constraint.maxSpan !== undefined || constraint.maxZoom !== undefined) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Continuous constraint options (minSpan, maxSpan, maxZoom) ignored for category axis "${axisId}".`,
                    `viewport-constraint-type-mismatch-${axis}-${axisId}`
                );
            }
            if (
                constraint.minVisibleCategories !== undefined &&
                constraint.maxVisibleCategories !== undefined &&
                constraint.minVisibleCategories > constraint.maxVisibleCategories
            ) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Constraint minVisibleCategories (${constraint.minVisibleCategories}) exceeds maxVisibleCategories (${constraint.maxVisibleCategories}) for axis "${axisId}".`,
                    `viewport-constraint-invalid-bounds-${axis}-${axisId}`
                );
            }
        } else {
            if (constraint.minVisibleCategories !== undefined || constraint.maxVisibleCategories !== undefined) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Category constraint options (minVisibleCategories, maxVisibleCategories) ignored for continuous axis "${axisId}".`,
                    `viewport-constraint-type-mismatch-${axis}-${axisId}`
                );
            }
            if (
                constraint.minSpan !== undefined &&
                constraint.maxSpan !== undefined &&
                constraint.minSpan > constraint.maxSpan
            ) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Constraint minSpan (${constraint.minSpan}) exceeds maxSpan (${constraint.maxSpan}) for axis "${axisId}".`,
                    `viewport-constraint-invalid-bounds-${axis}-${axisId}`
                );
            }
        }
    }

    if (isCategory) {
        if (rawWindow.kind !== "category") {
            ChartDiagnostics.warnOnce(
                warned,
                `Viewport kind "${rawWindow.kind}" does not match category axis "${axisId}".`,
                `viewport-kind-mismatch-${axis}-${axisId}`
            );
            return undefined;
        }

        const baseCount = Array.isArray(axisInfo.baseDomain) ? axisInfo.baseDomain.length : 0;
        if (baseCount === 0) return undefined;

        const rawStart = Number(rawWindow.startIndex);
        const rawEnd = Number(rawWindow.endIndexExclusive);

        if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd) || rawStart >= rawEnd) {
            ChartDiagnostics.warnOnce(
                warned,
                `Invalid category viewport indices [${rawStart}, ${rawEnd}] for axis "${axisId}".`,
                `viewport-category-index-out-of-range-${axis}-${axisId}`
            );
            return undefined;
        }

        const [startIndex, endIndex] = CartesianViewportConstraints.applyCategoryConstraints(
            rawStart,
            rawEnd,
            baseCount,
            constraint,
            defaultMinCat,
            clampToData
        );

        if (startIndex === 0 && endIndex === baseCount) {
            // Full domain is canonicalized to no entry
            return undefined;
        }

        const catDomain = axisInfo.baseDomain as readonly string[];
        const firstVisibleKey = catDomain[startIndex] !== undefined ? String(catDomain[startIndex]) : undefined;
        const lastVisibleKey = catDomain[endIndex - 1] !== undefined ? String(catDomain[endIndex - 1]) : undefined;

        return {
            axis,
            axisId,
            endIndexExclusive: endIndex,
            firstVisibleKey,
            kind: "category",
            lastVisibleKey,
            startIndex
        };
    } else {
        // Continuous
        if (rawWindow.kind !== "continuous") {
            ChartDiagnostics.warnOnce(
                warned,
                `Viewport kind "${rawWindow.kind}" does not match continuous axis "${axisId}".`,
                `viewport-kind-mismatch-${axis}-${axisId}`
            );
            return undefined;
        }

        let minVal = rawWindow.min instanceof Date ? rawWindow.min.getTime() : Number(rawWindow.min);
        let maxVal = rawWindow.max instanceof Date ? rawWindow.max.getTime() : Number(rawWindow.max);

        if (!Number.isFinite(minVal) || !Number.isFinite(maxVal) || minVal >= maxVal) {
            ChartDiagnostics.warnOnce(
                warned,
                `Invalid continuous viewport domain [${minVal}, ${maxVal}] for axis "${axisId}".`,
                `viewport-invalid-domain-${axis}-${axisId}`
            );
            return undefined;
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
                return undefined;
            }
            if (baseMax < 0 && (minVal >= 0 || maxVal >= 0)) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Viewport [${minVal}, ${maxVal}] crosses zero or is positive on negative log axis "${axisId}".`,
                    `viewport-log-sign-mismatch-${axis}-${axisId}`
                );
                return undefined;
            }
        }

        const baseMin = Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2
            ? (axisInfo.baseDomain[0] instanceof Date ? axisInfo.baseDomain[0].getTime() : Number(axisInfo.baseDomain[0]))
            : minVal;
        const baseMax = Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2
            ? (axisInfo.baseDomain[1] instanceof Date ? axisInfo.baseDomain[1].getTime() : Number(axisInfo.baseDomain[1]))
            : maxVal;

        const baseScale = "baseScale" in axisInfo ? axisInfo.baseScale : undefined;

        const [cMin, cMax] = CartesianViewportConstraints.applyContinuousConstraints(
            minVal,
            maxVal,
            baseMin,
            baseMax,
            constraint,
            clampToData,
            baseScale,
            axisInfo.resolvedType
        );

        minVal = cMin;
        maxVal = cMax;

        // Re-validate log sign after constraints/clamping
        if (axisInfo.resolvedType === "log" && Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2) {
            const bMin = Number(axisInfo.baseDomain[0]);
            const bMax = Number(axisInfo.baseDomain[1]);
            if (bMin > 0 && (minVal <= 0 || maxVal <= 0)) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Viewport [${minVal}, ${maxVal}] crosses zero or is negative on positive log axis "${axisId}".`,
                    `viewport-log-sign-mismatch-${axis}-${axisId}`
                );
                return undefined;
            }
            if (bMax < 0 && (minVal >= 0 || maxVal >= 0)) {
                ChartDiagnostics.warnOnce(
                    warned,
                    `Viewport [${minVal}, ${maxVal}] crosses zero or is positive on negative log axis "${axisId}".`,
                    `viewport-log-sign-mismatch-${axis}-${axisId}`
                );
                return undefined;
            }
        }

        // Full domain check
        if (Array.isArray(axisInfo.baseDomain) && axisInfo.baseDomain.length >= 2) {
            if (isFullContinuousViewport(minVal, maxVal, axisInfo)) {
                return undefined;
            }
        }

        return {
            axis,
            axisId,
            kind: "continuous",
            max: maxVal,
            min: minVal
        };
    }
}

import type { CartesianAxisCoordinateSpace } from "./cartesian-axis-coordinate-space";

export function normalizeViewportState(
    publicState: ChartViewportState | undefined | null,
    resolvedAxes: ResolvedAxisInfoMap | CartesianAxisCoordinateSpace,
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

    if (!publicState || !Array.isArray(publicState.axes) || publicState.axes.length === 0) {
        return { x: xMap, y: yMap };
    }

    const isCoordinateSpace = "get" in resolvedAxes && typeof resolvedAxes.get === "function";
    const resolvedMap: ResolvedAxisInfoMap =
        isCoordinateSpace && typeof (resolvedAxes as CartesianAxisCoordinateSpace).toResolvedAxisInfoMap === "function"
            ? (resolvedAxes as CartesianAxisCoordinateSpace).toResolvedAxisInfoMap()
            : (resolvedAxes as ResolvedAxisInfoMap);

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

        const axisInfo: ResolvedAxisInfo | CartesianAxisCoordinateSnapshot | undefined = isCoordinateSpace
            ? (resolvedAxes as CartesianAxisCoordinateSpace).get({ axis, axisId })
            : (axis === "x" ? resolvedMap.x : resolvedMap.y).get(axisId);

        if (!axisInfo || ("valid" in axisInfo && axisInfo.valid === false)) {
            ChartDiagnostics.warnOnce(
                warned,
                `Viewport specified for unrecognized axis "${axis}" with id "${axisId}".`,
                `viewport-unknown-axis-${axis}-${axisId}`
            );
            continue;
        }

        const constraint = options?.constraints?.find(c => c.axis === axis && c.axisId === axisId);
        const normalized = normalizeAxisWindow(rawWindow, axisInfo, constraint, options);

        if (normalized) {
            const targetMap = axis === "x" ? xMap : yMap;
            targetMap.set(axisId, normalized);
        }
    }

    return { x: xMap, y: yMap };
}
