import { cva } from "class-variance-authority";

export const buttonGroupVariants = cva(
    `
        inline-flex items-center justify-center
        border border-border shadow-xs
        [&>button]:border-0
        [&>button]:focus-visible:ring-2
        [&>button]:focus-visible:z-10
        [&>button]:rounded-none
        [&>button]:shadow-none
    `,
    {
        variants: {
            look: {
                default: "",
                error: "",
                ghost: "border-transparent",
                info: "",
                outline: "[&>button:not(:last-child)]:border-r",
                primary: "",
                secondary: "",
                success: "",
                warning: ""
            },
            rounded: {
                full: `
                    rounded-full
                    [&>button]:first:rounded-ss-full [&>button]:first:rounded-es-full
                    [&>button]:last:rounded-se-full [&>button]:last:rounded-ee-full
                `,
                large: `
                    rounded-lg
                    [&>button]:first:rounded-ss-lg [&>button]:first:rounded-es-lg
                    [&>button]:last:rounded-se-lg [&>button]:last:rounded-ee-lg
                `,
                medium: `
                    rounded-md
                    [&>button]:first:rounded-ss-md [&>button]:first:rounded-es-md
                    [&>button]:last:rounded-se-md [&>button]:last:rounded-ee-md
                `,
                none: `
                    rounded-none
                `,
                small: `
                    rounded-sm
                    [&>button]:first:rounded-ss-sm [&>button]:first:rounded-es-sm
                    [&>button]:last:rounded-se-sm [&>button]:last:rounded-ee-sm
                `
            },
            size: {
                large: ``,
                medium: "",
                small: ``
            }
        },
        defaultVariants: {
            look: "default",
            size: "medium"
        }
    }
);
