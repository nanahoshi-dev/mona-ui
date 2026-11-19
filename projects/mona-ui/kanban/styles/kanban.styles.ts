import { cva } from "class-variance-authority";

/**
 * The board scrolls sideways when its columns don't fit, also where a parent centers it and would let it overflow;
 * the padding keeps focus outlines clear of its edge.
 */
export const kanbanBaseThemeVariants = cva("flex max-w-full min-w-0 gap-4 overflow-x-auto p-1");

export const kanbanColumnThemeVariants = cva("flex max-h-full w-72 shrink-0 flex-col rounded-lg bg-surface-muted");

export const kanbanColumnHeaderThemeVariants = cva("flex min-h-11 items-center gap-2 px-3 pt-3 pb-1");

export const kanbanColumnTitleThemeVariants = cva("min-w-0 flex-1 truncate text-sm font-semibold text-foreground");

/** A column that has reached its limit shows its count in the warning colors. */
export const kanbanColumnCountThemeVariants = cva(
    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums forced-color-adjust-none",
    {
        variants: {
            full: {
                true: "bg-warning-subtle text-warning-subtle-foreground forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
                false: "bg-background text-muted-foreground forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]"
            }
        },
        defaultVariants: {
            full: false
        }
    }
);

export const kanbanColumnBodyThemeVariants = cva("relative flex min-h-0 flex-1 flex-col");

/** Tall enough when empty to drop a card into. */
export const kanbanColumnListThemeVariants = cva("flex min-h-20 flex-1 flex-col gap-2 overflow-y-auto p-2");

/** Hidden while a card is held over the column, where the card's slot takes its place. */
export const kanbanColumnEmptyThemeVariants = cva(`
    pointer-events-none absolute inset-x-2 top-2 flex h-16 items-center justify-center
    rounded-md border border-dashed border-border text-sm text-muted-foreground
    [.cdk-drop-list-dragging+&]:hidden
`);

export const kanbanColumnFooterThemeVariants = cva("px-2 pb-2");

export const kanbanCardThemeVariants = cva(`
    cursor-grab rounded-md border border-border bg-card p-3 text-sm text-card-foreground
    shadow-(--shadow-raised) select-none
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-indicator
    [&.cdk-drag-preview]:cursor-grabbing
`);
