import { describe, expect, it, vi } from "vitest";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import { ChartSynchronizationTracker } from "../layout/chart-density-instrumentation";
import type {
    ChartSynchronizationCrosshairClearMessage,
    ChartSynchronizationCrosshairMessage,
    ChartSynchronizationMember,
    ChartSynchronizationViewportMessage
} from "./chart-synchronization-types";
import type { NormalizedChartSynchronizationOptions } from "./chart-synchronization-options";

function createMember(memberId: string, group: string): ChartSynchronizationMember & {
    cleared: ChartSynchronizationCrosshairClearMessage[];
    crosshairs: ChartSynchronizationCrosshairMessage[];
    viewports: ChartSynchronizationViewportMessage[];
} {
    return {
        cleared: [],
        crosshairs: [],
        getCoordinateSpace: () => null,
        getOptions: () => ({ crosshair: { axes: "auto", clearOnLeave: true, enabled: true, match: "axis-value", mode: "domain", showTooltip: false }, group, viewport: { axes: "auto", enabled: true, mode: "domain", phase: "continuous" } }),
        getViewport: () => null,
        memberId,
        receiveCrosshair(message) {
            this.crosshairs.push(message);
        },
        receiveViewport(message) {
            this.viewports.push(message);
        },
        clearCrosshair(message) {
            this.cleared.push(message);
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

const baseOptions = (group: string): NormalizedChartSynchronizationOptions => ({
    crosshair: { axes: "auto", clearOnLeave: true, enabled: true, match: "axis-value", mode: "domain", showTooltip: false },
    group,
    viewport: { axes: "auto", enabled: true, mode: "domain", phase: "continuous" }
});

describe("ChartSynchronizationCoordinator", () => {
    it("creates a group on first member and deletes it after the last member leaves", () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const member = createMember("m1", "g1");
        const registration = coordinator.register(member, baseOptions("g1").group);
        expect(coordinator.groupCount).toBe(1);
        expect(coordinator.getGroupForTesting("g1")?.members.has("m1")).toBe(true);

        registration.destroy();
        expect(coordinator.groupCount).toBe(0);
        expect(coordinator.getGroupForTesting("g1")).toBeUndefined();
    });

    it("does not deliver messages when only one member exists", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const member = createMember("m1", "g1");
        const registration = coordinator.register(member, "g1");
        registration.publishViewport({ axes: [], phase: "update", source: "wheel" });
        await settle();
        expect(member.viewports).toHaveLength(0);
        registration.destroy();
    });

    it("delivers viewport updates to other members with envelope metadata", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const b = createMember("b", "g1");
        const regA = coordinator.register(a, "g1");
        coordinator.register(b, "g1");

        regA.publishViewport({ axes: [], phase: "update", source: "wheel", transactionId: "tx-1" });
        await settle();

        expect(a.viewports).toHaveLength(0);
        expect(b.viewports).toHaveLength(1);
        const message = b.viewports[0];
        expect(message.group).toBe("g1");
        expect(message.originMemberId).toBe("a");
        expect(message.transactionId).toBe("tx-1");
        expect(message.sequence).toBeGreaterThan(0);
        regA.destroy();
    });

    it("coalesces multiple updates in the same frame to latest-wins per member", async () => {
        const instrumentation = ChartSynchronizationTracker.install();
        try {
            const coordinator = new ChartSynchronizationCoordinator();
            const a = createMember("a", "g1");
            const b = createMember("b", "g1");
            const regA = coordinator.register(a, "g1");
            coordinator.register(b, "g1");

            regA.publishViewport({ axes: [], phase: "update", source: "wheel" });
            regA.publishViewport({ axes: [], phase: "update", source: "wheel" });
            regA.publishViewport({ axes: [], phase: "update", source: "wheel" });

            expect(b.viewports).toHaveLength(0);
            await settle();

            expect(b.viewports).toHaveLength(1);
            expect(instrumentation.snapshot.syncMessagesCoalesced).toBeGreaterThanOrEqual(2);
            regA.destroy();
        } finally {
            ChartSynchronizationTracker.uninstall();
        }
    });

    it("delivers end phase synchronously and flushes pending updates", () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const b = createMember("b", "g1");
        const regA = coordinator.register(a, "g1");
        coordinator.register(b, "g1");

        regA.publishViewport({ axes: [], phase: "update", source: "wheel" });
        regA.publishViewport({ axes: [], phase: "end", source: "wheel" });

        expect(b.viewports).toHaveLength(1);
        expect(b.viewports[0].phase).toBe("end");
        regA.destroy();
    });

    it("moves a member between groups on group change and cleans up the old group", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const b = createMember("b", "g2");
        const regA = coordinator.register(a, "g1");
        const regB = coordinator.register(b, "g2");
        expect(coordinator.groupCount).toBe(2);

        regA.updateOptions(baseOptions("g2"));
        expect(coordinator.groupCount).toBe(1);
        expect(coordinator.getGroupForTesting("g1")).toBeUndefined();

        regA.publishViewport({ axes: [], phase: "update", source: "wheel" });
        await settle();
        expect(b.viewports).toHaveLength(1);
        expect(a.viewports).toHaveLength(0);
        regA.destroy();
        regB.destroy();
    });

    it("unregisters synchronously on destroy and skips pending deliveries", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const b = createMember("b", "g1");
        const regA = coordinator.register(a, "g1");
        const regB = coordinator.register(b, "g1");

        regA.publishViewport({ axes: [], phase: "update", source: "wheel" });
        regB.destroy();
        await settle();

        expect(b.viewports).toHaveLength(0);
        expect(coordinator.getGroupForTesting("g1")?.members.size).toBe(1);
        regA.destroy();
        expect(coordinator.groupCount).toBe(0);
    });

    it("tracks active crosshair origin and ignores stale clears from older origins", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const b = createMember("b", "g1");
        const c = createMember("c", "g1");
        const regA = coordinator.register(a, "g1");
        const regB = coordinator.register(b, "g1");
        const regC = coordinator.register(c, "g1");

        regA.publishCrosshair({ axes: [], snapped: true });
        await settle();
        expect(c.crosshairs).toHaveLength(1);

        regB.publishCrosshair({ axes: [], snapped: true });
        await settle();
        expect(c.crosshairs).toHaveLength(2);

        regA.clearCrosshair();
        expect(c.cleared).toHaveLength(0);

        regB.clearCrosshair();
        expect(c.cleared).toHaveLength(1);
        expect(coordinator.getGroupForTesting("g1")?.activeCrosshairOrigin).toBeNull();
        regA.destroy();
        regB.destroy();
        regC.destroy();
    });

    it("clears active crosshair origin when the origin member is destroyed", () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const b = createMember("b", "g1");
        const regA = coordinator.register(a, "g1");
        coordinator.register(b, "g1");
        regA.publishCrosshair({ axes: [], snapped: true });
        expect(coordinator.getGroupForTesting("g1")?.activeCrosshairOrigin).toBe("a");

        regA.destroy();
        expect(coordinator.getGroupForTesting("g1")?.activeCrosshairOrigin).toBeNull();
    });

    it("never calls a member after it moved to a different group before flush", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const b = createMember("b", "g1");
        const regA = coordinator.register(a, "g1");
        const regB = coordinator.register(b, "g1");

        regA.publishViewport({ axes: [], phase: "update", source: "wheel" });
        regB.updateOptions(baseOptions("g2"));
        await settle();

        expect(b.viewports).toHaveLength(0);
        regA.destroy();
        regB.destroy();
    });

    it("does not deliver cross-group messages", async () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const a = createMember("a", "g1");
        const x = createMember("x", "g2");
        const regA = coordinator.register(a, "g1");
        coordinator.register(x, "g2");

        regA.publishViewport({ axes: [], phase: "update", source: "wheel" });
        regA.publishCrosshair({ axes: [], snapped: true });
        await settle();

        expect(x.viewports).toHaveLength(0);
        expect(x.crosshairs).toHaveLength(0);
        regA.destroy();
    });
});
