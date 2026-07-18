import { cva } from "class-variance-authority";

export const tabListBaseVariants = cva(
    `
        flex w-fit max-w-full overflow-hidden
        text-sm font-medium
        bg-surface-muted
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

export const tabListListWrapperVariants = cva(`h-full w-full overflow-hidden`);

export const tabListListVariants = cva(
    `
        flex h-full w-full list-none overflow-hidden p-[3px]
        cursor-default select-none whitespace-nowrap
        transition-colors duration-300 ease-out
    `
);

export const tabListListItemVariants = cva(
    `
        flex items-center justify-center px-2
        cursor-pointer outline-none
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            active: {
                true: "bg-surface-raised font-semibold text-foreground shadow-(--shadow-control) inset-ring-1 inset-ring-border-subtle",
                false: ""
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none text-disabled-foreground",
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
        flex h-full items-center justify-center px-2
        text-muted-foreground
        hover:bg-hover hover:text-foreground
        active:bg-active
    `
);

export const tabContentVariants = cva(
    `
        flex-1 w-full overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        bg-surface text-foreground
        border border-border shadow-(--shadow-raised)
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
        flex max-w-full flex-col gap-2
    `
);
