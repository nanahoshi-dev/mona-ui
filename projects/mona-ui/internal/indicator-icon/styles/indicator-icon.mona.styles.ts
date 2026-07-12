import { cva } from "class-variance-authority";

export const indicatorIconHostVariants = cva(
    `h-full aspect-square flex-none inline-flex items-center justify-center self-stretch`,
    {
        variants: {
            interactive: {
                true: "opacity-50 hover:opacity-90 focus:ring-1 focus:ring-primary/40 focus:outline-none",
                false: ""
            },
            preset: {
                clear: "",
                editableDropdown: "bg-background border-l border-l-solid border-l-border",
                dropdown: "",
                loading: ""
            }
        },
        defaultVariants: {
            interactive: false
        }
    }
);

export const indicatorIconSvgVariants = cva(``, {
    variants: {
        loading: {
            true: "animate-[spin_2s_linear_infinite]",
            false: ""
        }
    },
    defaultVariants: {
        loading: false
    }
});
