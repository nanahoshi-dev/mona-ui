import { cva } from "class-variance-authority";

export const textBoxVariants = cva(
    `
        flex items-center w-full min-w-0
        overflow-hidden

        bg-input-background text-foreground
        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border] ease-in-out duration-150

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        focus-within:ring-2 focus-within:ring-primary/35
        focus-within:border-primary

        [&>input]:w-full [&>input]:h-full
        [&>input]:bg-transparent
        [&>input]:border-0 [&>input]:outline-none
        [&>input]:placeholder:text-muted-foreground
        [&>input]:px-3

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
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
                large: "h-10 text-md [&>input]:px-3",
                medium: "h-9 text-sm [&>input]:px-3",
                small: "h-8 text-xs [&>input]:px-2"
            }
        }
    }
);

export const inputVariants = cva(
    `
        bg-input-background
        px-3

        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border] ease-in-out duration-150

        shadow-xs

        file:text-foreground
        file:inline-flex file:border-0
        file:bg-transparent file:text-xs
        file:font-medium

        placeholder:text-muted-foreground

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-50

        focus-visible:ring-2 focus-visible:ring-primary/35
        focus-visible:border-primary

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/35
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
                large: "h-10 text-md px-3",
                medium: "h-9 text-sm px-3",
                small: "h-8 text-xs px-2"
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
