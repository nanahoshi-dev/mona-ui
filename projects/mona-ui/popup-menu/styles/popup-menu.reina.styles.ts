import { cva } from "class-variance-authority";

export const reinaPopupMenuBaseVariants = cva(`w-full h-full overflow-hidden`, {
    variants: {
        rounded: {
            small: "rounded-xl",
            medium: "rounded-2xl",
            large: "rounded-3xl",
            none: "rounded-none"
        }
    }
});

export const reinaPopupMenuContainerVariants = cva(
    `
        flex flex-col
        bg-background/95 backdrop-blur-xl text-foreground
        border border-input-border
        outline-none
        p-1.5 shadow-lg
    `,
    {
        variants: {
            rounded: {
                small: "rounded-xl",
                medium: "rounded-2xl",
                large: "rounded-3xl",
                none: "rounded-none"
            }
        }
    }
);

export const reinaPopupMenuGroupHeaderVariants = cva(
    `font-semibold tracking-tight text-foreground/50 select-none px-2 py-1 w-full`,
    {
        variants: {
            size: {
                small: "text-[11px]",
                medium: "text-xs",
                large: "text-sm"
            }
        }
    }
);

export const reinaPopupMenuIconContainerVariants = cva(`absolute left-2 flex items-center justify-center`);

export const reinaPopupMenuItemVariants = cva(
    `
        relative flex gap-2
        cursor-pointer select-none items-center pl-8 pr-2 py-1.5
        font-medium
        outline-none
        transition-colors duration-100 ease-out

        hover:bg-accent
        hover:text-accent-foreground

        focus-within:bg-accent
        focus-within:text-accent-foreground
        focus-within:outline-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-40

        data-[active='true']:bg-accent
        data-[active='true']:text-accent-foreground
    `,
    {
        variants: {
            rounded: {
                small: "rounded-lg",
                medium: "rounded-xl",
                large: "rounded-2xl",
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

export const reinaPopupMenuLinkVariants = cva(`flex items-center justify-center`);
