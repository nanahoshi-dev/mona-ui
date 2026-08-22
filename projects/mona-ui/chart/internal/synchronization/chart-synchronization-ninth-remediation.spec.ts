import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../viewport/cartesian-axis-coordinate-space";
import type { InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";
import { normalizeChartSynchronizationOptions } from "./chart-synchronization-options";
import { ChartSynchronizationController, type ChartSynchronizationHost } from "./chart-synchronization-controller";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import type { ChartSynchronizationMember, ChartSynchronizationViewportMessage } from "./chart-synchronization-types";

function linearSpace(): CartesianAxisCoordinateSpace {
    const range: readonly [number, number] = [0, 400];
    const scale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 100],
        range: [...range],
        type: "linear"
    });
    const snapshot: CartesianAxisCoordinateSnapshot = {
        baseDomain: [0, 100],
        baseScale: scale,
        range,
        ref: { axis: "x", axisId: "x-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 100],
        viewportScale: scale
    };
    return new CartesianAxisCoordinateSpace(new Map([["x-main", snapshot]]), new Map());
}

function viewport(min: number, max: number): InternalCartesianViewportState {
    return {
        x: new Map([["x-main", { axis: "x", axisId: "x-main", kind: "continuous", max, min }]]),
        y: new Map()
    };
}

function controllerHost(
    coordinateSpace: CartesianAxisCoordinateSpace,
    controlled: boolean,
    current: { value: InternalCartesianViewportState },
    proposals: InternalCartesianViewportState[]
): ChartSynchronizationHost {
    return {
        getBaseDomainSignature: () => "x-main:0:100",
        getCoordinateSpace: () => coordinateSpace,
        getCrosshairSceneContext: () => null,
        getNavigationOptions: () => ({ clampToData: false }),
        getViewport: () => current.value,
        isControlled: () => controlled,
        onRemoteCrosshairState: () => {},
        onSyncViewportCommit: state => {
            current.value = state;
        },
        onSyncViewportProposal: state => {
            proposals.push(state);
        }
    };
}

function observerMember(
    coordinateSpace: CartesianAxisCoordinateSpace,
    received: ChartSynchronizationViewportMessage[]
): ChartSynchronizationMember {
    return {
        clearCrosshair: () => {},
        getCoordinateSpace: () => coordinateSpace,
        getOptions: () => normalizeChartSynchronizationOptions({ group: "sync-ninth" }),
        getViewport: () => viewport(0, 100),
        memberId: "observer-C",
        receiveCrosshair: () => {},
        receiveViewport: message => received.push(message)
    };
}

describe("Chart synchronization ninth remediation", () => {
    it("delivers one original transaction through an accepted controlled recipient", () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const coordinateSpace = linearSpace();
        const proposals: InternalCartesianViewportState[] = [];
        const receivedByObserver: ChartSynchronizationViewportMessage[] = [];
        const currentA = { value: viewport(0, 100) };
        const currentB = { value: viewport(0, 100) };
        const controllerA = new ChartSynchronizationController(
            coordinator,
            controllerHost(coordinateSpace, false, currentA, []),
            new Set()
        );
        const controllerB = new ChartSynchronizationController(
            coordinator,
            controllerHost(coordinateSpace, true, currentB, proposals),
            new Set()
        );
        const observerRegistration = coordinator.register(
            observerMember(coordinateSpace, receivedByObserver),
            "sync-ninth"
        );

        controllerA.setOptions(normalizeChartSynchronizationOptions({ group: "sync-ninth" }));
        controllerB.setOptions(normalizeChartSynchronizationOptions({ group: "sync-ninth" }));
        controllerA.publishViewport([{ axis: "x", axisId: "x-main" }], "end", "drag");

        expect(proposals).toHaveLength(1);
        expect(receivedByObserver).toHaveLength(1);

        currentB.value = proposals[0];
        expect(controllerB.consumeAcknowledgedInbound(proposals[0])).toBe(true);
        controllerB.onCommittedViewportChange({
            acknowledgedInbound: true,
            changedAxes: [{ axis: "x", axisId: "x-main" }],
            phase: "end",
            source: "sync"
        });

        expect(receivedByObserver).toHaveLength(1);

        observerRegistration.destroy();
        controllerA.destroy();
        controllerB.destroy();
    });

    it("does not publish a rejected controlled proposal to the observer", () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const coordinateSpace = linearSpace();
        const proposals: InternalCartesianViewportState[] = [];
        const receivedByObserver: ChartSynchronizationViewportMessage[] = [];
        const controllerA = new ChartSynchronizationController(
            coordinator,
            controllerHost(coordinateSpace, false, { value: viewport(0, 100) }, []),
            new Set()
        );
        const controllerB = new ChartSynchronizationController(
            coordinator,
            controllerHost(coordinateSpace, true, { value: viewport(0, 100) }, proposals),
            new Set()
        );
        const observerRegistration = coordinator.register(
            observerMember(coordinateSpace, receivedByObserver),
            "sync-ninth"
        );

        controllerA.setOptions(normalizeChartSynchronizationOptions({ group: "sync-ninth" }));
        controllerB.setOptions(normalizeChartSynchronizationOptions({ group: "sync-ninth" }));
        controllerA.publishViewport([{ axis: "x", axisId: "x-main" }], "end", "drag");

        expect(proposals).toHaveLength(1);
        expect(receivedByObserver).toHaveLength(1);

        observerRegistration.destroy();
        controllerA.destroy();
        controllerB.destroy();
    });

    it("does not acknowledge a distinct representable deep viewport as an accepted echo", () => {
        const coordinator = new ChartSynchronizationCoordinator();
        const coordinateSpace = linearSpace();
        const proposals: InternalCartesianViewportState[] = [];
        const controllerA = new ChartSynchronizationController(
            coordinator,
            controllerHost(coordinateSpace, false, { value: viewport(0, 5e-13) }, []),
            new Set()
        );
        const controllerB = new ChartSynchronizationController(
            coordinator,
            controllerHost(coordinateSpace, true, { value: viewport(0, 100) }, proposals),
            new Set()
        );

        controllerA.setOptions(normalizeChartSynchronizationOptions({ group: "sync-ninth" }));
        controllerB.setOptions(normalizeChartSynchronizationOptions({ group: "sync-ninth" }));
        controllerA.publishViewport([{ axis: "x", axisId: "x-main" }], "end", "drag");

        expect(proposals).toHaveLength(1);
        expect(controllerB.consumeAcknowledgedInbound(viewport(0, 9e-13))).toBe(false);

        controllerA.publishViewport([{ axis: "x", axisId: "x-main" }], "end", "drag");
        expect(proposals).toHaveLength(2);
        expect(controllerB.consumeAcknowledgedInbound(proposals[1])).toBe(true);

        controllerA.destroy();
        controllerB.destroy();
    });
});
