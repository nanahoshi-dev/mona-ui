import { cva } from "class-variance-authority";

export const buttonGroupVariants = cva(
    `
        inline-flex items-center justify-center
        border border-border
        [&>button]:border-0
        [&>button]:focus-visible:ring-2
        [&>button]:focus-visible:z-10
        [&>button]:rounded-none
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
                    [&>button]:first:rounded-tl-full [&>button]:first:rounded-bl-full
                    [&>button]:last:rounded-tr-full [&>button]:last:rounded-br-full
                `,
                large: `
                    rounded-lg
                    [&>button]:first:rounded-tl-lg [&>button]:first:rounded-bl-lg
                    [&>button]:last:rounded-tr-lg [&>button]:last:rounded-br-lg
                `,
                medium: `
                    rounded-md
                    [&>button]:first:rounded-tl-md [&>button]:first:rounded-bl-md
                    [&>button]:last:rounded-tr-md [&>button]:last:rounded-br-md
                `,
                none: `
                    rounded-none
                `,
                small: `
                    rounded-sm
                    [&>button]:first:rounded-tl-sm [&>button]:first:rounded-bl-sm
                    [&>button]:last:rounded-tr-sm [&>button]:last:rounded-br-sm
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
