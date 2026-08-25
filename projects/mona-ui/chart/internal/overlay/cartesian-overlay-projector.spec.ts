import { describe, expect, it } from "vitest";
import { signal } from "@angular/core";
import { CartesianOverlayProjector } from "./cartesian-overlay-projector";
import type { CartesianXYChartScene } from "../scene/chart-scene";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import type {
    ChartAnnotationRegistration,
    ChartReferenceBandRegistration,
    ChartReferenceLineRegistration
} from "../context/chart-registration-context";
import {
    CartesianAxisCoordinateSpace,
    type CartesianAxisCoordinateSnapshot
} from "../viewport/cartesian-axis-coordinate-space";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";

function createMockCoordinateSpace(): CartesianAxisCoordinateSpace {
    const xMap = new Map<string, CartesianAxisCoordinateSnapshot>();
    const yMap = new Map<string, CartesianAxisCoordinateSnapshot>();

    const xScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 100],
        range: [50, 450],
        type: "linear"
    });
    const yScale = CartesianScaleFactory.createExactPositionScale({
        domain: [0, 1000],
        range: [250, 50],
        type: "linear"
    });

    xMap.set("x-main", {
        baseDomain: [0, 100],
        baseScale: xScale,
        range: [50, 450],
        ref: { axis: "x", axisId: "x-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 100],
        viewportScale: xScale
    });

    yMap.set("y-main", {
        baseDomain: [0, 1000],
        baseScale: yScale,
        range: [250, 50],
        ref: { axis: "y", axisId: "y-main" },
        resolvedType: "linear",
        valid: true,
        viewportDomain: [0, 1000],
        viewportScale: yScale
    });

    const catDomain = ["Jan", "Feb", "Mar", "Apr", "May"];
    const catScale = CartesianScaleFactory.createBandScale({
        domain: catDomain,
        range: [50, 450]
    });

    xMap.set("x-cat", {
        baseDomain: catDomain,
        baseScale: catScale,
        range: [50, 450],
        ref: { axis: "x", axisId: "x-cat" },
        resolvedType: "category",
        valid: true,
        viewportDomain: catDomain,
        viewportScale: catScale
    });

    return new CartesianAxisCoordinateSpace(xMap, yMap);
}

function createMockScene(coordSpace: CartesianAxisCoordinateSpace): CartesianXYChartScene {
    return {
        axes: [],
        cartesianKind: "xy",
        coordinateSpace: coordSpace,
        coordinateSystem: "cartesian",
        hasRenderableData: true,
        height: 300,
        hitTargets: [],
        interactionAxis: "x",
        interactionBuckets: [],
        legendItems: [],
        plotRect: { height: 200, width: 400, x: 50, y: 50 },
        primaryXAxisId: "x-main",
        primaryYAxisId: "y-main",
        series: [],
        width: 500
    };
}

