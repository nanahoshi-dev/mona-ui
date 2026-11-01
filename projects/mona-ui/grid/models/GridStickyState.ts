/**
 * How a layout column stays pinned while the grid scrolls horizontally.
 * Sides are logical, so `start` is the left edge in LTR and the right edge in RTL.
 */
export interface GridStickyState {
    /** Whether this is the innermost pinned column on its side, which draws the separator border. */
    readonly edge: boolean;
    /** The distance from the pinned side, in pixels. */
    readonly offset: number;
    readonly side: "end" | "start";
}
