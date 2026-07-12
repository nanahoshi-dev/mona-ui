import { cva } from "class-variance-authority";

export const datePickerBaseVariants = cva(
    `
        flex items-center w-auto
        border border-border
        transition-[color,box-shadow,border,background-color] ease-in-out duration-150
        focus-within:ring-2 focus-within:ring-primary/35 focus-within:border-primary
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
    `,
    {
        variants: {
            focused: {
                true: "ring-2 ring-primary/35 border-primary",
                false: ""
            },
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            },
            size: {
                large: "h-10 text-md",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        }
    }
);
