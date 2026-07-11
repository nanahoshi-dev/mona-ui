import { cva } from "class-variance-authority";

export const reinaMenubarBaseVariants = cva(
    `
        flex items-center justify-center
        gap-1 overflow-hidden
        bg-background text-foreground
        shadow-sm border border-input-border

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-40
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

export const reinaMenubarListItemVariants = cva(
    `
        h-full flex items-center justify-center
        px-2 py-1.5
        cursor-pointer outline-none
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
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            }
        }
    }
);

export const reinaMenubarListVariants = cva(
    `
        w-full h-full list-none
        flex items-center select-none
        p-1
    `
);
