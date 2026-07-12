import { cva } from "class-variance-authority";

export const colorPickerBaseVariants = cva(
    `
        flex items-center
        border border-border-control
        bg-input-background outline-none
        shadow-control text-foreground
        cursor-pointer

        hover:bg-accent hover:text-accent-foreground

        transition-[color,box-shadow,border-color,background-color] ease-in-out duration-150 motion-reduce:transition-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:opacity-50
        data-[disabled='true']:text-disabled
        data-[disabled='true']:border-border-subtle
        data-[readonly='true']:cursor-default
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2
        data-[invalid='true']:ring-error/35

        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            expanded: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35"
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
