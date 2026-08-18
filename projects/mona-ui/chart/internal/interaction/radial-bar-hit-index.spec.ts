import { describe, expect, it } from "vitest";
import { RadialBarHitIndex } from "./radial-bar-hit-index";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("RadialBarHitIndex", () => {
    const center = { x: 200, y: 200 };

    const target1: SceneHitTarget = {
        arc: {
            center,
            endAngle: Math.PI, // 0 to 180 degrees (right half)
            innerRadius: 80,
            outerRadius: 100,
            padAngle: 0,
            startAngle: 0
        },
        dataIndex: 0,
        datum: { cat: "A", val: 50 },
        index: 0,
        itemId: "s:A",
        seriesId: "rb-1",
        seriesName: "CPU",
        seriesType: "radialBar",
        value: 50,
        xKey: "s:A",
        xValue: "A"
    };

    const target2: SceneHitTarget = {
        arc: {
            center,
            endAngle: Math.PI * 1.5, // 0 to 270 degrees
            innerRadius: 50,
            outerRadius: 70,
            padAngle: 0,
            startAngle: 0
        },
        dataIndex: 1,
        datum: { cat: "B", val: 75 },
        index: 1,
        itemId: "s:B",
        seriesId: "rb-1",
        seriesName: "CPU",
        seriesType: "radialBar",
        value: 75,
        xKey: "s:B",
        xValue: "B"
    };

    const index = new RadialBarHitIndex(center, [target1, target2]);

    it("hits target1 when inside outer ring radius and angular sweep", () => {
        // Point at (290, 200): radius = 90 (between 80 and 100), angle = 90 deg (Math.PI / 2) -> inside 0..PI
        const hits = index.query({ x: 290, y: 200 });
        expect(hits.length).toBe(1);
        expect(hits[0].itemId).toBe("s:A");
    });

    it("misses target1 when inside outer ring radius but outside angular sweep", () => {
        // Point at (110, 200): radius = 90, angle = 270 deg (Math.PI * 1.5) -> outside 0..PI
        const hits = index.query({ x: 110, y: 200 });
        expect(hits.length).toBe(0);
    });

    it("hits target2 when inside inner ring radius and angular sweep", () => {
        // Point at (260, 200): radius = 60 (between 50 and 70), angle = 90 deg -> inside 0..1.5*PI
        const hits = index.query({ x: 260, y: 200 });
        expect(hits.length).toBe(1);
        expect(hits[0].itemId).toBe("s:B");
    });

    it("misses when in the gap between rings", () => {
        // Radius = 75 (between 70 and 80)
        const hits = index.query({ x: 275, y: 200 });
        expect(hits.length).toBe(0);
    });
});
