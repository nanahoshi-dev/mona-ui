import { cva } from "class-variance-authority";

export const reinaColorPickerBaseVariants = cva(
    `
        flex items-center
        border border-input-border
        bg-input-background outline-none
        shadow-xs text-foreground
        cursor-pointer

        hover:bg-input-hover

        transition-[color,box-shadow,border,background-color] ease-out duration-150

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-40
        data-[readonly='true']:cursor-default
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2
        data-[invalid='true']:ring-error/35

        focus-within:ring-2 focus-within:ring-primary/35 focus-within:border-primary

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            expanded: {
                true: "ring-2 ring-primary/35 border-primary",
                false: ""
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

export const reinaColorPickerColorVariants = cva(
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
