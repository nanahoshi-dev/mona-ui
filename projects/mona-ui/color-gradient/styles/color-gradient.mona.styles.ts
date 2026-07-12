import { cva } from "class-variance-authority";

export const colorGradientBaseVariants = cva(
    `
        flex flex-col min-w-64
        p-2 gap-2
        select-none

        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        data-[disabled='true']:pointer-events-none

        data-[invalid='true']:border
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2
        data-[invalid='true']:ring-error/35
    `
);

export const colorGradientHsvRectangleVariants = cva(
    `
        relative w-full h-40
        bg-[linear-gradient(to_bottom,rgba(0,0,0,0),black),linear-gradient(to_right,white,rgba(255,255,255,0))]
        border border-border
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-lg" // Full is not suitable for color gradient rectangle.
            }
        }
    }
);

export const colorGradientHsvRectangleHandleVariants = cva(
    `
        absolute
        w-3 h-3
        cursor-pointer
        border border-foreground
        outline outline-background
        shadow-md
        transition-[box-shadow,color,border-color,background-color] ease-in-out duration-150

        focus-visible:ring-2
        focus-visible:ring-primary/35
        focus-visible:ring-offset-2
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const colorGradientPreviewVariants = cva(
    `
        w-10 h-10 flex
        border border-border
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const colorGradientSliderHandleVariants = cva(
    `
        border-3 border-white/90
        outline outline-solid outline-black/90
        bg-transparent
        w-3 h-3
    `
);
