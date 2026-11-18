import type { ConnectionPositionPair } from "@angular/cdk/overlay";
import { type ConnectionPoint, connectionPosition } from "./connectionPosition";

const connectionPoints: ConnectionPoint[] = [
    "topleft",
    "topcenter",
    "topright",
    "centerleft",
    "center",
    "centerright",
    "bottomleft",
    "bottomcenter",
    "bottomright"
];

// A 100 × 30 anchor and an 80 × 60 popup, enough to tell whether a position puts the popup over the anchor.
const anchor = { height: 30, width: 100, x: 100, y: 100 };
const popup = { height: 60, width: 80 };

/** The popup's top-left corner for a position, offsets included, the way the CDK places it in a left-to-right page. */
function placePopup(position: ConnectionPositionPair): { x: number; y: number } {
    const originX = { center: anchor.x + anchor.width / 2, end: anchor.x + anchor.width, start: anchor.x };
    const originY = { bottom: anchor.y + anchor.height, center: anchor.y + anchor.height / 2, top: anchor.y };
    const overlayX = { center: popup.width / 2, end: popup.width, start: 0 };
    const overlayY = { bottom: popup.height, center: popup.height / 2, top: 0 };
    return {
        x: originX[position.originX] - overlayX[position.overlayX] + (position.offsetX ?? 0),
        y: originY[position.originY] - overlayY[position.overlayY] + (position.offsetY ?? 0)
    };
}

function coversAnchor(position: ConnectionPositionPair): boolean {
    const { x, y } = placePopup(position);
    return (
        x < anchor.x + anchor.width &&
        x + popup.width > anchor.x &&
        y < anchor.y + anchor.height &&
        y + popup.height > anchor.y
    );
}

function describePosition(position: ConnectionPositionPair): string {
    return `${position.originX} ${position.originY} → ${position.overlayX} ${position.overlayY}`;
}

function describeOffset(position: ConnectionPositionPair): string {
    return `${describePosition(position)} (${position.offsetX}, ${position.offsetY})`;
}

/** The space between the anchor and a popup that sits wholly before or after it on the axis, or null. */
function gap(position: ConnectionPositionPair, axis: "x" | "y"): number | null {
    const { x, y } = placePopup(position);
    if (axis === "x") {
        if (position.originX === "end" && position.overlayX === "start") {
            return x - (anchor.x + anchor.width);
        }
        return position.originX === "start" && position.overlayX === "end" ? anchor.x - (x + popup.width) : null;
    }
    if (position.originY === "bottom" && position.overlayY === "top") {
        return y - (anchor.y + anchor.height);
    }
    return position.originY === "top" && position.overlayY === "bottom" ? anchor.y - (y + popup.height) : null;
}

describe("connectionPosition", () => {
    it("lists the requested position first", () => {
        expect(connectionPosition("bottomleft", "topleft")[0]).toEqual({
            originX: "start",
            originY: "bottom",
            overlayX: "start",
            overlayY: "top"
        });
    });

    it("falls back from below the anchor to its other edge and then above it", () => {
        expect(connectionPosition("bottomleft", "topleft").slice(1).map(describePosition)).toEqual([
            "end bottom → end top",
            "start top → start bottom",
            "end top → end bottom"
        ]);
    });

    it("never falls back to a position over the anchor when the requested one is beside it", () => {
        const covering: string[] = [];
        for (const anchorPoint of connectionPoints) {
            for (const popupPoint of connectionPoints) {
                const [primary, ...fallbacks] = connectionPosition(anchorPoint, popupPoint);
                if (coversAnchor(primary)) {
                    continue;
                }
                fallbacks
                    .filter(coversAnchor)
                    .forEach(f => covering.push(`${anchorPoint}/${popupPoint}: ${describePosition(f)}`));
            }
        }

        expect(covering).toEqual([]);
    });

    it("leaves the offsets to the position strategy without an offset", () => {
        for (const position of connectionPosition("bottomleft", "topleft")) {
            expect(position.offsetX).toBeUndefined();
            expect(position.offsetY).toBeUndefined();
        }
    });

    it("negates the vertical offset on the fallbacks that flip the popup above the anchor", () => {
        expect(connectionPosition("bottomleft", "topleft", { horizontal: 0, vertical: 4 }).map(describeOffset)).toEqual(
            [
                "start bottom → start top (0, 4)",
                "end bottom → end top (0, 4)",
                "start top → start bottom (0, -4)",
                "end top → end bottom (0, -4)"
            ]
        );
    });

    it("negates the horizontal offset on the fallbacks that align the popup with the anchor's other end", () => {
        expect(
            connectionPosition("bottomleft", "topleft", { horizontal: -1, vertical: 2 }).map(describeOffset)
        ).toEqual([
            "start bottom → start top (-1, 2)",
            "end bottom → end top (1, 2)",
            "start top → start bottom (-1, -2)",
            "end top → end bottom (1, -2)"
        ]);
    });

    it("negates the horizontal offset on the fallback that flips the popup to the anchor's other side", () => {
        expect(connectionPosition("centerright", "centerleft", { horizontal: 8 }).map(describeOffset)).toEqual([
            "end center → start center (8, 0)",
            "start center → end center (-8, 0)"
        ]);
    });

    it("keeps the requested position's gap between the anchor and the popup on whichever side a fallback puts it", () => {
        const wrongGaps: string[] = [];
        for (const anchorPoint of connectionPoints) {
            for (const popupPoint of connectionPoints) {
                const positions = connectionPosition(anchorPoint, popupPoint, { horizontal: 3, vertical: 4 });
                for (const axis of ["x", "y"] as const) {
                    const expected = gap(positions[0], axis);
                    if (expected === null) {
                        continue;
                    }
                    positions
                        .filter(position => gap(position, axis) !== null && gap(position, axis) !== expected)
                        .forEach(position =>
                            wrongGaps.push(
                                `${anchorPoint}/${popupPoint}: ${describePosition(position)} has a ${axis} gap of ${gap(position, axis)}`
                            )
                        );
                }
            }
        }

        expect(wrongGaps).toEqual([]);
    });

    it("lists each position once", () => {
        for (const anchorPoint of connectionPoints) {
            for (const popupPoint of connectionPoints) {
                const positions = connectionPosition(anchorPoint, popupPoint).map(describePosition);
                expect(new Set(positions).size).toBe(positions.length);
            }
        }
    });
});
