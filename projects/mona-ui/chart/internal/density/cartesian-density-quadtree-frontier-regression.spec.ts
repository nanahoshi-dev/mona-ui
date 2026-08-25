import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartLineSeriesRegistration, ChartXAxisRegistration } from "../context/chart-registration-context";
import { CartesianAxisDomainResolver } from "../layout/cartesian-axis-domain-resolver";
import {
    CartesianAxisRegistryResolver,
    type ResolvedCartesianAxisDescriptor
} from "../layout/cartesian-axis-registry-resolver";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { CartesianScaleFactory, LinearScale } from "../scale/cartesian-scale-factory";
import { createBubbleRadiusScale } from "../scale/bubble-size-scale";
import { resolveCartesianTemporalValue } from "../data/cartesian-temporal-value-resolver";
import { CartesianMarkerSpatialInteractionProvider } from "./cartesian-marker-dense-provider";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

function markerHit(input: {
    readonly index: number;
    readonly point: { readonly x: number; readonly y: number };
    readonly radius: number;
    readonly seriesId?: string;
    readonly seriesType?: "bubble" | "scatter";
    readonly visualRadius: number;
}): SceneHitTarget {
    return {
        animationKey: `${input.seriesId ?? "markers"}-${input.index}`,
        datum: { index: input.index },
        index: input.index,
        markerInteractionOrder: {
            seriesOrdinal: 0,
            sourceOrdinal: input.index
        },
        point: input.point,
        radius: input.radius,
        seriesId: input.seriesId ?? "markers",
        seriesName: "Markers",
        seriesType: input.seriesType ?? "bubble",
        visualRadius: input.visualRadius,
        xKey: input.index,
        xValue: input.point.x,
        yValue: input.point.y
    };
}

function linearScale(domain: readonly [number, number], range: readonly [number, number] = [0, 100]): LinearScale {
    return new LinearScale([...domain], [...range]);
}

function bubbleProvider(
    sizes: readonly number[],
    radiusScale: (size: number) => number
): CartesianMarkerSpatialInteractionProvider {
    const targets = sizes.map((size, index) => {
        const visualRadius = radiusScale(size);
        return markerHit({
            index,
            point: { x: 50, y: 50 },
            radius: visualRadius + 4,
            seriesType: "bubble",
            visualRadius
        });
    });
    const hierarchy = new CartesianSpatialDensityIndex(
        new Float64Array(sizes.length).fill(0.5),
        new Float64Array(sizes.length).fill(0.5),
        Float64Array.from(sizes)
    );
    const xScale = linearScale([0, 100]);
    const yScale = linearScale([0, 100], [100, 0]);
    return new CartesianMarkerSpatialInteractionProvider({
        bubbleRadiusScale: radiusScale,
        hierarchy,
        materialize: sourceIndex => targets[sourceIndex] ?? null,
        maxHitRadius: 40,
        maxVisualRadius: 24,
        seriesId: "bubbles",
        seriesType: "bubble",
        sizes: Float64Array.from(sizes),
        xBaseNormalize: value => Number(value) / 100,
        xViewportScale: xScale,
        yBaseNormalize: value => Number(value) / 100,
        yViewportScale: yScale
    });
}

function temporalAxis(explicitMin?: number | Date, explicitMax?: number | Date): ResolvedCartesianAxisDescriptor<"x"> {
    const registration: ChartXAxisRegistration = {
        axisId: signal("x1"),
        axisLine: signal(true),
        exponent: signal(1),
        field: signal(undefined),
        formatter: signal(undefined),
        gridLines: signal(undefined),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(undefined),
        labelRotation: signal(undefined),
        labels: signal(true),
        labelTemplate: signal(undefined),
        logBase: signal(10),
        max: signal(explicitMax),
        min: signal(explicitMin),
        nice: signal(true),
        position: signal("bottom"),
        registrationId: "thirteenth-x",
        symlogConstant: signal(1),
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("time"),
        visible: signal(true)
    };
    return CartesianAxisRegistryResolver.resolve([registration], []).xAxes[0];
}

