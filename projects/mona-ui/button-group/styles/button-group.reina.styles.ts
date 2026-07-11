import { cva } from "class-variance-authority";

export const reinaButtonGroupVariants = cva(
    `
        inline-flex items-center justify-center
        bg-accent
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
                ghost: "bg-transparent p-0 gap-1.5 [&>button]:rounded-full",
                info: "",
                outline: "bg-transparent border border-input-border",
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
                    rounded-3xl
                    [&>button]:first:rounded-ss-3xl [&>button]:first:rounded-es-3xl
                    [&>button]:last:rounded-se-3xl [&>button]:last:rounded-ee-3xl
                `,
                medium: `
                    rounded-2xl
                    [&>button]:first:rounded-ss-2xl [&>button]:first:rounded-es-2xl
                    [&>button]:last:rounded-se-2xl [&>button]:last:rounded-ee-2xl
                `,
                none: `
                    rounded-none
                `,
                small: `
                    rounded-xl
                    [&>button]:first:rounded-ss-xl [&>button]:first:rounded-es-xl
                    [&>button]:last:rounded-se-xl [&>button]:last:rounded-ee-xl
                `
            },
            size: {
                large: "",
                medium: "",
                small: ""
            }
        },
        defaultVariants: {
            look: "default",
            size: "medium"
        }
    }
);
