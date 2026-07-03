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
                dropdown: "opacity-50",
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
