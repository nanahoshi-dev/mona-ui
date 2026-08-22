import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartLineSeriesRegistration, ChartXAxisRegistration, ChartYAxisRegistration } from "../context/chart-registration-context";
import { CartesianAxisDomainResolver } from "../layout/cartesian-axis-domain-resolver";
import { CartesianAxisRegistryResolver } from "../layout/cartesian-axis-registry-resolver";
import { CartesianMultiAxisCoordinator } from "../layout/cartesian-multi-axis-coordinator";
import { CartesianSeriesAxisBindingResolver } from "../layout/cartesian-series-axis-binding-resolver";
import { CartesianScaleFactory, LinearScale } from "../scale/cartesian-scale-factory";
import type { SceneHitTarget } from "../scene/scene-geometry";
import { CartesianAxisCoordinateSpace, type CartesianAxisCoordinateSnapshot } from "../viewport/cartesian-axis-coordinate-space";
import { createCartesianNormalizedBaseMapper } from "../viewport/cartesian-normalized-base-mapper";
import { normalizeCartesianTemporalDomain } from "../data/cartesian-temporal-value-resolver";
import { CartesianMarkerSpatialInteractionProvider } from "./cartesian-marker-dense-provider";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

function markerTarget(index: number, point: { readonly x: number; readonly y: number }): SceneHitTarget {
    return {
        animationKey: `scatter-${index}`,
        datum: { index },
        index,
        markerInteractionOrder: { seriesOrdinal: 0, sourceOrdinal: index },
        point,
        radius: 8,
        seriesId: "scatter",
        seriesName: "Scatter",
        seriesType: "scatter",
        visualRadius: 8,
        xKey: index,
        xValue: index,
        yValue: 0.5
    };
}

function createNearCoordinateProvider(): CartesianMarkerSpatialInteractionProvider {
    const semanticX = [0, 4e-13, 6e-13, 9e-13];
    const xScale = new LinearScale([0, 1e-12], [0, 600]);
    const yScale = new LinearScale([0, 1], [100, 0]);
    const targets = semanticX.map((value, index) => markerTarget(index, {
        x: xScale.map(value)!,
        y: yScale.map(0.5)!
    }));
    const hierarchy = new CartesianSpatialDensityIndex(
        Float64Array.from(semanticX),
        new Float64Array(semanticX.length).fill(0.5)
    );

    return new CartesianMarkerSpatialInteractionProvider({
        hierarchy,
        materialize: sourceIndex => targets[sourceIndex] ?? null,
        maxHitRadius: 10,
        maxVisualRadius: 8,
        seriesId: "scatter",
        seriesType: "scatter",
        xBaseNormalize: value => Number(value),
        xViewportScale: xScale,
        yBaseNormalize: value => Number(value),
        yViewportScale: yScale
    });
}

function createNearBubbleProvider(): CartesianMarkerSpatialInteractionProvider {
    const semanticX = [0, 4e-13, 6e-13, 9e-13];
    const xScale = new LinearScale([0, 1e-12], [0, 600]);
    const yScale = new LinearScale([0, 1], [100, 0]);
    const targets = semanticX.map((value, index) => ({
        ...markerTarget(index, {
            x: xScale.map(value)!,
            y: yScale.map(0.5)!
        }),
        seriesId: "bubble",
        seriesName: "Bubble",
        seriesType: "bubble" as const
    }));
    const hierarchy = new CartesianSpatialDensityIndex(
        Float64Array.from(semanticX),
        new Float64Array(semanticX.length).fill(0.5),
        new Float64Array([1, 2, 3, 4])
    );

    return new CartesianMarkerSpatialInteractionProvider({
        bubbleRadiusScale: () => 8,
        hierarchy,
        materialize: sourceIndex => targets[sourceIndex] ?? null,
        maxHitRadius: 10,
        maxVisualRadius: 8,
        seriesId: "bubble",
        seriesType: "bubble",
        sizes: new Float64Array([1, 2, 3, 4]),
        xBaseNormalize: value => Number(value),
        xViewportScale: xScale,
        yBaseNormalize: value => Number(value),
        yViewportScale: yScale
    });
}

