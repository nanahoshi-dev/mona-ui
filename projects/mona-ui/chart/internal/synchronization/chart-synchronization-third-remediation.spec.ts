import { describe, expect, it } from "vitest";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import { ChartSynchronizationController, type ChartSynchronizationHost } from "./chart-synchronization-controller";
import type {
    ChartSynchronizationCrosshairClearMessage,
    ChartSynchronizationCrosshairMessage,
    ChartSynchronizationMember,
    ChartSynchronizationViewportMessage
} from "./chart-synchronization-types";
import { resolveSynchronizationLocalTarget } from "./chart-synchronization-local-target-resolver";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { normalizeChartSynchronizationOptions } from "./chart-synchronization-options";
import type { InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../viewport/cartesian-axis-coordinate-space";

function linearSnap(
    axisId: string,
    domain: readonly [number, number],
    dimension: "x" | "y" = "x"
): CartesianAxisCoordinateSnapshot {
    const range: readonly [number, number] = [0, 400];
    const scale = CartesianScaleFactory.createExactPositionScale({
        domain: [...domain],
        range: [...range],
        type: "linear"
    });
    return {
        baseDomain: domain,
        baseScale: scale,
        range,
        ref: { axis: dimension, axisId },
        resolvedType: "linear",
        valid: true,
        viewportDomain: domain,
        viewportScale: scale
    };
}

function spaceFrom(...snaps: readonly CartesianAxisCoordinateSnapshot[]): CartesianAxisCoordinateSpace {
    const x = new Map<string, CartesianAxisCoordinateSnapshot>();
    const y = new Map<string, CartesianAxisCoordinateSnapshot>();
    for (const snap of snaps) {
        (snap.ref.axis === "x" ? x : y).set(snap.ref.axisId, snap);
    }
    return new CartesianAxisCoordinateSpace(x, y);
}

function createMember(
    memberId: string,
    group: string
): ChartSynchronizationMember & {
    cleared: ChartSynchronizationCrosshairClearMessage[];
    crosshairs: ChartSynchronizationCrosshairMessage[];
    viewports: ChartSynchronizationViewportMessage[];
} {
    return {
        clearCrosshair(message) {
            this.cleared.push(message);
        },
        cleared: [],
        crosshairs: [],
        getCoordinateSpace: () => null,
        getOptions: () => ({
            axisMappings: [],
            crosshair: {
                axes: "auto",
                clearOnLeave: true,
                enabled: true,
                match: "axis-value",
                mode: "domain",
                showTooltip: false
            },
            group,
            viewport: { axes: "auto", enabled: true, mode: "domain", phase: "continuous" }
        }),
        getViewport: () => null,
        memberId,
        receiveCrosshair(message) {
            this.crosshairs.push(message);
        },
        receiveViewport(message) {
            this.viewports.push(message);
        },
        viewports: []
    };
}

describe("Chart Synchronization Third Remediation (WP0 / SD3-R01 - SD3-R04)", () => {
    describe("SD3-R01: Crosshair update and clear share one logical delivery channel", () => {
        it("suppresses older queued crosshair update when a newer crosshair-clear was delivered", () => {
            const coordinator = new ChartSynchronizationCoordinator();
            const member1 = createMember("member-1", "group-1");
            const member2 = createMember("member-2", "group-1");
            const member3 = createMember("member-3", "group-1");

            const reg1 = coordinator.register(member1, "group-1");
            const reg2 = coordinator.register(member2, "group-1");
            const reg3 = coordinator.register(member3, "group-1");

            // 1. Member 1 publishes crosshair (queued in scheduler with sequence 1)
            reg1.publishCrosshair({
                axes: [{ sourceRef: { axis: "x", axisId: "x-1" }, sourceType: "linear", value: 10 }],
                snapped: false,
                transactionId: "t1"
            });

            // 2. Member 1 clears crosshair (delivered immediately with sequence 2)
            reg1.clearCrosshair();
            expect(member3.cleared.length).toBe(1);
            expect(member3.cleared[0].sequence).toBe(2);

            // 3. Member 3 must have received 0 crosshairs (stale update cancelled/rejected)
            expect(member3.crosshairs).toHaveLength(0);

            reg1.destroy();
            reg2.destroy();
            reg3.destroy();
        });
    });

    describe("SD3-R02: Controlled sync viewport proposal transaction ownership", () => {
        it("accepts matching proposal acknowledgement and invalidates subsequent or mismatched attempts", () => {
            const coordinator = new ChartSynchronizationCoordinator();
            const proposals: InternalCartesianViewportState[] = [];
            const commits: InternalCartesianViewportState[] = [];

            const coordSpace = spaceFrom(linearSnap("x-1", [0, 100], "x"));
            const mockHost: ChartSynchronizationHost = {
                getBaseDomainSignature: () => "x-1:0:100",
                getCoordinateSpace: () => coordSpace,
                getCrosshairSceneContext: () => null,
                getNavigationOptions: () => ({ clampToData: false }),
                getViewport: () => ({ x: new Map(), y: new Map() }),
                isControlled: () => true, // Controlled chart
                onRemoteCrosshairState: () => {},
                onSyncViewportCommit: state => commits.push(state),
                onSyncViewportProposal: state => proposals.push(state)
            };

            const controller = new ChartSynchronizationController(coordinator, mockHost, new Set());
            controller.setOptions(normalizeChartSynchronizationOptions({ group: "g1" }));

            // Simulate incoming proposal from peer
            const peer = createMember("peer-1", "g1");
            const peerReg = coordinator.register(peer, "g1");

            peerReg.publishViewport({
                axes: [
                    {
                        normalizedWindow: [0.2, 0.8],
                        sourceIsPrimary: true,
                        sourceRef: { axis: "x", axisId: "x-1" },
                        sourceType: "linear",
                        window: { axis: "x", axisId: "x-1", kind: "continuous", max: 80, min: 20 }
                    }
                ],
                phase: "end",
                source: "drag"
            });

            // Proposal arrived at controlled chart
            expect(proposals).toHaveLength(1);
            const proposedState = proposals[0];

            // Matching state consumes acknowledgement
            const matched = controller.consumeAcknowledgedInbound(proposedState);
            expect(matched).toBe(true);

            // Exercise the same committed-change callback used by ChartComponent
            // after the controlled parent echoes the proposal. The accepted echo
            // must be consumed without publishing a second sync message.
            controller.onCommittedViewportChange({
                acknowledgedInbound: true,
                changedAxes: [{ axis: "x", axisId: "x-1" }],
                phase: "end",
                source: "sync"
            });
            expect(peer.viewports).toHaveLength(0);

            // Subsequent attempt fails because proposal was consumed
            const retry = controller.consumeAcknowledgedInbound(proposedState);
            expect(retry).toBe(false);

            peerReg.destroy();
            controller.destroy();
        });
    });

    describe("SD3-R03 & SD3-R04: Ordinary candidate vs dense candidate distance comparison and metric awareness", () => {
        it("selects ordinary datum at 80px instead of dense datum at 200px", () => {
            const ordinaryHit: SceneHitTarget = {
                animationKey: "line-1-0",
                datum: {},
                formattedCategory: "100",
                formattedValue: "50",
                index: 0,
                point: { x: 180, y: 100 }, // dx = 80 from anchor (100, 100)
                radius: 16,
                seriesId: "line-1",
                seriesName: "Line 1",
                seriesType: "line",
                visualRadius: 4,
                xAxisId: "x-1",
                xKey: 100,
                xValue: 100,
                yAxisId: "y-1",
                yValue: 50
            };

            const denseHit: SceneHitTarget = {
                animationKey: "dense-1-0",
                datum: {},
                formattedCategory: "300",
                formattedValue: "50",
                index: 0,
                point: { x: 300, y: 100 }, // dx = 200 from anchor (100, 100)
                radius: 16,
                seriesId: "dense-1",
                seriesName: "Dense 1",
                seriesType: "line",
                visualRadius: 0,
                xAxisId: "x-1",
                xKey: 300,
                xValue: 300,
                yAxisId: "y-1",
                yValue: 50
            };

            const mockScene: CartesianXYChartScene = {
                axes: [],
                axisTopology: [],
                axisTopologySignature: "[]",
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                denseInteraction: new Map([
                    [
                        "dense-1",
                        {
                            materializeAt: () => denseHit,
                            queryRange: () => [denseHit],
                            resolveNearest: () => [denseHit],
                            seriesId: "dense-1",
                            xAxisId: "x-1",
                            yAxisId: "y-1"
                        }
                    ]
                ]),
                hasRenderableData: true,
                height: 400,
                hitTargets: [ordinaryHit],
                interactionAxis: "x",
                interactionBuckets: [],
                legendItems: [],
                orientation: "vertical",
                plotRect: { height: 400, width: 600, x: 0, y: 0 },
                primaryXAxisId: "x-1",
                primaryYAxisId: "y-1",
                series: [],
                stackConfiguration: [],
                stackSignature: "",
                width: 600,
                xAxisType: "linear",
                yAxisType: "linear"
            };

            const result = resolveSynchronizationLocalTarget({
                anchor: { x: 100, y: 100 },
                dimension: "x",
                scene: mockScene
            });

            expect(result).not.toBeNull();
            expect(result?.primaryHit?.seriesId).toBe("line-1");
            expect(result?.primaryHit?.point?.x).toBe(180);
        });

        it("respects dimension parameter for Y distance metric", () => {
            const hitA: SceneHitTarget = {
                animationKey: "a-0",
                datum: {},
                index: 0,
                point: { x: 150, y: 105 }, // dx = 50, dy = 5
                radius: 16,
                seriesId: "s-a",
                seriesName: "A",
                seriesType: "line",
                visualRadius: 0,
                xAxisId: "x-1",
                xKey: 10,
                xValue: 10,
                yAxisId: "y-1",
                yValue: 10
            };

            const hitB: SceneHitTarget = {
                animationKey: "b-0",
                datum: {},
                index: 0,
                point: { x: 105, y: 150 }, // dx = 5, dy = 50
                radius: 16,
                seriesId: "s-b",
                seriesName: "B",
                seriesType: "line",
                visualRadius: 0,
                xAxisId: "x-1",
                xKey: 20,
                xValue: 20,
                yAxisId: "y-1",
                yValue: 20
            };

            const mockScene: CartesianXYChartScene = {
                axes: [],
                axisTopology: [],
                axisTopologySignature: "[]",
                cartesianKind: "xy",
                coordinateSystem: "cartesian",
                hasRenderableData: true,
                height: 400,
                hitTargets: [hitA, hitB],
                interactionAxis: "y",
                interactionBuckets: [],
                legendItems: [],
                orientation: "vertical",
                plotRect: { height: 400, width: 600, x: 0, y: 0 },
                primaryXAxisId: "x-1",
                primaryYAxisId: "y-1",
                series: [],
                stackConfiguration: [],
                stackSignature: "",
                width: 600,
                xAxisType: "linear",
                yAxisType: "linear"
            };

            // Query at (100, 100) with dimension = "y" -> Hit A has dy = 5 vs Hit B dy = 50 -> Hit A wins!
            const resY = resolveSynchronizationLocalTarget({
                anchor: { x: 100, y: 100 },
                dimension: "y",
                scene: mockScene
            });
            expect(resY?.primaryHit?.seriesId).toBe("s-a");

            // Query at (100, 100) with dimension = "x" -> Hit B has dx = 5 vs Hit A dx = 50 -> Hit B wins!
            const resX = resolveSynchronizationLocalTarget({
                anchor: { x: 100, y: 100 },
                dimension: "x",
                scene: mockScene
            });
            expect(resX?.primaryHit?.seriesId).toBe("s-b");
        });
    });
});
