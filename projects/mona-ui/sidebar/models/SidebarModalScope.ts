/**
 * @description
 * How far an open drawer's modality reaches.
 * - `"page"` makes everything outside the drawer inert and locks the page's scroll, and the drawer is `aria-modal`.
 * - `"layout"` does that within `mona-sidebar-layout` only, for a sidebar embedded in part of a page. What's around the
 *   layout stays usable, so the drawer isn't `aria-modal`.
 */
export type SidebarModalScope = "page" | "layout";
