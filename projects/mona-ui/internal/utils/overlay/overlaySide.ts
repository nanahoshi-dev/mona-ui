import { ConnectionPositionPair } from "@angular/cdk/overlay";

/**
 * The side of its anchor a tooltip or popover opens on. `left` and `right` are physical in every direction; `start`
 * and `end` follow the text direction.
 */
/** A side of the anchor. `start` and `end` follow the direction. */
export type OverlaySide = "bottom" | "end" | "left" | "right" | "start" | "top";

/** A side resolved against the text direction. */
export type PhysicalOverlaySide = "bottom" | "left" | "right" | "top";

const OPPOSITE: Record<PhysicalOverlaySide, PhysicalOverlaySide> = {
    bottom: "top",
    left: "right",
    right: "left",
    top: "bottom"
};

export const resolveOverlaySide = (side: OverlaySide, direction: "ltr" | "rtl"): PhysicalOverlaySide => {
    if (side === "start") {
        return direction === "rtl" ? "right" : "left";
    }
    if (side === "end") {
        return direction === "rtl" ? "left" : "right";
    }
    return side;
};

const positionFor = (side: PhysicalOverlaySide, gap: number, direction: "ltr" | "rtl"): ConnectionPositionPair => {
    // The overlay's start and end follow its direction, so a physical side is translated for RTL.
    const left = direction === "rtl" ? "end" : "start";
    const right = direction === "rtl" ? "start" : "end";
    switch (side) {
        case "top":
            return new ConnectionPositionPair(
                { originX: "center", originY: "top" },
                { overlayX: "center", overlayY: "bottom" },
                0,
                -gap
            );
        case "bottom":
            return new ConnectionPositionPair(
                { originX: "center", originY: "bottom" },
                { overlayX: "center", overlayY: "top" },
                0,
                gap
            );
        case "left":
            return new ConnectionPositionPair(
                { originX: left, originY: "center" },
                { overlayX: right, overlayY: "center" },
                -gap,
                0
            );
        case "right":
            return new ConnectionPositionPair(
                { originX: right, originY: "center" },
                { overlayX: left, overlayY: "center" },
                gap,
                0
            );
    }
};

/**
 * Positions for a popup centered on `side` of its anchor, flipping to the opposite side when it doesn't fit. Each
 * position carries its own offset, so the gap stays between the popup and its anchor after a flip.
 * @param gap the distance between the anchor and the popup, in pixels
 * @param direction the overlay's direction
 */
export const overlaySidePositions = (
    side: PhysicalOverlaySide,
    gap: number,
    direction: "ltr" | "rtl"
): ConnectionPositionPair[] => [positionFor(side, gap, direction), positionFor(OPPOSITE[side], gap, direction)];

/**
 * The physical side of its anchor a popup ended up on, from the position the overlay chose.
 */
export const sideOfPosition = (
    position: Pick<ConnectionPositionPair, "originY" | "overlayX" | "overlayY">,
    direction: "ltr" | "rtl"
): PhysicalOverlaySide => {
    if (position.overlayY === "bottom" && position.overlayX === "center") {
        return "top";
    }
    if (position.overlayY === "top" && position.overlayX === "center") {
        return "bottom";
    }
    // A popup to the anchor's right touches it with its left edge: the overlay's start in LTR, its end in RTL.
    const leftEdge = position.overlayX === (direction === "rtl" ? "end" : "start");
    return leftEdge ? "right" : "left";
};
