import { signal } from "@angular/core";
import { describe, expect, it } from "vitest";
import type {
    ChartBubbleSeriesRegistration,
    ChartScatterSeriesRegistration
} from "../context/chart-registration-context";
import { CartesianScaleFactory } from "../scale/cartesian-scale-factory";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { CartesianMarkerLayout } from "./cartesian-marker-layout";

describe("CartesianMarkerLayout", () => {
    const styleResolver = new ChartStyleResolver();
    const plotRect = { height: 300, width: 400, x: 50, y: 50 };
    const yScale = CartesianScaleFactory.createLinearScale([0, 100], [350, 50]);

    it("should compute scatter markers with numeric X", () => {
        const linearXScale = CartesianScaleFactory.createLinearScale([0, 10], [50, 450]);
        const scatterReg: ChartScatterSeriesRegistration = {
            color: signal("#3b82f6"),
            data: signal([
                { x: 2, y: 20 },
                { x: 5, y: 50 },
                { x: 8, y: 80 }
            ]),
            element: { nativeElement: {} as HTMLElement },
            field: signal("y"),
            id: "scatter-1",
            name: signal("Scatter 1"),
            pointRadius: signal(5),
            type: "scatter",
            visible: signal(true),
            xField: signal("x")
        };

        const result = CartesianMarkerLayout.compute({
            linearXScale,
            plotRect,
            rootData: [],
            series: [scatterReg],
            styleResolver,
            xAxisType: "linear",
            yScale
        });

        expect(result.seriesScenes.length).toBe(1);
        const scene = result.seriesScenes[0];
        expect(scene.type).toBe("scatter");
        if (scene.type === "scatter") {
            expect(scene.markers.length).toBe(3);
            expect(scene.markers[0].x).toBe(linearXScale.map(2));
            expect(scene.markers[0].y).toBe(yScale.map(20));
            expect(scene.markers[0].radius).toBe(5);
        }
        expect(result.hitTargets.length).toBe(3);
        expect(result.hitTargets[0].visualRadius).toBe(5);
        expect(result.hitTargets[0].radius).toBe(11); // max(5 + 6, 10) = 11
    });

    it("should compute bubble markers with sqrt radius scaling and skip non-positive sizes", () => {
        const linearXScale = CartesianScaleFactory.createLinearScale([0, 100], [50, 450]);
        const bubbleReg: ChartBubbleSeriesRegistration = {
            color: signal("#10b981"),
            data: signal([
                { pop: 100, x: 20, y: 30 },
                { pop: 400, x: 50, y: 60 },
                { pop: 900, x: 80, y: 90 },
                { pop: 0, x: 90, y: 10 }, // zero size -> skipped
                { pop: -50, x: 95, y: 20 } // negative size -> skipped
            ]),
            element: { nativeElement: {} as HTMLElement },
            field: signal("y"),
            id: "bubble-1",
            maxRadius: signal(30),
            minRadius: signal(10),
            name: signal("Bubble 1"),
            sizeField: signal("pop"),
            type: "bubble",
            visible: signal(true),
            xField: signal("x")
        };

        const result = CartesianMarkerLayout.compute({
            linearXScale,
            plotRect,
            rootData: [],
            series: [bubbleReg],
            styleResolver,
            xAxisType: "linear",
            yScale
        });

        expect(result.seriesScenes.length).toBe(1);
        const scene = result.seriesScenes[0];
        expect(scene.type).toBe("bubble");
        if (scene.type === "bubble") {
            expect(scene.markers.length).toBe(3);
            expect(scene.markers[0].radius).toBe(10); // min
            expect(scene.markers[1].radius).toBe(20); // sqrt midpoint (sqrt(400)=20 is midway between 10 and 30)
            expect(scene.markers[2].radius).toBe(30); // max
            expect(scene.markers[0].sizeValue).toBe(100);
        }
    });

    it("should share global size domain across multiple visible Bubble series", () => {
        const linearXScale = CartesianScaleFactory.createLinearScale([0, 100], [50, 450]);
        const bubbleReg1: ChartBubbleSeriesRegistration = {
            color: signal("#10b981"),
            data: signal([{ pop: 100, x: 20, y: 30 }]),
            element: { nativeElement: {} as HTMLElement },
            field: signal("y"),
            id: "b1",
            maxRadius: signal(30),
            minRadius: signal(10),
            name: signal("B1"),
            sizeField: signal("pop"),
            type: "bubble",
            visible: signal(true),
            xField: signal("x")
        };

        const bubbleReg2: ChartBubbleSeriesRegistration = {
            color: signal("#f59e0b"),
            data: signal([{ pop: 900, x: 80, y: 90 }]),
            element: { nativeElement: {} as HTMLElement },
            field: signal("y"),
            id: "b2",
            maxRadius: signal(30),
            minRadius: signal(10),
            name: signal("B2"),
            sizeField: signal("pop"),
            type: "bubble",
            visible: signal(true),
            xField: signal("x")
        };

        const result = CartesianMarkerLayout.compute({
            linearXScale,
            plotRect,
            rootData: [],
            series: [bubbleReg1, bubbleReg2],
            styleResolver,
            xAxisType: "linear",
            yScale
        });

        const b1Scene = result.seriesScenes.find(s => s.id === "b1");
        const b2Scene = result.seriesScenes.find(s => s.id === "b2");
        expect(b1Scene?.markers[0].radius).toBe(10);
        expect(b2Scene?.markers[0].radius).toBe(30);
    });

    it("should return empty scenes if axis type is category", () => {
        const scatterReg: ChartScatterSeriesRegistration = {
            color: signal("#3b82f6"),
            data: signal([{ x: "Cat A", y: 20 }]),
            element: { nativeElement: {} as HTMLElement },
            field: signal("y"),
            id: "scatter-cat",
            name: signal("Scatter"),
            type: "scatter",
            visible: signal(true),
            xField: signal("x")
        };

        const result = CartesianMarkerLayout.compute({
            plotRect,
            rootData: [],
            series: [scatterReg],
            styleResolver,
            xAxisType: "category",
            yScale
        });

        expect(result.seriesScenes.length).toBe(0);
        expect(result.hitTargets.length).toBe(0);
    });
});
