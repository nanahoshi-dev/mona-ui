import { cva } from "class-variance-authority";

export const dropdownPopupVariants = cva(
    `
        bg-background shadow-md text-foreground
        border border-input-border
        h-full max-h-64 overflow-auto
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-lg"
            },
            size: {
                large: "text-md",
                medium: "text-sm",
                small: "text-xs"
            }
        },
        defaultVariants: {
            rounded: "medium",
            size: "medium"
        }
    }
);
