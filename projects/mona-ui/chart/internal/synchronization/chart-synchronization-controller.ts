import type {
    ChartViewportAxisRef,
    ChartViewportChangePhase,
    ChartViewportChangeSource,
    ChartViewportWindow
} from "../../models/chart-viewport.models";
import type { CartesianAxisCoordinateSpace } from "../viewport/cartesian-axis-coordinate-space";
import {
    areInternalViewportStatesEqual,
    type InternalCartesianViewportState
} from "../viewport/cartesian-viewport-normalizer";
import { CartesianViewportLinker } from "../viewport/cartesian-viewport-linker";
import { ChartSynchronizationTracker } from "../layout/chart-density-instrumentation";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import type { NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";
import { ChartSynchronizationAxisMapper } from "./chart-synchronization-axis-mapper";
import type {
    ChartSynchronizationAxisWindow,
    ChartSynchronizedAxisValue
} from "./chart-synchronization-types";

export interface ViewportCommitNotification {
    readonly changedAxes: readonly ChartViewportAxisRef[];
    readonly phase: ChartViewportChangePhase;
    readonly source: ChartViewportChangeSource;
    /** True when the commit is the accepted echo of an inbound synchronized proposal. */
    readonly acknowledgedInbound?: boolean;
}

export interface ChartSynchronizationHost {
    getBaseDomainSignature(): string | null;
    getCoordinateSpace(): CartesianAxisCoordinateSpace | null;
    getNavigationOptions(): {
        readonly clampToData?: boolean;
        readonly constraints?: readonly import("../../models/chart-viewport.models").ChartViewportConstraint[];
        readonly linkGroups?: unknown;
        readonly minVisibleCategories?: number;
    };
    getViewport(): InternalCartesianViewportState | null;
    isControlled(): boolean;
    onSyncViewportProposal(state: InternalCartesianViewportState, changedAxes: readonly ChartViewportAxisRef[], phase: ChartViewportChangePhase): void;
    onSyncViewportCommit(state: InternalCartesianViewportState, changedAxes: readonly ChartViewportAxisRef[], phase: ChartViewportChangePhase): void;
}

interface PendingAcknowledgement {
    readonly expectedFingerprint: string;
    readonly transactionId: string;
}

function fingerprintViewport(state: InternalCartesianViewportState): string {
    const parts: string[] = [];
    for (const dimension of ["x", "y"] as const) {
        const map = state[dimension];
        for (const [axisId, window] of map) {
            if (window.kind === "continuous") {
                parts.push(`${dimension}:${axisId}:c:${window.min.toFixed(9)}:${window.max.toFixed(9)}`);
            } else {
                parts.push(`${dimension}:${axisId}:k:${window.startIndex}:${window.endIndexExclusive}`);
            }
        }
    }
    return parts.sort().join("|");
}

let chartMemberCounter = 0;
let viewportTransactionCounter = 0;

export class ChartSynchronizationController {
    readonly #coordinator: ChartSynchronizationCoordinator;
    readonly #host: ChartSynchronizationHost;
    readonly #memberId: string;
    #options: NormalizedChartSynchronizationOptions | null = null;
    #pendingAcknowledgement: PendingAcknowledgement | null = null;
    #registration: import("./chart-synchronization-types").ChartSynchronizationRegistration | null = null;
    #activeViewportTransactionId: string | null = null;
    readonly #warnedSignatures: Set<string>;

    public constructor(
        coordinator: ChartSynchronizationCoordinator,
        host: ChartSynchronizationHost,
        warnedSignatures: Set<string>
    ) {
        this.#coordinator = coordinator;
        this.#host = host;
        this.#warnedSignatures = warnedSignatures;
        this.#memberId = `chart-sync-${++chartMemberCounter}`;
    }

    public get memberId(): string {
        return this.#memberId;
    }

    public setOptions(options: NormalizedChartSynchronizationOptions | null): void {
        const previousGroup = this.#options?.group ?? null;
        this.#options = options;
        if (!options) {
            this.#registration?.destroy();
            this.#registration = null;
            return;
        }
        if (!this.#registration) {
            this.#registration = this.#coordinator.register(this.#createMember(), options.group);
            return;
        }
        this.#registration.updateOptions(options);
        if (previousGroup !== options.group) {
            this.#pendingAcknowledgement = null;
        }
    }

    public destroy(): void {
        this.#registration?.destroy();
        this.#registration = null;
        this.#options = null;
        this.#pendingAcknowledgement = null;
    }

    /**
     * Called by the chart whenever committed viewport authority actually changes.
     * Publishes semantic windows to the synchronization group unless the change
     * is the accepted echo of an inbound synchronized transaction.
     */
    public onCommittedViewportChange(notification: ViewportCommitNotification): void {
        if (!this.#options || !this.#options.viewport.enabled || !this.#registration) {
            return;
        }

        if (
            notification.acknowledgedInbound &&
            this.#pendingAcknowledgement !== null &&
            notification.phase === "end"
        ) {
            this.#pendingAcknowledgement = null;
            return;
        }

        this.publishViewport(
            notification.changedAxes,
            notification.phase === "start" ? "start" : notification.phase,
            notification.source
        );
    }

    public publishViewport(
        changedAxes: readonly ChartViewportAxisRef[],
        phase: ChartViewportChangePhase,
        source: ChartViewportChangeSource
    ): void {
        if (!this.#options || !this.#options.viewport.enabled || !this.#registration) {
            return;
        }
        const coordinateSpace = this.#host.getCoordinateSpace();
        const viewport = this.#host.getViewport();
        if (!coordinateSpace || !viewport) {
            return;
        }

        const axes = buildAxisWindows(changedAxes, viewport, coordinateSpace, this.#host.getBaseDomainSignature());
        if (axes.length === 0) {
            return;
        }

        if (phase === "start" || this.#activeViewportTransactionId === null) {
            this.#activeViewportTransactionId = `vp-${this.#memberId}-${++viewportTransactionCounter}`;
        }
        const transactionId = this.#activeViewportTransactionId;
        if (phase === "end") {
            this.#activeViewportTransactionId = null;
        }

        ChartSynchronizationTracker.current?.onSyncMessagePublished?.("viewport");
        this.#registration.publishViewport({ axes, phase, source, transactionId });
    }

    public clearCrosshair(): void {
        if (this.#options?.crosshair.enabled && this.#registration) {
            this.#registration.clearCrosshair();
        }
    }

    public publishCrosshair(values: readonly ChartSynchronizedAxisValue[], snapped: boolean): void {
        if (!this.#options?.crosshair.enabled || !this.#registration) {
            return;
        }
        ChartSynchronizationTracker.current?.onSyncMessagePublished?.("crosshair");
        this.#registration.publishCrosshair({ axes: values, snapped });
    }

    #createMember(): import("./chart-synchronization-types").ChartSynchronizationMember {
        const controller = this;
        return {
            clearCrosshair(message) {
                controller.#onRemoteCrosshairClear(message.originMemberId);
            },
            getCoordinateSpace: () => this.#host.getCoordinateSpace(),
            getOptions: () => this.#options,
            getViewport: () => this.#host.getViewport(),
            memberId: this.#memberId,
            receiveCrosshair(message) {
                controller.#onRemoteCrosshair(message);
            },
            receiveViewport(message) {
                controller.#receiveViewport(message);
            }
        };
    }

    #receiveViewport(message: import("./chart-synchronization-types").ChartSynchronizationViewportMessage): void {
        const options = this.#options;
        if (!options || !options.viewport.enabled) {
            return;
        }
        const coordinateSpace = this.#host.getCoordinateSpace();
        if (!coordinateSpace) {
            return;
        }

        const primaryX = firstValidAxisId(coordinateSpace, "x") ?? "";
        const primaryY = firstValidAxisId(coordinateSpace, "y") ?? "";

        const navOptions = this.#host.getNavigationOptions();
        const mapperOptions = {
            clampToData: navOptions.clampToData,
            constraints: navOptions.constraints as never,
            minVisibleCategories: navOptions.minVisibleCategories
        };

        const currentViewport = this.#host.getViewport() ?? { x: new Map(), y: new Map() };
        const mapped = ChartSynchronizationAxisMapper.mapIncomingAxes(
            message,
            coordinateSpace,
            options,
            currentViewport,
            { x: primaryX, y: primaryY },
            mapperOptions,
            this.#warnedSignatures
        );

        // Recipient intra-chart link propagation belongs to the same inbound transaction.
        let composed = mapped.viewport;
        let changedAxes = [...mapped.changedAxes];
        if (mapped.changedAxes.length > 0) {
            const linked = CartesianViewportLinker.propagateLinks(
                composed,
                mapped.changedAxes,
                coordinateSpace,
                navOptions.linkGroups as never,
                {
                    ...(mapperOptions as object),
                    excludedAxes: undefined,
                    warnedSignatures: this.#warnedSignatures
                } as never
            );
            composed = linked.viewport;
            for (const axis of linked.changedAxes) {
                if (!changedAxes.some(a => a.axis === axis.axis && a.axisId === axis.axisId)) {
                    changedAxes.push(axis);
                }
            }
        }

        if (changedAxes.length === 0 && areInternalViewportStatesEqual(currentViewport, composed)) {
            return;
        }

        ChartSynchronizationTracker.current?.onRecipientViewportProjection?.();

        if (this.#host.isControlled()) {
            // Inbound synchronization is a proposal only; hidden authority must not mutate.
            this.#pendingAcknowledgement = {
                expectedFingerprint: fingerprintViewport(composed),
                transactionId: message.transactionId
            };
            this.#host.onSyncViewportProposal(composed, changedAxes, message.phase);
            return;
        }

        this.#host.onSyncViewportCommit(composed, changedAxes, message.phase);
    }

    /**
     * Returns true when a controlled input commit matches a pending inbound
     * acknowledgement (accepted echo). The caller must then suppress republishing.
     */
    public consumeAcknowledgedInbound(nextState: InternalCartesianViewportState): boolean {
        const pending = this.#pendingAcknowledgement;
        if (!pending) {
            return false;
        }
        if (fingerprintViewport(nextState) === pending.expectedFingerprint) {
            this.#pendingAcknowledgement = null;
            return true;
        }
        return false;
    }

    public clearPendingAcknowledgement(): void {
        this.#pendingAcknowledgement = null;
    }

    #onRemoteCrosshair(message: import("./chart-synchronization-types").ChartSynchronizationCrosshairMessage): void {
        void message;
        void this.#host;
    }

    #onRemoteCrosshairClear(originMemberId: string): void {
        void originMemberId;
        void this.#host;
    }
}

