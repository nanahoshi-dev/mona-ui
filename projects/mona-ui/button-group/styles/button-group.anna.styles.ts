import { cva } from "class-variance-authority";

export const buttonGroupVariants = cva(
    `
        inline-flex items-center justify-center
        border border-input-border
        [&>button]:border-0
        [&>button]:shadow-none
        [&>button:not(:last-child)]:border-r
        [&>button:not(:last-child)]:border-border-subtle
        [&>button]:rounded-none
        [&>button]:focus-visible:ring-2
        [&>button]:focus-visible:z-10
    `,
    {
        variants: {
            look: {
                default: "",
                error: "border-transparent",
                ghost: "border-transparent [&>button:not(:last-child)]:border-r-0",
                info: "border-transparent",
                outline: "",
                primary: "border-transparent",
                secondary: "border-transparent",
                success: "border-transparent",
                warning: "border-transparent"
            },
            rounded: {
                full: `
                    rounded-full
                    [&>button]:first:rounded-ss-full [&>button]:first:rounded-es-full
                    [&>button]:last:rounded-se-full [&>button]:last:rounded-ee-full
                `,
                large: `
                    rounded-[4px]
                    [&>button]:first:rounded-ss-lg [&>button]:first:rounded-es-lg
                    [&>button]:last:rounded-se-lg [&>button]:last:rounded-ee-lg
                `,
                medium: `
                    rounded-[2px]
                    [&>button]:first:rounded-ss-md [&>button]:first:rounded-es-md
                    [&>button]:last:rounded-se-md [&>button]:last:rounded-ee-md
                `,
                none: `
                    rounded-none
                `,
                small: `
                    rounded-[1px]
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
