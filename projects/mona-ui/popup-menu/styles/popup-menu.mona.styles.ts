import { cva } from "class-variance-authority";

export const popupMenuBaseVariants = cva(`w-full h-full overflow-hidden`, {
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
        flex flex-col
        bg-background text-foreground
        border border-border
        outline-none
        p-1 shadow-md
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

export const popupMenuGroupHeaderVariants = cva(`font-bold inline-flex select-none px-2 py-1 w-full`, {
    variants: {
        size: {
            small: "text-xs",
            medium: "text-sm",
            large: "text-md"
        }
    }
});

export const popupMenuIconContainerVariants = cva(`absolute left-2 flex items-center justify-center`);

export const popupMenuItemVariants = cva(
    `
        relative flex gap-2
        cursor-pointer select-none items-center pl-8 pr-2 py-1
        outline-none

        hover:bg-hover
        hover:text-hover-foreground

        focus-within:bg-accent
        focus-within:text-accent-foreground
        focus-within:outline-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        data-[active='true']:bg-hover
        data-[active='true']:text-hover-foreground
        transition-colors duration-150 ease-in-out
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
