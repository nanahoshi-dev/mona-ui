import { cva } from "class-variance-authority";

export const colorGradientBaseVariants = cva(
    `
        flex flex-col min-w-64
        gap-2 p-2
        select-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        data-[invalid='true']:border
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-1
        data-[invalid='true']:ring-error
    `
);

export const colorGradientHsvRectangleVariants = cva(
    `
        relative h-40 w-full
        bg-[linear-gradient(to_bottom,rgba(0,0,0,0),black),linear-gradient(to_right,white,rgba(255,255,255,0))]
        border border-border-subtle
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-[4px]" // Full is not suitable for color gradient rectangle.
            }
        }
    }
);

export const colorGradientHsvRectangleHandleVariants = cva(
    `
        absolute
        h-3 w-3
        cursor-pointer
        bg-transparent
        border-2 border-black/90 outline outline-white/90 shadow-sm

        focus-visible:ring-2 focus-visible:ring-focus-indicator
        focus-visible:ring-offset-2 focus-visible:ring-offset-surface
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full"
            }
        }
    }
);

export const colorGradientPreviewVariants = cva(
    `
        flex h-8.5 w-8.5
        border border-border-subtle
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full"
            }
        }
    }
);

export const colorGradientSliderHandleVariants = cva(
    `
        h-3 w-3
        bg-transparent
        border-3 border-white/90
        outline outline-solid outline-black/90
    `
);
