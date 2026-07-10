import { cva } from "class-variance-authority";

export const colorPickerBaseVariants = cva(
    `
        flex items-center
        border border-input-border
        bg-background outline-none
        shadow-xs text-foreground
        cursor-pointer

        hover:bg-accent hover:text-accent-foreground

        transition-[color,box-shadow,border] ease-in-out duration-300

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
        data-[readonly='true']:cursor-default
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-1
        data-[invalid='true']:ring-error

        focus-within:ring-1 focus-within:ring-primary/40

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            expanded: {
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
                large: "h-10 text-md",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        }
    }
);

export const colorPickerColorVariants = cva(
    `
        flex items-center justify-center
        mx-1
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            size: {
                large: "w-6 h-6 mx-2",
                medium: "w-5 h-5 mx-2",
                small: "w-4 h-4 mx-1"
            }
        }
    }
);
