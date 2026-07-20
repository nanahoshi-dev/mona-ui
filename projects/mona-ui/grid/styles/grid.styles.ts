import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

const gridRowHeightClass = "h-9";

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

export const gridCellBaseThemeVariants = cva(
    `
        absolute inset-0
        flex w-full
        shadow-[inset_0_-1px_0_0_var(--color-border-subtle)]
    `
);

export const gridCellContainerThemeVariants = cva(
    `
        flex h-full w-full items-center
        flex-1 outline-none
        overflow-hidden
    `,
    {
        variants: {
            editing: {
                true: "px-0",
                false: "px-2"
            }
        },
        defaultVariants: {
            editing: false
        }
    }
);

export const gridCellDirtyIndicatorThemeVariants = cva(`
    absolute top-0 right-0 w-0 h-0
    border-t-[8px] border-l-[8px]
    border-t-destructive border-l-transparent
    pointer-events-none
`);

export const gridCellEditorBaseThemeVariants = cva(`
    flex h-full w-full items-center
    bg-input-background border border-focus-indicator/40
`);

export const gridCellEditorInputThemeVariants = cva(`
    h-full w-full border-transparent
    data-[expanded='true']:border-focus-indicator
    data-[expanded='true']:focus-within:border-focus-indicator/40
`);

export const gridCellTextThemeVariants = cva(`
    truncate cursor-default select-none
`);

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
    absolute flex w-1 h-full bg-primary z-10! top-0 bottom-0
`);

export const gridColumnResizerThemeVariants = cva(`
    absolute top-0 bottom-0 w-3 bg-transparent cursor-col-resize z-10 -right-1.5
`);

export const gridDetailContentCellThemeVariants = cva(`border-b border-b-border-subtle`, {
    variants: {
        nextIsGroup: {
            true: "",
            false: ""
        }
    }
});

export const gridDetailIndentCellThemeVariants = cva(
    `
        border-r border-r-border-subtle border-b border-b-border-subtle
    `,
    {
        variants: {
            nextIsGroup: {
                true: "",
                false: ""
            }
        }
    }
);

export const gridDetailRowThemeVariants = cva(`
    border-b border-b-border-subtle
`);

export const gridFilterRowCellThemeVariants = cva(`flex items-center px-1 py-0.5 w-full`);

export const gridFooterThemeVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-surface-muted border-r border-r-border-subtle border-t border-t-border-subtle
    `
);

export const gridFooterTableThemeVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridFooterTableRowThemeVariants = cva(`relative inline-flex [&>td:last-child]:border-r-0`);

export const gridFooterTableCellThemeVariants = cva(
    `
        relative overflow-hidden
        text-left align-middle px-2 py-2
        bg-surface-muted
        border-r border-r-border-subtle border-b border-b-border-subtle
        font-medium
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
        bg-surface-muted border-r border-r-border-subtle
    `
);

export const gridHeaderThemeVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-surface-muted border-r border-r-border-subtle
    `
);

export const gridHeaderTableThemeVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridHeaderTableRowThemeVariants = cva(
    `relative inline-flex not-first:border-t not-first:border-t-border-subtle [&>th:last-child]:border-r-0`
);

export const gridHeaderTableCellThemeVariants = cva(
    `
        relative select-none
        text-left overflow-visible
        outline-none border-r border-r-border-subtle
        after:absolute after:inset-0 after:pointer-events-none
        focus:after:ring-1 focus:after:ring-inset focus:after:ring-focus-indicator/35
    `
);

export const gridHeaderTableColumnWrapThemeVariants = cva(
    `
        w-full h-full px-1
        flex items-center justify-between
        cursor-pointer overflow-hidden
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
        outline-none
        border-t border-t-border-subtle
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
    `,
    {
        variants: {
            virtual: {
                true: "overflow-x-hidden overflow-y-hidden flex flex-col min-h-0",
                false: "overflow-x-auto overflow-y-scroll"
            }
        }
    }
);

export const gridListTableThemeVariants = cva(
    `
        border-separate border-spacing-0 w-full table-fixed
    `
);

export const gridListTableRowThemeVariants = cva(``, {
    variants: {
        selected: {
            true: `
                    ${gridRowHeightClass}
                    bg-(--color-selected) text-(--color-selected-foreground) hover:bg-(--color-selected-active)
                `,
            false: `${gridRowHeightClass} bg-surface hover:bg-hover`
        }
    }
});

export const gridListTableCellThemeVariants = cva(
    `
        relative
        ${gridRowHeightClass}
        outline-none z-1
        align-top
        after:content-[''] after:block
        after:absolute after:inset-0 after:pointer-events-none
        focus:after:ring-1 focus:after:ring-inset focus:after:ring-focus-indicator/35
    `,
    {
        variants: {
            groupHeader: {
                true: "",
                false: ""
            },
            groupToggle: {
                true: "",
                false: ""
            },
            grouped: {
                true: "",
                false: ""
            },
            indentCell: {
                true: "",
                false: ""
            },
            lastInRow: {
                true: "",
                false: "border-r border-r-border-subtle"
            },
            masterDetailContent: {
                true: "",
                false: ""
            },
            masterDetailToggle: {
                true: "",
                false: ""
            },
            dataCell: {
                true: "",
                false: ""
            }
        },
        compoundVariants: [
            {
                grouped: false,
                masterDetailToggle: true,
                class: ""
            },
            {
                grouped: false,
                dataCell: true,
                class: ""
            },
            {
                grouped: false,
                indentCell: true,
                class: ""
            },
            {
                grouped: false,
                masterDetailContent: true,
                class: ""
            },
            {
                groupHeader: true,
                class: ""
            },
            {
                grouped: true,
                masterDetailToggle: true,
                class: ""
            },
            {
                grouped: true,
                dataCell: true,
                class: ""
            },
            {
                grouped: true,
                indentCell: true,
                class: "bg-surface-muted shadow-[inset_0_-1px_0_0_var(--color-border-subtle)]"
            },
            {
                grouped: true,
                indentCell: false,
                class: "shadow-[inset_0_-1px_0_0_var(--color-border-subtle)]"
            },
            {
                grouped: true,
                indentCell: true,
                masterDetailToggle: true,
                class: ""
            },
            {
                grouped: true,
                groupToggle: true,
                class: ""
            }
        ]
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

export type GridListTableCellVariantInput = VariantInputs<GridListTableCellVariantProps>;

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
    Omit<GridListTableRowVariantInput, "selected">;

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
