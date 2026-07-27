/**
 * The visual treatment of the sidebar region.
 *
 * - `sidebar` — flush against the edge of the layout, separated by a single border.
 * - `floating` — detached from the edge, with its own rounded, bordered surface.
 * - `inset` — the sidebar itself is plain, and the inset region beside it becomes the raised surface.
 */
export type SidebarVariant = "sidebar" | "floating" | "inset";
