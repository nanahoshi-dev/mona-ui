/**
 * Edge the sheet opens from. `left` and `right` are physical, whatever the direction; `start` and `end` follow it
 * (`start` is the left edge in LTR and the right edge in RTL).
 */
export type SheetSide = "bottom" | "end" | "left" | "right" | "start" | "top";

/** A side resolved to a physical edge. */
export type SheetPhysicalSide = "bottom" | "left" | "right" | "top";
