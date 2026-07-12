import { cva } from "class-variance-authority";

export const autoCompleteBaseVariants = cva(
    `
        flex
        border border-border-control outline-none
        bg-input-background shadow-control text-foreground
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35
        transition-[color,box-shadow,border-color] ease-in-out duration-150 motion-reduce:transition-none
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed bg-disabled-background opacity-50 text-disabled border-border-subtle"
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
        border-none outline-none
        bg-transparent shadow-none
        px-2 h-full w-full text-ellipsis
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

export const autoCompleteAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);
