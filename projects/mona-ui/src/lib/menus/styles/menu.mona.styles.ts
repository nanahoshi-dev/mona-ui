import { cva } from "class-variance-authority";

export const contextMenuContentVariants = cva(
    `
        w-full gap-4 overflow-hidden
        bg-background text-foreground
        shadow-lg border border-border
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

export const contextMenuDividerVariants = cva(`-mx-0.5 my-1 h-px bg-border`);

export const menuItemGroupHeaderVariants = cva(`font-bold inline-flex select-none px-2 py-1 w-full`, {
    variants: {
        size: {
            small: "text-xs",
            medium: "text-sm",
            large: "text-md"
        }
    }
});

export const menuItemIconVariants = cva(`absolute left-2 flex h-3.5 w-3.5 items-center justify-center`);

export const menuItemLinkVariants = cva(`flex h-3.5 w-3.5 items-center justify-center`);

export const menuItemShortcutVariants = cva(`flex items-center justify-end flex-1 opacity-60 text-xs`);

export const menuItemTextVariants = cva(`flex flex-1 items-center justify-start gap-2`);

export const menuItemVariants = cva(
    `
        relative flex cursor-default select-none items-center px-2 py-1.5 gap-4
        outline-none

        hover:bg-hover
        hover:text-hover-foreground

        focus-within:bg-accent
        focus-within:text-accent-foreground
        focus-within:outline-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        data-[focused]:bg-accent
        data-[focused]:text-accent-foreground
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
        flex items-center justify-center
        gap-1 overflow-hidden
        bg-background text-foreground
        shadow-sm border border-border
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
        h-full flex items-center justify-center
        px-2 py-1.5
        cursor-pointer outline-none

        hover:bg-hover
        hover:text-hover-foreground
        focus-within:bg-accent
        focus-within:text-accent-foreground
        focus-within:outline-none
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        data-[active='true']:bg-accent
        data-[active='true']:text-accent-foreground

    `
);

export const menubarListVariants = cva(
    `
        w-full h-full list-none
        flex items-center select-none
    `
);
