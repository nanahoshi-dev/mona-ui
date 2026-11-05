import { Position } from "@nanahoshi/mona-ui/common";
import { ConnectionPoint, PopupOffset } from "@nanahoshi/mona-ui/popup";

/**
 * Gets the appropriate offset for a tooltip based on its position.
 * The offset ensures proper spacing between the tooltip and its anchor element.
 * @deprecated No longer used by the tooltip or popover, which keep the gap on the side they flip to and place
 * `left` and `right` physically in RTL. Kept for existing callers.
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

/**
 * @deprecated No longer used by the tooltip or popover. Kept for existing callers.
 */
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
