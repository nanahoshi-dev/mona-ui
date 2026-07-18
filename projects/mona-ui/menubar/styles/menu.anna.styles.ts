import { cva } from "class-variance-authority";

export const contextMenuContentVariants = cva(
    `
        w-full gap-4 overflow-hidden
        bg-surface-overlay text-foreground
        border border-border shadow-[0_6px_14px_-4px_rgb(0_0_0/0.65)]
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            },
            size: {
                small: "px-1 py-0.5",
                medium: "px-1.5 py-1",
                large: "px-2 py-1.5"
            }
        }
    }
);

export const contextMenuDividerVariants = cva(`-mx-0.5 my-1 h-px bg-border-subtle`);

export const menuItemGroupHeaderVariants = cva(
    `inline-flex w-full select-none px-2 py-1 font-bold text-muted-foreground`,
    {
        variants: {
            size: {
                small: "text-xs",
                medium: "text-sm",
                large: "text-md"
            }
        }
    }
);

export const menuItemIconVariants = cva(`absolute left-2 flex h-3.5 w-3.5 items-center justify-center`);

export const menuItemLinkVariants = cva(`flex h-3.5 w-3.5 items-center justify-center`);

export const menuItemShortcutVariants = cva(`flex flex-1 items-center justify-end text-xs text-muted-foreground`);

export const menuItemTextVariants = cva(`flex flex-1 items-center justify-start gap-2`);

export const menuItemVariants = cva(
    `
        relative flex cursor-default select-none items-center gap-4 px-2 py-1.5
        text-foreground outline-none
        hover:bg-hover hover:text-foreground
        focus-within:bg-hover focus-within:text-foreground focus-within:outline-none
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
        data-[focused]:bg-hover data-[focused]:text-foreground
    `,
    {
        variants: {
            size: {
                small: "px-2 py-1 text-xs",
                medium: "px-2 py-1.5 text-sm",
                large: "px-3 py-2 text-md"
            }
        }
    }
);

export const menubarBaseVariants = cva(
    `
        flex items-center justify-center gap-1 overflow-hidden
        bg-surface-muted text-foreground
        border border-border-subtle shadow-none
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            },
            size: {
                small: "h-8 text-xs",
                medium: "h-10 text-sm",
                large: "h-12 text-md"
            }
        }
    }
);

export const menubarListItemVariants = cva(
    `
        flex h-full items-center justify-center px-2 py-1.5
        cursor-pointer text-foreground outline-none
        hover:bg-hover hover:text-foreground
        focus-within:bg-hover focus-within:text-foreground focus-within:outline-none
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
        data-[active='true']:bg-primary data-[active='true']:text-primary-foreground
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            }
        }
    }
);

export const menubarListVariants = cva(
    `
        flex h-full w-full list-none items-center p-1
        select-none
    `
);
