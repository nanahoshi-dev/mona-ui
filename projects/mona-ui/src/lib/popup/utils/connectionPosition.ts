import { ConnectionPositionPair, OriginConnectionPosition, OverlayConnectionPosition } from "@angular/cdk/overlay";

export type ConnectionPoint =
    | "topleft"
    | "topcenter"
    | "topright"
    | "centerleft"
    | "center"
    | "centerright"
    | "bottomleft"
    | "bottomcenter"
    | "bottomright";

export const connectionPosition = (
    anchorConnectionPoint: ConnectionPoint,
    popupConnectionPoint: ConnectionPoint
): ConnectionPositionPair[] => {
    const originMap: Record<ConnectionPoint, OriginConnectionPosition> = {
        topleft: { originX: "start", originY: "top" },
        topcenter: { originX: "center", originY: "top" },
        topright: { originX: "end", originY: "top" },
        centerleft: { originX: "start", originY: "center" },
        center: { originX: "center", originY: "center" },
        centerright: { originX: "end", originY: "center" },
        bottomleft: { originX: "start", originY: "bottom" },
        bottomcenter: { originX: "center", originY: "bottom" },
        bottomright: { originX: "end", originY: "bottom" }
    };

    const overlayMap: Record<ConnectionPoint, OverlayConnectionPosition> = {
        topleft: { overlayX: "start", overlayY: "top" },
        topcenter: { overlayX: "center", overlayY: "top" },
        topright: { overlayX: "end", overlayY: "top" },
        centerleft: { overlayX: "start", overlayY: "center" },
        center: { overlayX: "center", overlayY: "center" },
        centerright: { overlayX: "end", overlayY: "center" },
        bottomleft: { overlayX: "start", overlayY: "bottom" },
        bottomcenter: { overlayX: "center", overlayY: "bottom" },
        bottomright: { overlayX: "end", overlayY: "bottom" }
    };

    const primaryPosition: ConnectionPositionPair = {
        ...originMap[anchorConnectionPoint],
        ...overlayMap[popupConnectionPoint]
    };
    const fallbackPositions = generateFallbackPositions(primaryPosition);
    return [primaryPosition, ...fallbackPositions];
};

/**
 * Generate fallback positions for the given primary position.
 * This function is mostly AI-generated.
 * @param primaryPosition The primary position to generate fallbacks for.
 */
