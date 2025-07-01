import { cva } from "class-variance-authority";

export const textAreaVariants = cva(
    `
        bg-input-background

        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] ease-in-out duration-300

        px-2 py-1 text-sm

        focus-within:ring-2 focus-within:ring-primary/40
        focus-within:border-primary

        disabled:pointer-events-none disabled:opacity-50
        disabled:cursor-not-allowed disabled:select-none

        [&.ng-touched.ng-invalid]:border-error
    `,
    {
        variants: {
            rounded: {
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);
