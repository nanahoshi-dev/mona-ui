import { cva } from "class-variance-authority";

export const datePickerBaseVariants = cva(
    `
        flex w-auto items-center
        bg-input-background text-foreground
        border border-input-border shadow-none
        outline-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-2 focus-within:ring-focus-indicator

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error

        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
        [&_mona-text-box]:shadow-none
        [&_mona-text-box]:focus-within:ring-0
        [&_mona-text-box[data-invalid='true']]:ring-0
    `,
    {
        variants: {
            focused: {
                true: "border-focus-indicator ring-2 ring-focus-indicator",
                false: ""
            },
            rounded: {
                full: "rounded-full",
                large: "rounded-[4px]",
                medium: "rounded-[2px]",
                none: "rounded-none",
                small: "rounded-[1px]"
            },
            size: {
                large: "h-8.5 text-md",
                medium: "h-7.5 text-sm",
                small: "h-6.5 text-xs"
            }
        },
        compoundVariants: [
            {
                focused: true,
                class: "data-[invalid='true']:border-error data-[invalid='true']:ring-error"
            }
        ]
    }
);