export function buildAxisWindows(
    changedAxes: readonly ChartViewportAxisRef[],
    viewport: InternalCartesianViewportState,
    coordinateSpace: CartesianAxisCoordinateSpace,
    baseDomainSignature: string | null
): readonly ChartSynchronizationAxisWindow[] {
    const windows: ChartSynchronizationAxisWindow[] = [];
    for (const ref of changedAxes) {
        const snap = coordinateSpace.get(ref);
        if (!snap || !snap.valid) {
            continue;
        }
        const internalWindow = ref.axis === "x" ? viewport.x.get(ref.axisId) : viewport.y.get(ref.axisId);
        windows.push(buildAxisWindow(ref, snap.resolvedType, internalWindow ?? null, snap, baseDomainSignature));
    }
    return windows;
}

export function buildAxisWindow(
    sourceRef: ChartViewportAxisRef,
    resolvedType: import("../scale/chart-scale").ResolvedChartCartesianAxisType,
    internalWindow: import("../viewport/cartesian-viewport-normalizer").InternalAxisViewport | null,
    snap: import("../viewport/cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot | undefined,
    baseDomainSignature: string | null
): ChartSynchronizationAxisWindow {
    if (!internalWindow) {
        return {
            baseDomainSignature: baseDomainSignature ?? undefined,
            sourceRef,
            sourceType: resolvedType,
            window: null
        };
    }

    if (internalWindow.kind === "continuous") {
        const isTemporal = resolvedType === "time" || resolvedType === "utc";
        const window: ChartViewportWindow = {
            axis: sourceRef.axis,
            axisId: sourceRef.axisId,
            kind: "continuous",
            max: isTemporal ? new Date(internalWindow.max) : internalWindow.max,
            min: isTemporal ? new Date(internalWindow.min) : internalWindow.min
        };
        return {
            baseDomainSignature: baseDomainSignature ?? undefined,
            normalizedWindow: computeNormalizedWindow(internalWindow, snap),
            sourceRef,
            sourceType: resolvedType,
            window
        };
    }

    const visibleKeys: string[] = [];
    if (snap && snap.resolvedType === "category") {
        const domain = snap.baseDomain as readonly string[];
        for (let i = internalWindow.startIndex; i < internalWindow.endIndexExclusive && i < domain.length; i++) {
            visibleKeys.push(String(domain[i]));
        }
    }

    const categoryWindow: ChartViewportWindow = {
        axis: sourceRef.axis,
        axisId: sourceRef.axisId,
        endIndexExclusive: internalWindow.endIndexExclusive,
        kind: "category",
        startIndex: internalWindow.startIndex
    };

    return {
        baseDomainSignature: baseDomainSignature ?? undefined,
        normalizedWindow: [
            internalWindow.startIndex / Math.max(1, snap?.baseDomain.length ?? 1),
            internalWindow.endIndexExclusive / Math.max(1, snap?.baseDomain.length ?? 1)
        ],
        sourceRef,
        sourceType: resolvedType,
        visibleCategoryKeys: visibleKeys,
        window: categoryWindow
    };
}

function computeNormalizedWindow(
    window: { kind: "continuous"; max: number; min: number },
    snap: import("../viewport/cartesian-axis-coordinate-space").CartesianAxisCoordinateSnapshot | undefined
): readonly [number, number] | undefined {
    if (!snap) {
        return undefined;
    }
    const pMinVal = snap.resolvedType === "time" || snap.resolvedType === "utc" ? new Date(window.min) : window.min;
    const pMaxVal = snap.resolvedType === "time" || snap.resolvedType === "utc" ? new Date(window.max) : window.max;
    const p0 = snap.baseScale.map(pMinVal as never);
    const p1 = snap.baseScale.map(pMaxVal as never);
    const [r0, r1] = snap.range;
    if (p0 === undefined || p1 === undefined || r1 === r0) {
        return undefined;
    }
    return [(p0 - r0) / (r1 - r0), (p1 - r0) / (r1 - r0)];
}

function firstValidAxisId(coordinateSpace: CartesianAxisCoordinateSpace, axis: "x" | "y"): string | null {
    const map = axis === "x" ? coordinateSpace.x : coordinateSpace.y;
    for (const [id, snap] of map) {
        if (snap.valid) {
            return id;
        }
    }
    return null;
}
