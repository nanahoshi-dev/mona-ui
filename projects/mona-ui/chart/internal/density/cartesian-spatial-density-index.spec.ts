import { describe, expect, it } from "vitest";
import { CartesianSpatialDensityIndex } from "./cartesian-spatial-density-index";

describe("CartesianSpatialDensityIndex", () => {
    const count = 20_000;
    const u = new Float64Array(count);
    const v = new Float64Array(count);
    for (let i = 0; i < count; i++) {
        u[i] = (i % 200) / 200;
        v[i] = Math.floor(i / 200) / 100;
    }

    it("collects a bounded representative set deterministically", () => {
        const index = new CartesianSpatialDensityIndex(u, v);
        const runA: number[] = [];
        const runB: number[] = [];
        index.collectRepresentatives([0, 0, 1, 1], 500, idx => runA.push(idx));
        index.collectRepresentatives([0, 0, 1, 1], 500, idx => runB.push(idx));
        expect(runA).toEqual(runB);
        expect(runA.length).toBeLessThanOrEqual(500);
        expect(runA.length).toBeGreaterThan(0);
        // Every representative is a real source index.
        for (const idx of runA) {
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(count);
        }
    });

    it("reveals more detail as the window shrinks", () => {
        const sizes = new Float64Array(count).fill(1);
        const index = new CartesianSpatialDensityIndex(u, v, sizes);

        const fullView: number[] = [];
        index.collectRepresentatives([0, 0, 1, 1], 400, idx => fullView.push(idx));

        const zoomed: number[] = [];
        index.collectRepresentatives([0, 0, 0.2, 0.2], 400, idx => zoomed.push(idx));

        // Representatives of intersecting nodes concentrate in the zoomed region.
        expect(zoomed.every(i => u[i] < 0.25 && v[i] < 0.25)).toBe(true);
        // Density within the zoomed window exceeds the same-region density in the full view.
        const inRegionFull = fullView.filter(i => u[i] < 0.2 && v[i] < 0.2).length;
        expect(zoomed.length).toBeGreaterThan(inRegionFull);
    });

    it("nearest matches brute force", () => {
        const randomishU = Float64Array.from({ length: 5000 }, (_, i) => ((i * 7919) % 9973) / 9973);
        const randomishV = Float64Array.from({ length: 5000 }, (_, i) => ((i * 104729) % 9967) / 9967);
        const index = new CartesianSpatialDensityIndex(randomishU, randomishV);

        const probes: Array<[number, number]> = [
            [0.1, 0.9],
            [0.5, 0.5],
            [0.999, 0.001],
            [0.333, 0.666]
        ];
        for (const [pu, pv] of probes) {
            let bruteIdx = -1;
            let bruteDist = Number.POSITIVE_INFINITY;
            for (let i = 0; i < randomishU.length; i++) {
                const du = randomishU[i] - pu;
                const dv = randomishV[i] - pv;
                const d = du * du + dv * dv;
                if (d < bruteDist || (d === bruteDist && i < bruteIdx)) {
                    bruteDist = d;
                    bruteIdx = i;
                }
            }
            const result = index.resolveNearestNormalized(pu, pv);
            expect(result?.index).toBe(bruteIdx);
        }
    });

    it("preserves the largest bubble per relevant node when sizes provided", () => {
        const few = 40;
        const su = Float64Array.from({ length: few }, (_, i) => i / few);
        const sv = Float64Array.from({ length: few }, (_, i) => i / few);
        const sizes = Float64Array.from({ length: few }, (_, i) => (i === 37 ? 999 : 1));
        const index = new CartesianSpatialDensityIndex(su, sv, sizes);
        expect(index.pointCount).toBe(few);

        let sawLargest = false;
        index.collectRepresentatives([0, 0, 1, 1], 4, idx => {
            if (idx === 37) {
                sawLargest = true;
            }
        });
        expect(sawLargest).toBe(true);
    });

    it("range query returns candidates intersecting the window only", () => {
        const index = new CartesianSpatialDensityIndex(u, v);
        const candidates: number[] = [];
        index.queryRangeNormalized([0, 0, 0.02, 0.02], idx => candidates.push(idx));
        expect(candidates.length).toBeGreaterThan(0);
        // Node bounds may extend slightly past the window (quadtree granularity).
        for (const idx of candidates) {
            expect(u[idx]).toBeLessThan(0.0625);
            expect(v[idx]).toBeLessThan(0.0625);
        }
    });

    it("filters out invalid NaN and infinite coordinates during construction (SD-R30)", () => {
        const uWithNaN = Float64Array.from([0.1, Number.NaN, 0.5, Number.POSITIVE_INFINITY, 0.8]);
        const vWithNaN = Float64Array.from([0.2, 0.3, Number.NaN, 0.6, 0.9]);
        const index = new CartesianSpatialDensityIndex(uWithNaN, vWithNaN);

        const collected: number[] = [];
        index.collectRepresentatives([0, 0, 1, 1], 10, idx => collected.push(idx));

        expect(collected).toContain(0);
        expect(collected).toContain(4);
        expect(collected).not.toContain(1);
        expect(collected).not.toContain(2);
        expect(collected).not.toContain(3);
    });
});
