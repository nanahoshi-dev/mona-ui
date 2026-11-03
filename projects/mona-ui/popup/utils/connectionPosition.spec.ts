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

function coversAnchor(position: ConnectionPositionPair): boolean {
    const originX = { center: anchor.x + anchor.width / 2, end: anchor.x + anchor.width, start: anchor.x };
    const originY = { bottom: anchor.y + anchor.height, center: anchor.y + anchor.height / 2, top: anchor.y };
    const x = originX[position.originX] - { center: popup.width / 2, end: popup.width, start: 0 }[position.overlayX];
    const y = originY[position.originY] - { bottom: popup.height, center: popup.height / 2, top: 0 }[position.overlayY];
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

    it("lists each position once", () => {
        for (const anchorPoint of connectionPoints) {
            for (const popupPoint of connectionPoints) {
                const positions = connectionPosition(anchorPoint, popupPoint).map(describePosition);
                expect(new Set(positions).size).toBe(positions.length);
            }
        }
    });
});
