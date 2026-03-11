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

export const windowContentVariants = cva(
    `
        flex-1 overflow-auto
    `
);

export const windowResizerVariants = cva(
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

export const windowTitleBarActionVariants = cva(
    `
        flex items-center space-evenly
    `
);

export const windowTitleBarVariants = cva(
    `
        flex items-center justify-start
        px-2 py-1 text-sm overflow-hidden
        border-b border-border
    `,
    {
        variants: {
            look: {
                default: "bg-secondary text-foreground",
                primary: "bg-primary text-primary-foreground"
            },
            rounded: {
                none: "rounded-ss-none rounded-se-none",
                small: "rounded-ss-sm rounded-se-sm",
                medium: "rounded-ss-md rounded-se-md",
                large: "rounded-ss-lg rounded-se-lg"
            }
        }
    }
);

export const windowTitleContainerVariants = cva(
    `
        flex items-center flex-1
        h-full cursor-default select-none
        overflow-hidden text-ellipsis
    `
);

export const windowTitleVariants = cva(
    `
        font-semibold
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
