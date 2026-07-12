import { cva } from "class-variance-authority";

export const comboBoxBaseVariants = cva(
    `
        flex items-center
        border border-border-control outline-none
        bg-input-background shadow-control text-foreground
        cursor-pointer overflow-hidden
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
