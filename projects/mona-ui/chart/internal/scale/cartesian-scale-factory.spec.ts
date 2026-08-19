import { describe, expect, it } from "vitest";
import {
    BandScale,
    CartesianScaleFactory,
    LinearScale,
    LogScale,
    PowScale,
    SqrtScale,
    SymlogScale,
    TimeScale,
    UtcScale
} from "./cartesian-scale-factory";

describe("CartesianScaleFactory and Scale Adapters", () => {
    describe("LinearScale", () => {
        it("should map domain to range and invert correctly", () => {
            const scale = new LinearScale([0, 100], [0, 500]);
            expect(scale.map(0)).toBe(0);
            expect(scale.map(50)).toBe(250);
            expect(scale.map(100)).toBe(500);
            expect(scale.invert(250)).toBe(50);
        });

        it("should generate ticks and format tick values", () => {
            const scale = new LinearScale([0, 100], [0, 500]);
            const ticks = scale.ticks(5);
            expect(ticks.length).toBeGreaterThan(0);
            expect(scale.formatTick(100, 5)).toBe("100");
        });
    });

    describe("LogScale", () => {
        it("should map positive values logarithmically with specified base", () => {
            const scale = new LogScale([1, 1000], [0, 300], 10);
            expect(scale.map(1)).toBeCloseTo(0, 5);
            expect(scale.map(10)).toBeCloseTo(100, 5);
            expect(scale.map(100)).toBeCloseTo(200, 5);
            expect(scale.map(1000)).toBeCloseTo(300, 5);
            expect(scale.invert(200)).toBeCloseTo(100, 5);
        });

        it("should handle negative log domains gracefully", () => {
            const scale = new LogScale([-1000, -1], [300, 0], 10);
            expect(scale.map(-1)).toBeCloseTo(0, 5);
            expect(scale.map(-1000)).toBeCloseTo(300, 5);
        });

        it("should return undefined for zero and opposite-sign values safely", () => {
            const scale = new LogScale([1, 100], [0, 200], 10);
            expect(scale.map(0)).toBeUndefined();
            expect(scale.map(-10)).toBeUndefined();
        });
    });

    describe("SymlogScale", () => {
        it("should handle domains crossing zero smoothly using constant c", () => {
            const scale = new SymlogScale([-100, 100], [0, 200], 1);
            expect(scale.map(0)).toBeCloseTo(100, 2);
            expect(scale.map(-100)).toBeCloseTo(0, 2);
            expect(scale.map(100)).toBeCloseTo(200, 2);
            expect(scale.invert(100)).toBeCloseTo(0, 2);
        });
    });

    describe("PowScale and SqrtScale", () => {
        it("should apply power transformation with custom exponent", () => {
            const scale = new PowScale([0, 10], [0, 100], 2);
            // 0^2 = 0 -> 0; 10^2 = 100 -> 100; for x=5: (25 / 100) * 100 = 25
            expect(scale.map(0)).toBe(0);
            expect(scale.map(5)).toBeCloseTo(25, 2);
            expect(scale.map(10)).toBe(100);
            expect(scale.invert(25)).toBeCloseTo(5, 2);
        });

        it("should apply square root transformation", () => {
            const scale = new SqrtScale([0, 100], [0, 100]);
            // sqrt(0) = 0 -> 0; sqrt(100) = 10 -> 100; for x=25: sqrt(25)/10 * 100 = 50
            expect(scale.map(0)).toBe(0);
            expect(scale.map(25)).toBeCloseTo(50, 2);
            expect(scale.map(100)).toBe(100);
            expect(scale.invert(50)).toBeCloseTo(25, 2);
        });
    });

    describe("TimeScale and UtcScale", () => {
        it("should map Date objects and timestamps linearly across time", () => {
            const d1 = new Date(2025, 0, 1);
            const d2 = new Date(2025, 0, 3);
            const mid = new Date(2025, 0, 2);
            const scale = new TimeScale([d1, d2], [0, 200]);

            expect(scale.map(d1)).toBeCloseTo(0, 2);
            expect(scale.map(mid)).toBeCloseTo(100, 2);
            expect(scale.map(d2)).toBeCloseTo(200, 2);
            expect(scale.invert(100).getTime()).toBeCloseTo(mid.getTime(), -2);
        });
    });

    describe("BandScale", () => {
        it("should divide range evenly across discrete categories", () => {
            const scale = new BandScale(["A", "B", "C", "D"], [0, 400], 0, 0);
            expect(scale.bandwidth()).toBeCloseTo(100, 2);
            expect(scale.map("A")).toBe(0);
            expect(scale.map("B")).toBe(100);
            expect(scale.map("C")).toBe(200);
            expect(scale.map("D")).toBe(300);
        });
    });

    describe("CartesianScaleFactory", () => {
        it("should construct appropriate scale instances via factory methods", () => {
            const linear = CartesianScaleFactory.createNumericScale({
                domain: [0, 100],
                range: [0, 500],
                type: "linear"
            });
            expect(linear.type).toBe("linear");

            const log = CartesianScaleFactory.createNumericScale({
                domain: [1, 1000],
                logBase: 10,
                range: [0, 300],
                type: "log"
            });
            expect(log.type).toBe("log");

            const symlog = CartesianScaleFactory.createNumericScale({
                domain: [-100, 100],
                range: [0, 200],
                symlogConstant: 2,
                type: "symlog"
            });
            expect(symlog.type).toBe("symlog");

            const pow = CartesianScaleFactory.createNumericScale({
                domain: [0, 10],
                exponent: 3,
                range: [0, 1000],
                type: "pow"
            });
            expect(pow.type).toBe("pow");

            const sqrt = CartesianScaleFactory.createNumericScale({
                domain: [0, 100],
                range: [0, 10],
                type: "sqrt"
            });
            expect(sqrt.type).toBe("sqrt");
        });

        it("should safely handle invalid explicit min/max on positive log scale with nice=true", () => {
            const log = CartesianScaleFactory.createNumericScale({
                domain: [1, 100],
                explicitMin: 0, // invalid for positive log
                nice: true,
                range: [0, 200],
                type: "log"
            });
            expect(log.domain()[0]).toBeGreaterThan(0);
        });

        it("should swap min and max when explicitMin > explicitMax", () => {
            const linear = CartesianScaleFactory.createNumericScale({
                domain: [0, 100],
                explicitMax: 10,
                explicitMin: 80,
                nice: true,
                range: [0, 200],
                type: "linear"
            });
            expect(linear.domain()[0]).toBeLessThanOrEqual(linear.domain()[1]);
        });
    });
});
