import type { ChartPoint } from "../../models/chart.models";

export interface ResolvedCrosshairAxisState {
    readonly axis: "x" | "y";
    readonly axisId: string;
    readonly coordinate: number;
    readonly formattedValue: string;
    readonly value: unknown;
}

export interface ChartCrosshairState {
    readonly anchor: ChartPoint;
    readonly snapped: boolean;
    readonly source: "keyboard" | "pointer" | "sync";
    readonly x?: ResolvedCrosshairAxisState;
    readonly y?: ResolvedCrosshairAxisState;
}
