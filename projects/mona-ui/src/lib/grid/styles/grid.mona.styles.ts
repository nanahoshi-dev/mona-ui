import { cva } from "class-variance-authority";

const gridRowHeightClass = "h-9";

export const gridBaseVariants = cva(
    `
        relative flex flex-col
        h-full overflow-hidden
        bg-background border border-border
        text-foreground text-sm
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
        border-b border-b-border
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
    w-full h-full border border-solid border-primary/40 flex items-center
`);

export const gridCellEditorInputVariants = cva(`
    w-full h-full border-transparent
    data-[expanded='true']:border-primary
    data-[expanded='true']:focus-within:border-primary/40
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
        bg-background! text-foreground!
        border! border-border! rounded-md
        shadow-sm! px-2! py-0.5!
    `
);

export const gridColumnDropHintVariants = cva(`
    absolute flex w-1 h-full bg-primary z-10! top-0 bottom-0
`);

export const gridColumnResizerVariants = cva(`
    absolute top-0 bottom-0 w-3 bg-transparent cursor-col-resize z-10 -right-1.5
`);

export const gridDetailContentCellVariants = cva(`border-b border-b-border`, {
    variants: {
        nextIsGroup: {
            true: "",
            false: ""
        }
    }
});

export const gridDetailIndentCellVariants = cva(
    `
        border-r border-r-border border-b border-b-border
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
    border-b border-b-border
`);

export const gridFilterRowCellVariants = cva(`flex items-center px-1 py-0.5 w-full`);

export const gridFooterVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-header-background border-r border-r-border border-t border-t-border
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
        border-r border-r-border border-b border-b-border
        bg-header-background font-medium
    `
);

export const gridGroupPanelPlaceholderVariants = cva(`
    truncate opacity-70
`);

export const gridGroupPanelVariants = cva(
    `
        flex items-center flex-wrap
        p-1 h-auto gap-1
        border-b border-b-border
    `
);

export const gridGroupRowVariants = cva(
    `
        w-full bg-header-background
        border-r border-r-border
        relative z-10
    `
);

export const gridHeaderVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-header-background border-r border-r-border
    `
);

export const gridHeaderTableVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridHeaderTableRowVariants = cva(
    `relative inline-flex not-first:border-t not-first:border-t-border [&>th:last-child]:border-r-0`
);

export const gridHeaderTableCellVariants = cva(
    `
        relative select-none
        text-left overflow-visible
        outline-none border-r border-r-border
        after:absolute after:inset-0 after:pointer-events-none
        focus:after:ring-1 focus:after:ring-inset focus:after:ring-primary/40
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
        border-t border-t-border
        outline-none
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
                    bg-primary text-primary-foreground
                `,
            false: `${gridRowHeightClass} odd:bg-background even:bg-background-dark `
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
        focus:after:ring-1 focus:after:ring-inset focus:after:ring-primary/40
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
                false: "border-r border-r-border"
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
                class: "bg-header-background border-b border-b-border"
            },
            {
                grouped: true,
                indentCell: false,
                class: "border-b border-b-border"
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
        border-t border-t-border
    `
);
