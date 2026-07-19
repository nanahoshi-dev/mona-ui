import { cva } from "class-variance-authority";

export const subTreeListThemeVariants = cva(
    `
        flex list-none flex-col
    `
);

export const subTreeListItemThemeVariants = cva(
    `
        relative overflow-hidden outline-none
        ps-6
    `
);

export const treeBaseThemeVariants = cva(
    `
        relative outline-none select-none
        text-md
    `
);

export const treeDropHintBaseThemeVariants = cva(
    `
        fixed z-1 h-0.5 w-10
        pointer-events-none
        bg-primary opacity-80
    `
);

export const treeDropHintIconThemeVariants = cva(
    `
        absolute flex items-center justify-center
        -top-3.25 -left-3.5 text-xl
    `
);

export const treeNodeBaseThemeVariants = cva(
    `
        cursor-default px-2 py-1 text-foreground
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-default text-disabled-foreground",
                false: ""
            },
            highlighted: {
                true: "inset-ring-1 inset-ring-focus-indicator/35",
                false: ""
            },
            selected: {
                true: "bg-active text-foreground",
                false: ""
            }
        },
        compoundVariants: [
            {
                disabled: false,
                selected: false,
                class: "hover:bg-hover active:bg-active"
            },
            {
                disabled: false,
                selected: true,
                class: "hover:bg-active"
            }
        ]
    }
);

export const treeNodeContainerThemeVariants = cva(
    `
        flex items-center
    `
);

export const treeNodeDraggingThemeVariants = cva(
    `
        flex items-center justify-center
        top-3! px-2! py-1!
        bg-surface-overlay! text-foreground!
        border! border-border!
        shadow-(--shadow-overlay)
    `
);

export const treeNodeExpanderThemeVariants = cva(
    `
        -ms-6 flex h-full min-w-6 items-center justify-center
        cursor-pointer text-sm text-foreground
    `
);
