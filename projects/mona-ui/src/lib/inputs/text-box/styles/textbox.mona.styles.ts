import { cva } from "class-variance-authority";

export const textBoxVariants = cva(
    `
        flex items-center w-full min-w-0
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

        [&.ng-touched.ng-invalid]:border-error
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
                large: "[&>input]:px-2 [&>input]:py-3 text-md",
                medium: "[&>input]:px-2 [&>input]:py-2 text-sm",
                small: "[&>input]:px-2 [&>input]:py-2 text-xs"
            }
        }
    }
);

export const inputVariants = cva(
    `
        bg-input-background

        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border] ease-in-out duration-300

        file:text-foreground
        file:inline-flex file:border-0
        file:bg-transparent file:text-xs
        file:font-medium

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        focus-within:ring-2 focus-within:ring-primary/40
        focus-within:border-primary

        [&.ng-touched.ng-invalid]:border-error
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
                large: "px-2 py-3 text-md",
                medium: "px-2 py-2 text-sm",
                small: "px-2 py-2 text-xs"
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
