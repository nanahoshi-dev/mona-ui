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

    public invertBase(ref: ChartViewportAxisRef, pixel: number): unknown | undefined {
        const snap = this.get(ref);
        if (!snap || snap.resolvedType === "category") return undefined;
        return (snap.baseScale as ChartContinuousPositionScale<number | Date>).invert?.(pixel);
    }
}
