import { cva } from "class-variance-authority";

export const reinaPopoverBaseVariants = cva(
    `
        flex flex-col items-center justify-center relative
        bg-background text-foreground border border-border/60
        shadow-lg z-1
    `,
    {
        variants: {
            rounded: {
                large: "rounded-2xl",
                medium: "rounded-xl",
                none: "rounded-none",
                small: "rounded-lg"
            }
        }
    }
);

export const reinaPopoverHeaderVariants = cva(
    `
        flex items-center justify-between w-full
        font-semibold overflow-hidden
        border-b border-border/60
    `,
    {
        variants: {
            rounded: {
                large: "rounded-t-2xl",
                medium: "rounded-t-xl",
                none: "rounded-t-none",
                small: "rounded-t-lg"
            }
        }
    }
);

export const reinaPopoverContentVariants = cva(
    `
        flex-1 w-full h-full
        overflow-hidden
    `
);
