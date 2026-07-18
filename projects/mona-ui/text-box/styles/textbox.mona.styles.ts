import { cva } from "class-variance-authority";

export const textBoxVariants = cva(
    `
        flex w-full min-w-0 items-center
        overflow-hidden
        bg-input-background text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-300 ease-in-out

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-2 focus-within:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error/35

        [&>input]:h-full [&>input]:w-full
        [&>input]:px-2
        [&>input]:bg-transparent
        [&>input]:border-0 [&>input]:outline-none
        [&>input]:placeholder:text-muted-foreground
    `,
    {
        variants: {
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

export const inputVariants = cva(
    `
        px-2
        bg-input-background text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-300 ease-in-out

        file:inline-flex file:border-0
        file:bg-transparent file:text-xs
        file:font-medium file:text-foreground
        placeholder:text-muted-foreground

        disabled:pointer-events-none disabled:cursor-not-allowed
        disabled:border-disabled-border disabled:bg-disabled-background disabled:text-disabled-foreground
        disabled:shadow-none
        read-only:cursor-default

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
                full: "rounded-full px-4",
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
        },
        compoundVariants: [
            {
                rounded: "full",
                size: "large",
                class: "px-4"
            },
            {
                rounded: "full",
                size: "medium",
                class: "px-4"
            },
            {
                rounded: "full",
                size: "small",
                class: "px-4"
            }
        ]
    }
);
