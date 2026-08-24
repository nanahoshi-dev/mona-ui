import { describe, expect, it } from "vitest";
import type { ChartViewportState } from "../../models/chart-viewport.models";
import { ChartSynchronizationAxisMapper } from "../synchronization/chart-synchronization-axis-mapper";
import type { ChartSynchronizationViewportMessage } from "../synchronization/chart-synchronization-types";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "./cartesian-axis-coordinate-space";
import { CartesianViewportController } from "./cartesian-viewport-controller";
import { CartesianViewportOperationCoordinator } from "./cartesian-viewport-operation-coordinator";
import {
    areAxisViewportsEqual,
    areViewportStatesEqual,
    continuousViewportNumbersEqual,
    isFullContinuousViewport,
    normalizeViewportState,
    type InternalCartesianViewportState,
    type ResolvedAxisInfoMap
} from "./cartesian-viewport-normalizer";

const highOffsetBase = 1e20;
const highOffsetUlp = highOffsetBase + 16_384 - highOffsetBase;

function highOffsetWindow(minOffsetUlp: number, maxOffsetUlp: number) {
    return {
        axis: "x" as const,
        axisId: "x-high",
        kind: "continuous" as const,
        max: highOffsetBase + maxOffsetUlp * highOffsetUlp,
        min: highOffsetBase + minOffsetUlp * highOffsetUlp
    };
}

function highOffsetSnapshot(): CartesianAxisCoordinateSnapshot {
    const domain = [highOffsetBase, highOffsetBase + 64 * highOffsetUlp] as const;
    const scale = CartesianScaleFactory.createExactPositionScale({
        domain: [...domain],
        range: [0, 400],
        type: "linear"
    });
    return {
        baseDomain: domain,
        baseScale: scale,
        range: [0, 400],
        ref: { axis: "x", axisId: "x-high" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: domain,
        viewportScale: scale
    };
}

function highOffsetViewportState(window: ReturnType<typeof highOffsetWindow>): InternalCartesianViewportState {
    return {
        x: new Map([[window.axisId, window]]),
        y: new Map()
    };
}

const highOffsetAxes: ResolvedAxisInfoMap = {
    x: new Map([
        [
            "x-high",
            {
                baseDomain: [highOffsetBase, highOffsetBase + 64 * highOffsetUlp],
                resolvedType: "linear" as const
            }
        ]
    ]),
    y: new Map()
};

const synchronizationOptions = {
    axisMappings: [],
    crosshair: {
        axes: "auto" as const,
        clearOnLeave: true,
        enabled: true,
        match: "axis-value" as const,
        mode: "domain" as const,
        showTooltip: false
    },
    group: "r16",
    viewport: { axes: "auto" as const, enabled: true, mode: "domain" as const, phase: "continuous" as const }
};

function viewportMessage(axes: ChartSynchronizationViewportMessage["axes"]): ChartSynchronizationViewportMessage {
    return {
        axes,
        group: "r16",
        kind: "viewport",
        originMemberId: "source",
        phase: "end",
        sequence: 1,
        source: "programmatic",
        transactionId: "r16-high-offset"
    };
}

describe("Cartesian Viewport High-Offset Window Regressions", () => {
    it("keeps distinct high-offset representable windows distinct", () => {
        expect(highOffsetUlp).toBe(16_384);
        const oldWindow = highOffsetWindow(16, 32);
        const nextWindow = highOffsetWindow(20, 36);

        expect(oldWindow.min).not.toBe(nextWindow.min);
        expect(oldWindow.max).not.toBe(nextWindow.max);
        expect(continuousViewportNumbersEqual(oldWindow.min, nextWindow.min)).toBe(false);
        expect(areAxisViewportsEqual(oldWindow, nextWindow)).toBe(false);

        const oldPublic: ChartViewportState = { axes: [oldWindow] };
        const nextPublic: ChartViewportState = { axes: [nextWindow] };
        expect(areViewportStatesEqual(oldPublic, nextPublic)).toBe(false);
    });

    it("accepts a high-offset setWindow movement and reports the changed axis", () => {
        const snapshot = highOffsetSnapshot();
        const coordinateSpace = new CartesianAxisCoordinateSpace(new Map([["x-high", snapshot]]), new Map());
        const current = highOffsetViewportState(highOffsetWindow(16, 32));
        const result = CartesianViewportOperationCoordinator.setWindow(
            current,
            coordinateSpace,
            highOffsetWindow(20, 36),
            { clampToData: true }
        );

        expect(result.accepted).toBe(true);
        expect(result.changed).toBe(true);
        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-high" }]);
    });

    it("detects a high-offset controller pan that moves a quarter of the visible span", () => {
        const snapshot = highOffsetSnapshot();
        const coordinateSpace = new CartesianAxisCoordinateSpace(new Map([["x-high", snapshot]]), new Map());
        const current = highOffsetViewportState(highOffsetWindow(16, 32));
        const result = CartesianViewportController.pan(
            current,
            coordinateSpace,
            [{ axis: "x", axisId: "x-high" }],
            { x: 100, y: 0 },
            { clampToData: false }
        );

        expect(result.changed).toBe(true);
        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-high" }]);
        expect(result.viewport.x.get("x-high")).not.toEqual(current.x.get("x-high"));
    });

    it("recognizes a high-offset synchronization movement at the recipient", () => {
        const snapshot = highOffsetSnapshot();
        const coordinateSpace = new CartesianAxisCoordinateSpace(new Map([["x-high", snapshot]]), new Map());
        const current = highOffsetViewportState(highOffsetWindow(16, 32));
        const next = highOffsetWindow(20, 36);
        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            viewportMessage([
                {
                    sourceRef: { axis: "x", axisId: "x-high" },
                    sourceType: "linear",
                    window: next
                }
            ]),
            coordinateSpace,
            synchronizationOptions,
            current,
            { x: "x-high", y: "y-high" },
            { clampToData: true },
            new Set()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "x-high" }]);
        expect(result.viewport.x.get("x-high")).toEqual(next);
    });

    it("does not treat a high-offset partial ResolvedAxisInfo window as full domain", () => {
        const partial = highOffsetWindow(4, 60);
        const normalized = normalizeViewportState({ axes: [partial] }, highOffsetAxes, { clampToData: true });

        expect(normalized.x.get("x-high")).toBeDefined();
        expect(isFullContinuousViewport(partial.min, partial.max, highOffsetAxes.x.get("x-high")!)).toBe(false);
    });

    it("still canonicalizes exact high-offset full domain and preserves one-ms temporal identity", () => {
        const full = highOffsetWindow(0, 64);
        const fullNormalized = normalizeViewportState({ axes: [full] }, highOffsetAxes, { clampToData: true });
        expect(fullNormalized.x.has("x-high")).toBe(false);

        const first: ChartViewportState = {
            axes: [{ axis: "x", axisId: "time", kind: "continuous", max: 1_777_000_000_001, min: 1_777_000_000_000 }]
        };
        const second: ChartViewportState = {
            axes: [{ axis: "x", axisId: "time", kind: "continuous", max: 1_777_000_000_002, min: 1_777_000_000_000 }]
        };
        expect(areViewportStatesEqual(first, second)).toBe(false);
    });
});
