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
        focus-visible:ring-2 focus-visible:ring-focus-indicator

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error
        data-[invalid='true']:focus-visible:border-error
        data-[invalid='true']:focus-visible:ring-error
        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error
        [&.ng-touched.ng-invalid]:focus-visible:border-error
        [&.ng-touched.ng-invalid]:focus-visible:ring-error
    `,
    {
        variants: {
            expanded: {
                true: "border-focus-indicator ring-2 ring-focus-indicator",
                false: ""
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
                full: "rounded-full"
            },
            size: {
                large: "h-8.5 text-md",
                medium: "h-7.5 text-sm",
                small: "h-6.5 text-xs"
            }
        },
        compoundVariants: [
            {
                expanded: true,
                class: "data-[invalid='true']:border-error data-[invalid='true']:ring-error"
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
                small: "rounded-[1px]",
                medium: "rounded-[2px]",
                large: "rounded-[4px]",
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
