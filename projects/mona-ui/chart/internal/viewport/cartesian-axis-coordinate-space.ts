import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ChartViewportAxisRef } from "../../models/chart-viewport.models";
import type {
    ChartContinuousPositionScale,
    ChartPositionScale,
    ResolvedChartCartesianAxisType
} from "../scale/chart-scale";

export interface CartesianAxisCoordinateSnapshot {
    readonly baseDomain: readonly unknown[];
    readonly baseScale: ChartPositionScale<unknown>;
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

export class CartesianAxisCoordinateSpace {
    public readonly x: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>;
    public readonly y: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>;

    public constructor(
        x: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>,
        y: ReadonlyMap<string, CartesianAxisCoordinateSnapshot>
    ) {
        this.x = x;
        this.y = y;
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

            xSnapshots.set(xAxis.axisId, {
                baseDomain,
                baseScale,
                range,
                ref: { axis: "x", axisId: xAxis.axisId },
                resolvedType,
                valid: isValid,
                viewportDomain: baseDomain,
                viewportScale: baseScale
            });
        }

        for (const yAxis of axisResolution.yAxes) {
            const resolvedType = resolvedTypes.y.get(yAxis.axisId)!;
            const baseDomain = baseDomains.y.get(yAxis.axisId)!;
            const range: readonly [number, number] = resolvedType === "category"
                ? [plotRect.y, plotRect.y + plotRect.height]
                : [plotRect.y + plotRect.height, plotRect.y];
            const baseScale = baseScales.getYScale(yAxis.axisId)!;
            const isValid = yAxisValidityById.get(yAxis.axisId)?.valid ?? true;

            ySnapshots.set(yAxis.axisId, {
                baseDomain,
                baseScale,
                range,
                ref: { axis: "y", axisId: yAxis.axisId },
                resolvedType,
                valid: isValid,
                viewportDomain: baseDomain,
                viewportScale: baseScale
            });
        }

        return new CartesianAxisCoordinateSpace(xSnapshots, ySnapshots);
    }

    public get(ref: ChartViewportAxisRef): CartesianAxisCoordinateSnapshot | undefined {
        return ref.axis === "x" ? this.x.get(ref.axisId) : this.y.get(ref.axisId);
    }

    public map(ref: ChartViewportAxisRef, value: unknown): number | undefined {
        const snap = this.get(ref);
        return snap?.viewportScale.map(value as never);
    }

    public mapBase(ref: ChartViewportAxisRef, value: unknown): number | undefined {
        const snap = this.get(ref);
        return snap?.baseScale.map(value as never);
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

    /**
     * Resolves the category at the specified pixel coordinate.
     *
     * Category resolution contract:
     * 1. Exact band containment: If the pixel falls inside [bandStart, bandStart + bandwidth), that category is returned.
     *    For the final category in the domain, the right/bottom edge [bandStart, bandStart + bandwidth] is inclusive.
     * 2. Inner/outer padding gap fallback: If the pixel lies in padding, the category whose band center is nearest
     *    (min abs(pixel - bandCenter)) is returned. Ties break deterministically to the lower viewport index.
     * 3. Category domain keys within a single axis domain are contracted to be unique.
     */
    public resolveCategoryAtPixel(
        ref: ChartViewportAxisRef,
        pixel: number
    ): ResolvedCategoryAtPixel | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType !== "category") return undefined;

        const catDomain = snap.viewportDomain as readonly string[];
        if (catDomain.length === 0) return undefined;

        const catBaseDomain = snap.baseDomain as readonly string[];
        const bandScale = snap.viewportScale as import("../scale/chart-scale").ChartBandPositionScale<string>;
        const bandwidth = bandScale.bandwidth();

        // Pass 1: Actual painted band containment
        for (let i = 0; i < catDomain.length; i++) {
            const key = String(catDomain[i]);
            const bandStart = bandScale.map(key);
            if (bandStart !== undefined) {
                const bStart = Math.min(bandStart, bandStart + bandwidth);
                const bEnd = Math.max(bandStart, bandStart + bandwidth);
                const isLast = i === catDomain.length - 1;
                const insideBand = pixel >= bStart && (isLast ? pixel <= bEnd : pixel < bEnd);
                if (insideBand) {
                    const baseIndex = catBaseDomain.indexOf(key);
                    return {
                        bandCenter: bandStart + bandwidth / 2,
                        bandStart,
                        bandwidth,
                        baseIndex: baseIndex !== -1 ? baseIndex : i,
                        index: i,
                        key,
                        viewportIndex: i
                    };
                }
            }
        }

        // Pass 2: Inner padding / outer padding fallback to nearest band center
        let closestIndex = 0;
        let closestDist = Infinity;
        let closestStart = 0;
        for (let i = 0; i < catDomain.length; i++) {
            const key = String(catDomain[i]);
            const start = bandScale.map(key);
            if (start !== undefined) {
                const center = start + bandwidth / 2;
                const dist = Math.abs(pixel - center);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestIndex = i;
                    closestStart = start;
                }
            }
        }

        const key = String(catDomain[closestIndex]);
        const baseIndex = catBaseDomain.indexOf(key);

        return {
            bandCenter: closestStart + bandwidth / 2,
            bandStart: closestStart,
            bandwidth,
            baseIndex: baseIndex !== -1 ? baseIndex : closestIndex,
            index: closestIndex,
            key,
            viewportIndex: closestIndex
        };
    }

    public getNormalizedBasePosition(ref: ChartViewportAxisRef, value: unknown): number | undefined {
        const snap = this.get(ref);
        if (!snap) return undefined;
        const p = snap.baseScale.map(value as never);
        if (p === undefined || !Number.isFinite(p)) return undefined;
        const [r0, r1] = snap.range;
        if (r1 === r0) return 0;
        return (p - r0) / (r1 - r0);
    }

    public invertNormalizedBasePosition(ref: ChartViewportAxisRef, u: number): unknown | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType === "category") return undefined;
        const [r0, r1] = snap.range;
        const pixel = r0 + u * (r1 - r0);
        return (snap.baseScale as ChartContinuousPositionScale<number | Date>).invert?.(pixel);
    }

    public static containsPlotPoint(point: ChartPoint, plotRect: ChartRect): boolean {
        return (
            point.x >= plotRect.x &&
            point.x <= plotRect.x + plotRect.width &&
            point.y >= plotRect.y &&
            point.y <= plotRect.y + plotRect.height
        );
    }

    public static clampPointToPlot(point: ChartPoint, plotRect: ChartRect): ChartPoint {
        return {
            x: Math.max(plotRect.x, Math.min(plotRect.x + plotRect.width, point.x)),
            y: Math.max(plotRect.y, Math.min(plotRect.y + plotRect.height, point.y))
        };
    }
}
