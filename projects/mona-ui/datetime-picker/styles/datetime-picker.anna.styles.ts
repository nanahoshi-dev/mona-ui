import { cva } from "class-variance-authority";

export const dateTimePickerBaseVariants = cva(
    `
        flex w-full items-center
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
        focus-within:ring-2 focus-within:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error/35

        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
        [&_mona-text-box]:shadow-none
        [&_mona-text-box]:focus-within:ring-0
        [&_mona-text-box[data-invalid='true']]:ring-0
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
        },
        compoundVariants: [
            {
                focused: true,
                class: "data-[invalid='true']:border-error data-[invalid='true']:ring-error/35"
            }
        ]
    }
);

export const dateTimePickerHeaderVariants = cva(
    `
        flex items-center p-2
        bg-surface-muted
        border-b border-border-subtle
        [&>mona-button-group]:w-full
        [&>mona-button-group>[monaButton]]:flex-1
    `
);

export const dateTimePickerFooterVariants = cva(
    `
        flex items-center justify-between gap-2 p-2
        bg-surface-muted
        border-t border-border-subtle
        [&>[monaButton]]:flex-1
    `
);
