import type { DropEffect } from "../models/DropEffect";

/** On the root element while something is dragged: no text is selected on the way. */
export const DRAGGING_ROOT_CLASSES = "select-none";

/**
 * On the root element while something is dragged, the pointer says what a drop would do, over every element, as a
 * file explorer's does: a plus to copy, a link arrow to link, a "no" sign where nothing can be dropped.
 */
export const DRAG_CURSOR_CLASSES: Readonly<Record<DropEffect, string>> = {
    copy: "cursor-copy! **:cursor-copy!",
    link: "cursor-alias! **:cursor-alias!",
    move: "cursor-default! **:cursor-default!",
    none: "cursor-no-drop! **:cursor-no-drop!"
};

/**
 * The preview that follows the pointer, above popups. Clicks go through it to what is under it, and screen readers
 * skip it: what a drop did is the app's to announce.
 */
export const DRAG_PREVIEW_HOST_CLASSES = "pointer-events-none fixed z-1100 will-change-transform";

/** The preview shown without a template: what a drop would do, and how many items, on a popup's surface. */
export const DRAG_PREVIEW_DEFAULT_CLASSES = `
    inline-flex items-center gap-1 rounded-md border border-border bg-surface-overlay px-1.5 py-1 text-sm
    text-foreground shadow-(--shadow-overlay)
`;

/** The count on the default preview, for more than one item. */
export const DRAG_PREVIEW_COUNT_CLASSES = `
    min-w-5 rounded-full bg-primary px-1.5 text-center text-xs leading-5 text-primary-foreground tabular-nums
    forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]
`;

/**
 * A `monaDropTarget` while a drag is over it and a drop there would do something: a frame inside it in the selection's
 * color, and in contrast themes, where rings don't paint, an outline. The attribute `data-drop-target` says so, for
 * other styles: a component whose contents would hide the frame, such as a grid's rows, draws it over them itself.
 */
export const DROP_TARGET_CLASSES = `
    data-drop-target:inset-ring-2 data-drop-target:inset-ring-(--color-selected-border)
    forced-colors:data-drop-target:outline-2 forced-colors:data-drop-target:-outline-offset-2
    forced-colors:data-drop-target:outline-[Highlight]
`;
