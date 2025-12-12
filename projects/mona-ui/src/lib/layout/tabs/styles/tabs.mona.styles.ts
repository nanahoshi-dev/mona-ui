import { cva } from "class-variance-authority";

export const tabListBaseVariants = cva(
    `
        w-fit max-w-full
        flex overflow-hidden
        bg-accent h-10
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
            }
        }
    }
);

export const tabListListWrapperVariants = cva(`w-full h-full overflow-hidden`);

export const tabListListVariants = cva(
    `
        flex h-full w-full overflow-hidden
        list-none cursor-default
        select-none whitespace-nowrap
        p-[3px]
    `
);

export const tabListListItemVariants = cva(
    `
        flex items-center justify-center
        cursor-pointer
        px-2 py-1
    `,
    {
        variants: {
            active: {
                true: "bg-background-dark text-foreground shadow-sm",
                false: ""
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed opacity-50 select-none",
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

export const tabListScrollButtonVariants = cva(
    `
        flex items-center justify-center
        h-full px-2
    `
);

export const tabContentVariants = cva(
    `
        w-full overflow-auto flex-1
        border border-border shadow-sm
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

export const tabsBaseVariants = cva(
    `
        flex flex-col w-full
        gap-2
    `
);
