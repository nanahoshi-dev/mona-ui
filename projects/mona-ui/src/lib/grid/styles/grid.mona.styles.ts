import { cva } from "class-variance-authority";

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
        w-full h-full flex
    `
);

export const gridCellContainerVariants = cva(
    `
        flex items-center w-full h-full
        flex-1 overflow-hidden outline-none
        px-2.75 py-1.5

    `,
    {
        variants: {
            editing: {
                true: "p-0.25!",
                false: ""
            }
        }
    }
);

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
    absolute top-0 bottom-0 w-3 bg-transparent cursor-col-resize z-1 -right-1.5
`);

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
        w-full bg-gray-100
        border-r border-r-border
    `
);

export const gridHeaderVariants = cva(
    `
        flex flex-row grow-0 shrink-0 basis-auto
        overflow-hidden
        bg-background-dark border-r border-r-border
    `
);

export const gridHeaderTableVariants = cva(
    `
        border-separate border-spacing-0 table-fixed
    `
);

export const gridHeaderTableRowVariants = cva(`relative inline-flex`);

export const gridHeaderTableCellVariants = cva(
    `
        relative select-none
        truncate text-left
        outline-none border-r border-r-border
        focus:ring-1 focus:ring-inset focus:ring-primary/40
    `
);

export const gridHeaderTableColumnWrapVariants = cva(
    `
       w-full h-full
        flex items-center justify-between
        cursor-pointer overflow-hidden
    `
);

export const gridHeaderTableColumnTitleVariants = cva(
    `
        flex-1 px-2 py-1 truncate
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
                true: "overflow-x-hidden overflow-y-hidden",
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

export const gridListTableRowVariants = cva(` `, {
    variants: {
        selected: {
            true: `
                    bg-primary text-primary-foreground
                `,
            false: "odd:bg-background even:bg-background-dark "
        }
    }
});

export const gridListTableCellVariants = cva(
    `
        relative
        outline-none z-1
        focus:ring-1 focus:ring-inset focus:ring-primary/40
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
                class: "border-b border-b-border border-r border-r-border"
            },
            {
                grouped: false,
                dataCell: true,
                class: "border-b border-b-border border-r border-r-border"
            },
            {
                grouped: false,
                indentCell: true,
                class: "border-r border-r-border border-b border-b-border"
            },
            {
                grouped: false,
                masterDetailContent: true,
                class: "border-b border-b-border"
            },
            {
                grouped: true,
                masterDetailToggle: true,
                class: "border-b border-b-border border-r border-r-border"
            },
            {
                grouped: true,
                dataCell: true,
                class: "border-b border-b-border border-r border-r-border"
            },
            {
                grouped: true,
                indentCell: true,
                class: "border-r border-r-border bg-gray-100"
            },
            {
                grouped: true,
                indentCell: true,
                masterDetailToggle: true,
                class: "border-r border-r-border"
            },
            {
                grouped: true,
                groupToggle: true,
                class: "border-r-none border-b-none"
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
