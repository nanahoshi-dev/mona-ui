import { cva } from "class-variance-authority";

export const comboBoxBaseVariants = cva(
    `
        flex items-center
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

export const comboBoxTextInputVariants = cva(
    `
        border-none outline-none
        bg-transparent shadow-none
        px-2 h-full w-full text-ellipsis
        focus-within:ring-0 focus-within:shadow-none
        focus-visible:ring-0 focus-visible:shadow-none
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

export const comboBoxAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);
