import { cva } from "class-variance-authority";

export const multiSelectBaseVariants = cva(
    `
        flex items-center justify-between
        border border-input-border outline-none
        bg-background shadow-xs
        cursor-pointer
        focus-within:ring-1 focus-within:ring-primary/40
        transition-[color,box-shadow,border] ease-in-out duration-300
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50 cursor-not-allowed"
            },
            focused: {
                true: "ring-1 ring-primary/40"
            },
            invalid: {
                true: "border-error ring-1 ring-error/40",
                false: ""
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            size: {
                small: "min-h-8 text-xs",
                medium: "min-h-9 text-sm",
                large: "min-h-10 text-md"
            }
        }
    }
);

export const multiSelectItemContainerVariants = cva(
    `
        flex flex-1 items-center gap-1 flex-wrap p-1
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

export const multiSelectAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);

export const multiSelectIndicatorContainerVariants = cva(`self-center`, {
    variants: {
        size: {
            small: "h-8",
            medium: "h-9",
            large: "h-10"
        }
    }
});
