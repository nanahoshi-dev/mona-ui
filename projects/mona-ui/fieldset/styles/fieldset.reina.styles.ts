import { cva } from "class-variance-authority";

export const reinaFieldsetBaseVariants = cva(
    `
        block
    `
);

export const reinaFieldsetVariants = cva(
    `
        bg-background
        border border-border/60
        text-foreground
        shadow-xs
    `,
    {
        variants: {
            rounded: {
                small: "rounded-md",
                medium: "rounded-xl",
                large: "rounded-2xl",
                full: "rounded-full",
                none: "rounded-none"
            },
            disabled: {
                true: "pointer-events-none opacity-40 cursor-not-allowed select-none",
                false: ""
            }
        },
        defaultVariants: {
            disabled: false
        }
    }
);

export const reinaFieldsetLegendVariants = cva(
    `
        ml-3 font-medium
    `,
    {
        variants: {
            hasTemplate: {
                true: "",
                false: "bg-background-dark text-foreground/70 border border-border/60 px-2.5 text-xs tracking-wide"
            },
            rounded: {
                small: "rounded",
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
