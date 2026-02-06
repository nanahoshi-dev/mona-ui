import { cva } from "class-variance-authority";

export const dateTimePickerBaseVariants = cva(
    `
        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/40
    `,
    {
        variants: {
            focused: {
                true: `
                    [&_mona-text-box]:ring-2
                    [&_mona-text-box]:ring-primary/40
                    [&_mona-text-box]:border-primary
                `,
                false: ""
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
