import { cva } from "class-variance-authority";

export const reinaAutoCompleteBaseVariants = cva(
    `
        flex
        border border-input-border outline-none
        bg-input-background shadow-xs text-foreground
        focus-within:ring-2 focus-within:ring-primary/35
        focus-within:border-primary
        transition-[color,box-shadow,border,background-color] ease-out duration-150
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-40 cursor-not-allowed"
            },
            expanded: {
                true: "ring-2 ring-primary/35 border-primary"
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

export const reinaAutoCompleteTextInputVariants = cva(
    `
        border-none outline-none
        bg-transparent shadow-none
        px-2 h-full w-full text-ellipsis
        focus-within:ring-0 focus-visible:ring-0
        placeholder:text-foreground/40
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

export const reinaAutoCompleteAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);
