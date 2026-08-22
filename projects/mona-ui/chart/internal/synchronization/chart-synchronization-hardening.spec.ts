import { describe, expect, it } from "vitest";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import { ChartSynchronizationScheduler } from "./chart-synchronization-scheduler";
import type {
    ChartSynchronizationCrosshairClearMessage,
    ChartSynchronizationCrosshairMessage,
    ChartSynchronizationMember,
    ChartSynchronizationViewportMessage
} from "./chart-synchronization-types";

function createMember(memberId: string, group: string): ChartSynchronizationMember & {
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
            crosshair: { axes: "auto", clearOnLeave: true, enabled: true, match: "axis-value", mode: "domain", showTooltip: false },
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

const settle = (): Promise<void> =>
    new Promise<void>(resolve => {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
        } else {
            setTimeout(resolve, 0);
        }
    });

describe("Chart Synchronization Hardening (SD2-R05 - SD2-R10)", () => {
    it("assigns groupSessionId and tracks monotonic delivered sequence per recipient", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const member1 = createMember("member-1", "group-1");
        const member2 = createMember("member-2", "group-1");

        const reg1 = coordinator.register(member1, "group-1");
        const reg2 = coordinator.register(member2, "group-1");

        const groupState = coordinator.getGroupForTesting("group-1");
        expect(groupState?.groupSessionId).toBeDefined();

        // Publish sequence 1
        reg1.publishCrosshair({
            axes: [
                {
                    sourceRef: { axis: "x", axisId: "x-1" },
                    sourceType: "linear",
                    value: 10
                }
            ],
            snapped: false,
            transactionId: "t1"
        });

        await settle();

        expect(member2.crosshairs).toHaveLength(1);
        expect(member2.crosshairs[0].sequence).toBe(1);
        expect(member2.crosshairs[0].groupSessionId).toBe(groupState!.groupSessionId);

        // Publish sequence 2
        reg1.publishCrosshair({
            axes: [
                {
                    sourceRef: { axis: "x", axisId: "x-1" },
                    sourceType: "linear",
                    value: 20
                }
            ],
            snapped: false,
            transactionId: "t2"
        });

        await settle();

        expect(member2.crosshairs).toHaveLength(2);
        expect(member2.crosshairs[1].sequence).toBe(2);
        expect(member2.crosshairs[1].groupSessionId).toBe(groupState!.groupSessionId);
        expect(member2.crosshairs[1].sequence).toBeGreaterThan(member2.crosshairs[0].sequence);

        reg1.destroy();
        reg2.destroy();
    });

    it("scheduler coalesces per recipient group and kind", () => {
        const scheduler = new ChartSynchronizationScheduler();
        const delivered: ChartSynchronizationViewportMessage[] = [];

        scheduler.schedule({
            deliver: () => {
                delivered.push({
                    axes: [],
                    group: "g1",
                    kind: "viewport",
                    originMemberId: "m1",
                    phase: "update",
                    sequence: 1,
                    source: "drag",
                    transactionId: "t1"
                });
            },
            group: "g1",
            kind: "viewport",
            originMemberId: "m1",
            recipientMemberId: "m2",
            sequence: 1
        });

        scheduler.schedule({
            deliver: () => {
                delivered.push({
                    axes: [],
                    group: "g1",
                    kind: "viewport",
                    originMemberId: "m1",
                    phase: "update",
                    sequence: 2,
                    source: "drag",
                    transactionId: "t2"
                });
            },
            group: "g1",
            kind: "viewport",
            originMemberId: "m1",
            recipientMemberId: "m2",
            sequence: 2
        });

        scheduler.flushNow();
        expect(delivered).toHaveLength(1);
        expect(delivered[0].sequence).toBe(2);
    });
});
