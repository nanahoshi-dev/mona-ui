import { cva } from "class-variance-authority";

export const radioButtonVariants = cva(
    `
        appearance-none outline-none
        peer absolute inset-0 w-full h-full
        opacity-0 cursor-pointer z-10
        focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:cursor-not-allowed
    `
);

export const radioButtonCircleVariants = cva(
    `
        w-4.5 h-4.5
        flex items-center justify-center
        overflow-hidden
        bg-input-background
        border border-input-border
        cursor-pointer
        relative
        transition-colors duration-200
        peer-focus:ring-2 peer-focus:ring-primary/40
        peer-disabled:opacity-50 peer-disabled:cursor-not-allowed

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/40
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
        flex w-3 h-3 bg-primary transition-all duration-200
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
        w-full h-full flex items-center justify-center gap-1
        relative
        cursor-pointer
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
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
        appearance-none outline-none
        w-4.5 h-4.5
        bg-input-background border border-input-border
        cursor-pointer
        relative
        place-content-center
        flex items-center justify-center

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-50

        after:content-['']
        after:w-3 after:h-3
        after:inline-grid
        after:place-content-center

        checked:after:bg-primary
        checked:after:rounded-full

        focus-visible:ring-2 focus-visible:ring-primary/40

        [&.ng-touched.ng-invalid]:border-error
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
