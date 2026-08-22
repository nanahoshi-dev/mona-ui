import { describe, expect, it } from "vitest";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../viewport/cartesian-axis-coordinate-space";
import type { InternalCartesianViewportState } from "../viewport/cartesian-viewport-normalizer";
import { ChartSynchronizationAxisMapper } from "./chart-synchronization-axis-mapper";
import {
    buildAxisWindow,
    ChartSynchronizationController,
    type ChartSynchronizationHost
} from "./chart-synchronization-controller";
import { ChartSynchronizationCoordinator } from "./chart-synchronization-coordinator";
import {
    normalizeChartSynchronizationOptions,
    type NormalizedChartSynchronizationOptions
} from "./chart-synchronization-options";
import type { ChartSynchronizationViewportMessage } from "./chart-synchronization-types";

function categorySnapshot(axisId: string, keys: readonly string[]): CartesianAxisCoordinateSnapshot {
    const scale = CartesianScaleFactory.createBandScale({ domain: [...keys], range: [0, 400] });
    return {
        baseDomain: keys,
        baseScale: scale,
        range: [0, 400],
        ref: { axis: "x", axisId },
        resolvedType: "category",
        valid: true,
        viewportDomain: keys,
        viewportScale: scale
    };
}

function message(axes: ChartSynchronizationViewportMessage["axes"], mode: "domain" | "relative" = "domain") {
    return {
        axes,
        group: "r16-category",
        kind: "viewport" as const,
        originMemberId: "source",
        phase: "end" as const,
        sequence: 1,
        source: "programmatic" as const,
        transactionId: `r16-category-${mode}`
    } satisfies ChartSynchronizationViewportMessage;
}

const options: NormalizedChartSynchronizationOptions = {
    axisMappings: [],
    crosshair: {
        axes: "auto",
        clearOnLeave: true,
        enabled: true,
        match: "axis-value",
        mode: "domain",
        showTooltip: false
    },
    group: "r16-category",
    viewport: { axes: "auto", enabled: true, mode: "domain", phase: "continuous" }
};

function emptyState(): InternalCartesianViewportState {
    return { x: new Map(), y: new Map() };
}

function categoryState(axisId: string, startIndex: number, endIndexExclusive: number): InternalCartesianViewportState {
    return {
        x: new Map([
            [
                axisId,
                {
                    axis: "x",
                    axisId,
                    endIndexExclusive,
                    firstVisibleKey: `key-${startIndex}`,
                    kind: "category",
                    lastVisibleKey: `key-${endIndexExclusive - 1}`,
                    startIndex
                }
            ]
        ]),
        y: new Map()
    };
}

