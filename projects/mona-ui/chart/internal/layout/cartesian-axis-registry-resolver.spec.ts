import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartXAxisRegistration, ChartYAxisRegistration } from "../context/chart-registration-context";
import { CartesianAxisRegistryResolver } from "./cartesian-axis-registry-resolver";

describe("CartesianAxisRegistryResolver", () => {
    const createMockXAxis = (overrides: Partial<ChartXAxisRegistration> = {}): ChartXAxisRegistration => ({
        axisId: signal(undefined),
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
        registrationId: "mock-x",
        symlogConstant: signal(1),
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("category"),
        visible: signal(true),
        ...overrides
    });

    const createMockYAxis = (overrides: Partial<ChartYAxisRegistration> = {}): ChartYAxisRegistration => ({
        axisId: signal(undefined),
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
        registrationId: "mock-y",
        symlogConstant: signal(1),
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("linear"),
        visible: signal(true),
        ...overrides
    });

    it("should generate synthetic X and Y axes when no axis registrations are provided", () => {
        const res = CartesianAxisRegistryResolver.resolve([], []);
        expect(res.xAxes.length).toBe(1);
        expect(res.yAxes.length).toBe(1);
        expect(res.primaryXAxisId).toBe("default-x");
        expect(res.primaryYAxisId).toBe("default-y");
        expect(res.xAxes[0].isSynthetic).toBe(true);
        expect(res.yAxes[0].isSynthetic).toBe(true);
        expect(res.xAxes[0].position).toBe("bottom");
        expect(res.yAxes[0].position).toBe("left");
        expect(res.warnings.length).toBe(0);
    });

    it("should resolve explicit axisId and mark the first axis as primary", () => {
        const x1 = createMockXAxis({ axisId: signal("x-main"), position: signal("bottom") });
        const y1 = createMockYAxis({ axisId: signal("y-temp"), position: signal("left") });
        const y2 = createMockYAxis({ axisId: signal("y-precip"), position: signal("right") });

        const res = CartesianAxisRegistryResolver.resolve([x1], [y1, y2]);
        expect(res.primaryXAxisId).toBe("x-main");
        expect(res.primaryYAxisId).toBe("y-temp");
        expect(res.xAxes.length).toBe(1);
        expect(res.yAxes.length).toBe(2);

        expect(res.yAxes[0].axisId).toBe("y-temp");
        expect(res.yAxes[0].isPrimary).toBe(true);
        expect(res.yAxes[0].stackIndex).toBe(0);

        expect(res.yAxes[1].axisId).toBe("y-precip");
        expect(res.yAxes[1].isPrimary).toBe(false);
        expect(res.yAxes[1].stackIndex).toBe(0); // first axis on 'right'
    });

    it("should assign increasing stack indices for multiple axes on the same side", () => {
        const y1 = createMockYAxis({ axisId: signal("y-left-inner"), position: signal("left") });
        const y2 = createMockYAxis({ axisId: signal("y-left-outer"), position: signal("left") });
        const y3 = createMockYAxis({ axisId: signal("y-right-inner"), position: signal("right") });
        const y4 = createMockYAxis({ axisId: signal("y-right-outer"), position: signal("right") });

        const res = CartesianAxisRegistryResolver.resolve([], [y1, y2, y3, y4]);
        expect(res.yAxes.length).toBe(4);

        const leftAxes = res.yAxes.filter(a => a.position === "left");
        expect(leftAxes[0].stackIndex).toBe(0);
        expect(leftAxes[1].stackIndex).toBe(1);

        const rightAxes = res.yAxes.filter(a => a.position === "right");
        expect(rightAxes[0].stackIndex).toBe(0);
        expect(rightAxes[1].stackIndex).toBe(1);
    });

    it("should detect duplicate axis IDs and issue warning diagnostics", () => {
        const y1 = createMockYAxis({ axisId: signal("shared-y"), position: signal("left") });
        const y2 = createMockYAxis({ axisId: signal("shared-y"), position: signal("right") });

        const res = CartesianAxisRegistryResolver.resolve([], [y1, y2]);
        expect(res.warnings.length).toBeGreaterThanOrEqual(1);
        expect(res.warnings[0]).toContain('Duplicate Y axis ID "shared-y"');
        expect(res.yAxes[0].axisId).toBe("shared-y");
        expect(res.yAxes[1].axisId).not.toBe("shared-y");
    });
});
