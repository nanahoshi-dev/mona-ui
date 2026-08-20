import { describe, expect, it } from "vitest";
import { ChartOverlayLabelPositioner } from "./chart-overlay-label-positioner";
import type { ChartRect } from "../../models/chart.models";

describe("ChartOverlayLabelPositioner (CAA-R3-007)", () => {
    const containerRect: ChartRect = {
        height: 300,
        width: 500,
        x: 0,
        y: 0
    };

    it("clamps badge center anchor when it overflows container left edge", () => {
        // Desired anchor near left edge: x = 10, measurement width = 60, fraction = 0.5 (center)
        // Badge left would be 10 - 30 = -20 (overflows by 20px)
        // Clamped anchor.x should be 30px so badge left is exactly 0px
        const result = ChartOverlayLabelPositioner.position({
            anchorFraction: { x: 0.5, y: 0.5 },
            containerRect,
            desiredAnchor: { x: 10, y: 150 },
            measurement: { height: 20, width: 60 }
        });

        expect(result.anchor.x).toBe(30);
        expect(result.bounds.x).toBe(0);
        expect(result.transform).toBe("translate(-50%, -50%)");
    });

    it("clamps badge center anchor when it overflows container right edge", () => {
        // Desired anchor near right edge: x = 490, measurement width = 60, fraction = 0.5
        // Clamped anchor.x should be 470px so badge right is exactly 500px
        const result = ChartOverlayLabelPositioner.position({
            anchorFraction: { x: 0.5, y: 0.5 },
            containerRect,
            desiredAnchor: { x: 490, y: 150 },
            measurement: { height: 20, width: 60 }
        });

        expect(result.anchor.x).toBe(470);
        expect(result.bounds.x).toBe(440);
        expect(result.bounds.x + result.bounds.width).toBe(500);
    });

    it("applies anchorFraction transform correctly for top-aligned placement", () => {
        // Placement = top -> fraction = { x: 0.5, y: 1 } -> transform = translate(-50%, -100%)
        const result = ChartOverlayLabelPositioner.position({
            anchorFraction: { x: 0.5, y: 1 },
            containerRect,
            desiredAnchor: { x: 250, y: 5 },
            measurement: { height: 20, width: 40 }
        });

        expect(result.transform).toBe("translate(-50%, -100%)");
        // Clamped Y anchor should be 20px so bounds top is 0px
        expect(result.anchor.y).toBe(20);
        expect(result.bounds.y).toBe(0);
    });

    it("applies anchorFraction and clamping for bottom, left, right placements (Gate P)", () => {
        // Bottom placement: fraction = { x: 0.5, y: 0 } -> transform = translate(-50%, 0%)
        const resBottom = ChartOverlayLabelPositioner.position({
            anchorFraction: { x: 0.5, y: 0 },
            containerRect,
            desiredAnchor: { x: 250, y: 295 },
            measurement: { height: 20, width: 40 }
        });
        expect(resBottom.transform).toBe("translate(-50%, 0%)");
        expect(resBottom.anchor.y).toBe(280);
        expect(resBottom.bounds.y + resBottom.bounds.height).toBe(300);

        // Left placement: fraction = { x: 1, y: 0.5 } -> transform = translate(-100%, -50%)
        const resLeft = ChartOverlayLabelPositioner.position({
            anchorFraction: { x: 1, y: 0.5 },
            containerRect,
            desiredAnchor: { x: 10, y: 150 },
            measurement: { height: 20, width: 40 }
        });
        expect(resLeft.transform).toBe("translate(-100%, -50%)");
        expect(resLeft.anchor.x).toBe(40);
        expect(resLeft.bounds.x).toBe(0);

        // Right placement: fraction = { x: 0, y: 0.5 } -> transform = translate(0%, -50%)
        const resRight = ChartOverlayLabelPositioner.position({
            anchorFraction: { x: 0, y: 0.5 },
            containerRect,
            desiredAnchor: { x: 490, y: 150 },
            measurement: { height: 20, width: 40 }
        });
        expect(resRight.transform).toBe("translate(0%, -50%)");
        expect(resRight.anchor.x).toBe(460);
        expect(resRight.bounds.x + resRight.bounds.width).toBe(500);
    });

    it("respects padding when clamping (Gate P)", () => {
        const result = ChartOverlayLabelPositioner.position({
            anchorFraction: { x: 0.5, y: 0.5 },
            containerRect,
            desiredAnchor: { x: 5, y: 150 },
            measurement: { height: 20, width: 60 },
            padding: 8
        });

        // Left edge + 8px padding = bounds.x is 8, anchor.x is 8 + 30 = 38
        expect(result.anchor.x).toBe(38);
        expect(result.bounds.x).toBe(8);
    });
});
