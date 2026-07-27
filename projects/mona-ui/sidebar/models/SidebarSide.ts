/**
 * Which edge of the layout the sidebar sits on. Also determines its order within the layout
 * and which side its rail and border are drawn on.
 *
 * `start` and `end` are the preferred values: they follow the document's writing direction, so a
 * `start` sidebar sits on the left in LTR and on the right in RTL without the consumer branching.
 *
 * `left` and `right` are retained as aliases of `start` and `end`. They were always a poor
 * description of the behaviour — the layout orders the sidebar with flexbox, which is
 * direction-relative, so `side="left"` already rendered on the right under RTL.
 */
export type SidebarSide = "start" | "end" | "left" | "right";

/** The direction-relative side, once the `left`/`right` aliases have been folded in. */
export type SidebarLogicalSide = "start" | "end";

export function toLogicalSide(side: SidebarSide): SidebarLogicalSide {
    return side === "end" || side === "right" ? "end" : "start";
}
