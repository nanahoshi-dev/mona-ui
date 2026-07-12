import { cva } from "class-variance-authority";

export const textBoxVariants = cva(
    `
        flex items-center w-full min-w-0
        overflow-hidden

        bg-input-background text-foreground
        border border-border-control outline-none
        bg-input-background shadow-control
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border-color] ease-in-out duration-150 motion-reduce:transition-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:opacity-50
        data-[disabled='true']:text-disabled
        data-[disabled='true']:border-border-subtle

        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35

        [&>input]:w-full [&>input]:h-full
        [&>input]:bg-transparent
        [&>input]:border-0 [&>input]:outline-none
        [&>input]:placeholder:text-muted-foreground
        [&>input]:px-2

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error data-[invalid='true']:focus-within:ring-error/35
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
        bg-input-background
        px-2

        border border-border-control outline-none
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border-color] ease-in-out duration-150 motion-reduce:transition-none

        shadow-control

        file:text-foreground
        file:inline-flex file:border-0
        file:bg-transparent file:text-xs
        file:font-medium

        placeholder:text-muted-foreground

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:bg-disabled-background
        disabled:opacity-50
        disabled:text-disabled
        disabled:border-border-subtle

        focus-visible:border-focus-indicator focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-2 [&.ng-touched.ng-invalid]:ring-error/35
        [&.ng-touched.ng-invalid]:focus-visible:border-error [&.ng-touched.ng-invalid]:focus-visible:ring-error/35
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
        }
    }
);
