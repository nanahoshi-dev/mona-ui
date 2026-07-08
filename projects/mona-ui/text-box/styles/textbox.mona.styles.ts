import { cva } from "class-variance-authority";

export const textBoxVariants = cva(
    `
        flex items-center w-full min-w-0
        overflow-hidden

        bg-input-background
        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border] ease-in-out duration-300

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        focus-within:ring-2 focus-within:ring-primary/40
        focus-within:border-primary

        [&>input]:w-full [&>input]:h-full
        [&>input]:bg-transparent
        [&>input]:border-0 [&>input]:outline-none
        [&>input]:placeholder:text-muted-foreground
        [&>input]:px-2

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

        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border] ease-in-out duration-300

        shadow-xs

        file:text-foreground
        file:inline-flex file:border-0
        file:bg-transparent file:text-xs
        file:font-medium

        placeholder:text-muted-foreground

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-50

        focus-visible:ring-2 focus-visible:ring-primary/40
        focus-visible:border-primary

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/40
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
