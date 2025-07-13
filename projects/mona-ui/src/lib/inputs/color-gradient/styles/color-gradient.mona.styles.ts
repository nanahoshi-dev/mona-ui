import { cva } from "class-variance-authority";

export const colorGradientBaseVariants = cva(
    `
        flex flex-col min-w-7.5
        p-2 gap-2
        select-none
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
