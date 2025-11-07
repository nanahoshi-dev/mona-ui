import { cva } from "class-variance-authority";

export const listViewBaseVariants = cva(
    `
        flex flex-col w-full h-full
        outline-none overflow-hidden
        bg-background text-foreground
        border border-border
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
                small: "text-sm",
                medium: "text-base",
                large: "text-lg"
            }
        }
    }
);

export const listViewListVariants = cva(
    `
    `
);
