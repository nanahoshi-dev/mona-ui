import { cva } from "class-variance-authority";

export const splitButtonVariants = cva(
    `
        inline-flex flex-nowrap items-center
        [&>button]:focus-visible:z-10
        [&_svg]:h-5 [&_svg]:w-5
    `,
    {
        variants: {
            look: {
                default: "",
                error: "",
                ghost: "border-transparent",
                info: "",
                outline: "[&>button:not(:last-child)]:border-r [&>button:not(:last-child)]:border-input-border",
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
                large: `
                    [&_svg]:h-5 [&_svg]:w-5
                `,
                medium: `
                    [&_svg]:h-5 [&_svg]:w-5
                `,
                small: `
                    [&_svg]:h-4 [&_svg]:w-4
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
