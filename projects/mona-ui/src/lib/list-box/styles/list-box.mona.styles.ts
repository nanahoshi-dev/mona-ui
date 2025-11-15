import { cva } from "class-variance-authority";

export const listBoxBaseVariants = cva(
    `
        flex gap-1
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
