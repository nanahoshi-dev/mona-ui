import { cva } from "class-variance-authority";

export const reinaMultiSelectBaseVariants = cva(
    `
        flex items-center justify-between
        border border-input-border outline-none
        bg-input-background text-foreground shadow-xs
        cursor-pointer
        focus-within:ring-2 focus-within:ring-primary/35
        focus-within:border-primary
        transition-[color,box-shadow,border,background-color] ease-out duration-150
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-40 cursor-not-allowed"
            },
            focused: {
                true: "ring-2 ring-primary/35 border-primary"
            },
            invalid: {
                true: "border-error ring-2 ring-error/35",
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

export const reinaMultiSelectItemContainerVariants = cva(
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

export const reinaMultiSelectAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);

export const reinaMultiSelectIndicatorContainerVariants = cva(`self-center`, {
    variants: {
        size: {
            small: "h-8",
            medium: "h-9",
            large: "h-10"
        }
    }
});
