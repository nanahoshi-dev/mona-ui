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

    const index = new GaugeHitIndex(center, [target], innerRadius, outerRadius);

    it("hits gauge arc inside 12 o'clock top region", () => {
        // Point at (200, 115): r = 85 (between 70 and 100), angle = 0 deg -> inside -120..120
        const hits = index.query({ x: 200, y: 115 });
        expect(hits.length).toBe(1);
        expect(hits[0].seriesId).toBe("gauge-1");
    });

    it("misses when in the bottom 6 o'clock gap (outside -120..120)", () => {
        // Point at (200, 285): r = 85, angle = 180 deg -> outside -120..120 (gap is 120..240)
        const hits = index.query({ x: 200, y: 285 });
        expect(hits.length).toBe(0);
    });

    it("misses when inside center hub below inner radius", () => {
        const hits = index.query({ x: 200, y: 160 }); // r = 40 < 70
        expect(hits.length).toBe(0);
    });
});