function createTemporalXAxis(overrides: Partial<ChartXAxisRegistration> = {}): ChartXAxisRegistration {
    return {
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
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("bottom"),
        registrationId: "r14-x",
        symlogConstant: signal(1),
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("time"),
        visible: signal(true),
        ...overrides
    };
}

function createTemporalYAxis(): ChartYAxisRegistration {
    return {
        axisId: signal("y1"),
        axisLine: signal(true),
        exponent: signal(1),
        formatter: signal(undefined),
        gridLines: signal(undefined),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(undefined),
        labelRotation: signal(undefined),
        labels: signal(true),
        labelTemplate: signal(undefined),
        logBase: signal(10),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("left"),
        registrationId: "r14-y",
        symlogConstant: signal(1),
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("linear"),
        visible: signal(true)
    };
}

function createTemporalLine(data: readonly unknown[]): ChartLineSeriesRegistration {
    return {
        color: signal("#000"),
        curve: signal("linear"),
        data: signal(data),
        element: { nativeElement: {} as HTMLElement },
        field: signal("y"),
        id: "r14-line",
        name: signal("R14"),
        pointRadius: signal(undefined),
        strokeWidth: signal(undefined),
        type: "line",
        visible: signal(true),
        xAxisId: signal("x1"),
        xField: signal("x"),
        yAxisId: signal("y1")
    };
}

function resolveTemporalStageADomain(
    data: readonly unknown[],
    explicitMin?: Date | number,
    explicitMax?: Date | number
): readonly [Date, Date] {
    const xAxis = createTemporalXAxis({
        max: signal(explicitMax),
        min: signal(explicitMin)
    });
    const axis = CartesianAxisRegistryResolver.resolve([xAxis], []).xAxes[0];
    const line = createTemporalLine(data);
    return CartesianAxisDomainResolver.resolveDomain(axis, "time", [line], data, "x").domain as readonly [Date, Date];
}

function resolveTemporalCommittedDomain(
    data: readonly unknown[],
    explicitMin?: Date | number,
    explicitMax?: Date | number,
    type: "time" | "utc" = "time"
): readonly [Date, Date] {
    const xAxis = createTemporalXAxis({
        max: signal(explicitMax),
        min: signal(explicitMin),
        type: signal(type)
    });
    const yAxis = createTemporalYAxis();
    const line = createTemporalLine(data);
    const axisResolution = CartesianAxisRegistryResolver.resolve([xAxis], [yAxis]);
    const bindingResolution = CartesianSeriesAxisBindingResolver.resolve([line], axisResolution);
    const preparation = CartesianMultiAxisCoordinator.prepareDomains({
        axisResolution,
        bindingResolution,
        rootData: data,
        rootXField: "x"
    });
    return preparation.baseDomains.x.get("x1") as readonly [Date, Date];
}

