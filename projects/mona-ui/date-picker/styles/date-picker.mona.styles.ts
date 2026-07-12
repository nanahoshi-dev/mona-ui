import { cva } from "class-variance-authority";

export const datePickerBaseVariants = cva(
    `
        flex items-center w-auto
        border border-border-control bg-input-background shadow-control
        transition-[color,box-shadow,border-color] ease-in-out duration-150 motion-reduce:transition-none
        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error data-[invalid='true']:focus-within:ring-error/35
        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
    `,
    {
        variants: {
            focused: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35",
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
