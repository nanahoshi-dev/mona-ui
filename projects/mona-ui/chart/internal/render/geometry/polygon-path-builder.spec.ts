import { describe, expect, it } from "vitest";
import { buildPolygonPath, buildPolylinePath } from "./polygon-path-builder";

describe("PolygonPathBuilder", () => {
    it("builds closed polygon path", () => {
        const points = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
        ];
        const path = buildPolygonPath(points);
        expect(path).toBe("M 0 0 L 10 0 L 10 10 L 0 10 Z");
    });

    it("builds open polyline path", () => {
        const points = [
            { x: 0, y: 0 },
            { x: 10, y: 10 }
        ];
        const path = buildPolylinePath(points);
        expect(path).toBe("M 0 0 L 10 10");
    });
});
