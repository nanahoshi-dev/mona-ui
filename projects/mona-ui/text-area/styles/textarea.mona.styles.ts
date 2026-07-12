import { cva } from "class-variance-authority";

export const textAreaVariants = cva(
    `
        bg-input-background

        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] ease-in-out duration-150

        shadow-xs
        px-3 py-1.5 text-sm

        placeholder:text-muted-foreground

        focus-visible:ring-2 focus-visible:ring-primary/35
        focus-visible:border-primary

        disabled:pointer-events-none disabled:opacity-50
        disabled:cursor-not-allowed disabled:select-none

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/35
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
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
