import type {
    ChartViewportAxisRef,
    ChartViewportChangePhase,
    ChartViewportChangeSource,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type { ResolvedChartCartesianAxisType } from "../scale/chart-scale";
import type { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import type { InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";
import type { NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";

export type SynchronizationDeliveryChannel = "crosshair" | "viewport";
export type SynchronizationMessageKind = "crosshair" | "crosshair-clear" | "viewport";

export function resolveDeliveryChannel(kind: SynchronizationMessageKind): SynchronizationDeliveryChannel {
    return kind === "viewport" ? "viewport" : "crosshair";
}

export interface ChartSynchronizationEnvelope {
    readonly group: string;
    readonly groupSessionId?: number;
    readonly originMemberId: string;
    readonly sequence: number;
    readonly transactionId: string;
}

export interface ChartSynchronizationAxisWindow {
    readonly baseDomainSignature?: string;
    readonly normalizedWindow?: readonly [number, number];
    readonly sourceIsPrimary?: boolean;
    readonly sourceRef: ChartViewportAxisRef;
    readonly sourceType: ResolvedChartCartesianAxisType;
    readonly visibleCategoryKeys?: readonly string[];
    readonly window: ChartViewportWindow | null;
}

export interface ChartSynchronizationViewportMessage extends ChartSynchronizationEnvelope {
    readonly axes: readonly ChartSynchronizationAxisWindow[];
    readonly kind: "viewport";
    readonly phase: ChartViewportChangePhase;
    readonly source: ChartViewportChangeSource;
}

export interface ChartSynchronizedAxisValue {
    readonly normalizedBasePosition?: number;
    readonly sourceIsPrimary?: boolean;
    readonly sourceRef: ChartViewportAxisRef;
    readonly sourceType: ResolvedChartCartesianAxisType;
    readonly value: unknown;
}

export interface ChartSynchronizationCrosshairMessage extends ChartSynchronizationEnvelope {
    readonly axes: readonly ChartSynchronizedAxisValue[];
    readonly kind: "crosshair";
    readonly snapped: boolean;
}

export interface ChartSynchronizationCrosshairClearMessage extends ChartSynchronizationEnvelope {
    readonly kind: "crosshair-clear";
}

export interface ChartSynchronizationPublishViewportPayload {
    readonly axes: readonly ChartSynchronizationAxisWindow[];
    readonly phase: ChartViewportChangePhase;
    readonly source: ChartViewportChangeSource;
    readonly transactionId?: string;
}

export interface ChartSynchronizationPublishCrosshairPayload {
    readonly axes: readonly ChartSynchronizedAxisValue[];
    readonly snapped: boolean;
    readonly transactionId?: string;
}

export interface ChartSynchronizationMember {
    clearCrosshair(message: ChartSynchronizationCrosshairClearMessage): void;
    getCoordinateSpace(): CartesianAxisCoordinateSpace | null;
    getOptions(): NormalizedChartSynchronizationOptions | null;
    getViewport(): InternalCartesianViewportState | null;
    readonly memberId: string;
    receiveCrosshair(message: ChartSynchronizationCrosshairMessage): void;
    receiveViewport(message: ChartSynchronizationViewportMessage): void;
}

export interface ChartSynchronizationRegistration {
    clearCrosshair(): void;
    destroy(): void;
    readonly memberId: string;
    publishCrosshair(payload: ChartSynchronizationPublishCrosshairPayload): void;
    publishViewport(payload: ChartSynchronizationPublishViewportPayload): void;
    updateOptions(options: NormalizedChartSynchronizationOptions | null): void;
}

export interface SynchronizationGroupState {
    activeCrosshairOrigin: string | null;
    readonly groupSessionId: number;
    readonly members: Map<string, ChartSynchronizationMember>;
    sequence: number;
}
