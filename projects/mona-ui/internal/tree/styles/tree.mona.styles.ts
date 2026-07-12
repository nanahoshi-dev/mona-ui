import { cva } from "class-variance-authority";

export const subTreeListVariants = cva(
    `
        list-none flex flex-col
    `
);

export const subTreeListItemVariants = cva(
    `
        relative overflow-hidden outline-none
        ps-6
    `
);

export const treeBaseVariants = cva(
    `
        relative outline-none select-none
        text-md
    `
);

export const treeDropHintBaseVariants = cva(
    `
        fixed z-1 w-10 h-0.5
        bg-primary opacity-80
        pointer-events-none
    `
);

export const treeDropHintIconVariants = cva(
    `
        absolute flex items-center justify-center
        -top-3.25 -left-3.5 text-xl
    `
);

export const treeNodeBaseVariants = cva(
    `
        px-2 py-1 cursor-default
        transition-colors duration-150 ease-in-out motion-reduce:transition-none
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50 cursor-default",
                false: ""
            },
            highlighted: {
                true: "inset-ring-1 inset-ring-border-control-hover",
                false: ""
            },
            selected: {
                true: "bg-primary text-primary-foreground",
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
                class: "hover:bg-primary-hover"
            }
        ]
    }
);

export const treeNodeContainerVariants = cva(
    `
        flex items-center
    `
);

export const treeNodeDraggingVariants = cva(
    `
        flex items-center justify-center
        px-2! py-1! top-3!
        bg-surface-raised! text-foreground!
        border! border-border!
        shadow-raised
    `
);

export const treeNodeExpanderVariants = cva(
    `
        min-w-6 h-full -ms-6
        flex items-center justify-center
        cursor-pointer text-sm text-foreground
    `
);
