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
        }
    }
);

export const autoCompleteTextInputVariants = cva(
    `
        border-none outline-none
        bg-transparent shadow-none
        px-2 h-full w-full
        focus-within:ring-0
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

export const autoCompletePopupVariants = cva(
    `
        bg-background shadow-md
        border border-input-border
        h-full max-h-64 overflow-auto
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-lg"
            },
            size: {
                large: "text-md",
                medium: "text-sm",
                small: "text-xs"
            }
        }
    }
);
