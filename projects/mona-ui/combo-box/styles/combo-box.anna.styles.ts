import { cva } from "class-variance-authority";

export const comboBoxBaseVariants = cva(
    `
        flex items-center
        cursor-pointer
        bg-input-background text-foreground
        border border-input-border shadow-none outline-none
        transition-[color,box-shadow,border] duration-150 ease-in-out
        data-[readonly='true']:cursor-default
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator
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
                true: "border-focus-indicator ring-2 ring-focus-indicator"
            },
            invalid: {
                true: "border-error ring-2 ring-error focus-within:border-error focus-within:ring-error",
                false: ""
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full"
            },
            size: {
                small: "h-6.5 text-xs",
                medium: "h-7.5 text-sm",
                large: "h-8.5 text-md"
            }
        },
        compoundVariants: [
            {
                focused: true,
                invalid: true,
                class: "border-error ring-error"
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

export const comboBoxTextInputVariants = cva(
    `
        h-full w-full px-2 text-ellipsis
        bg-transparent border-none shadow-none outline-none
        focus-within:ring-0 focus-within:shadow-none
        focus-visible:ring-0 focus-visible:shadow-none
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full px-3"
            }
        }
    }
);

export const comboBoxAffixContainerVariants = cva(`flex h-full flex-none items-center justify-center`);
