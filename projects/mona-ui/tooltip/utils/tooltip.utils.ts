import { ConnectionPositionPair } from "@angular/cdk/overlay";
import { Position } from "@nanahoshi/mona-ui/common";
import { ConnectionPoint, PopupOffset } from "@nanahoshi/mona-ui/popup";

/**
 * Derives the tooltip arrow position from a ConnectionPositionPair.
 * This function determines where the arrow should be positioned based on
 * how the popup is actually positioned relative to its anchor.
 */
export function getArrowPositionFromConnectionPair(connectionPair: ConnectionPositionPair): Position {
    const { originX, originY, overlayX, overlayY } = connectionPair;

    // Tooltip is above the anchor (arrow points down)
    if (originY === "top" && overlayY === "bottom") {
        return "top";
    }

    // Tooltip is below the anchor (arrow points up)
    if (originY === "bottom" && overlayY === "top") {
        return "bottom";
    }

    // Tooltip is to the left of the anchor (arrow points right)
    if (originX === "start" && overlayX === "end") {
        return "left";
    }

    // Tooltip is to the right of the anchor (arrow points left)
    if (originX === "end" && overlayX === "start") {
        return "right";
    }

    // For center-aligned tooltips, prioritize vertical positioning
    if (overlayY === "bottom") {
        return "top";
    }
    if (overlayY === "top") {
        return "bottom";
    }
    if (overlayX === "end") {
        return "left";
    }
    if (overlayX === "start") {
        return "right";
    }

    return "top";
}

/**
 * Gets the appropriate offset for a tooltip based on its position.
 * The offset ensures proper spacing between the tooltip and its anchor element.
 */
export function getOffsetForPosition(position: Position, arrowVisible: boolean): PopupOffset {
    const arrowOffset = arrowVisible ? 12 : 4;
    switch (position) {
        case "top":
            return { horizontal: 0, vertical: -arrowOffset };
        case "bottom":
            return { horizontal: 0, vertical: arrowOffset };
        case "right":
            return { horizontal: arrowOffset, vertical: 0 };
        case "left":
            return { horizontal: -arrowOffset, vertical: 0 };
    }
}

export function getPositionConnectionPoints(position: Position): { anchor: ConnectionPoint; popup: ConnectionPoint } {
    switch (position) {
        case "top":
            return { anchor: "topcenter", popup: "bottomcenter" };
        case "bottom":
            return { anchor: "bottomcenter", popup: "topcenter" };
        case "right":
            return { anchor: "centerright", popup: "centerleft" };
        case "left":
            return { anchor: "centerleft", popup: "centerright" };
    }
}
