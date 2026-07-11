import { cva } from "class-variance-authority";

export const reinaSplitButtonVariants = cva(
    `
        inline-flex flex-nowrap items-center
        [&>button]:focus-visible:z-10
        [&_svg]:w-5 [&_svg]:h-5
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
                    rounded-3xl
                    [&>button]:first:rounded-tl-3xl [&>button]:first:rounded-bl-3xl
                    [&>button]:last:rounded-tr-3xl [&>button]:last:rounded-br-3xl
                `,
                medium: `
                    rounded-2xl
                    [&>button]:first:rounded-tl-2xl [&>button]:first:rounded-bl-2xl
                    [&>button]:last:rounded-tr-2xl [&>button]:last:rounded-br-2xl
                `,
                none: `
                    rounded-none
                `,
                small: `
                    rounded-xl
                    [&>button]:first:rounded-tl-xl [&>button]:first:rounded-bl-xl
                    [&>button]:last:rounded-tr-xl [&>button]:last:rounded-br-xl
                `
            },
            size: {
                large: `
                    [&_svg]:w-5 [&_svg]:h-5
                `,
                medium: `
                    [&_svg]:w-5 [&_svg]:h-5
                `,
                small: `
                    [&_svg]:w-4 [&_svg]:h-4
                `
            }
        },
        defaultVariants: {
            look: "default",
            size: "medium",
            rounded: "medium"
        }
    }
);
