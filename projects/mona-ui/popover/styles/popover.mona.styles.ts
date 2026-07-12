import { cva } from "class-variance-authority";

export const popoverBaseVariants = cva(
    `
        flex flex-col items-center justify-center relative
        bg-background text-foreground border border-border
        shadow-overlay z-1
    `,
    {
        variants: {
            rounded: {
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);

export const popoverHeaderVariants = cva(
    `
        flex items-center justify-between w-full
        font-semibold overflow-hidden
    `,
    {
        variants: {
            rounded: {
                large: "rounded-t-lg",
                medium: "rounded-t-md",
                none: "rounded-t-none",
                small: "rounded-t-sm"
            }
        }
    }
);

export const popoverContentVariants = cva(
    `
        flex-1 w-full h-full
        overflow-hidden
    `
);
