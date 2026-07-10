import { cva } from "class-variance-authority";

export const reinaButtonGroupVariants = cva(
    `
        inline-flex items-center gap-1
        bg-accent p-1
        [&>button]:border-0
        [&>button]:rounded-full
        [&>button]:shadow-none
        [&>button]:focus-visible:ring-2
        [&>button]:focus-visible:z-10
    `,
    {
        variants: {
            look: {
                default: "",
                error: "",
                ghost: "bg-transparent p-0 gap-1.5",
                info: "",
                outline: "bg-transparent border border-input-border",
                primary: "",
                secondary: "",
                success: "",
                warning: ""
            },
            rounded: {
                full: "rounded-full",
                large: "rounded-3xl",
                medium: "rounded-2xl",
                none: "rounded-none [&>button]:rounded-none",
                small: "rounded-xl"
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
