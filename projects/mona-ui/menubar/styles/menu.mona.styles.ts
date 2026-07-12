import { cva } from "class-variance-authority";

export const menubarBaseVariants = cva(
    `
        flex items-center justify-center
        gap-1 overflow-hidden
        bg-surface-overlay text-foreground
        shadow-raised border border-border

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
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
        transition-colors duration-150 ease-in-out motion-reduce:transition-none

        hover:bg-hover
        hover:text-accent-foreground
        focus-within:bg-accent
        focus-within:text-accent-foreground
        focus-within:outline-none
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        data-[active='true']:bg-accent
        data-[active='true']:text-accent-foreground
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
        w-full h-full list-none
        flex items-center select-none
        p-1
    `
);
