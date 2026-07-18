import { cva } from "class-variance-authority";

export const radioButtonVariants = cva(
    `
        peer absolute inset-0 z-10 h-full w-full
        cursor-pointer appearance-none opacity-0
        outline-none
        disabled:cursor-not-allowed
    `
);

export const radioButtonCircleVariants = cva(
    `
        relative flex h-4.5 w-4.5 items-center justify-center
        cursor-pointer overflow-hidden
        bg-input-background
        border border-input-border
        transition-colors duration-200

        peer-disabled:cursor-not-allowed
        peer-disabled:border-disabled-border peer-disabled:bg-disabled-background peer-disabled:text-disabled-foreground

        peer-focus-visible:border-focus-indicator
        peer-focus-visible:ring-2 peer-focus-visible:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:peer-focus-visible:border-error
        data-[invalid='true']:peer-focus-visible:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);

export const radioButtonIndicatorVariants = cva(
    `
        flex h-3 w-3
        bg-primary
        transition-all duration-200
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);

export const radioButtonContainerLabelVariants = cva(
    `
        relative flex h-full w-full items-center justify-center gap-1
        cursor-pointer
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:text-disabled-foreground
    `,
    {
        variants: {
            labelSize: {
                small: "text-sm",
                medium: "text-base",
                large: "text-lg"
            }
        },
        defaultVariants: {
            labelSize: "medium"
        }
    }
);

export const radioButtonDirectiveVariants = cva(
    `
        relative flex h-4.5 w-4.5 items-center justify-center place-content-center
        cursor-pointer appearance-none
        bg-input-background
        border border-input-border
        outline-none

        disabled:pointer-events-none disabled:cursor-not-allowed
        disabled:border-disabled-border disabled:bg-disabled-background disabled:text-disabled-foreground

        after:inline-grid
        after:h-3 after:w-3
        after:place-content-center
        after:content-['']

        checked:after:bg-primary
        checked:after:rounded-full

        focus-visible:border-focus-indicator
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error/35
        [&.ng-touched.ng-invalid]:focus-visible:border-error
        [&.ng-touched.ng-invalid]:focus-visible:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        },
        compoundVariants: [
            {
                rounded: "full",
                class: "checked:after:rounded-full"
            },
            {
                rounded: "large",
                class: "checked:after:rounded-lg"
            },
            {
                rounded: "medium",
                class: "checked:after:rounded-md"
            },
            {
                rounded: "none",
                class: "checked:after:rounded-none"
            },
            {
                rounded: "small",
                class: "checked:after:rounded-sm"
            }
        ]
    }
);
