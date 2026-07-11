import { cva } from "class-variance-authority";

export const reinaWindowBaseVariants = cva(
    `
        flex flex-col w-full h-full
        bg-background text-foreground
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-lg",
                medium: "rounded-xl",
                large: "rounded-2xl"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const reinaWindowContentContainerVariants = cva(
    `
        flex flex-col
        relative w-full h-full
        border border-border/60
        shadow-lg
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-lg",
                medium: "rounded-xl",
                large: "rounded-2xl"
            }
        }
    }
);

export const reinaWindowContentVariants = cva(
    `
        flex-1 overflow-auto
    `
);

export const reinaWindowResizerVariants = cva(
    `
        absolute flex
    `,
    {
        variants: {
            position: {
                east: "top-0 bottom-0 -right-0.5 w-2 cursor-ew-resize",
                north: "left-0 right-0 -top-0.5 h-2 cursor-ns-resize",
                south: "left-0 right-0 -bottom-0.5 h-2 cursor-ns-resize",
                west: "top-0 bottom-0 -left-0.5 w-2 cursor-ew-resize",
                northeast: "-top-0.5 -right-0.5 w-2 h-2 cursor-nesw-resize",
                northwest: "-top-0.5 -left-0.5 w-2 h-2 cursor-nwse-resize",
                southeast: "-bottom-0.5 -right-0.5 w-2 h-2 cursor-nwse-resize",
                southwest: "-bottom-0.5 -left-0.5 w-2 h-2 cursor-nesw-resize"
            }
        }
    }
);

export const reinaWindowTitleBarActionVariants = cva(
    `
        flex items-center space-evenly
    `
);

export const reinaWindowTitleBarVariants = cva(
    `
        flex items-center justify-start
        px-2 py-1 text-sm overflow-hidden
        border-b border-border/60
    `,
    {
        variants: {
            look: {
                default: "bg-background-dark text-foreground",
                primary: "bg-primary text-primary-foreground"
            },
            rounded: {
                none: "rounded-ss-none rounded-se-none",
                small: "rounded-ss-lg rounded-se-lg",
                medium: "rounded-ss-xl rounded-se-xl",
                large: "rounded-ss-2xl rounded-se-2xl"
            }
        }
    }
);

export const reinaWindowTitleContainerVariants = cva(
    `
        flex items-center flex-1
        h-full cursor-default select-none
        overflow-hidden text-ellipsis
    `
);

export const reinaWindowTitleVariants = cva(
    `
        font-semibold tracking-tight
        overflow-hidden text-ellipsis whitespace-nowrap
    `,
    {
        variants: {
            look: {
                default: "text-foreground",
                primary: "text-primary-foreground"
            }
        }
    }
);
