import { describe, expect, it } from "vitest";
import type { ChartPoint, ChartRect } from "../../models/chart.models";
import type { ScenePolarSlice } from "../scene/polar-scene";
import {
    formatPolarLabelText,
    layoutOutsidePolarLabels
    
} from "./polar-label-layout";

function createSlice(id: string, startAngle: number, endAngle: number, value: number): ScenePolarSlice {
    return {
        category: id,
        centroid: { x: 200, y: 200 },
        color: "#3b82f6",
        cornerRadius: 0,
        dataIndex: 0,
        datum: {},
        endAngle,
        formattedCategory: id,
        formattedPercentage: `${value}%`,
        formattedValue: `${value}`,
        innerRadius: 0,
        insideLabelBackgroundColor: "#3b82f6",
        insideLabelPoint: { x: 200, y: 200 },
        outerRadius: 100,
        padAngle: 0,
        percentage: value / 100,
        sliceId: id,
        startAngle,
        value,
        visible: true
    };
}

describe("polar-label-layout", () => {
    const center: ChartPoint = { x: 200, y: 200 };
    const plotRect: ChartRect = { height: 400, width: 400, x: 0, y: 0 };
    const outerRadius = 100;

    it("should format polar label text based on labelContent", () => {
        const slice = {
            formattedCategory: "Desktop",
            formattedPercentage: "65%",
            formattedValue: "1,300"
        };

        expect(formatPolarLabelText(slice, "percentage")).toBe("65%");
        expect(formatPolarLabelText(slice, "value")).toBe("1,300");
        expect(formatPolarLabelText(slice, "category")).toBe("Desktop");
        expect(formatPolarLabelText(slice, "category-percentage")).toBe("Desktop: 65%");
    });

    it("should compute natural outside connector coordinates starting directly from the visible arc edge", () => {
        // Slice 1: 0 to Math.PI (right hemisphere, midAngle Math.PI / 2 -> 3 o'clock)
        const sliceRight = createSlice("right-slice", 0, Math.PI, 50);
        // Slice 2: Math.PI to 2*Math.PI (left hemisphere, midAngle 3*Math.PI / 2 -> 9 o'clock)
        const sliceLeft = createSlice("left-slice", Math.PI, 2 * Math.PI, 50);

        const strokeWidth = 2;
        const labelMap = layoutOutsidePolarLabels({
            center,
            outerRadius,
            plotRect,
            slices: [sliceRight, sliceLeft],
            strokeWidth
        });

        const labelRight = labelMap.get("right-slice");
        const labelLeft = labelMap.get("left-slice");

        expect(labelRight).toBeDefined();
        expect(labelLeft).toBeDefined();
        expect(labelRight?.side).toBe("right");
        expect(labelLeft?.side).toBe("left");

        // Right side: 3 o'clock (sin=1, cos=0)
        // arcAnchor radius = 100 + strokeWidth/2 = 101 -> x: 200 + 101 = 301, y: 200
        expect(labelRight?.arcAnchor.x).toBeCloseTo(301, 1);
        expect(labelRight?.arcAnchor.y).toBeCloseTo(200, 1);
        // elbow radius = 101 + 12 = 113 -> x: 200 + 113 = 313, y: 200
        expect(labelRight?.elbow.x).toBeCloseTo(313, 1);
        expect(labelRight?.elbow.y).toBeCloseTo(200, 1);
        // lineEnd = x: 313 + 18 = 331, y: 200
        expect(labelRight?.lineEnd.x).toBeCloseTo(331, 1);
        expect(labelRight?.lineEnd.y).toBeCloseTo(200, 1);

        // Left side: 9 o'clock (sin=-1, cos=0)
        // arcAnchor radius = 101 -> x: 200 - 101 = 99, y: 200
        expect(labelLeft?.arcAnchor.x).toBeCloseTo(99, 1);
        // elbow radius = 113 -> x: 200 - 113 = 87, y: 200
        expect(labelLeft?.elbow.x).toBeCloseTo(87, 1);
        // lineEnd = x: 87 - 18 = 69, y: 200
        expect(labelLeft?.lineEnd.x).toBeCloseTo(69, 1);
    });

    it("should resolve vertical collisions and preserve monotonic Y order on the same hemisphere", () => {
        // Multiple small slices closely clustered on the right side
        const s1 = createSlice("s1", 0.1, 0.3, 10);
        const s2 = createSlice("s2", 0.3, 0.5, 10);
        const s3 = createSlice("s3", 0.5, 0.7, 10);

        const labelMap = layoutOutsidePolarLabels({
            center,
            outerRadius,
            plotRect,
            slices: [s1, s2, s3]
        });

        const l1 = labelMap.get("s1")!;
        const l2 = labelMap.get("s2")!;
        const l3 = labelMap.get("s3")!;

        expect(l1.visible).toBe(true);
        expect(l2.visible).toBe(true);
        expect(l3.visible).toBe(true);

        // Top to bottom monotonic Y order
        expect(l1.position.y).toBeLessThan(l2.position.y);
        expect(l2.position.y).toBeLessThan(l3.position.y);

        // Required separation check: min gap between adjacent labels
        const gapBetween1And2 = (l2.position.y - l2.heightEstimate / 2) - (l1.position.y + l1.heightEstimate / 2);
        const gapBetween2And3 = (l3.position.y - l3.heightEstimate / 2) - (l2.position.y + l2.heightEstimate / 2);

        expect(gapBetween1And2).toBeGreaterThanOrEqual(3.9);
        expect(gapBetween2And3).toBeGreaterThanOrEqual(3.9);
    });

    it("should respect top and bottom vertical bounds", () => {
        // Slices near top and bottom
        const topSlice = createSlice("top", 0.01, 0.05, 5);
        const bottomSlice = createSlice("bottom", Math.PI - 0.05, Math.PI - 0.01, 5);

        const labelMap = layoutOutsidePolarLabels({
            center,
            outerRadius,
            plotRect,
            slices: [topSlice, bottomSlice]
        });

        const topLabel = labelMap.get("top")!;
        const bottomLabel = labelMap.get("bottom")!;

        const topBound = plotRect.y + 4;
        const bottomBound = plotRect.y + plotRect.height - 4;

        expect(topLabel.position.y - topLabel.heightEstimate / 2).toBeGreaterThanOrEqual(topBound);
        expect(bottomLabel.position.y + bottomLabel.heightEstimate / 2).toBeLessThanOrEqual(bottomBound);
    });

    it("should suppress smallest slices when vertical space is constrained rather than overlapping", () => {
        // Small plot height with 6 slices on the right hemisphere
        const tightPlotRect: ChartRect = { height: 60, width: 400, x: 0, y: 0 };
        const slices: ScenePolarSlice[] = [];
        const values = [50, 20, 15, 10, 3, 2];

        let start = 0;
        for (let i = 0; i < values.length; i++) {
            const span = (values[i] / 100) * Math.PI;
            slices.push(createSlice(`slice-${i}`, start, start + span, values[i]));
            start += span;
        }

        const labelMap = layoutOutsidePolarLabels({
            center,
            outerRadius,
            plotRect: tightPlotRect,
            slices
        });

        const l0 = labelMap.get("slice-0")!; // value 50
        const lSmall = labelMap.get("slice-5")!; // value 2

        // Largest slice should remain visible
        expect(l0.visible).toBe(true);
        // Smallest slice should be suppressed in tight height
        expect(lSmall.visible).toBe(false);

        // Visible labels must not overlap
        const visibleLabels = Array.from(labelMap.values()).filter(l => l.visible);
        for (let i = 1; i < visibleLabels.length; i++) {
            const prev = visibleLabels[i - 1];
            const curr = visibleLabels[i];
            const gap = (curr.position.y - curr.heightEstimate / 2) - (prev.position.y + prev.heightEstimate / 2);
            expect(gap).toBeGreaterThanOrEqual(3.9);
        }
    });

    it("should respect actual measured label dimensions", () => {
        const s1 = createSlice("s1", 0.2, 0.4, 30);
        const s2 = createSlice("s2", 0.5, 0.7, 30);

        const measurements = new Map([
            ["s1", { height: 40, width: 80 }],
            ["s2", { height: 30, width: 60 }]
        ]);

        const labelMap = layoutOutsidePolarLabels({
            center,
            measurements,
            outerRadius,
            plotRect,
            slices: [s1, s2]
        });

        const l1 = labelMap.get("s1")!;
        const l2 = labelMap.get("s2")!;

        expect(l1.heightEstimate).toBe(40);
        expect(l1.widthEstimate).toBe(80);
        expect(l2.heightEstimate).toBe(30);

        const gap = (l2.position.y - 15) - (l1.position.y + 20);
        expect(gap).toBeGreaterThanOrEqual(3.9);
    });
});
