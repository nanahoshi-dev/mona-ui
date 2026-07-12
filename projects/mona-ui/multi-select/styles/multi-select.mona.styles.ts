import { cva } from "class-variance-authority";

export const multiSelectBaseVariants = cva(
    `
        flex items-center justify-between
        border border-border-control outline-none
        bg-input-background text-foreground shadow-control
        cursor-pointer
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35
        transition-[color,box-shadow,border-color] ease-in-out duration-150 motion-reduce:transition-none
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed bg-disabled-background opacity-50 text-disabled border-border-subtle"
            },
            focused: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35"
            },
            invalid: {
                true: "border-error ring-2 ring-error/35 focus-within:border-error focus-within:ring-error/35",
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