function temporalLine(data: readonly unknown[]): ChartLineSeriesRegistration {
    return {
        color: signal("#000"),
        curve: signal("linear"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal("y"),
        id: "temporal-line",
        name: signal("Temporal"),
        pointRadius: signal(undefined),
        strokeWidth: signal(undefined),
        type: "line",
        visible: signal(true),
        xAxisId: signal("x1"),
        xField: signal("x"),
        yAxisId: signal("y1")
    };
}

describe("Cartesian Density Quadtree Frontier and Temporal Bounds Regressions", () => {
    it("returns the globally latest qualifying source across intersecting leaves", () => {
        const u = new Float64Array(101).fill(Number.NaN);
        const v = new Float64Array(101).fill(Number.NaN);
        for (let index = 1; index <= 15; index++) {
            u[index] = 0.2 + index * 1e-6;
            v[index] = 0.2 + index * 1e-6;
        }
        u[100] = 0.2 + 16e-6;
        v[100] = 0.2 + 16e-6;
        for (let index = 85; index <= 99; index++) {
            u[index] = 0.8 + (index - 84) * 1e-6;
            v[index] = 0.8 + (index - 84) * 1e-6;
        }

        const hierarchy = new CartesianSpatialDensityIndex(u, v);
        const result = hierarchy.resolveTopmostPointerCandidate([0, 0, 1, 1], index => index === 1 || index === 99);

        expect(result).toBe(99);
    });

    it("merges specialized degenerate matches globally instead of returning the first leaf", () => {
        const u = new Float64Array(101).fill(Number.NaN);
        const v = new Float64Array(101).fill(Number.NaN);
        for (let index = 1; index <= 9; index++) {
            u[index] = 0.2;
            v[index] = 0.2;
        }
        u[100] = 0.2;
        v[100] = 0.2;
        for (let index = 90; index <= 99; index++) {
            u[index] = 0.8;
            v[index] = 0.8;
        }

        const hierarchy = new CartesianSpatialDensityIndex(u, v);
        const result = hierarchy.resolveTopmostPointerCandidate(
            [0, 0, 1, 1],
            () => false,
            undefined,
            undefined,
            (_nodeIndex, node) => {
                if (node.topmostIndex === 100) return 1;
                if (node.topmostIndex === 99) return 99;
                return null;
            }
        );

        expect(result).toBe(99);
    });

    it("keeps max-depth fallback branching bounded", () => {
        const clusterCount = 100_000;
        const sentinelCount = 15;
        const total = clusterCount + sentinelCount;
        const u = new Float64Array(total);
        const v = new Float64Array(total);
        for (let index = 0; index < sentinelCount; index++) {
            const coordinate = 1 - 2 ** -(index + 1);
            u[index] = coordinate;
            v[index] = coordinate;
        }

        const clusterCoordinate = 1 - 2 ** -20;
        for (let index = sentinelCount; index < total; index++) {
            const offset = (index - sentinelCount) % 1000;
            u[index] = clusterCoordinate + offset * 1e-10;
            v[index] = clusterCoordinate + ((offset * 17) % 1000) * 1e-10;
        }

        const hierarchy = new CartesianSpatialDensityIndex(u, v);
        let maxFanout = 0;
        for (let nodeIndex = 0; nodeIndex < hierarchy.nodeCount; nodeIndex++) {
            maxFanout = Math.max(maxFanout, hierarchy.getNode(nodeIndex)?.children?.length ?? 0);
        }

        expect(maxFanout).toBeLessThanOrEqual(4);
    });

    it("keeps topmost, nearest, and range traversal frontiers bounded", () => {
        const clusterCount = 40_000;
        const sentinelCount = 15;
        const total = clusterCount + sentinelCount;
        const u = new Float64Array(total);
        const v = new Float64Array(total);
        for (let index = 0; index < sentinelCount; index++) {
            const coordinate = 1 - 2 ** -(index + 1);
            u[index] = coordinate;
            v[index] = coordinate;
        }
        const clusterCoordinate = 1 - 2 ** -20;
        for (let index = sentinelCount; index < total; index++) {
            const offset = (index - sentinelCount) % 400;
            u[index] = clusterCoordinate + offset * 1e-9;
            v[index] = clusterCoordinate + ((offset * 17) % 400) * 1e-9;
        }

        const hierarchy = new CartesianSpatialDensityIndex(u, v);
        let topmostFrontier = 0;
        let topmostNodes = 0;
        let topmostCandidates = 0;
        const topmost = hierarchy.resolveTopmostPointerCandidate(
            [0, 0, 1, 1],
            index => index === total - 1,
            () => topmostNodes++,
            () => topmostCandidates++,
            undefined,
            size => {
                topmostFrontier = Math.max(topmostFrontier, size);
            }
        );

        let nearestFrontier = 0;
        let nearestNodes = 0;
        const nearest = hierarchy.resolveNearestNormalized(
            clusterCoordinate,
            clusterCoordinate,
            () => nearestNodes++,
            undefined,
            size => {
                nearestFrontier = Math.max(nearestFrontier, size);
            }
        );

        let rangeNodes = 0;
        let rangeCandidates = 0;
        hierarchy.queryRangeNormalized(
            [clusterCoordinate - 1e-7, clusterCoordinate - 1e-7, 2e-7, 2e-7],
            () => rangeCandidates++,
            () => rangeNodes++
        );

        expect(topmost).toBe(total - 1);
        expect(topmostCandidates).toBeLessThan(64);
        expect(topmostNodes).toBeLessThan(hierarchy.nodeCount);
        expect(topmostFrontier).toBeLessThan(2048);
        expect(nearest).not.toBeNull();
        expect(nearestNodes).toBeLessThan(hierarchy.nodeCount);
        expect(nearestFrontier).toBeLessThan(2048);
        expect(rangeCandidates).toBeGreaterThan(0);
        expect(rangeNodes).toBeLessThan(hierarchy.nodeCount);
    });

    it("keeps an exact wide-domain sqrt bubble boundary", () => {
        const radiusScale = createBubbleRadiusScale([1, 1e20], [4, 24]);
        const mediumSize = 1e10;
        const mediumRadius = radiusScale(mediumSize);
        const provider = bubbleProvider([1e20, mediumSize, 1], radiusScale);

        const result = provider.resolvePointerCandidates({
            pixel: { x: 50 + mediumRadius, y: 50 }
        });

        expect(result[0]?.index).toBe(1);
    });

    it("rejects unrepresentable and numeric-looking temporal values in Stage A", () => {
        const data = [
            { x: "2026-01-01T00:00:00.000Z", y: 1 },
            { x: "+1", y: 2 },
            { x: 1e20, y: 3 },
            { x: "2026-01-03T00:00:00.000Z", y: 4 }
        ];
        const result = CartesianAxisDomainResolver.resolveDomain(temporalAxis(), "time", [temporalLine(data)]);
        const [min, max] = result.domain as readonly [Date, Date];

        expect(Number.isFinite(min.getTime())).toBe(true);
        expect(Number.isFinite(max.getTime())).toBe(true);
        expect(min.getTime()).toBe(Date.parse("2026-01-01T00:00:00.000Z"));
        expect(max.getTime()).toBe(Date.parse("2026-01-03T00:00:00.000Z"));
    });

    it("treats an invalid explicit temporal bound as absent", () => {
        const data = [
            { x: "2026-01-01T00:00:00.000Z", y: 1 },
            { x: "2026-01-03T00:00:00.000Z", y: 4 }
        ];
        const result = CartesianAxisDomainResolver.resolveDomain(temporalAxis(1e20), "time", [temporalLine(data)]);
        const [min, max] = result.domain as readonly [Date, Date];

        expect(Number.isFinite(min.getTime())).toBe(true);
        expect(Number.isFinite(max.getTime())).toBe(true);
        expect(min.getTime()).toBe(Date.parse("2026-01-01T00:00:00.000Z"));
        expect(max.getTime()).toBe(Date.parse("2026-01-03T00:00:00.000Z"));
    });

    it("keeps the shared temporal policy through scale explicit-bound refinement", () => {
        const validMin = new Date("2026-01-01T00:00:00.000Z");
        const validMax = new Date("2026-01-03T00:00:00.000Z");
        const scale = CartesianScaleFactory.createTemporalScale({
            domain: [validMin, validMax],
            explicitMin: 1e20,
            range: [0, 100],
            type: "time"
        });

        expect(Number.isFinite(scale.domain()[0].getTime())).toBe(true);
        expect(Number.isFinite(scale.domain()[1].getTime())).toBe(true);
        expect(resolveCartesianTemporalValue("+1")).toBeNull();
        expect(resolveCartesianTemporalValue(1e20)).toBeNull();
        expect(resolveCartesianTemporalValue("2026-01-01T00:00:00.000Z")?.epochMs).toBe(validMin.getTime());
    });
});
