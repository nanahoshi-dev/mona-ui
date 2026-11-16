import type { GlobalPositionStrategy, OverlayRef, PositionStrategy } from "@angular/cdk/overlay";

export interface GlobalOverlayPosition {
    /** Distance from the viewport's left edge in pixels; centered horizontally when omitted. Physical in RTL too. */
    readonly left?: number | null;
    /** Distance from the viewport's top edge in pixels; centered vertically when omitted. */
    readonly top?: number | null;
}

/**
 * Places a global overlay through its position strategy, so later `updatePosition()` calls (a direction change, a
 * resize) keep it where it is instead of resetting inline styles. Each axis is independent: a `top` alone keeps the
 * overlay centered horizontally. Centering follows the overlay's size as it grows or shrinks.
 */
export const positionGlobalOverlay = (overlayRef: OverlayRef, position: GlobalOverlayPosition): void => {
    const strategy = overlayRef.getConfig().positionStrategy;
    if (!isGlobalPositionStrategy(strategy)) {
        return;
    }
    if (position.left != null) {
        strategy.left(`${position.left}px`);
    } else {
        strategy.centerHorizontally();
    }
    if (position.top != null) {
        strategy.top(`${position.top}px`);
    } else {
        strategy.centerVertically();
    }
    overlayRef.updatePosition();
};

/**
 * Recognizes a global strategy by its methods, not with `instanceof`. A value import of `@angular/cdk/overlay` here,
 * even an unused one, puts the overlay module in the initial bundle of an application whose overlays are all in lazily
 * loaded code.
 */
function isGlobalPositionStrategy(strategy: PositionStrategy | undefined): strategy is GlobalPositionStrategy {
    const candidate = strategy as Partial<GlobalPositionStrategy> | undefined;
    return (
        typeof candidate?.centerHorizontally === "function" &&
        typeof candidate.centerVertically === "function" &&
        typeof candidate.left === "function" &&
        typeof candidate.top === "function"
    );
}
