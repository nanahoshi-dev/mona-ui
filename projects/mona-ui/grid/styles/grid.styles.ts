import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

const gridRowMinHeightClass = "min-h-9";
const gridVirtualRowHeightClass =
    "h-(--mona-grid-row-height) min-h-(--mona-grid-row-height) max-h-(--mona-grid-row-height)";

export const gridBaseThemeVariants = cva(
    `
        relative flex flex-col
        h-full overflow-hidden
        text-foreground text-sm
        bg-surface border border-border
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            }
        }
    }
);

export const gridCellBaseThemeVariants = cva("flex w-full min-w-0", {
    variants: {
        virtual: {
            true: "absolute inset-0 overflow-hidden",
            false: `relative ${gridRowMinHeightClass}`
        }
    },
    defaultVariants: { virtual: false }
});

export const gridCellContainerThemeVariants = cva(
    `
        flex w-full min-w-0 items-center
        flex-1 outline-none focus-visible:outline-hidden
    `,
    {
        variants: {
            virtual: {
                true: "h-full overflow-hidden",
                false: gridRowMinHeightClass
            },
            editing: {
                true: "px-0",
                false: "px-2"
            }
        },
        defaultVariants: {
            editing: false,
            virtual: false
        },
        compoundVariants: [{ virtual: false, editing: false, class: "py-1" }]
    }
);

export const gridCellDirtyIndicatorThemeVariants = cva(`
    absolute top-0 end-0 w-0 h-0
    border-t-[8px] border-s-[8px]
    border-t-destructive border-s-transparent
    pointer-events-none
`);

export const gridCellEditorBaseThemeVariants = cva(
    `
    flex w-full min-w-0 items-center
    bg-input-background border border-focus-indicator/40
`,
    {
        variants: { virtual: { true: "h-full overflow-hidden", false: gridRowMinHeightClass } },
        defaultVariants: { virtual: false }
    }
);

export const gridCellEditorInputThemeVariants = cva(
    `
    w-full border-transparent
    data-[expanded='true']:border-focus-indicator
    data-[expanded='true']:focus-within:border-focus-indicator/40
`,
    {
        variants: { virtual: { true: "h-full", false: "min-h-8" } },
        defaultVariants: { virtual: false }
    }
);

export const gridCellTextThemeVariants = cva(`
    truncate cursor-default select-none
`);

/** The tree toggle in a tree grid's cell: a chevron the size of a small icon button. */
export const gridTreeToggleThemeVariants = cva(`
    me-1 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm
    hover:bg-hover
`);

/** Takes a tree toggle's room in a row without children, so sibling rows line up. */
export const gridTreeLeafSpacerThemeVariants = cva("me-1 size-5 shrink-0");

export const gridSelectAllCellThemeVariants = cva(`
    absolute inset-0 flex h-full w-full items-center justify-center
`);

export const gridSelectionCellThemeVariants = cva("flex w-full items-center justify-center", {
    variants: { virtual: { true: "absolute inset-0 h-full", false: gridRowMinHeightClass } },
    defaultVariants: { virtual: false }
});

export const gridColumnActionsThemeVariants = cva(`
    flex items-center justify-center
    text-xs [&_i]:text-xs
`);

export const gridColumnDragPreviewThemeVariants = cva(
    `
        flex items-center justify-center
        px-2! py-0.5!
        bg-surface-raised! text-foreground!
        border! border-border! rounded-md shadow-(--shadow-overlay)!
    `
);

export const gridColumnDropHintThemeVariants = cva(`
    absolute flex w-1 h-full bg-[var(--mona-indicator-color,var(--color-primary))] z-10! top-0 bottom-0
`);

export const gridColumnResizerThemeVariants = cva(`
    absolute top-0 bottom-0 w-3 bg-transparent cursor-col-resize z-10 -end-1.5 touch-none
    outline-none focus-visible:outline-hidden focus-visible:bg-focus-indicator/40
`);

export const gridRowReorderHandleThemeVariants = cva(`
    flex min-h-9 w-full items-center justify-center
    cursor-grab select-none touch-none
    text-muted-foreground
    hover:text-foreground
    active:cursor-grabbing
    focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-indicator/50
    disabled:cursor-not-allowed disabled:text-muted-foreground/35 disabled:hover:text-muted-foreground/35
`);

/** On drop, the preview glides into the row's new slot and fades out. */
export const gridRowDragPreviewThemeVariants = cva(`
    flex items-center gap-2
    px-2! py-1!
    bg-surface-raised! text-foreground!
    border! border-border! rounded-md shadow-(--shadow-overlay)!
    [&.cdk-drag-animating]:opacity-0
    [&.cdk-drag-animating]:transition-[transform,opacity] [&.cdk-drag-animating]:duration-200
    [&.cdk-drag-animating]:ease-[cubic-bezier(0.2,0,0,1)]
    motion-reduce:[&.cdk-drag-animating]:transition-none
`);

export const gridFilterRowCellThemeVariants = cva(`
    flex items-center px-1 py-0.5 w-full
    [--mona-effect-control-background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]
    [--mona-effect-control-fallback-background-color:var(--mona-effect-raised-fallback-background-color,var(--color-surface-raised))]
    [--mona-effect-control-background-image:var(--mona-effect-raised-background-image,none)]
    [--mona-effect-control-backdrop-filter:var(--mona-effect-raised-backdrop-filter,none)]
`);

export const gridFooterThemeVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-surface-muted border-e border-e-border-subtle border-t border-t-border-subtle
    `
);

