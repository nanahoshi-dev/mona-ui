import { cva } from "class-variance-authority";

export const listViewBaseVariants = cva(
    `
        flex h-full flex-col overflow-hidden
        bg-surface text-foreground
        border border-border
        outline-none
    `,
    {
        variants: {
            rounded: {
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
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
