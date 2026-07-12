import { cva } from "class-variance-authority";

export const splitButtonVariants = cva(
    `
        inline-flex flex-nowrap items-center
        [&>button]:focus-visible:z-10
        [&_svg]:w-5 [&_svg]:h-5
    `,
    {
        variants: {
            look: {
                default: "",
                outline: "",
                primary: `
                    [&>button:first-child]:border-r [&>button:first-child]:border-primary-hover
                `,
                secondary: `
                    [&>button:first-child]:border-r [&>button:first-child]:border-border-subtle
                `,
                success: `
                    [&>button:first-child]:border-r [&>button:first-child]:border-success-hover
                `,
                error: `
                    [&>button:first-child]:border-r [&>button:first-child]:border-error-hover
                `,
                warning: `
                    [&>button:first-child]:border-r [&>button:first-child]:border-warning-hover
                `,
                info: `
                    [&>button:first-child]:border-r [&>button:first-child]:border-info-hover
                `,
                ghost: "border-transparent shadow-none",
                link: "border-transparent shadow-none",
                clear: "border-transparent shadow-none"
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
