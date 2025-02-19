import { cva } from "class-variance-authority";

export const contextMenuContentVariants = cva(
    `
        shadow-lg border border-border p-1 rounded-md bg-popover text-sm
        w-full gap-4 overflow-hidden
    `,
    {
        variants: {}
    }
);

export const contextMenuDividerVariants = cva(`-mx-0.5 my-1 h-px bg-border`, {
    variants: {}
});

export const contextMenuItemVariants = cva(
    `
        relative flex cursor-default select-none items-center rounded-sm py-1.5 text-sm
        outline-none focus:bg-accent focus:text-accent-foreground
        data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50
        hover:bg-accent hover:text-accent-foreground
        pl-8 pr-2 gap-4
        data-[focused]:bg-accent data-[focused]:text-accent-foreground
    `,
    {
        variants: {}
    }
);

export const contextMenuItemIconVariants = cva(`absolute left-2 flex h-3.5 w-3.5 items-center justify-center`, {
    variants: {}
});

export const contextMenuItemLinkVariants = cva(`flex h-3.5 w-3.5 items-center justify-center`, {
    variants: {}
});

export const contextMenuItemShortcutVariants = cva(`flex items-center justify-end flex-1 opacity-60 text-xs`, {
    variants: {}
});

export const contextMenuItemTextVariants = cva(`flex flex-1 items-center justify-start gap-2`, {
    variants: {}
});
