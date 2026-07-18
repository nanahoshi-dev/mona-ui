import { cva } from "class-variance-authority";

export const popupMenuBaseVariants = cva(`h-full w-full overflow-hidden`, {
    variants: {
        rounded: {
            small: "rounded-sm",
            medium: "rounded-md",
            large: "rounded-lg",
            none: "rounded-none"
        }
    }
});

export const popupMenuContainerVariants = cva(
    `
        flex flex-col p-1
        bg-surface-overlay text-foreground
        border border-border shadow-md outline-none
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

export const popupMenuGroupHeaderVariants = cva(
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

export const popupMenuIconContainerVariants = cva(`absolute left-2 flex items-center justify-center`);

export const popupMenuItemVariants = cva(
    `
        relative flex cursor-pointer select-none items-center gap-2 py-1 pr-2 pl-8
        text-foreground outline-none
        hover:bg-hover hover:text-foreground
        focus-within:bg-hover focus-within:text-foreground focus-within:outline-none
        data-[disabled='true']:pointer-events-none data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
        data-[active='true']:bg-active data-[active='true']:text-foreground
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
                small: "text-xs",
                medium: "text-sm",
                large: "text-md"
            }
        }
    }
);

export const popupMenuLinkVariants = cva(`flex items-center justify-center`);
