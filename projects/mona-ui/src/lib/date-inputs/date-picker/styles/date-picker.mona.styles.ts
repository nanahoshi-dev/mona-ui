import { cva } from "class-variance-authority";

export const datePickerBaseVariants = cva(
    `
        flex items-center w-full
        border border-border
        focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary
        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/40
        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
    `,
    {
        variants: {
            focused: {
                true: `ring-2 ring-primary/40 border-primary`,
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