export const gridFooterTableThemeVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridFooterTableRowThemeVariants = cva(`relative inline-flex [&>td:last-child]:border-e-0`, {
    variants: { virtual: { true: `${gridVirtualRowHeightClass} overflow-hidden`, false: "" } },
    defaultVariants: { virtual: false }
});

export const gridFooterTableCellThemeVariants = cva(
    `
        relative overflow-hidden outline-none focus-visible:outline-hidden
        text-start align-middle px-2 py-2
        bg-surface-muted
        border-e border-e-border-subtle border-b border-b-border-subtle
        font-medium
        after:absolute after:inset-0 after:pointer-events-none
        focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus-indicator
    `
);

export const gridGroupPanelPlaceholderThemeVariants = cva(`
    truncate text-muted-foreground
`);

export const gridGroupPanelThemeVariants = cva(
    `
        flex items-center flex-wrap
        p-1 h-auto gap-1
        bg-surface-muted border-b border-b-border-subtle
    `
);

export const gridGroupRowThemeVariants = cva(
    `
        relative z-10
        w-full
        bg-surface-muted border-e border-e-border-subtle
    `,
    { variants: { virtual: { true: gridVirtualRowHeightClass, false: "" } }, defaultVariants: { virtual: false } }
);

export const gridHeaderThemeVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-surface-muted border-e border-e-border-subtle
    `
);

export const gridHeaderTableThemeVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridHeaderTableRowThemeVariants = cva(
    `relative inline-flex not-first:border-t not-first:border-t-border-subtle [&>th:last-child]:border-e-0`
);

/**
 * A column group row, and the column header row under group rows. Group titles draw the line under them, so a column
 * outside a group reads as one tall header.
 */
export const gridHeaderGroupTableRowThemeVariants = cva(`relative inline-flex [&>th:last-child]:border-e-0`);

/**
 * A group's title cell, over the columns it spans. It clips rather than hides its overflow, so it isn't a scroll
 * container and its title can stick to the scrolling header.
 */
export const gridHeaderGroupCellThemeVariants = cva(
    `
        relative select-none
        text-start overflow-clip
        outline-none focus-visible:outline-hidden
        border-e border-e-border-subtle border-b border-b-border-subtle
        after:absolute after:inset-0 after:pointer-events-none
        focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus-indicator
    `
);

/** The space above a column that isn't in a group at that level. */
export const gridHeaderGroupSpacerCellThemeVariants = cva(`border-e border-e-border-subtle`);

/**
 * A group's title text. It sticks next to the pinned start columns while the rest of its group is in view, so a
 * group scrolled partly out of view keeps its title readable.
 */
export const gridHeaderGroupTitleThemeVariants = cva(`sticky block w-fit max-w-full px-2 py-2 truncate font-medium`);

export const gridHeaderTableCellThemeVariants = cva(
    `
        relative select-none
        text-start overflow-visible
        outline-none focus-visible:outline-hidden border-e border-e-border-subtle
        after:absolute after:inset-0 after:pointer-events-none
        focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus-indicator
    `
);

/** A `th` of the filter row: the grid's keys reach it, and Enter or F2 moves into its filter. */
export const gridFilterRowHeaderCellThemeVariants = cva(
    `
        relative overflow-hidden
        outline-none focus-visible:outline-hidden border-e border-border
        after:absolute after:inset-0 after:pointer-events-none
        focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus-indicator
    `
);

export const gridHeaderTableColumnWrapThemeVariants = cva(
    `
        w-full h-full px-1
        flex items-center justify-between
        overflow-hidden
    `
);

export const gridHeaderTableColumnTitleThemeVariants = cva(
    `
        flex-1 px-1 py-2 truncate
        font-medium
    `
);

export const gridListBaseThemeVariants = cva(
    `
        w-full h-full
        outline-none focus-visible:outline-hidden
        border-t border-t-border-subtle
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
    `,
    {
        variants: {
            virtual: {
                true: "overflow-x-hidden overflow-y-hidden flex flex-col min-h-0",
                false: "block overflow-x-auto overflow-y-scroll"
            }
        }
    }
);

/**
 * While a row is dragged, the other rows slide out of its way and the slot it will drop into shows the row dimmed.
 */
export const gridListTableThemeVariants = cva(
    `
        border-separate border-spacing-0 w-full table-fixed
        [&_.cdk-drop-list-dragging>.cdk-drag]:transition-transform
        [&_.cdk-drop-list-dragging>.cdk-drag]:duration-200
        [&_.cdk-drop-list-dragging>.cdk-drag]:ease-[cubic-bezier(0.2,0,0,1)]
        motion-reduce:[&_.cdk-drop-list-dragging>.cdk-drag]:transition-none
        [&_.cdk-drag-placeholder]:opacity-60 [&_.cdk-drag-placeholder>td]:bg-hover!
    `
);

export const gridListTableRowThemeVariants = cva(``, {
    variants: {
        /**
         * Row navigation: the row shows the focus of its cell, with a ring over its cells, above pinned ones too. In
         * forced colors, where rings don't paint and neither do the cells' backgrounds, the row has an outline.
         */
        rowFocus: {
            true: `
                relative after:absolute after:inset-0 after:z-2 after:pointer-events-none after:content-['']
                has-[>td:focus-visible]:after:ring-2 has-[>td:focus-visible]:after:ring-inset
                has-[>td:focus-visible]:after:ring-focus-indicator
                forced-colors:has-[>td:focus-visible]:outline-2
                forced-colors:has-[>td:focus-visible]:-outline-offset-2
                forced-colors:has-[>td:focus-visible]:outline-[CanvasText]
            `,
            false: ""
        },
        selected: {
            true: `
                    bg-(--color-selected) text-(--color-selected-foreground) hover:bg-(--color-selected-active)
                    [&>td:first-child]:before:absolute [&>td:first-child]:before:inset-y-0
                    [&>td:first-child]:before:start-0 [&>td:first-child]:before:w-0.5
                    [&>td:first-child]:before:bg-(--color-selected-border)
                    [&>td:first-child]:before:forced-color-adjust-none
                    forced-colors:[&>td:first-child]:before:bg-[Highlight]
                `,
            false: "bg-surface hover:bg-hover"
        },
        virtual: { true: gridVirtualRowHeightClass, false: "" }
    },
    defaultVariants: { rowFocus: false, virtual: false }
});

export const gridListTableCellThemeVariants = cva(
    `
        relative
        outline-none z-1
        align-middle
        border-b border-b-border-subtle
        after:content-[''] after:block
        after:absolute after:inset-0 after:pointer-events-none
        aria-selected:bg-(--color-selected) aria-selected:text-(--color-selected-foreground)
        forced-colors:aria-selected:bg-[Highlight] forced-colors:aria-selected:text-[HighlightText]
        forced-colors:aria-selected:forced-color-adjust-none
    `,
    {
        variants: {
            virtual: { true: gridVirtualRowHeightClass, false: "" },
            groupIndent: { true: "bg-surface-muted", false: "" },
            lastInRow: { true: "", false: "border-e border-e-border-subtle" },
            /** Row navigation: the row draws the focus, so the cell doesn't. */
            rowFocus: {
                true: "",
                false: `
                    focus-visible:outline-hidden
                    focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-focus-indicator
                `
            }
        },
        defaultVariants: { rowFocus: false, virtual: false }
    }
);

export const gridNoDataThemeVariants = cva(
    `
        flex items-center justify-center h-full
        text-muted-foreground border-t border-t-border-subtle
    `
);

type GridBaseVariantProps = VariantProps<typeof gridBaseThemeVariants>;

type GridBaseVariantInput = VariantInputs<GridBaseVariantProps>;

export type GridHeaderTableCellVariantProps = VariantProps<typeof gridHeaderTableCellThemeVariants>;

export type GridHeaderTableCellVariantInput = VariantInputs<GridHeaderTableCellVariantProps>;

export type GridHeaderTableColumnTitleVariantProps = VariantProps<typeof gridHeaderTableColumnTitleThemeVariants>;

export type GridHeaderTableColumnTitleVariantInput = VariantInputs<GridHeaderTableColumnTitleVariantProps>;

export type GridHeaderTableColumnWrapVariantProps = VariantProps<typeof gridHeaderTableColumnWrapThemeVariants>;

export type GridHeaderTableColumnWrapVariantInput = VariantInputs<GridHeaderTableColumnWrapVariantProps>;

export type GridHeaderTableRowVariantProps = VariantProps<typeof gridHeaderTableRowThemeVariants>;

export type GridHeaderTableRowVariantInput = VariantInputs<GridHeaderTableRowVariantProps>;

export type GridHeaderTableVariantProps = VariantProps<typeof gridHeaderTableThemeVariants>;

export type GridHeaderTableVariantInput = VariantInputs<GridHeaderTableVariantProps>;

export type GridHeaderVariantProps = VariantProps<typeof gridHeaderThemeVariants>;

export type GridHeaderVariantInput = VariantInputs<GridHeaderVariantProps>;

export type GridListTableCellVariantProps = VariantProps<typeof gridListTableCellThemeVariants>;

export type GridListTableCellVariantInput = Omit<VariantInputs<GridListTableCellVariantProps>, "rowFocus" | "virtual">;

type GridListTableRowVariantProps = VariantProps<typeof gridListTableRowThemeVariants>;

type GridListTableRowVariantInput = VariantInputs<GridListTableRowVariantProps>;

export type GridListTableVariantProps = VariantProps<typeof gridListTableThemeVariants>;

export type GridListTableVariantInput = VariantInputs<GridListTableVariantProps>;

type GridListBaseVariantProps = VariantProps<typeof gridListBaseThemeVariants>;

type GridListBaseVariantInput = VariantInputs<GridListBaseVariantProps>;

export type GridListVariantProps = VariantProps<typeof gridListBaseThemeVariants> &
    GridListTableVariantProps &
    GridListTableRowVariantProps &
    GridListTableCellVariantProps;

export type GridListVariantInput = Omit<GridListBaseVariantInput, "virtual"> &
    GridListTableVariantInput &
    Omit<GridListTableRowVariantInput, "rowFocus" | "selected" | "virtual">;

export type GridVariantProps = GridBaseVariantProps &
    GridHeaderTableCellVariantProps &
    GridHeaderTableColumnTitleVariantProps &
    GridHeaderTableColumnWrapVariantProps &
    GridHeaderTableRowVariantProps &
    GridHeaderTableVariantProps &
    GridHeaderVariantProps;

export type GridVariantInput = GridBaseVariantInput &
    GridHeaderTableCellVariantInput &
    GridHeaderTableColumnTitleVariantInput &
    GridHeaderTableColumnWrapVariantInput &
    Omit<GridHeaderTableRowVariantInput, "isFilterRow"> &
    GridHeaderTableVariantInput &
    GridHeaderVariantInput;
