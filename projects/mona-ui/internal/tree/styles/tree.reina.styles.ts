import { cva } from "class-variance-authority";

export const reinaSubTreeListVariants = cva(
    `
        list-none flex flex-col
    `
);

export const reinaSubTreeListItemVariants = cva(
    `
        relative overflow-hidden outline-none
        ps-6
    `
);

export const reinaTreeBaseVariants = cva(
    `
        relative outline-none select-none
        text-md
    `
);

export const reinaTreeDropHintBaseVariants = cva(
    `
        fixed z-1 w-10 h-0.5
        bg-primary opacity-80
        pointer-events-none
    `
);

export const reinaTreeDropHintIconVariants = cva(
    `
        absolute flex items-center justify-center
        -top-3.25 -left-3.5 text-xl
    `
);

export const reinaTreeNodeBaseVariants = cva(
    `
        px-2 py-1 cursor-default
        rounded-md
        transition-colors ease-out duration-150
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-40 cursor-default",
                false: ""
            },
            highlighted: {
                true: "inset-ring-1 inset-ring-primary/40",
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

export const reinaTreeNodeContainerVariants = cva(
    `
        flex items-center
    `
);

export const reinaTreeNodeDraggingVariants = cva(
    `
        flex items-center justify-center
        px-2! py-1! top-3!
        bg-background! text-foreground!
        border! border-input-border!
        rounded-md!
        shadow-md
    `
);

export const reinaTreeNodeExpanderVariants = cva(
    `
        min-w-6 h-full -ms-6
        flex items-center justify-center
        cursor-pointer text-sm text-foreground
    `
);
