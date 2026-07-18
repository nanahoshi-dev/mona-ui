import { cva } from "class-variance-authority";

export const textBoxVariants = cva(
    `
        flex w-full min-w-0 items-center
        overflow-hidden
        bg-input-background text-foreground
        border border-input-border shadow-none
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-150 ease-in-out

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-2 focus-within:ring-focus-indicator

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error

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
                large: "rounded-[4px]",
                medium: "rounded-[2px]",
                none: "rounded-none",
                small: "rounded-[1px]"
            },
            size: {
                large: "h-8.5 text-md",
                medium: "h-7.5 text-sm",
                small: "h-6.5 text-xs"
            }
        }
    }
);

export const inputVariants = cva(
    `
        px-2
        bg-input-background text-foreground
        border border-input-border shadow-none
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-150 ease-in-out

        file:inline-flex file:border-0
        file:bg-transparent file:text-xs
        file:font-medium file:text-foreground
        placeholder:text-muted-foreground

        disabled:pointer-events-none disabled:cursor-not-allowed
        disabled:border-disabled-border disabled:bg-disabled-background disabled:text-disabled-foreground
        disabled:shadow-none
        read-only:cursor-default

        focus-visible:border-focus-indicator
        focus-visible:ring-2 focus-visible:ring-focus-indicator

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error
        [&.ng-touched.ng-invalid]:focus-visible:border-error
        [&.ng-touched.ng-invalid]:focus-visible:ring-error
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full px-4",
                large: "rounded-[4px]",
                medium: "rounded-[2px]",
                none: "rounded-none",
                small: "rounded-[1px]"
            },
            size: {
                large: "h-8.5 text-md",
                medium: "h-7.5 text-sm",
                small: "h-6.5 text-xs"
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
