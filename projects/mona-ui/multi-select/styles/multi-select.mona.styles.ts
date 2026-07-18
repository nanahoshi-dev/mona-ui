import { cva } from "class-variance-authority";

export const multiSelectBaseVariants = cva(
    `
        flex items-center justify-between
        cursor-pointer
        bg-input-background text-foreground
        border border-input-border shadow-(--shadow-control) outline-none
        transition-[color,box-shadow,border] duration-300 ease-in-out
        data-[readonly='true']:cursor-default
        focus-visible:border-focus-indicator focus-visible:ring-2 focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            disabled: {
                true: `
                    pointer-events-none cursor-not-allowed
                    bg-disabled-background text-disabled-foreground
                    border-disabled-border shadow-none
                `
            },
            focused: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35"
            },
            invalid: {
                true: "border-error ring-2 ring-error/35 focus-visible:border-error focus-visible:ring-error/35",
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
        },
        compoundVariants: [
            {
                focused: true,
                invalid: true,
                class: "border-error ring-error/35"
            }
        ]
    }
);

export const multiSelectItemContainerVariants = cva(
    `
        flex flex-1 flex-wrap items-center gap-1 p-1
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

export const multiSelectAffixContainerVariants = cva(`flex h-full flex-none items-center justify-center`);

export const multiSelectIndicatorContainerVariants = cva(`self-center`, {
    variants: {
        size: {
            small: "h-8",
            medium: "h-9",
            large: "h-10"
        }
    }
});
