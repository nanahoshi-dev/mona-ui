import { cva } from "class-variance-authority";

export const windowBaseVariants = cva(
    `
        flex flex-col
        bg-background
        w-full h-full
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const windowContentContainerVariants = cva(
    `
        flex flex-col
        relative w-full h-full
        border border-border
        shadow-sm
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            }
        }
    }
);

export const windowTitleBarVariants = cva(
    `
        flex items-center justify-start
        px-2 py-1 text-sm overflow-hidden
        border-b border-border
        bg-secondary
    `
);

export const windowTitleContainerVariants = cva(
    `
        flex items-center flex-1
        h-full cursor-default select-none
        overflow-hidden text-ellipsis
    `
);
