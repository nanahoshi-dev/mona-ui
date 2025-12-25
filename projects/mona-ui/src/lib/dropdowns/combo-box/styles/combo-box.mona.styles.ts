import { cva } from "class-variance-authority";

export const comboBoxBaseVariants = cva(
    `
        flex border border-input-border outline-none
        bg-background shadow-xs
        cursor-pointer
        focus-within:ring-1 focus-within:ring-primary/40
        transition-[color,box-shadow,border] ease-in-out duration-300

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/40
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50 cursor-not-allowed"
            },
            focused: {
                true: "ring-1 ring-primary/40"
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

export const comboBoxPopupVariants = cva(
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
        },
        defaultVariants: {
            rounded: "medium",
            size: "medium"
        }
    }
);

export const comboBoxAffixContainerVariants = cva(`h-full flex flex-none items-center justify-center`);