const generateFallbackPositions = (primaryPosition: ConnectionPositionPair): ConnectionPositionPair[] => {
    const { originX, originY, overlayX, overlayY } = primaryPosition;
    const fallbacks: ConnectionPositionPair[] = [];

    // 1. Keep same X, try bottom.
    if (originY !== "bottom" && overlayY !== "bottom") {
        if (originY === "top") {
            fallbacks.push({ originX, originY: "bottom", overlayX, overlayY: "bottom" });
        } else {
            //originY is center
            if (overlayY === "top") {
                fallbacks.push({ originX, originY: "center", overlayX, overlayY: "bottom" });
            }
        }
    }

    // 2. Keep same Y, try right
    if (originX !== "end" && overlayX !== "end") {
        if (originX === "start") {
            fallbacks.push({ originX: "end", originY, overlayX: "end", overlayY });
        } else {
            //originX is center
            if (overlayX === "start") {
                fallbacks.push({ originX: "center", originY, overlayX: "end", overlayY });
            }
        }
    }

    // 3. Keep X and flip Y to opposite if possible.
    if (!fallbacks.find(f => f.originX === originX && f.overlayX === overlayX)) {
        if (originY === "top" && overlayY === "top") {
            fallbacks.push({ originX, originY: "bottom", overlayX, overlayY: "bottom" });
        } else if (originY === "bottom" && overlayY === "bottom") {
            fallbacks.push({ originX, originY: "top", overlayX, overlayY: "top" });
        } else if (originY === "top" && overlayY === "bottom") {
            fallbacks.push({ originX, originY: "bottom", overlayX, overlayY: "top" });
        } else if (originY === "bottom" && overlayY === "top") {
            fallbacks.push({ originX, originY: "top", overlayX, overlayY: "bottom" });
        } else {
            //originY === 'center'
            if (overlayY === "top") {
                fallbacks.push({ originX, originY: "center", overlayX, overlayY: "bottom" });
            } else if (overlayY === "bottom") {
                fallbacks.push({ originX, originY: "center", overlayX, overlayY: "top" });
            }
        }
    }

    // 4. Keep Y and flip X to opposite if possible
    if (!fallbacks.find(f => f.originY === originY && f.overlayY === overlayY)) {
        if (originX === "start" && overlayX === "start") {
            fallbacks.push({ originX: "end", originY, overlayX: "end", overlayY });
        } else if (originX === "end" && overlayX === "end") {
            fallbacks.push({ originX: "start", originY, overlayX: "start", overlayY });
        } else if (originX === "start" && overlayX === "end") {
            fallbacks.push({ originX: "end", originY, overlayX: "start", overlayY });
        } else if (originX === "end" && overlayX === "start") {
            fallbacks.push({ originX: "start", originY, overlayX: "end", overlayY });
        } else {
            if (overlayX === "start") {
                fallbacks.push({ originX: "center", originY, overlayX: "end", overlayY });
            } else if (overlayX === "end") {
                fallbacks.push({ originX: "center", originY, overlayX: "start", overlayY });
            }
        }
    }

    // 5. Diagonal Flips
    if (originX === "start" && originY === "top" && overlayX === "end" && overlayY === "bottom") {
        fallbacks.push({ originX: "end", originY: "bottom", overlayX: "start", overlayY: "top" });
    } else if (originX === "end" && originY === "bottom" && overlayX === "start" && overlayY === "top") {
        fallbacks.push({ originX: "start", originY: "top", overlayX: "end", overlayY: "bottom" });
    } else if (originX === "start" && originY === "bottom" && overlayX === "end" && overlayY === "top") {
        fallbacks.push({ originX: "end", originY: "top", overlayX: "start", overlayY: "bottom" });
    } else if (originX === "end" && originY === "top" && overlayX === "start" && overlayY === "bottom") {
        fallbacks.push({ originX: "start", originY: "bottom", overlayX: "end", overlayY: "top" });
    }

    //6. Complete mirroring:
    if (
        !fallbacks.find(
            f => f.originX !== originX && f.overlayX !== overlayX && f.originY !== originY && f.overlayY !== overlayY
        )
    ) {
        if (originX === "start" && originY === "top") {
            fallbacks.push({ originX: "end", originY: "bottom", overlayX: "end", overlayY: "bottom" });
        } else if (originX === "center" && originY === "top") {
            fallbacks.push({ originX: "center", originY: "bottom", overlayX: "center", overlayY: "bottom" });
        } else if (originX === "end" && originY === "top") {
            fallbacks.push({ originX: "start", originY: "bottom", overlayX: "start", overlayY: "bottom" });
        } else if (originX === "start" && originY === "center") {
            fallbacks.push({ originX: "end", originY: "center", overlayX: "end", overlayY: "center" });
        } else if (originX === "center" && originY === "center") {
            fallbacks.push({ originX: "center", originY: "center", overlayX: "center", overlayY: "center" });
        } else if (originX === "end" && originY === "center") {
            fallbacks.push({ originX: "start", originY: "center", overlayX: "start", overlayY: "center" });
        } else if (originX === "start" && originY === "bottom") {
            fallbacks.push({ originX: "end", originY: "top", overlayX: "end", overlayY: "top" });
        } else if (originX === "center" && originY === "bottom") {
            fallbacks.push({ originX: "center", originY: "top", overlayX: "center", overlayY: "top" });
        } else if (originX === "end" && originY === "bottom") {
            fallbacks.push({ originX: "start", originY: "top", overlayX: "start", overlayY: "top" });
        }
    }
    return fallbacks;
};