function categoryControllerHost(
    coordinateSpace: CartesianAxisCoordinateSpace,
    primaryAxisId: string,
    controlled: boolean,
    current: { value: InternalCartesianViewportState },
    proposals: InternalCartesianViewportState[]
): ChartSynchronizationHost {
    return {
        getBaseDomainSignature: () => "category:r16",
        getCoordinateSpace: () => coordinateSpace,
        getCrosshairSceneContext: () => null,
        getNavigationOptions: () => ({ clampToData: false, minVisibleCategories: 1 }),
        getPrimaryAxisIds: () => ({ x: primaryAxisId }),
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

describe("Chart synchronization sixteenth remediation", () => {
    it("publishes sourceIsPrimary for partial category windows, including false", () => {
        const sourceRef = { axis: "x" as const, axisId: "source-category" };
        const snap = categorySnapshot(sourceRef.axisId, ["a", "b", "c", "d"]);
        const partial = {
            axis: "x" as const,
            axisId: sourceRef.axisId,
            endIndexExclusive: 3,
            kind: "category" as const,
            startIndex: 1
        };

        expect(buildAxisWindow(sourceRef, "category", partial, snap, null, true).sourceIsPrimary).toBe(true);
        expect(buildAxisWindow(sourceRef, "category", partial, snap, null, false).sourceIsPrimary).toBe(false);
    });

    it("routes a primary category window to a different recipient primary ID by semantic keys", () => {
        const coordinateSpace = new CartesianAxisCoordinateSpace(
            new Map([["target-category", categorySnapshot("target-category", ["a", "b", "c", "d"])]]),
            new Map()
        );
        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            message([
                {
                    sourceIsPrimary: true,
                    sourceRef: { axis: "x", axisId: "source-category" },
                    sourceType: "category",
                    visibleCategoryKeys: ["b", "c"],
                    window: {
                        axis: "x",
                        axisId: "source-category",
                        endIndexExclusive: 3,
                        kind: "category",
                        startIndex: 1
                    }
                }
            ]),
            coordinateSpace,
            options,
            emptyState(),
            { x: "target-category", y: "target-y" },
            { clampToData: true, minVisibleCategories: 1 },
            new Set()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "target-category" }]);
        expect(result.viewport.x.get("target-category")).toMatchObject({
            endIndexExclusive: 3,
            kind: "category",
            startIndex: 1
        });
    });

    it("keeps category primary fallback available in relative mode", () => {
        const coordinateSpace = new CartesianAxisCoordinateSpace(
            new Map([
                ["target-category", categorySnapshot("target-category", ["a", "b", "c", "d", "e", "f", "g", "h"])]
            ]),
            new Map()
        );
        const relativeOptions: NormalizedChartSynchronizationOptions = {
            ...options,
            viewport: { ...options.viewport, mode: "relative" }
        };
        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            message(
                [
                    {
                        normalizedWindow: [0.25, 0.75],
                        sourceIsPrimary: true,
                        sourceRef: { axis: "x", axisId: "source-category" },
                        sourceType: "category",
                        window: {
                            axis: "x",
                            axisId: "source-category",
                            endIndexExclusive: 4,
                            kind: "category",
                            startIndex: 1
                        }
                    }
                ],
                "relative"
            ),
            coordinateSpace,
            relativeOptions,
            emptyState(),
            { x: "target-category", y: "target-y" },
            { clampToData: true, minVisibleCategories: 1 },
            new Set()
        );

        expect(result.changedAxes).toEqual([{ axis: "x", axisId: "target-category" }]);
        expect(result.viewport.x.get("target-category")).toMatchObject({
            endIndexExclusive: 6,
            kind: "category",
            startIndex: 2
        });
    });

    it("does not route a non-primary category source to the recipient primary", () => {
        const coordinateSpace = new CartesianAxisCoordinateSpace(
            new Map([["target-category", categorySnapshot("target-category", ["a", "b", "c", "d"])]]),
            new Map()
        );
        const result = ChartSynchronizationAxisMapper.mapIncomingAxes(
            message([
                {
                    sourceIsPrimary: false,
                    sourceRef: { axis: "x", axisId: "source-secondary" },
                    sourceType: "category",
                    visibleCategoryKeys: ["b", "c"],
                    window: {
                        axis: "x",
                        axisId: "source-secondary",
                        endIndexExclusive: 3,
                        kind: "category",
                        startIndex: 1
                    }
                }
            ]),
            coordinateSpace,
            options,
            emptyState(),
            { x: "target-category", y: "target-y" },
            { clampToData: true, minVisibleCategories: 1 },
            new Set()
        );

        expect(result.changedAxes).toHaveLength(0);
    });

    it("keeps a different-ID primary category sync proposal-only for a controlled recipient", () => {
        const sourceSpace = new CartesianAxisCoordinateSpace(
            new Map([["source-category", categorySnapshot("source-category", ["a", "b", "c", "d"])]]),
            new Map()
        );
        const targetSpace = new CartesianAxisCoordinateSpace(
            new Map([["target-category", categorySnapshot("target-category", ["a", "b", "c", "d"])]]),
            new Map()
        );
        const coordinator = new ChartSynchronizationCoordinator();
        const sourceCurrent = { value: categoryState("source-category", 1, 3) };
        const targetCurrent = { value: categoryState("target-category", 0, 2) };
        const proposals: InternalCartesianViewportState[] = [];
        const source = new ChartSynchronizationController(
            coordinator,
            categoryControllerHost(sourceSpace, "source-category", false, sourceCurrent, []),
            new Set()
        );
        const target = new ChartSynchronizationController(
            coordinator,
            categoryControllerHost(targetSpace, "target-category", true, targetCurrent, proposals),
            new Set()
        );
        const normalizedOptions = normalizeChartSynchronizationOptions({
            group: "r16-controlled-category",
            viewport: { mode: "domain" }
        })!;

        source.setOptions(normalizedOptions);
        target.setOptions(normalizedOptions);
        source.publishViewport([{ axis: "x", axisId: "source-category" }], "end", "programmatic");

        expect(proposals).toHaveLength(1);
        expect(targetCurrent.value.x.get("target-category")).toEqual(
            categoryState("target-category", 0, 2).x.get("target-category")
        );
        expect(proposals[0].x.get("target-category")).toMatchObject({
            endIndexExclusive: 3,
            kind: "category",
            startIndex: 1
        });

        targetCurrent.value = proposals[0];
        expect(target.consumeAcknowledgedInbound(proposals[0])).toBe(true);
        target.onCommittedViewportChange({
            acknowledgedInbound: true,
            changedAxes: [{ axis: "x", axisId: "target-category" }],
            phase: "end",
            source: "sync"
        });

        source.destroy();
        target.destroy();
    });
});
