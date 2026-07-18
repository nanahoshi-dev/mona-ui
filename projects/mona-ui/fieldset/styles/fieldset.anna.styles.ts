import { cva } from "class-variance-authority";

export const fieldsetBaseVariants = cva(
    `
        block
    `
);

export const fieldsetVariants = cva(
    `
        bg-surface text-foreground border border-border
    `,
    {
        variants: {
            rounded: {
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full",
                none: "rounded-none"
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none bg-disabled-background text-disabled-foreground border-disabled-border",
                false: ""
            }
        },
        defaultVariants: {
            disabled: false
        }
    }
);

export const fieldsetLegendVariants = cva(
    `
        ms-2
    `,
    {
        variants: {
            hasTemplate: {
                true: "",
                false: "px-2 bg-surface-raised text-foreground border border-border-subtle"
            },
            rounded: {
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full",
                none: "rounded-none"
            }
        },
        defaultVariants: {
            hasTemplate: false
        }
    }
);
