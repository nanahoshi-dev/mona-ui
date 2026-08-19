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

    public resolveCategoryAtPixel(
        ref: ChartViewportAxisRef,
        pixel: number
    ): { readonly bandCenter: number; readonly bandStart: number; readonly bandwidth: number; readonly index: number; readonly key: string } | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType !== "category") return undefined;

        const catDomain = snap.viewportDomain as readonly string[];
        if (catDomain.length === 0) return undefined;

        const bandScale = snap.viewportScale as import("../scale/chart-scale").ChartBandPositionScale<string>;
        const bandwidth = bandScale.bandwidth();
        const step = bandScale.step();

        for (let i = 0; i < catDomain.length; i++) {
            const key = String(catDomain[i]);
            const bandStart = bandScale.map(key);
            if (bandStart !== undefined) {
                if (pixel >= bandStart && pixel <= bandStart + (step > 0 ? step : bandwidth)) {
                    return {
                        bandCenter: bandStart + bandwidth / 2,
                        bandStart,
                        bandwidth,
                        index: i,
                        key
                    };
                }
            }
        }

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

        return {
            bandCenter: closestStart + bandwidth / 2,
            bandStart: closestStart,
            bandwidth,
            index: closestIndex,
            key: String(catDomain[closestIndex])
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
}
