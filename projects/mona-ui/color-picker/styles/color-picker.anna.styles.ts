import { cva } from "class-variance-authority";

export const colorPickerBaseVariants = cva(
    `
        flex items-center
        cursor-pointer
        bg-input-background text-foreground
        border border-input-border
        shadow-none outline-none
        transition-[color,box-shadow,border] duration-150 ease-in-out

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        hover:bg-hover active:bg-active

        focus-visible:border-focus-indicator
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-visible:border-error
        data-[invalid='true']:focus-visible:ring-error/35
        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error/35
        [&.ng-touched.ng-invalid]:focus-visible:border-error
        [&.ng-touched.ng-invalid]:focus-visible:ring-error/35
    `,
    {
        variants: {
            expanded: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35",
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
        },
        compoundVariants: [
            {
                expanded: true,
                class: "data-[invalid='true']:border-error data-[invalid='true']:ring-error/35"
            }
        ]
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
                large: "mx-2 h-6 w-6",
                medium: "mx-2 h-5 w-5",
                small: "mx-1 h-4 w-4"
            }
        }
    }
);
