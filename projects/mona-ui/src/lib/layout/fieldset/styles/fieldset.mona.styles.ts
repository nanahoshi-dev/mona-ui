import { cva } from "class-variance-authority";

export const fieldsetBaseVariants = cva(
    `
        block
    `
);

export const fieldsetVariants = cva(
    `
        bg-background
        border border-border
        text-foreground
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        }
    }
);

export const fieldsetLegendVariants = cva(
    `
        ml-2
    `,
    {
        variants: {
            hasTemplate: {
                true: "",
                false: "bg-background-dark text-foreground border border-border px-2"
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        },
        defaultVariants: {
            hasTemplate: false
        }
    }
);
