import { cva } from "class-variance-authority";

export const reinaTabListBaseVariants = cva(
    `
        w-fit max-w-full
        flex overflow-hidden
        bg-header-background
        font-medium text-sm
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            },
            size: {
                small: "h-8",
                medium: "h-9",
                large: "h-10"
            }
        }
    }
);

export const reinaTabListListWrapperVariants = cva(`w-full h-full overflow-hidden`);

export const reinaTabListListVariants = cva(
    `
        flex h-full w-full overflow-hidden
        list-none cursor-default
        select-none whitespace-nowrap
        p-[3px]
        transition-colors duration-150 ease-out
    `
);

export const reinaTabListListItemVariants = cva(
    `
        flex items-center justify-center
        cursor-pointer
        px-2 outline-none
        transition-[color,box-shadow,background-color] duration-150 ease-out
        focus-visible:ring-2 focus-visible:ring-primary/35
    `,
    {
        variants: {
            active: {
                true: "bg-background shadow-sm text-foreground",
                false: ""
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed opacity-40 select-none",
                false: ""
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const reinaTabListScrollButtonVariants = cva(
    `
        flex items-center justify-center
        h-full px-2
    `
);

export const reinaTabContentVariants = cva(
    `
        w-full overflow-auto flex-1
        border border-input-border shadow-sm
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const reinaTabsBaseVariants = cva(
    `
        max-w-full
        flex flex-col gap-2
    `
);
