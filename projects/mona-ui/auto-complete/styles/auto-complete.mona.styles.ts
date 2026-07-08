import { cva } from "class-variance-authority";

export const autoCompleteBaseVariants = cva(
    `
        flex
        border border-input-border outline-none
        bg-background shadow-xs
        focus-within:ring-1 focus-within:ring-primary/40
        transition-[color,box-shadow,border] ease-in-out duration-300
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50 cursor-not-allowed"
            },
            expanded: {
                true: "ring-1 ring-primary/40"
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