describe("Cartesian density fourteenth remediation", () => {
    it("finds a deep-zoom scatter mark inside an old approximate-degenerate leaf", () => {
        const provider = createNearCoordinateProvider();
        const target = provider.resolvePointerCandidates({ pixel: { x: 240, y: 50 } });

        expect(target.map(mark => mark.index)).toEqual([1]);
    });

    it("finds the intermediate nearest mark inside an old approximate-degenerate leaf", () => {
        const provider = createNearCoordinateProvider();
        const target = provider.resolveNearest({ pixel: { x: 360, y: 50 } });

        expect(target.map(mark => mark.index)).toEqual([2]);
    });

    it("preserves deep-zoom bubble pointer and nearest resolution", () => {
        const provider = createNearBubbleProvider();

        expect(provider.resolvePointerCandidates({ pixel: { x: 240, y: 50 } }).map(mark => mark.index)).toEqual([1]);
        expect(provider.resolveNearest({ pixel: { x: 360, y: 50 } }).map(mark => mark.index)).toEqual([2]);
    });

    it("preserves distinct normalized positions for a huge offset domain", () => {
        const scale = new LinearScale([0, 1e20], [50, 650]);
        const snapshot: CartesianAxisCoordinateSnapshot = {
            baseDomain: [0, 1e20],
            baseScale: scale,
            range: [50, 650],
            ref: { axis: "x", axisId: "r14-large" },
            resolvedType: "linear",
            valid: true,
            viewportDomain: [0, 1e20],
            viewportScale: scale
        };
        const coordinateSpace = new CartesianAxisCoordinateSpace(new Map([["r14-large", snapshot]]), new Map());
        const first = coordinateSpace.getNormalizedBasePosition(snapshot.ref, 1);
        const second = coordinateSpace.getNormalizedBasePosition(snapshot.ref, 2);

        expect(first).toBeDefined();
        expect(second).toBeDefined();
        expect(first).not.toBe(second);
    });

    it("canonicalizes reversed temporal bounds after scale nice refinement", () => {
        const scale = CartesianScaleFactory.createTemporalScale({
            domain: [new Date("2026-01-01"), new Date("2026-01-03")],
            explicitMax: new Date("2026-01-01"),
            explicitMin: new Date("2026-01-03"),
            nice: true,
            range: [0, 1],
            type: "time"
        });

        expect(scale.domain()[0].getTime()).toBeLessThan(scale.domain()[1].getTime());

        const committedDomain = resolveTemporalCommittedDomain(
            [{ x: "2026-01-01", y: 1 }, { x: "2026-01-02", y: 2 }],
            new Date("2026-01-03"),
            new Date("2026-01-01")
        );
        expect(committedDomain[0].getTime()).toBeLessThan(committedDomain[1].getTime());
    });

    it("keeps a valid explicit minimum above observed temporal data", () => {
        const domain = resolveTemporalStageADomain(
            [{ x: "2026-01-01", y: 1 }, { x: "2026-01-02", y: 2 }],
            new Date("2026-02-01")
        );

        expect(domain[0].getTime()).toBe(new Date("2026-02-01").getTime());
        expect(domain[1].getTime()).toBeGreaterThan(domain[0].getTime());
    });

    it("keeps a valid explicit maximum below observed temporal data", () => {
        const domain = resolveTemporalStageADomain(
            [{ x: "2026-02-01", y: 1 }, { x: "2026-02-02", y: 2 }],
            undefined,
            new Date("2026-01-01")
        );

        expect(domain[1].getTime()).toBe(new Date("2026-01-01").getTime());
        expect(domain[0].getTime()).toBeLessThan(domain[1].getTime());
    });

    it("anchors one-sided temporal bounds when there is no valid data", () => {
        const minDomain = resolveTemporalStageADomain([], new Date("2026-02-01"));
        const maxDomain = resolveTemporalStageADomain([], undefined, new Date("2026-02-01"));
        const anchor = new Date("2026-02-01").getTime();

        expect(minDomain[0].getTime()).toBe(anchor);
        expect(minDomain[1].getTime()).toBeGreaterThan(anchor);
        expect(maxDomain[1].getTime()).toBe(anchor);
        expect(maxDomain[0].getTime()).toBeLessThan(anchor);
    });

    it("keeps time and UTC explicit bounds ascending through the committed domain", () => {
        for (const type of ["time", "utc"] as const) {
            const domain = resolveTemporalCommittedDomain(
                [{ x: "2026-01-01T00:00:00Z", y: 1 }, { x: "2026-01-02T00:00:00Z", y: 2 }],
                new Date("2026-01-03T00:00:00Z"),
                new Date("2026-01-01T00:00:00Z"),
                type
            );

            expect(domain[0].getTime()).toBeLessThan(domain[1].getTime());
        }
    });

    it("uses the temporal fallback policy for invalid explicit bounds", () => {
        const domain = resolveTemporalStageADomain(
            [{ x: "2026-01-01", y: 1 }, { x: "2026-01-02", y: 2 }],
            new Date(Number.NaN),
            new Date(Number.NaN)
        );

        expect(domain[0].getTime()).toBe(new Date("2026-01-01").getTime());
        expect(domain[1].getTime()).toBe(new Date("2026-01-02").getTime());
    });

    it("preserves one-sided explicit bounds at Date representability limits", () => {
        const maxDate = new Date(8_640_000_000_000_000);
        const minDate = new Date(-8_640_000_000_000_000);
        const nearMaxDate = new Date(maxDate.getTime() - 1_000);
        const nearMinDate = new Date(minDate.getTime() + 1_000);
        const minDomain = resolveTemporalStageADomain([], nearMaxDate);
        const maxDomain = resolveTemporalStageADomain([], undefined, nearMinDate);
        const equalAtMax = normalizeCartesianTemporalDomain({ explicitMax: maxDate, explicitMin: maxDate }).domain;
        const equalAtMin = normalizeCartesianTemporalDomain({ explicitMax: minDate, explicitMin: minDate }).domain;

        expect(minDomain[0].getTime()).toBe(nearMaxDate.getTime());
        expect(minDomain[1].getTime()).toBeGreaterThan(minDomain[0].getTime());
        expect(maxDomain[1].getTime()).toBe(nearMinDate.getTime());
        expect(maxDomain[0].getTime()).toBeLessThan(maxDomain[1].getTime());
        expect(equalAtMax[1].getTime()).toBe(maxDate.getTime());
        expect(equalAtMax[0].getTime()).toBeLessThan(equalAtMax[1].getTime());
        expect(equalAtMin[0].getTime()).toBe(minDate.getTime());
        expect(equalAtMin[1].getTime()).toBeGreaterThan(equalAtMin[0].getTime());
    });

    it("reuses exact nonlinear and temporal normalized transforms", () => {
        const numericMapper = createCartesianNormalizedBaseMapper({
            domain: [1, 1e20],
            exponent: 2,
            logBase: 2,
            symlogConstant: 3,
            type: "pow"
        });
        const timeMapper = createCartesianNormalizedBaseMapper({
            domain: [new Date("2026-01-01T00:00:00Z"), new Date("2026-01-03T00:00:00Z")],
            type: "utc"
        });

        expect(numericMapper?.map(1)).toBe(0);
        expect(numericMapper?.map(1e20)).toBe(1);
        expect(numericMapper?.invert(0)).toBe(1);
        expect(timeMapper?.map(new Date("2026-01-02T00:00:00Z"))).toBeCloseTo(0.5);
        expect((timeMapper?.invert(0.5) as Date).getTime()).toBe(new Date("2026-01-02T00:00:00Z").getTime());
    });

    it("preserves close time and UTC instants inside a large base interval", () => {
        for (const type of ["time", "utc"] as const) {
            const mapper = createCartesianNormalizedBaseMapper({
                domain: [new Date(0), new Date(8_000_000_000_000_000)],
                type
            });
            const first = mapper?.map(new Date(1));
            const second = mapper?.map(new Date(2));

            expect(first).toBeDefined();
            expect(second).toBeDefined();
            expect(first).not.toBe(second);
        }
    });

    it("keeps exact duplicate fast paths compact for 100k markers", () => {
        const count = 100_000;
        const index = new CartesianSpatialDensityIndex(
            new Float64Array(count).fill(0.5),
            new Float64Array(count).fill(0.5)
        );

        expect(index.nodeCount).toBe(1);
        expect(index.buildStats).toEqual({
            fallbackNodeCount: 0,
            fallbackRowsPartitioned: 0,
            fallbackSortInputTotal: 0,
            maxChildFanout: 0,
            maxFallbackDepth: 0
        });
        expect(index.countPointsInWindow([0, 0, 1, 1])).toBe(count);
    });

    it("certifies bounded recursive fallback work on nested-outlier distributions", () => {
        for (const count of [100_000, 250_000]) {
            const u = new Float64Array(count);
            const v = new Float64Array(count).fill(0.5);
            for (let i = 0; i < count; i++) {
                u[i] = Math.pow(i / (count - 1), 64);
            }

            const index = new CartesianSpatialDensityIndex(u, v);
            const stats = index.buildStats;

            expect(stats.fallbackNodeCount).toBeGreaterThan(0);
            expect(stats.fallbackRowsPartitioned).toBeGreaterThan(0);
            expect(stats.fallbackSortInputTotal).toBeGreaterThanOrEqual(stats.fallbackRowsPartitioned);
            expect(stats.maxChildFanout).toBeLessThanOrEqual(4);
            expect(stats.maxFallbackDepth).toBeGreaterThanOrEqual(14);
            expect(stats.fallbackRowsPartitioned).toBeLessThanOrEqual(count * 32);
            expect(stats.fallbackSortInputTotal).toBeLessThanOrEqual(count * 32);
            expect(stats.maxFallbackDepth).toBeLessThanOrEqual(32);
            expect(index.nodeCount).toBeLessThanOrEqual(Math.ceil(count / 2));
            expect(index.countPointsInWindow([0, 0, 1, 1])).toBe(count);
        }
    });
});
