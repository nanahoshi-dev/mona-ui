import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import type {
    ChartBandPositionScale,
    ChartContinuousPositionScale,
    ChartPositionScale,
    ResolvedChartCartesianAxisType
} from "../scale/chart-scale";
import {
    createCartesianNormalizedBaseMapper,
    resolveCartesianNormalizedBaseMapper,
    type CartesianNormalizedBaseMapper
} from "./cartesian-normalized-base-mapper";

export interface ResolvedCategoryGeometry {
    readonly bandCenter: number;
    readonly bandEnd: number;
    readonly bandStart: number;
    readonly bandwidth: number;
    readonly baseIndex: number;
    readonly key: string;
    readonly viewportIndex?: number;
    readonly visibleInViewport: boolean;
}

export interface CartesianCategoryGeometryIndex {
    readonly bandwidth: number;
    readonly byKey: ReadonlyMap<string, ResolvedCategoryGeometry>;
    readonly firstCenter: number;
    readonly signedStep: number;
    readonly viewportDomain: readonly string[];
}

export interface CartesianAxisCoordinateSnapshot {
    readonly baseDomain: readonly unknown[];
    readonly baseScale: ChartPositionScale<unknown>;
    readonly categoryIndex?: CartesianCategoryGeometryIndex;
    readonly normalizedBaseMapper?: CartesianNormalizedBaseMapper;
    readonly range: readonly [number, number];
    readonly ref: ChartViewportAxisRef;
    readonly resolvedType: ResolvedChartCartesianAxisType;
    readonly valid: boolean;
    readonly viewportDomain: readonly unknown[];
    readonly viewportScale: ChartPositionScale<unknown>;
}

export interface ResolvedCategoryAtPixel {
    readonly bandCenter: number;
    readonly bandStart: number;
    readonly bandwidth: number;
    readonly baseIndex: number;
    readonly index: number;
    readonly key: string;
    readonly viewportIndex: number;
}

export interface ResolvedCategoryExtent {
    readonly fromBaseIndex: number;
    readonly fromValue: unknown;
    readonly toBaseIndex: number;
    readonly toValue: unknown;
}

export interface ResolvedContinuousCoordinate {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly pixel: number;
    readonly resolvedType:
        | "linear"
        | "log"
        | "symlog"
        | "pow"
        | "sqrt"
        | "time"
        | "utc";
    readonly value: number | Date;
}

const categoryBaseIndexCache = new WeakMap<readonly unknown[], ReadonlyMap<string, number>>();

export function getOrCreateBaseCategoryIndex(baseDomain: readonly unknown[]): ReadonlyMap<string, number> {
    let map = categoryBaseIndexCache.get(baseDomain);
    if (!map) {
        const m = new Map<string, number>();
        for (let i = 0; i < baseDomain.length; i++) {
            m.set(String(baseDomain[i]), i);
        }
        categoryBaseIndexCache.set(baseDomain, m);
        map = m;
    }
    return map;
}

function buildCategoryGeometryIndex(
    baseDomain: readonly unknown[],
    viewportDomain: readonly unknown[],
    baseScale: ChartPositionScale<unknown>,
    viewportScale: ChartPositionScale<unknown>
): CartesianCategoryGeometryIndex {
    const vDomain = (viewportDomain as readonly string[]).map(String);
    const bandScale = viewportScale as ChartBandPositionScale<string>;
    const bandwidth = typeof bandScale.bandwidth === "function" ? bandScale.bandwidth() : 0;
    const byKey = new Map<string, ResolvedCategoryGeometry>();
    const baseIndexMap = getOrCreateBaseCategoryIndex(baseDomain);

    let firstCenter = 0;
    let signedStep = 0;

    if (vDomain.length > 0) {
        const start0 = bandScale.map(vDomain[0]) ?? 0;
        firstCenter = start0 + bandwidth / 2;
        if (vDomain.length > 1) {
            const start1 = bandScale.map(vDomain[1]) ?? start0;
            const center1 = start1 + bandwidth / 2;
            signedStep = center1 - firstCenter;
        }
    }

    for (let i = 0; i < vDomain.length; i++) {
        const key = vDomain[i];
        const bandStart = bandScale.map(key) ?? 0;
        const bandCenter = bandStart + bandwidth / 2;
        const bandEnd = bandStart + bandwidth;
        const baseIndex = baseIndexMap.get(key);

        byKey.set(key, {
            bandCenter,
            bandEnd,
            bandStart,
            bandwidth,
            baseIndex: baseIndex !== undefined ? baseIndex : i,
            key,
            viewportIndex: i,
            visibleInViewport: true
        });
    }

    return {
        bandwidth,
        byKey,
        firstCenter,
        signedStep,
        viewportDomain: vDomain
    };
}

