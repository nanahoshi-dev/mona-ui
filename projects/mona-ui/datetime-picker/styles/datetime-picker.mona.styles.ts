import { cva } from "class-variance-authority";

export const dateTimePickerBaseVariants = cva(
    `
        flex items-center
        border border-border
        focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/40
        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
    `,
    {
        variants: {
            focused: {
                true: `ring-2 ring-primary/40 border-primary`
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

export const dateTimePickerHeaderVariants = cva(
    `
        p-2 bg-accent/20 border-b border-border flex items-center
        [&>mona-button-group]:w-full
        [&>mona-button-group>[monaButton]]:flex-1
    `
);

export const dateTimePickerFooterVariants = cva(
    `
        p-2 bg-accent/20 border-t border-border flex items-center justify-between gap-2
        [&>[monaButton]]:flex-1
    `
);
