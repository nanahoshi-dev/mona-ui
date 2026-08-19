import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type { ChartXAxisRegistration, ChartYAxisRegistration } from "../context/chart-registration-context";
import { BandScale, LinearScale } from "../scale/cartesian-scale-factory";
import { CartesianAxisLayoutEngine } from "./cartesian-axis-layout-engine";

describe("CartesianAxisLayoutEngine", () => {
    const createXAxisReg = (overrides: Partial<ChartXAxisRegistration> = {}): ChartXAxisRegistration => ({
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(undefined),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(undefined),
        labelRotation: signal(undefined),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("bottom"),
        registrationId: "mock-x",
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("category"),
        visible: signal(true),
        ...overrides
    });

    const createYAxisReg = (overrides: Partial<ChartYAxisRegistration> = {}): ChartYAxisRegistration => ({
        axisId: signal(undefined),
        axisLine: signal(true),
        formatter: signal(undefined),
        gridLines: signal(undefined),
        labelMaxWidth: signal(undefined),
        labelPadding: signal(undefined),
        labelRotation: signal(undefined),
        labels: signal(true),
        labelTemplate: signal(undefined),
        max: signal(undefined),
        min: signal(undefined),
        nice: signal(true),
        position: signal("left"),
        registrationId: "mock-y",
        tickCount: signal(undefined),
        tickMarks: signal(false),
        tickSize: signal(undefined),
        title: signal(""),
        titlePadding: signal(undefined),
        type: signal("linear"),
        visible: signal(true),
        ...overrides
    });

    it("returns 0 gutter and invisible scene when registration is not visible", () => {
        const reg = createXAxisReg({ visible: signal(false) });
        const scale = new BandScale(["A", "B", "C"], [0, 300]);

        const result = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "category",
            containerSize: 300,
            defaultGridLines: false,
            plotGutterConstraint: 100,
            position: "bottom",
            registration: reg,
            scale
        });

        expect(result.gutter).toBe(0);
        expect(result.axisScene.visible).toBe(false);
        expect(result.axisScene.ticks.length).toBe(0);
    });

    it("generates category ticks with tickKey and labelVisible flags", () => {
        const reg = createXAxisReg();
        const scale = new BandScale(["Jan", "Feb", "Mar"], [0, 300]);

        const result = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "category",
            containerSize: 300,
            defaultGridLines: false,
            plotGutterConstraint: 100,
            position: "bottom",
            registration: reg,
            scale
        });

        expect(result.axisScene.ticks.length).toBe(3);
        expect(result.axisScene.ticks[0].tickKey).toBe("axis:x:category:0:Jan");
        expect(result.axisScene.ticks[0].labelVisible).toBe(true);
        expect(result.gutter).toBeGreaterThan(15);
    });

    it("auto-rotates dense bottom X category labels to negative angles (-45 or -90)", () => {
        const categories = ["LongCategoryOne", "LongCategoryTwo", "LongCategoryThree", "LongCategoryFour"];
        const reg = createXAxisReg({ labelRotation: signal("auto") });
        const scale = new BandScale(categories, [0, 200]); // tight bandwidth = 50px

        const measurements = new Map([
            ["axis:x:category:0:LongCategoryOne", { height: 16, width: 120 }],
            ["axis:x:category:1:LongCategoryTwo", { height: 16, width: 120 }],
            ["axis:x:category:2:LongCategoryThree", { height: 16, width: 120 }],
            ["axis:x:category:3:LongCategoryFour", { height: 16, width: 120 }]
        ]);

        const result = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "category",
            containerSize: 200,
            defaultGridLines: false,
            measurements,
            plotGutterConstraint: 150,
            position: "bottom",
            registration: reg,
            scale
        });

        // Bottom X outward rotation is negative (-45 or -90)
        expect(result.resolvedRotation).toBeLessThan(0);
        expect(result.axisScene.labelRotation).toBe(result.resolvedRotation);
    });

    it("auto-rotates dense top X category labels to positive angles (+45 or +90)", () => {
        const categories = ["LongCategoryOne", "LongCategoryTwo", "LongCategoryThree", "LongCategoryFour"];
        const reg = createXAxisReg({ labelRotation: signal("auto"), position: signal("top") });
        const scale = new BandScale(categories, [0, 200]);

        const measurements = new Map([
            ["axis:x:category:0:LongCategoryOne", { height: 16, width: 120 }],
            ["axis:x:category:1:LongCategoryTwo", { height: 16, width: 120 }],
            ["axis:x:category:2:LongCategoryThree", { height: 16, width: 120 }],
            ["axis:x:category:3:LongCategoryFour", { height: 16, width: 120 }]
        ]);

        const result = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "category",
            containerSize: 200,
            defaultGridLines: false,
            measurements,
            plotGutterConstraint: 150,
            position: "top",
            registration: reg,
            scale
        });

        // Top X outward rotation is positive (+45 or +90)
        expect(result.resolvedRotation).toBeGreaterThan(0);
        expect(result.axisScene.labelRotation).toBe(result.resolvedRotation);
    });

    it("applies labelMaxWidth to clamp label dimensions before rotation", () => {
        const reg = createXAxisReg({ labelMaxWidth: signal(40) });
        const scale = new BandScale(["A"], [0, 100]);
        const measurements = new Map([["axis:x:category:0:A", { height: 16, width: 100 }]]);

        const result = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "category",
            containerSize: 100,
            defaultGridLines: false,
            measurements,
            plotGutterConstraint: 100,
            position: "bottom",
            registration: reg,
            scale
        });

        expect(result.axisScene.ticks[0].unrotatedWidth).toBe(40);
    });

    it("normalizes NaN, negative, or invalid presentation inputs cleanly", () => {
        const reg = createXAxisReg({
            labelPadding: signal(Number.NaN as any),
            tickCount: signal(-5),
            tickSize: signal(-10 as any),
            titlePadding: signal(Number.POSITIVE_INFINITY as any)
        });
        const scale = new LinearScale([0, 100], [0, 200]);

        const result = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "x",
            axisType: "linear",
            containerSize: 200,
            defaultGridLines: false,
            plotGutterConstraint: 100,
            position: "bottom",
            registration: reg,
            scale
        });

        expect(result.axisScene.tickSize).toBe(6);
        expect(result.axisScene.labelPadding).toBe(4);
        expect(result.axisScene.titlePadding).toBe(6);
        expect(result.axisScene.ticks.length).toBeGreaterThan(0);
    });

    it("incorporates tickMarks and titlePadding in gutter calculation", () => {
        const regWithoutMarks = createYAxisReg({ title: signal("Revenue") });
        const regWithMarks = createYAxisReg({
            tickMarks: signal(true),
            tickSize: signal(12),
            title: signal("Revenue"),
            titlePadding: signal(10)
        });
        const scale = new LinearScale([0, 100], [200, 0]);

        const resultWithout = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "y",
            axisType: "linear",
            containerSize: 200,
            defaultGridLines: true,
            plotGutterConstraint: 150,
            position: "left",
            registration: regWithoutMarks,
            scale
        });

        const resultWith = CartesianAxisLayoutEngine.computeAxisLayout({
            axis: "y",
            axisType: "linear",
            containerSize: 200,
            defaultGridLines: true,
            plotGutterConstraint: 150,
            position: "left",
            registration: regWithMarks,
            scale
        });

        expect(resultWith.gutter).toBeGreaterThan(resultWithout.gutter);
        expect(resultWith.axisScene.tickMarks).toBe(true);
        expect(resultWith.axisScene.tickSize).toBe(12);
    });
});