function ensureCategorySnapshotIndex(snapshot: CartesianAxisCoordinateSnapshot): CartesianAxisCoordinateSnapshot {
    if (snapshot.resolvedType !== "category" || snapshot.categoryIndex) {
        return snapshot;
    }
    const categoryIndex = buildCategoryGeometryIndex(
        snapshot.baseDomain,
        snapshot.viewportDomain,
        snapshot.baseScale,
        snapshot.viewportScale
    );
    return {
        ...snapshot,
        categoryIndex
    };
}

function ensureCategoryIndices(
    map: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>
): ReadonlyMap<string, CartesianAxisCoordinateSnapshot> {
    let hasModified = false;
    const result = new Map<string, CartesianAxisCoordinateSnapshot>();
    for (const [id, snap] of map) {
        const enhanced = ensureCategorySnapshotIndex(snap);
        if (enhanced !== snap) {
            hasModified = true;
        }
        result.set(id, enhanced);
    }
    return hasModified ? result : map;
}

export class CartesianAxisCoordinateSpace {
    public readonly x: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>;
    public readonly y: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>;

    public constructor(
        x: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>,
        y: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>
    ) {
        this.x = ensureCategoryIndices(x);
        this.y = ensureCategoryIndices(y);
    }

    public static clampPointToPlot(point: ChartPoint, plotRect: ChartRect): ChartPoint {
        return {
            x: Math.max(plotRect.x, Math.min(plotRect.x + plotRect.width, point.x)),
            y: Math.max(plotRect.y, Math.min(plotRect.y + plotRect.height, point.y))
        };
    }

    public static containsPlotPoint(point: ChartPoint, plotRect: ChartRect): boolean {
        return (
            point.x >= plotRect.x &&
            point.x <= plotRect.x + plotRect.width &&
            point.y >= plotRect.y &&
            point.y <= plotRect.y + plotRect.height
        );
    }

    public static fromBaseAuthority(
        preparation: import("../layout/cartesian-multi-axis-coordinator").CartesianDomainPreparation,
        chrome: import("../layout/cartesian-multi-axis-coordinator").CartesianAxisChromeLayout
    ): CartesianAxisCoordinateSpace {
        const { axisResolution, baseDomains, resolvedTypes, xAxisValidityById, yAxisValidityById } = preparation;
        const { plotRect, baseScales } = chrome;

        const xSnapshots = new Map<string, CartesianAxisCoordinateSnapshot>();
        const ySnapshots = new Map<string, CartesianAxisCoordinateSnapshot>();

        for (const xAxis of axisResolution.xAxes) {
            const resolvedType = resolvedTypes.x.get(xAxis.axisId)!;
            const baseDomain = baseDomains.x.get(xAxis.axisId)!;
            const range: readonly [number, number] = [plotRect.x, plotRect.x + plotRect.width];
            const baseScale = baseScales.getXScale(xAxis.axisId)!;
            const isValid = xAxisValidityById.get(xAxis.axisId)?.valid ?? true;
            const normalizedBaseMapper = createCartesianNormalizedBaseMapper({
                domain: baseDomain,
                exponent: xAxis.exponent,
                logBase: xAxis.logBase,
                symlogConstant: xAxis.symlogConstant,
                type: resolvedType
            });

            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain,
                baseScale,
                normalizedBaseMapper,
                range,
                ref: { axis: "x", axisId: xAxis.axisId },
                resolvedType,
                valid: isValid,
                viewportDomain: baseDomain,
                viewportScale: baseScale
            };
            xSnapshots.set(xAxis.axisId, ensureCategorySnapshotIndex(snap));
        }

