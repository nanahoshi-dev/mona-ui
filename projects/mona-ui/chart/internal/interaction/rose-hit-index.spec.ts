import { describe, expect, it } from "vitest";
import { RoseHitIndex } from "./rose-hit-index";
import type { SceneHitTarget } from "../scene/scene-geometry";

describe("RoseHitIndex", () => {
    const center = { x: 200, y: 200 };

    const target1: SceneHitTarget = {
        arc: {
            center,
            endAngle: Math.PI, // 0 to 180 degrees
            innerRadius: 0,
            outerRadius: 100,
            padAngle: 0,
            startAngle: 0
        },
        dataIndex: 0,
        datum: { cat: "North", val: 100 },
        index: 0,
        itemId: "s:North",
        seriesId: "rose-1",
        seriesName: "Rose",
        seriesType: "rose",
        value: 100,
        xKey: "s:North",
        xValue: "North"
    };

    const target2: SceneHitTarget = {
        arc: {
            center,
            endAngle: Math.PI * 2, // 180 to 360 degrees
            innerRadius: 0,
            outerRadius: 60,
            padAngle: 0,
            startAngle: Math.PI
        },
        dataIndex: 1,
        datum: { cat: "South", val: 60 },
        index: 1,
        itemId: "s:South",
        seriesId: "rose-1",
        seriesName: "Rose",
        seriesType: "rose",
        value: 60,
        xKey: "s:South",
        xValue: "South"
    };

    const index = new RoseHitIndex(center, [target1, target2], 0, Math.PI * 2, 2);

    it("hits target1 in right half within radius 100", () => {
        const hits = index.query({ x: 250, y: 200 }); // angle = 90 deg, r = 50
        expect(hits.length).toBe(1);
        expect(hits[0].itemId).toBe("s:North");
    });

    it("hits target2 in left half within radius 60", () => {
        const hits = index.query({ x: 160, y: 200 }); // angle = 270 deg, r = 40
        expect(hits.length).toBe(1);
        expect(hits[0].itemId).toBe("s:South");
    });

    it("misses target2 when exceeding radius 60 in left half", () => {
        const hits = index.query({ x: 120, y: 200 }); // angle = 270 deg, r = 80 > 60
        expect(hits.length).toBe(0);
    });

    it("handles fallback iteration when category count is 0", () => {
        const fallbackIndex = new RoseHitIndex(center, [target1, target2], 0, 0, 0);
        const hits = fallbackIndex.query({ x: 250, y: 200 });
        expect(hits.length).toBe(1);
        expect(hits[0].itemId).toBe("s:North");
    });
});
