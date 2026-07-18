import { cva } from "class-variance-authority";

const gridRowHeightClass = "h-9";

export const gridBaseVariants = cva(
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

export const gridCellBaseVariants = cva(
    `
        absolute inset-0
        flex w-full
        shadow-[inset_0_-1px_0_0_var(--color-border-subtle)]
    `
);

export const gridCellContainerVariants = cva(
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

export const gridCellDirtyIndicatorVariants = cva(`
    absolute top-0 right-0 w-0 h-0
    border-t-[8px] border-l-[8px]
    border-t-destructive border-l-transparent
    pointer-events-none
`);

export const gridCellEditorBaseVariants = cva(`
    flex h-full w-full items-center
    bg-input-background border border-focus-indicator/40
`);

export const gridCellEditorInputVariants = cva(`
    h-full w-full border-transparent
    data-[expanded='true']:border-focus-indicator
    data-[expanded='true']:focus-within:border-focus-indicator/40
`);

export const gridCellTextVariants = cva(`
    truncate cursor-default select-none
`);

export const gridColumnActionsVariants = cva(`
    flex items-center justify-center
    text-xs [&_i]:text-xs
`);

export const gridColumnDragPreviewVariants = cva(
    `
        flex items-center justify-center
        px-2! py-0.5!
        bg-surface-raised! text-foreground!
        border! border-border! rounded-md shadow-sm!
    `
);

export const gridColumnDropHintVariants = cva(`
    absolute flex w-1 h-full bg-primary z-10! top-0 bottom-0
`);

export const gridColumnResizerVariants = cva(`
    absolute top-0 bottom-0 w-3 bg-transparent cursor-col-resize z-10 -right-1.5
`);

export const gridDetailContentCellVariants = cva(`border-b border-b-border-subtle`, {
    variants: {
        nextIsGroup: {
            true: "",
            false: ""
        }
    }
});

export const gridDetailIndentCellVariants = cva(
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

export const gridDetailRowVariants = cva(`
    border-b border-b-border-subtle
`);

export const gridFilterRowCellVariants = cva(`flex items-center px-1 py-0.5 w-full`);

export const gridFooterVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-surface-muted border-r border-r-border-subtle border-t border-t-border-subtle
    `
);

export const gridFooterTableVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridFooterTableRowVariants = cva(`relative inline-flex [&>td:last-child]:border-r-0`);

export const gridFooterTableCellVariants = cva(
    `
        relative overflow-hidden
        text-left align-middle px-2 py-2
        bg-surface-muted
        border-r border-r-border-subtle border-b border-b-border-subtle
        font-medium
    `
);

export const gridGroupPanelPlaceholderVariants = cva(`
    truncate text-muted-foreground
`);

export const gridGroupPanelVariants = cva(
    `
        flex items-center flex-wrap
        p-1 h-auto gap-1
        bg-surface-muted border-b border-b-border-subtle
    `
);

export const gridGroupRowVariants = cva(
    `
        relative z-10
        w-full
        bg-surface-muted border-r border-r-border-subtle
    `
);

export const gridHeaderVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-surface-muted border-r border-r-border-subtle
    `
);

export const gridHeaderTableVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridHeaderTableRowVariants = cva(
    `relative inline-flex not-first:border-t not-first:border-t-border-subtle [&>th:last-child]:border-r-0`
);

export const gridHeaderTableCellVariants = cva(
    `
        relative select-none
        text-left overflow-visible
        outline-none border-r border-r-border-subtle
        after:absolute after:inset-0 after:pointer-events-none
        focus:after:ring-1 focus:after:ring-inset focus:after:ring-focus-indicator/35
    `
);

export const gridHeaderTableColumnWrapVariants = cva(
    `
        w-full h-full px-1
        flex items-center justify-between
        cursor-pointer overflow-hidden
    `
);

export const gridHeaderTableColumnTitleVariants = cva(
    `
        flex-1 px-1 py-2 truncate
        font-medium
    `
);

export const gridListBaseVariants = cva(
    `
        w-full h-full
        outline-none
        border-t border-t-border-subtle
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

export const gridListTableVariants = cva(
    `
        border-separate border-spacing-0 w-full table-fixed
    `
);

export const gridListTableRowVariants = cva(``, {
    variants: {
        selected: {
            true: `
                    ${gridRowHeightClass}
                    bg-active text-foreground hover:bg-active
                `,
            false: `${gridRowHeightClass} bg-surface hover:bg-hover`
        }
    }
});

export const gridListTableCellVariants = cva(
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

export const gridNoDataVariants = cva(
    `
        flex items-center justify-center h-full
        text-muted-foreground border-t border-t-border-subtle
    `
);