        for (const yAxis of axisResolution.yAxes) {
            const resolvedType = resolvedTypes.y.get(yAxis.axisId)!;
            const baseDomain = baseDomains.y.get(yAxis.axisId)!;
            const range: readonly [number, number] = resolvedType === "category"
                ? [plotRect.y, plotRect.y + plotRect.height]
                : [plotRect.y + plotRect.height, plotRect.y];
            const baseScale = baseScales.getYScale(yAxis.axisId)!;
            const isValid = yAxisValidityById.get(yAxis.axisId)?.valid ?? true;
            const normalizedBaseMapper = createCartesianNormalizedBaseMapper({
                domain: baseDomain,
                exponent: yAxis.exponent,
                logBase: yAxis.logBase,
                symlogConstant: yAxis.symlogConstant,
                type: resolvedType
            });

            const snap: CartesianAxisCoordinateSnapshot = {
                baseDomain,
                baseScale,
                normalizedBaseMapper,
                range,
                ref: { axis: "y", axisId: yAxis.axisId },
                resolvedType,
                valid: isValid,
                viewportDomain: baseDomain,
                viewportScale: baseScale
            };
            ySnapshots.set(yAxis.axisId, ensureCategorySnapshotIndex(snap));
        }

        return new CartesianAxisCoordinateSpace(xSnapshots, ySnapshots);
    }

    public get(ref: ChartViewportAxisRef): CartesianAxisCoordinateSnapshot | undefined {
        return ref.axis === "x" ? this.x.get(ref.axisId) : this.y.get(ref.axisId);
    }

    public getNormalizedBasePosition(ref: ChartViewportAxisRef, value: unknown): number | undefined {
        const snap = this.get(ref);
        if (!snap) return undefined;
        return resolveCartesianNormalizedBaseMapper(snap)?.map(value);
    }

    public invert(ref: ChartViewportAxisRef, pixel: number): unknown | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType === "category") return undefined;
        return (snap.viewportScale as ChartContinuousPositionScale<number | Date>).invert?.(pixel);
    }

    public invertBase(ref: ChartViewportAxisRef, pixel: number): unknown | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType === "category") return undefined;
        return (snap.baseScale as ChartContinuousPositionScale<number | Date>).invert?.(pixel);
    }

    public invertNormalizedBasePosition(ref: ChartViewportAxisRef, u: number): unknown | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType === "category") return undefined;
        return resolveCartesianNormalizedBaseMapper(snap)?.invert(u);
    }

    public map(ref: ChartViewportAxisRef, value: unknown): number | undefined {
        const snap = this.get(ref);
        return snap?.viewportScale.map(value as never);
    }

    public mapBase(ref: ChartViewportAxisRef, value: unknown): number | undefined {
        const snap = this.get(ref);
        return snap?.baseScale.map(value as never);
    }

    public mapCategoryBand(
        ref: ChartViewportAxisRef,
        key: unknown,
        space: "viewport" | "base" = "viewport"
    ): { readonly bandEnd: number; readonly bandStart: number; readonly bandwidth: number } | undefined {
        const geom = this.resolveCategoryByKey(ref, key, space);
        if (!geom) {
            return undefined;
        }
        return {
            bandEnd: geom.bandEnd,
            bandStart: geom.bandStart,
            bandwidth: geom.bandwidth
        };
    }

    public mapCategoryCenter(
        ref: ChartViewportAxisRef,
        key: unknown,
        space: "viewport" | "base" = "viewport"
    ): number | undefined {
        return this.resolveCategoryByKey(ref, key, space)?.bandCenter;
    }

    /**
     * Maps a continuous domain value safely to a pixel coordinate.
     * Returns undefined for unknown, invalid, or category axes, or if mapped pixel is non-finite.
     */
    public mapContinuousValue(
        ref: ChartViewportAxisRef,
        value: unknown,
        space: "viewport" | "base" = "viewport"
    ): number | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType === "category" || snap.valid === false) {
            return undefined;
        }

        if (value === undefined || value === null) {
            return undefined;
        }

        if (value instanceof Date) {
            if (Number.isNaN(value.getTime())) {
                return undefined;
            }
        } else if (typeof value === "number") {
            if (!Number.isFinite(value)) {
                return undefined;
            }
        } else {
            return undefined;
        }

        const scale = space === "base" ? snap.baseScale : snap.viewportScale;
        const pixel = scale.map(value as never);
        if (pixel === undefined || !Number.isFinite(pixel)) {
            return undefined;
        }

        return pixel;
    }

    /**
     * Resolves the category at the specified pixel coordinate in O(1) time.
     *
     * Category resolution contract:
     * 1. Invalid axes (valid === false) return undefined.
     * 2. Exact band containment: If the pixel falls inside [bandStart, bandStart + bandwidth), that category is returned.
     *    For the final category in the domain, the right/bottom edge [bandStart, bandStart + bandwidth] is inclusive.
     * 3. Inner/outer padding gap fallback: If the pixel lies in padding, the category whose band center is nearest
     *    (min abs(pixel - bandCenter)) is returned. Ties break deterministically to the lower viewport index.
     * 4. Category domain keys within a single axis domain are contracted to be unique.
     */
    public resolveCategoryAtPixel(
        ref: ChartViewportAxisRef,
        pixel: number
    ): ResolvedCategoryAtPixel | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType !== "category" || snap.valid === false) {
            return undefined;
        }

        const categoryIndex = snap.categoryIndex;
        if (!categoryIndex || categoryIndex.viewportDomain.length === 0) {
            return undefined;
        }

        const vDomain = categoryIndex.viewportDomain;
        const count = vDomain.length;
        const signedStep = categoryIndex.signedStep;
        const firstCenter = categoryIndex.firstCenter;

        let approxIndex = 0;
        if (count > 1 && Math.abs(signedStep) > 1e-9) {
            approxIndex = Math.round((pixel - firstCenter) / signedStep);
        }

        const minIdx = Math.max(0, approxIndex - 1);
        const maxIdx = Math.min(count - 1, approxIndex + 1);

        // Pass 1: Exact band containment in neighboring candidates
        for (let i = minIdx; i <= maxIdx; i++) {
            const key = vDomain[i];
            const geom = categoryIndex.byKey.get(key);
            if (geom) {
                const bStart = Math.min(geom.bandStart, geom.bandEnd);
                const bEnd = Math.max(geom.bandStart, geom.bandEnd);
                const isLast = i === count - 1;
                const insideBand = pixel >= bStart && (isLast ? pixel <= bEnd : pixel < bEnd);
                if (insideBand) {
                    return {
                        bandCenter: geom.bandCenter,
                        bandStart: geom.bandStart,
                        bandwidth: geom.bandwidth,
                        baseIndex: geom.baseIndex,
                        index: i,
                        key: geom.key,
                        viewportIndex: i
                    };
                }
            }
        }

        // Pass 2: Nearest band center among candidate indices (and boundary candidates if pixel is outside range)
        const candidateIndices = new Set<number>();
        for (let i = minIdx; i <= maxIdx; i++) candidateIndices.add(i);
        candidateIndices.add(0);
        candidateIndices.add(count - 1);

        let bestIndex = 0;
        let bestDist = Infinity;
        let bestGeom: ResolvedCategoryGeometry | undefined;

        // Iterate in ascending index order for deterministic lower-index tie breaking
        const sortedIndices = Array.from(candidateIndices).sort((a, b) => a - b);
        for (const i of sortedIndices) {
            const key = vDomain[i];
            const geom = categoryIndex.byKey.get(key);
            if (geom) {
                const dist = Math.abs(pixel - geom.bandCenter);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIndex = i;
                    bestGeom = geom;
                }
            }
        }

        if (!bestGeom) {
            return undefined;
        }

        return {
            bandCenter: bestGeom.bandCenter,
            bandStart: bestGeom.bandStart,
            bandwidth: bestGeom.bandwidth,
            baseIndex: bestGeom.baseIndex,
            index: bestIndex,
            key: bestGeom.key,
            viewportIndex: bestIndex
        };
    }

    /**
     * Resolves category band geometry by category key.
     *
     * Semantic lookup contract:
     * - Invalid axes (valid === false) return undefined.
     * - In 'viewport' space, categories outside the current viewport return undefined.
     * - In 'base' space, geometry is mapped against base scale authority; viewportIndex is undefined if not in viewport.
     */
    public resolveCategoryByKey(
        ref: ChartViewportAxisRef,
        key: unknown,
        space: "viewport" | "base" = "viewport"
    ): ResolvedCategoryGeometry | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType !== "category" || snap.valid === false) {
            return undefined;
        }

        const categoryIndex = snap.categoryIndex;
        if (!categoryIndex) {
            return undefined;
        }

        const keyStr = String(key);
        const geom = categoryIndex.byKey.get(keyStr);

        if (space === "viewport") {
            return geom?.visibleInViewport ? geom : undefined;
        }

        // Base space geometry: resolved lazily
        const baseIndexMap = getOrCreateBaseCategoryIndex(snap.baseDomain);
        const baseIndex = geom ? geom.baseIndex : baseIndexMap.get(keyStr);
        if (baseIndex === undefined) {
            return undefined;
        }

        const baseBandScale = snap.baseScale as ChartBandPositionScale<string>;
        const baseBandwidth = typeof baseBandScale.bandwidth === "function" ? baseBandScale.bandwidth() : 0;
        const baseStart = baseBandScale.map(keyStr);
        if (baseStart === undefined) {
            return undefined;
        }

        return {
            bandCenter: baseStart + baseBandwidth / 2,
            bandEnd: baseStart + baseBandwidth,
            bandStart: baseStart,
            bandwidth: baseBandwidth,
            baseIndex,
            key: keyStr,
            viewportIndex: geom?.visibleInViewport ? geom.viewportIndex : undefined,
            visibleInViewport: geom?.visibleInViewport ?? false
        };
    }

    /**
     * Resolves the category extent intersecting the pixel interval [pixelA, pixelB] in sublinear / O(log C) time.
     * Returns undefined if no category band intersects the interval (e.g. interval entirely within padding gap).
     * Preserves raw base domain values.
     */
    public resolveCategoryExtentAtPixels(
        ref: ChartViewportAxisRef,
        pixelA: number,
        pixelB: number
    ): ResolvedCategoryExtent | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType !== "category" || snap.valid === false) {
            return undefined;
        }

        const categoryIndex = snap.categoryIndex;
        if (!categoryIndex || categoryIndex.viewportDomain.length === 0) {
            return undefined;
        }

        const vDomain = categoryIndex.viewportDomain;
        const count = vDomain.length;
        const byKey = categoryIndex.byKey;
        const minPx = Math.min(pixelA, pixelB);
        const maxPx = Math.max(pixelA, pixelB);

        const geomFirst = byKey.get(vDomain[0]);
        const geomLast = byKey.get(vDomain[count - 1]);
        if (!geomFirst || !geomLast) {
            return undefined;
        }

        const axisMin = Math.min(geomFirst.bandStart, geomLast.bandStart, geomFirst.bandEnd, geomLast.bandEnd);
        const axisMax = Math.max(geomFirst.bandStart, geomLast.bandStart, geomFirst.bandEnd, geomLast.bandEnd);

        if (maxPx < axisMin || minPx > axisMax) {
            return undefined;
        }

        const signedStep = categoryIndex.signedStep;

        const intersects = (idx: number): boolean => {
            if (idx < 0 || idx >= count) return false;
            const geom = byKey.get(vDomain[idx]);
            if (!geom) return false;
            const bStart = Math.min(geom.bandStart, geom.bandEnd);
            const bEnd = Math.max(geom.bandStart, geom.bandEnd);
            return bStart <= maxPx && bEnd >= minPx;
        };

        let firstIdx = -1;
        let lastIdx = -1;

        if (count === 1) {
            if (intersects(0)) {
                firstIdx = 0;
                lastIdx = 0;
            }
        } else {
            const isAscending = signedStep >= 0;

            // Binary search for lowest viewport index (0..count-1) that intersects [minPx, maxPx]
            let low = 0;
            let high = count - 1;
            let foundFirst = -1;

            if (isAscending) {
                while (low <= high) {
                    const mid = (low + high) >> 1;
                    const geom = byKey.get(vDomain[mid]);
                    const bEnd = geom ? Math.max(geom.bandStart, geom.bandEnd) : 0;
                    if (bEnd >= minPx) {
                        foundFirst = mid;
                        high = mid - 1;
                    } else {
                        low = mid + 1;
                    }
                }
            } else {
                while (low <= high) {
                    const mid = (low + high) >> 1;
                    const geom = byKey.get(vDomain[mid]);
                    const bStart = geom ? Math.min(geom.bandStart, geom.bandEnd) : 0;
                    if (bStart <= maxPx) {
                        foundFirst = mid;
                        high = mid - 1;
                    } else {
                        low = mid + 1;
                    }
                }
            }

            if (foundFirst !== -1 && intersects(foundFirst)) {
                firstIdx = foundFirst;
            } else if (foundFirst !== -1 && foundFirst + 1 < count && intersects(foundFirst + 1)) {
                firstIdx = foundFirst + 1;
            }

            // Binary search for highest viewport index (0..count-1) that intersects [minPx, maxPx]
            low = 0;
            high = count - 1;
            let foundLast = -1;

            if (isAscending) {
                while (low <= high) {
                    const mid = (low + high) >> 1;
                    const geom = byKey.get(vDomain[mid]);
                    const bStart = geom ? Math.min(geom.bandStart, geom.bandEnd) : 0;
                    if (bStart <= maxPx) {
                        foundLast = mid;
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                }
            } else {
                while (low <= high) {
                    const mid = (low + high) >> 1;
                    const geom = byKey.get(vDomain[mid]);
                    const bEnd = geom ? Math.max(geom.bandStart, geom.bandEnd) : 0;
                    if (bEnd >= minPx) {
                        foundLast = mid;
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                }
            }

            if (foundLast !== -1 && intersects(foundLast)) {
                lastIdx = foundLast;
            } else if (foundLast !== -1 && foundLast - 1 >= 0 && intersects(foundLast - 1)) {
                lastIdx = foundLast - 1;
            }
        }

        if (firstIdx === -1 || lastIdx === -1 || firstIdx > lastIdx) {
            return undefined;
        }

        const geomA = byKey.get(vDomain[firstIdx]);
        const geomB = byKey.get(vDomain[lastIdx]);
        if (!geomA || !geomB) {
            return undefined;
        }

        const fromBaseIndex = Math.min(geomA.baseIndex, geomB.baseIndex);
        const toBaseIndex = Math.max(geomA.baseIndex, geomB.baseIndex);

        return {
            fromBaseIndex,
            fromValue: snap.baseDomain[fromBaseIndex],
            toBaseIndex,
            toValue: snap.baseDomain[toBaseIndex]
        };
    }

    /**
     * Resolves continuous coordinate values safely at the specified pixel coordinate.
     * Returns undefined for unknown, invalid, or category axes, or if inverted value is non-finite.
     */
    public resolveContinuousAtPixel(
        ref: ChartViewportAxisRef,
        pixel: number,
        space: "viewport" | "base" = "viewport"
    ): ResolvedContinuousCoordinate | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType === "category" || snap.valid === false) {
            return undefined;
        }
        if (!Number.isFinite(pixel)) {
            return undefined;
        }

        const scale = (space === "base" ? snap.baseScale : snap.viewportScale) as ChartContinuousPositionScale<number | Date>;
        if (typeof scale.invert !== "function") {
            return undefined;
        }

        const rawValue = scale.invert(pixel);
        if (rawValue === undefined || rawValue === null) {
            return undefined;
        }

        if (rawValue instanceof Date) {
            if (Number.isNaN(rawValue.getTime())) {
                return undefined;
            }
            return {
                axis: ref.axis,
                axisId: ref.axisId,
                pixel,
                resolvedType: snap.resolvedType,
                value: rawValue
            };
        }

        if (typeof rawValue === "number") {
            if (!Number.isFinite(rawValue)) {
                return undefined;
            }
            return {
                axis: ref.axis,
                axisId: ref.axisId,
                pixel,
                resolvedType: snap.resolvedType,
                value: rawValue
            };
        }

        return undefined;
    }

    public toResolvedAxisInfoMap(): {
        readonly x: ReadonlyMap<string, { readonly baseDomain: readonly unknown[]; readonly resolvedType: ResolvedChartCartesianAxisType }>;
        readonly y: ReadonlyMap<string, { readonly baseDomain: readonly unknown[]; readonly resolvedType: ResolvedChartCartesianAxisType }>;
    } {
        const xMap = new Map<string, { baseDomain: readonly unknown[]; resolvedType: ResolvedChartCartesianAxisType }>();
        const yMap = new Map<string, { baseDomain: readonly unknown[]; resolvedType: ResolvedChartCartesianAxisType }>();

        for (const [id, snap] of this.x) {
            xMap.set(id, { baseDomain: snap.baseDomain, resolvedType: snap.resolvedType });
        }
        for (const [id, snap] of this.y) {
            yMap.set(id, { baseDomain: snap.baseDomain, resolvedType: snap.resolvedType });
        }

        return { x: xMap, y: yMap };
    }
}
