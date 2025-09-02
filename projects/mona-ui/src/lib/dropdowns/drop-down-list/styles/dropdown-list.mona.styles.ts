import { cva } from "class-variance-authority";

export const dropdownListInputVariants = cva(
    `
        inline-flex items-center

        border border-input-border
        bg-background outline-none
        shadow-xs
        cursor-pointer select-none

        px-2

        hover:bg-accent hover:text-accent-foreground

        transition-[color,box-shadow,border] ease-in-out duration-300

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        focus-within:ring-1 focus-within:ring-primary/40
        data-[expanded='true']:ring-1
        data-[expanded='true']:ring-primary/40

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full px-3"
            },
            size: {
                large: "h-10.5 text-md",
                medium: "h-8.5 text-sm",
                small: "h-7.5 text-xs"
            }
        }
    }
);

export const dropdownListPopupVariants = cva(
    `
        bg-background shadow-md
        border border-input-border
        h-full max-h-64 overflow-auto
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-lg"
            },
            size: {
                large: "text-md",
                medium: "text-sm",
                small: "text-xs"
            }
        }
    }
);
