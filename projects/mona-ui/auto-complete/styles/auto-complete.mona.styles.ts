import { cva } from "class-variance-authority";

export const autoCompleteBaseVariants = cva(
    `
        flex
        bg-input-background text-foreground
        border border-input-border shadow-(--shadow-control) outline-none
        transition-[color,box-shadow,border] duration-300 ease-in-out
        data-[readonly='true']:cursor-default
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35
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
            expanded: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35"
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
                large: "h-10 text-md",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        },
        compoundVariants: [
            {
                expanded: true,
                invalid: true,
                class: "border-error ring-error/35"
            },
            {
                focused: true,
                invalid: true,
                class: "border-error ring-error/35"
            }
        ],
        defaultVariants: {
            disabled: false,
            focused: false,
            invalid: false,
            rounded: "medium",
            size: "medium"
        }
    }
);

export const autoCompleteTextInputVariants = cva(
    `
        h-full w-full px-2 text-ellipsis
        bg-transparent border-none shadow-none outline-none
        focus-within:ring-0 focus-visible:ring-0
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full px-3"
            }
        }
    }
);

export const autoCompleteAffixContainerVariants = cva(`flex h-full flex-none items-center justify-center`);