describe("CartesianOverlayProjector", () => {
    const styleResolver = new ChartStyleResolver();

    it("returns empty scene when scene or coordinate space is null or plotRect is empty", () => {
        const result = CartesianOverlayProjector.project(null, [], [], [], styleResolver);
        expect(result.annotations).toEqual([]);
        expect(result.referenceBands).toEqual([]);
        expect(result.referenceLines).toEqual([]);
    });

    describe("Reference Lines", () => {
        it("projects continuous X and Y reference lines with correct coordinates and labels", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const refLineX: ChartReferenceLineRegistration = {
                axis: signal<"x" | "y">("x"),
                axisId: signal<string | undefined>(undefined),
                color: signal<string | undefined>("#ef4444"),
                element: { nativeElement: document.createElement("div") },
                id: "line-1",
                label: signal("Target X"),
                labelClass: signal("font-bold"),
                labelOffset: signal(6),
                labelPosition: signal("start"),
                layer: signal("overlay"),
                lineStyle: signal("dashed"),
                opacity: signal(0.9),
                template: signal(undefined),
                userClass: signal(""),
                value: signal(50),
                visible: signal(true),
                width: signal(2)
            };

            const refLineY: ChartReferenceLineRegistration = {
                axis: signal<"x" | "y">("y"),
                axisId: signal<string | undefined>(undefined),
                color: signal<string | undefined>("#10b981"),
                element: { nativeElement: document.createElement("div") },
                id: "line-2",
                label: signal("Target Y"),
                labelClass: signal(""),
                labelOffset: signal(6),
                labelPosition: signal("end"),
                layer: signal("underlay"),
                lineStyle: signal("dotted"),
                opacity: signal(1),
                template: signal(undefined),
                userClass: signal(""),
                value: signal(500),
                visible: signal(true),
                width: signal(1)
            };

            const result = CartesianOverlayProjector.project(scene, [refLineX, refLineY], [], [], styleResolver);

            expect(result.referenceLines.length).toBe(2);

            const projX = result.referenceLines.find(l => l.id === "line-1")!;
            expect(projX).toBeDefined();
            expect(projX.axis).toBe("x");
            expect(projX.coordinate).toBe(250);
            expect(projX.layer).toBe("overlay");
            expect(projX.dash).toEqual([4, 4]);
            expect(projX.label?.formattedText).toBe("Target X");
            expect(projX.label?.anchor).toEqual({ x: 250, y: 56 });

            const projY = result.referenceLines.find(l => l.id === "line-2")!;
            expect(projY).toBeDefined();
            expect(projY.axis).toBe("y");
            expect(projY.coordinate).toBe(150);
            expect(projY.layer).toBe("underlay");
            expect(projY.dash).toEqual([2, 3]);
            expect(projY.label?.formattedText).toBe("Target Y");
            expect(projY.label?.anchor).toEqual({ x: 444, y: 150 });
        });

        it("projects category reference line resolving category center", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const refLineCat: ChartReferenceLineRegistration = {
                axis: signal<"x" | "y">("x"),
                axisId: signal<string | undefined>("x-cat"),
                color: signal(undefined),
                element: { nativeElement: document.createElement("div") },
                id: "line-cat",
                label: signal("March"),
                labelClass: signal(""),
                labelOffset: signal(6),
                labelPosition: signal("center"),
                layer: signal("overlay"),
                lineStyle: signal("solid"),
                opacity: signal(undefined),
                template: signal(undefined),
                userClass: signal(""),
                value: signal("Mar"),
                visible: signal(true),
                width: signal(undefined)
            };

            const result = CartesianOverlayProjector.project(scene, [refLineCat], [], [], styleResolver);

            expect(result.referenceLines.length).toBe(1);
            expect(result.referenceLines[0].coordinate).toBe(250);
            expect(result.referenceLines[0].dash).toEqual([]);
        });

        it("omits reference line when value falls outside plot area or is not visible", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const outOfBoundsLine: ChartReferenceLineRegistration = {
                axis: signal<"x" | "y">("x"),
                axisId: signal(undefined),
                color: signal(undefined),
                element: { nativeElement: document.createElement("div") },
                id: "out-line",
                label: signal(""),
                labelClass: signal(""),
                labelOffset: signal(6),
                labelPosition: signal("end"),
                layer: signal("overlay"),
                lineStyle: signal("dashed"),
                opacity: signal(undefined),
                template: signal(undefined),
                userClass: signal(""),
                value: signal(200),
                visible: signal(true),
                width: signal(undefined)
            };

            const hiddenLine: ChartReferenceLineRegistration = {
                ...outOfBoundsLine,
                id: "hidden-line",
                value: signal(50),
                visible: signal(false)
            };

            const result = CartesianOverlayProjector.project(
                scene,
                [outOfBoundsLine, hiddenLine],
                [],
                [],
                styleResolver
            );

            expect(result.referenceLines.length).toBe(0);
        });
    });

    describe("Reference Bands", () => {
        it("projects continuous reference band with clipped bounds and label", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const band: ChartReferenceBandRegistration = {
                axis: signal<"x" | "y">("x"),
                axisId: signal(undefined),
                borderColor: signal("#3b82f6"),
                borderWidth: signal(1),
                element: { nativeElement: document.createElement("div") },
                fillColor: signal("#93c5fd"),
                fillOpacity: signal(0.2),
                from: signal(25),
                id: "band-1",
                label: signal("Confidence Band"),
                labelClass: signal(""),
                labelOffset: signal(6),
                labelPosition: signal("center"),
                layer: signal("underlay"),
                template: signal(undefined),
                to: signal(75),
                userClass: signal(""),
                visible: signal(true)
            };

            const result = CartesianOverlayProjector.project(scene, [], [band], [], styleResolver);

            expect(result.referenceBands.length).toBe(1);
            const projBand = result.referenceBands[0];
            expect(projBand.bounds.x).toBe(150);
            expect(projBand.bounds.width).toBe(200);
            expect(projBand.bounds.y).toBe(50);
            expect(projBand.bounds.height).toBe(200);
            expect(projBand.label?.anchor).toEqual({ x: 250, y: 150 });
        });

        it("projects category inclusive reference band correctly handling start and end bands", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const catBand: ChartReferenceBandRegistration = {
                axis: signal<"x" | "y">("x"),
                axisId: signal("x-cat"),
                borderColor: signal(undefined),
                borderWidth: signal(undefined),
                element: { nativeElement: document.createElement("div") },
                fillColor: signal(undefined),
                fillOpacity: signal(undefined),
                from: signal("Feb"),
                id: "cat-band",
                label: signal("Q1 Range"),
                labelClass: signal(""),
                labelOffset: signal(6),
                labelPosition: signal("center"),
                layer: signal("underlay"),
                template: signal(undefined),
                to: signal("Apr"),
                userClass: signal(""),
                visible: signal(true)
            };

            const result = CartesianOverlayProjector.project(scene, [], [catBand], [], styleResolver);

            expect(result.referenceBands.length).toBe(1);
            const projBand = result.referenceBands[0];
            expect(projBand.bounds.x).toBeCloseTo(138, 0);
            expect(projBand.bounds.width).toBeCloseTo(224, 0);
        });

        it("clips continuous band that extends past plot area", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const wideBand: ChartReferenceBandRegistration = {
                axis: signal<"x" | "y">("x"),
                axisId: signal(undefined),
                borderColor: signal(undefined),
                borderWidth: signal(undefined),
                element: { nativeElement: document.createElement("div") },
                fillColor: signal(undefined),
                fillOpacity: signal(undefined),
                from: signal(-50),
                id: "wide-band",
                label: signal(""),
                labelClass: signal(""),
                labelOffset: signal(6),
                labelPosition: signal("center"),
                layer: signal("underlay"),
                template: signal(undefined),
                to: signal(50),
                userClass: signal(""),
                visible: signal(true)
            };

            const result = CartesianOverlayProjector.project(scene, [], [wideBand], [], styleResolver);

            expect(result.referenceBands.length).toBe(1);
            expect(result.referenceBands[0].bounds.x).toBe(50);
            expect(result.referenceBands[0].bounds.width).toBe(200);
        });
    });

    describe("Point Annotations", () => {
        it("projects point annotation with marker, connector, and positioned label", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const annotation: ChartAnnotationRegistration = {
                color: signal("#ec4899"),
                connector: signal(true),
                connectorWidth: signal(1.5),
                data: signal({ note: "Outlier" }),
                element: { nativeElement: document.createElement("div") },
                id: "ann-1",
                label: signal("Peak Value"),
                labelClass: signal("badge"),
                labelPlacement: signal("top"),
                marker: signal("diamond"),
                markerRadius: signal(5),
                markerStrokeWidth: signal(2),
                offsetX: signal(0),
                offsetY: signal(-14),
                template: signal(undefined),
                userClass: signal(""),
                visible: signal(true),
                x: signal(50),
                xAxisId: signal(undefined),
                y: signal(800),
                yAxisId: signal(undefined)
            };

            const result = CartesianOverlayProjector.project(scene, [], [], [annotation], styleResolver);

            expect(result.annotations.length).toBe(1);
            const projAnn = result.annotations[0];
            expect(projAnn.point.x).toBeCloseTo(250, 0);
            expect(projAnn.point.y).toBeCloseTo(90, 0);
            expect(projAnn.marker).toBe("diamond");
            expect(projAnn.markerRadius).toBe(5);
            expect(projAnn.color).toBe("#ec4899");
            expect(projAnn.label?.anchor.x).toBe(250);
            expect(projAnn.label?.anchor.y).toBeCloseTo(64, 0);
            expect(projAnn.label?.formattedText).toBe("Peak Value");
            expect(projAnn.data).toEqual({ note: "Outlier" });
        });

        it("omits annotation when anchor falls outside plot area", () => {
            const coordSpace = createMockCoordinateSpace();
            const scene = createMockScene(coordSpace);

            const outAnn: ChartAnnotationRegistration = {
                color: signal(undefined),
                connector: signal(true),
                connectorWidth: signal(1),
                data: signal(undefined),
                element: { nativeElement: document.createElement("div") },
                id: "ann-out",
                label: signal("Out of Bounds"),
                labelClass: signal(""),
                labelPlacement: signal("top"),
                marker: signal("circle"),
                markerRadius: signal(4),
                markerStrokeWidth: signal(1.5),
                offsetX: signal(0),
                offsetY: signal(-12),
                template: signal(undefined),
                userClass: signal(""),
                visible: signal(true),
                x: signal(150),
                xAxisId: signal(undefined),
                y: signal(500),
                yAxisId: signal(undefined)
            };

            const result = CartesianOverlayProjector.project(scene, [], [], [outAnn], styleResolver);

            expect(result.annotations.length).toBe(0);
        });
    });
});
