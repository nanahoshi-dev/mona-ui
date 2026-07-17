import { cva } from "class-variance-authority";

export const tabListBaseVariants = cva(
    `
        w-fit max-w-full
        flex overflow-hidden
        bg-accent
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

export const tabListListWrapperVariants = cva(`w-full h-full overflow-hidden`);

export const tabListListVariants = cva(
    `
        flex h-full w-full overflow-hidden
        list-none cursor-default
        select-none whitespace-nowrap
        p-[3px]
        transition-colors duration-300 ease-out
    `
);

export const tabListListItemVariants = cva(
    `
        flex items-center justify-center
        cursor-pointer
        px-2 outline-none
        focus-visible:ring-2 focus-visible:ring-primary/40
    `,
    {
        variants: {
            active: {
                true: "bg-surface text-foreground font-semibold shadow-sm inset-ring-1 inset-ring-border-subtle",
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
        bg-background text-foreground
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
        max-w-full
        flex flex-col gap-2
    `
);
