import { describe, expect, it } from "vitest";
import { GaugeHitIndex } from "./gauge-hit-index";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("GaugeHitIndex", () => {
    const center = { x: 200, y: 200 };
    const innerRadius = 70;
    const outerRadius = 100;

    const target: SceneHitTarget = {
        arc: {
            center,
            endAngle: (Math.PI * 2) / 3, // 120 deg
            innerRadius,
            outerRadius,
            padAngle: 0,
            startAngle: -(Math.PI * 2) / 3 // -120 deg (240 deg)
        },
        dataIndex: 0,
        datum: { val: 50 },
        index: 0,
        itemId: "gauge-1",
        seriesId: "gauge-1",
        seriesName: "Gauge",
        seriesType: "gauge",
        value: 50,
        xKey: "gauge-1",
        xValue: "Gauge"
    };

    it("hits gauge arc inside 12 o'clock top region when indicator is arc", () => {
        const index = new GaugeHitIndex({
            center,
            indicator: "arc",
            target,
            valueArc: target.arc
        });

        // Point at (200, 115): r = 85 (between 70 and 100), angle = 0 deg -> inside -120..120
        const hits = index.query({ x: 200, y: 115 });
        expect(hits.length).toBe(1);
        expect(hits[0].seriesId).toBe("gauge-1");
    });

    it("misses when in the bottom 6 o'clock gap (outside -120..120) for arc indicator", () => {
        const index = new GaugeHitIndex({
            center,
            indicator: "arc",
            target,
            valueArc: target.arc
        });

        const hits = index.query({ x: 200, y: 285 });
        expect(hits.length).toBe(0);
    });

    it("hits needle line segment and hub when indicator is needle", () => {
        const needleAngle = 0; // 12 o'clock pointing straight up (0, -y)
        const index = new GaugeHitIndex({
            center,
            indicator: "needle",
            needle: {
                angle: needleAngle,
                hubRadius: 10,
                length: 80,
                width: 6
            },
            target
        });

        // Near needle shaft at (200, 150): dy = -50, dx = 0
        const shaftHits = index.query({ x: 200, y: 150 });
        expect(shaftHits.length).toBe(1);

        // Inside hub circle at (200, 205): r = 5 <= hubRadius (10)
        const hubHits = index.query({ x: 200, y: 205 });
        expect(hubHits.length).toBe(1);

        // Far away at 3 o'clock: (270, 200)
        const missHits = index.query({ x: 270, y: 200 });
        expect(missHits.length).toBe(0);
    });

    it("returns empty array for null geometry", () => {
        const index = new GaugeHitIndex(null);
        expect(index.query({ x: 200, y: 200 })).toEqual([]);
    });
});
