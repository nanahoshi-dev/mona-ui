import { cva } from "class-variance-authority";

export const reinaComboBoxBaseVariants = cva(
    `
        flex items-center
        border border-input-border outline-none
        bg-input-background shadow-xs text-foreground
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
                small: "h-8 text-xs",
                medium: "h-9 text-sm",
                large: "h-10 text-md"
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

export const reinaComboBoxTextInputVariants = cva(
    `
        border-none outline-none
        bg-transparent shadow-none
        px-2 h-full w-full text-ellipsis
        focus-within:ring-0 focus-within:shadow-none
        focus-visible:ring-0 focus-visible:shadow-none
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

export const reinaComboBoxAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);
