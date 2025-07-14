import { cva } from "class-variance-authority";

export const colorPickerBaseVariants = cva(
    `
        flex items-center
        border border-input-border
        bg-background outline-none
        shadow-sm
        cursor-pointer

        hover:bg-accent hover:text-accent-foreground

        transition-[color,box-shadow,border] ease-in-out duration-300

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50

        focus-within:ring-2 focus-within:ring-primary/40

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);

export const colorPickerColorVariants = cva(
    `
        flex items-center justify-center
        w-5 h-5
        mx-1
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            }
        }
    }
);
