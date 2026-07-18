import { cva } from "class-variance-authority";

export const datePopupVariants = cva(
    `
        h-full overflow-auto
        bg-surface-overlay text-foreground
        border border-border shadow-(--shadow-overlay)
        [&_mona-calendar]:border-none
        [&_mona-calendar]:shadow-none
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
                large: "text-lg",
                medium: "text-md",
                small: "text-sm"
            }
        },
        defaultVariants: {
            rounded: "medium",
            size: "medium"
        }
    }
);
